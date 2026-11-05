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


def construir_html() -> Path:
    pagina = (SRC / "pagina.html").read_text(encoding="utf-8")
    js = (SRC / "app.js").read_text(encoding="utf-8")
    if "</script" in js.lower():
        raise SystemExit("app.js não pode conter </script>.")
    css = (SRC / "estilo-base.css").read_text(encoding="utf-8") + (SRC / "estilo-caderno.css").read_text(encoding="utf-8")
    exemplos = (SRC / "exemplos.json").read_text(encoding="utf-8").replace("</", "<\\/")
    logo = (ROOT / "marca" / "natixis-cib.svg").read_text(encoding="utf-8")
    html = (pagina.replace("%%CSS%%", css).replace("%%LOGO%%", logo)
            .replace("%%EXEMPLOS%%", exemplos).replace("%%JS%%", js))
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


if __name__ == "__main__":
    h = construir_html()
    z = construir_zip(h)
    print(f"✓ {h.relative_to(ROOT)} ({h.stat().st_size // 1024} KB)")
    print(f"✓ {z.relative_to(ROOT)} ({z.stat().st_size // 1024} KB)")
