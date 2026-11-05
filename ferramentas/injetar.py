#!/usr/bin/env python3
"""Insere uma reunião (bloco <article>) no caderno_reunioes.html, de forma segura.

Uso:
    python3 ferramentas/injetar.py transcricoes/reuniao.artigo.html --dados transcricoes/reuniao.analise.json

- Valida o <article> (data-id, data-title, data-date AAAA-MM-DD, data-type).
- Junta as métricas (.analise.json) ao artigo, como <script type="application/json" class="meeting-data">.
- Preenche data-duracao e data-participantes a partir das métricas, se faltarem.
- Insere logo abaixo do marcador <!-- NOVA_REUNIAO_AQUI e regista o teu nome na config do caderno.
- Remove as reuniões de exemplo (data-exemplo) na primeira reunião real.
- Guarda uma cópia de segurança em caderno_reunioes.html.bak.

Opções: --substituir (troca uma reunião com o mesmo data-id), --exemplo (marca como exemplo).
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLE = re.compile(r"<article\b[^>]*\bclass=\"[^\"]*\bmeeting-entry\b[^\"]*\"[^>]*>.*?</article>", re.S)
MARKER = "<!-- NOVA_REUNIAO_AQUI"
CONFIG = re.compile(r'(<script type="application/json" id="caderno-config">)(.*?)(</script>)', re.S)


def attr(tag_open: str, name: str):
    m = re.search(r'\b' + re.escape(name) + r'="([^"]*)"', tag_open)
    return m.group(1) if m else None


def set_attr(tag_open: str, name: str, value: str) -> str:
    value = value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
    if attr(tag_open, name) is not None:
        return re.sub(r'\b' + re.escape(name) + r'="[^"]*"', f'{name}="{value}"', tag_open, count=1)
    return tag_open[:-1].rstrip() + f' {name}="{value}">'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("artigo", type=Path)
    ap.add_argument("--dados", type=Path)
    ap.add_argument("--caderno", type=Path, default=ROOT / "caderno_reunioes.html")
    ap.add_argument("--substituir", action="store_true")
    ap.add_argument("--exemplo", action="store_true")
    a = ap.parse_args()

    src = a.artigo.read_text(encoding="utf-8")
    found = ARTICLE.findall(src)
    if len(found) != 1:
        sys.exit(f"Esperava exatamente 1 <article class=\"meeting-entry\"> em {a.artigo}, encontrei {len(found)}.")
    art = found[0]
    open_tag = art[: art.index(">") + 1]

    erros = [n for n in ("data-id", "data-title", "data-date", "data-type") if not attr(open_tag, n)]
    if erros:
        sys.exit("Faltam atributos no <article>: " + ", ".join(erros))
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", attr(open_tag, "data-date")):
        sys.exit("data-date tem de estar no formato AAAA-MM-DD.")
    if re.search(r"<script(?![^>]*application/json)", art, re.I) or re.search(r"\son\w+=", art):
        sys.exit("O artigo não pode conter <script> executável nem atributos on*=.")

    new_open = open_tag
    if a.dados:
        dados = json.loads(a.dados.read_text(encoding="utf-8"))
        if not attr(new_open, "data-duracao"):
            new_open = set_attr(new_open, "data-duracao", str(round(dados.get("duracao_s", 0) / 60)))
        if not attr(new_open, "data-participantes"):
            new_open = set_attr(new_open, "data-participantes", ", ".join(o["nome"] for o in dados["oradores"]))
        blob = json.dumps(dados, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        art = re.sub(r'\s*<script type="application/json" class="meeting-data">.*?</script>', "", art, flags=re.S)
        art = art[: art.rindex("</article>")].rstrip() + \
            f'\n    <script type="application/json" class="meeting-data">{blob}</script>\n</article>'
    if a.exemplo:
        new_open = set_attr(new_open, "data-exemplo", "true")
    art = new_open + art[len(open_tag):]

    cad_path = a.caderno
    cad = cad_path.read_text(encoding="utf-8")
    if MARKER not in cad:
        sys.exit(f"Não encontrei o marcador {MARKER} em {cad_path}.")
    cad_path.with_suffix(".html.bak").write_text(cad, encoding="utf-8")

    rid = attr(open_tag, "data-id")
    existing = [m for m in ARTICLE.finditer(cad) if attr(m.group(0)[: m.group(0).index(">") + 1], "data-id") == rid]
    if existing and not a.substituir:
        sys.exit(f'Já existe uma reunião com data-id="{rid}". Usa --substituir ou muda o data-id.')
    for m in reversed(existing):
        cad = cad[: m.start()] + cad[m.end():]

    removidos = 0
    if not a.exemplo:
        for m in reversed(list(ARTICLE.finditer(cad))):
            if attr(m.group(0)[: m.group(0).index(">") + 1], "data-exemplo") == "true":
                cad = cad[: m.start()] + cad[m.end():]
                removidos += 1
        cad = re.sub(r"\n{3,}", "\n\n", cad)

    i = cad.index("\n", cad.index(MARKER)) + 1
    cad = cad[:i] + "\n" + art + "\n" + cad[i:]

    if a.dados and dados.get("eu") and not a.exemplo:
        def add_eu(m):
            try:
                cfg = json.loads(m.group(2) or "{}")
            except json.JSONDecodeError:
                cfg = {}
            cfg.setdefault("eu", [])
            if dados["eu"] not in cfg["eu"]:
                cfg["eu"].append(dados["eu"])
            return m.group(1) + json.dumps(cfg, ensure_ascii=False) + m.group(3)
        cad = CONFIG.sub(add_eu, cad, count=1)

    cad_path.write_text(cad, encoding="utf-8")
    acao = "substituída" if existing else "inserida"
    print(f'✓ Reunião "{attr(open_tag, "data-title")}" {acao} em {cad_path.name}'
          + (f" ({removidos} exemplo(s) removido(s))" if removidos else ""))


if __name__ == "__main__":
    main()
