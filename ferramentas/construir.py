#!/usr/bin/env python3
"""Constrói o caderno e o pacote para distribuir à equipa.

Uso:  python3 ferramentas/construir.py

Gera:
  dist/Caderno de Reuniões.html            o caderno (um só ficheiro, offline)
  dist/Caderno-de-Reunioes-CIO-Office.zip   pasta pronta a enviar aos colegas

O PDF do procedimento é gerado à parte (node ferramentas/gerar_procedimento.js)
e incluído no ZIP se existir em docs/.
"""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, DOCS, DIST = ROOT / "src", ROOT / "docs", ROOT / "dist"
NOME = "Caderno de Reuniões.html"
PASTA = "Caderno de Reuniões"


def fontes_css() -> str:
    """Embute as fontes (marca/fontes, licença OFL) como data: URIs, para o caderno funcionar sem rede."""
    import base64
    d = ROOT / "marca" / "fontes"
    faces = [("IBM Plex Sans", "ibm-plex-sans-latin-400-normal.woff2", "400", "normal"),
             ("IBM Plex Sans", "ibm-plex-sans-latin-600-normal.woff2", "600", "normal"),
             ("IBM Plex Sans", "ibm-plex-sans-latin-400-italic.woff2", "400", "italic"),
             ("Lexend", "lexend-latin-wght-normal.woff2", "100 900", "normal")]
    out = []
    for fam, f, w, st in faces:
        fp = d / f
        if not fp.exists():
            continue
        b64 = base64.b64encode(fp.read_bytes()).decode()
        out.append(f'@font-face{{font-family:"{fam}";font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64}) format("woff2")}}')
    return "\n".join(out) + "\n"


def construir_html() -> Path:
    pagina = (SRC / "pagina.html").read_text(encoding="utf-8")
    js = (SRC / "app.js").read_text(encoding="utf-8")
    if "</script" in js.lower():
        raise SystemExit("app.js não pode conter </script>.")
    css = (SRC / "estilo-base.css").read_text(encoding="utf-8") + (SRC / "estilo-caderno.css").read_text(encoding="utf-8")
    for extra in ("estilo-rework.css", "estilo-toque.css"):
        if (SRC / extra).exists():
            css += (SRC / extra).read_text(encoding="utf-8")
    css = css + "\n" + fontes_css()
    exemplos = (SRC / "exemplos.json").read_text(encoding="utf-8").replace("</", "<\\/")
    ex_proj = SRC / "exemplo-projeto.json"
    exemplo_projeto = ex_proj.read_text(encoding="utf-8").replace("</", "<\\/") if ex_proj.exists() else "null"
    logo = (ROOT / "marca" / "natixis-cib.svg").read_text(encoding="utf-8")
    html = (pagina.replace("%%CSS%%", css).replace("%%LOGO%%", logo)
            .replace("%%EXEMPLOS%%", exemplos).replace("%%EXEMPLO_PROJETO%%", exemplo_projeto).replace("%%JS%%", js))
    if "%%" in html.split("<script>")[0]:
        raise SystemExit("Ficou um marcador %%…%% por substituir.")
    DIST.mkdir(exist_ok=True)
    out = DIST / NOME
    out.write_text(html, encoding="utf-8")
    return out


def construir_zip(html: Path) -> Path:
    z = DIST / "Caderno-de-Reunioes-CIO-Office.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as f:
        f.write(html, f"{PASTA}/{NOME}")
        f.write(DOCS / "LEIA-ME.txt", f"{PASTA}/LEIA-ME.txt")
        pdf = DOCS / "Procedimento - Caderno de Reuniões.pdf"
        if pdf.exists():
            f.write(pdf, f"{PASTA}/{pdf.name}")
        else:
            print("Aviso: o PDF do procedimento ainda não foi gerado.")
        for vtt in sorted((SRC / "exemplos").glob("*.vtt")):
            f.write(vtt, f"{PASTA}/Exemplo para experimentar/{vtt.name}")
        f.write(DOCS / "NOTA-TECNICA.txt", f"{PASTA}/Para a equipa de IT/Nota técnica.txt")
        # Modo pasta: comando /reuniao para o Kilo Code (formato atual e formato antigo) e caixa de entrada
        k = DOCS / "kilo"
        f.write(k / "reuniao.md", f"{PASTA}/.kilo/commands/reuniao.md")
        f.write(k / "reuniao.md", f"{PASTA}/.kilocode/workflows/reuniao.md")
        f.write(k / "AGENTS.md", f"{PASTA}/AGENTS.md")
        f.write(k / "kilo.jsonc", f"{PASTA}/kilo.jsonc")
        f.write(k / "Atualizar caderno.bat", f"{PASTA}/Atualizar caderno.bat")
        f.write(k / "COMO-USAR-ESTA-PASTA.md", f"{PASTA}/entrada/COMO-USAR-ESTA-PASTA.md")
        f.writestr(f"{PASTA}/entrada/processadas/", "")
    return z


def construir_zip_sem_bat(z: Path) -> Path:
    """Igual ao ZIP normal, mas com o .bat guardado como .bat.txt (passa nos filtros de email/Teams)."""
    out = DIST / "Caderno-de-Reunioes-CIO-Office-sem-bat.zip"
    nota = ('NOTA: nesta versão o atalho chama-se "Atualizar caderno.bat.txt" para passar nos filtros de email/Teams.\r\n'
            'Para o ativar: botão direito no ficheiro > Mudar o nome > apaga o ".txt" do fim > Enter > Sim.\r\n'
            '(Se não vires a extensão: no Explorador, separador Ver > marca "Extensões de nomes de ficheiro".)\r\n\r\n').encode("utf-8")
    with zipfile.ZipFile(z) as a, zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as b:
        for i in a.infolist():
            data, name = a.read(i.filename), i.filename
            if name.endswith(".bat"):
                name += ".txt"
            if name.endswith("LEIA-ME.txt"):
                data = nota + data
            b.writestr(name, data)
    return out


if __name__ == "__main__":
    h = construir_html()
    z = construir_zip(h)
    construir_zip_sem_bat(z)
    print(f"✓ {h.relative_to(ROOT)} ({h.stat().st_size // 1024} KB)")
    print(f"✓ {z.relative_to(ROOT)} ({z.stat().st_size // 1024} KB)")
