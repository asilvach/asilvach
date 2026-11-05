#!/usr/bin/env python3
"""Cria ou atualiza o TEU caderno de reuniões a partir do modelo da equipa.

Uso:
    python ferramentas/configurar.py                       (pergunta o que falta)
    python ferramentas/configurar.py --nome "Ana Silva" --teams "Silva, Ana"

O que faz:
- Guarda as tuas preferências em config.json (pessoal, fora do git).
- Cria caderno_reunioes.html a partir de modelo/caderno.html, com o teu nome.
- Se o caderno já existir, mantém todas as reuniões e só atualiza o design.
  É o comando a correr depois de um `git pull` para receber melhorias.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

ROOT = Path(__file__).resolve().parent.parent
MODELO = ROOT / "modelo" / "caderno.html"
CADERNO = ROOT / "caderno_reunioes.html"
CONFIG_FILE = ROOT / "config.json"
EQUIPA = "CIO Office Portugal"

ARTICLE = re.compile(r"<article\b[^>]*\bclass=\"[^\"]*\bmeeting-entry\b[^\"]*\"[^>]*>.*?</article>", re.S)
CONFIG_TAG = re.compile(r'(<script type="application/json" id="caderno-config">)(.*?)(</script>)', re.S)
MARKER = "<!-- NOVA_REUNIAO_AQUI"


def ler_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def guardar_config(cfg: dict) -> None:
    CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def config_do_caderno(html: str) -> dict:
    m = CONFIG_TAG.search(html)
    try:
        return json.loads(m.group(2)) if m else {}
    except json.JSONDecodeError:
        return {}


def construir(cfg: dict, caderno: Path = CADERNO) -> tuple[int, bool]:
    """Escreve o caderno a partir do modelo. Devolve (nº de reuniões, se já existia)."""
    modelo = MODELO.read_text(encoding="utf-8")
    existia = caderno.exists()
    if existia:
        antigo = caderno.read_text(encoding="utf-8")
        artigos = ARTICLE.findall(antigo)
        eu_antigo = config_do_caderno(antigo).get("eu", [])
        caderno.with_suffix(".html.bak").write_text(antigo, encoding="utf-8")
    else:
        artigos = ARTICLE.findall(modelo)
        eu_antigo = []

    # Retira os artigos do modelo e põe os do caderno
    corpo = ARTICLE.sub("", modelo)
    corpo = re.sub(r"(<!-- NOVA_REUNIAO_AQUI[^\n]*\n)\s*", r"\1", corpo)
    i = corpo.index("\n", corpo.index(MARKER)) + 1
    corpo = corpo[:i] + ("\n\n".join(artigos) + "\n" if artigos else "") + corpo[i:]

    eu = [n for n in [cfg.get("teams")] + list(eu_antigo) if n]
    final_cfg = {
        "dono": cfg.get("nome", ""),
        "eu": list(dict.fromkeys(eu)),
        "equipa": cfg.get("equipa") or EQUIPA,
        "empresa": "Natixis",
    }
    corpo = CONFIG_TAG.sub(lambda m: m.group(1) + json.dumps(final_cfg, ensure_ascii=False) + m.group(3), corpo, count=1)
    caderno.write_text(corpo, encoding="utf-8")
    return len(artigos), existia


def perguntar(texto: str, atual: str = "") -> str:
    if not sys.stdin.isatty():
        return atual
    sugestao = f" [{atual}]" if atual else ""
    resp = input(f"{texto}{sugestao}: ").strip()
    return resp or atual


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--nome", help="Como queres ser tratado no caderno (ex.: Ana Silva)")
    ap.add_argument("--teams", help='O teu nome tal como aparece nas transcrições do Teams (ex.: "Silva, Ana")')
    ap.add_argument("--equipa", help=f"Equipa (por omissão: {EQUIPA})")
    a = ap.parse_args()

    cfg = ler_config()
    cfg["nome"] = a.nome or cfg.get("nome") or perguntar("O teu nome", "")
    cfg["teams"] = a.teams or cfg.get("teams") or perguntar(
        "O teu nome no Teams, tal como aparece nas transcrições", cfg["nome"])
    cfg["equipa"] = a.equipa or cfg.get("equipa") or EQUIPA
    if not cfg["nome"]:
        sys.exit('Falta o teu nome. Usa: python ferramentas/configurar.py --nome "Ana Silva" --teams "Silva, Ana"')
    guardar_config(cfg)

    n, existia = construir(cfg)
    acao = "atualizado (reuniões mantidas)" if existia else "criado"
    print(f"✓ Caderno de {cfg['nome']} {acao}: {CADERNO.name} · {n} reunião(ões)")
    print(f"  Nome no Teams: {cfg['teams']} · Equipa: {cfg['equipa']}")
    print(f"  Abre no navegador: {CADERNO.resolve().as_uri()}")


if __name__ == "__main__":
    main()
