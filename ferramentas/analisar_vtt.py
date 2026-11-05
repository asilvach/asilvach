#!/usr/bin/env python3
"""Analisa uma transcrição do Teams (.vtt): limpa o texto e calcula métricas de participação.

Uso:
    python ferramentas/analisar_vtt.py transcricoes/reuniao.vtt [--eu "Nome no Teams"]

Gera, ao lado do ficheiro original:
    reuniao.limpo.txt     transcrição limpa ([hh:mm:ss] Orador: texto), para o Claude ler
    reuniao.analise.json  métricas exatas (tempo de fala, %, ritmo, bordões, etc.) para o caderno
e imprime um resumo no terminal.

As métricas de tempo vêm dos timestamps do .vtt (exatas). Interrupções são uma estimativa:
sobreposição de falas ou troca de orador a meio de uma frase.
"""
import argparse
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

CONFIG_FILE = Path(__file__).resolve().parent.parent / "config.json"


def nome_teams_configurado():
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8")).get("teams") or None
    except (OSError, json.JSONDecodeError):
        return None

TS_LINE = re.compile(r"((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s+-->\s+((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})")
VOICE = re.compile(r"<v(?:\.[^\s>]+)?\s+([^>]+)>(.*?)(?:</v>|$)", re.S)
TAG = re.compile(r"</?[^>]+>")

# Bordões / muletas (português europeu). Entradas com "re:" são expressões regulares.
BORDOES = [
    "tipo", "pronto", "prontos", "portanto", "basicamente", "literalmente", "ok", "okay",
    "pá", "digamos", "ou seja", "quer dizer", "sei lá", "olha", "no fundo", "efetivamente",
    "em termos de", "de certa forma", "hum", "hmm", "ahn", "eh", "uhm",
    r"re:não é(?=\s*[?,])", r"re:né\b",
]
# Linguagem hesitante (reduz assertividade)
HESITACOES = [
    "acho que", "se calhar", "talvez", "não sei se", "um bocadinho", "só queria",
    "mais ou menos", "penso que", "não tenho a certeza", "de alguma forma", "eventualmente",
    "à partida", "em princípio",
]


def to_seconds(ts: str) -> float:
    ts = ts.replace(",", ".")
    parts = [float(p) for p in ts.split(":")]
    while len(parts) < 3:
        parts.insert(0, 0.0)
    h, m, s = parts
    return h * 3600 + m * 60 + s


def hms(sec: float) -> str:
    sec = int(round(sec))
    return f"{sec // 3600:02d}:{sec % 3600 // 60:02d}:{sec % 60:02d}"


def compile_terms(terms):
    out = []
    for t in terms:
        if t.startswith("re:"):
            label = t[3:].split("(")[0].replace("\\b", "").strip()
            out.append((label, re.compile(r"(?<!\w)" + t[3:], re.I)))
        else:
            out.append((t, re.compile(r"(?<!\w)" + re.escape(t) + r"(?!\w)", re.I)))
    return out


BORDOES_RE = compile_terms(BORDOES)
HESITACOES_RE = compile_terms(HESITACOES)


def count_terms(text, compiled):
    found = {}
    for label, rx in compiled:
        n = len(rx.findall(text))
        if n:
            found[label] = n
    return found


def same_person(a: str, b: str) -> bool:
    def k(s):
        s = unicodedata.normalize("NFD", s.lower())
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return sorted(re.findall(r"\w+", s))
    return k(a) == k(b) or (k(b) and set(k(b)) <= set(k(a)))


def parse_vtt(path: Path):
    raw = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    cues = []
    for block in re.split(r"\n\s*\n", raw):
        lines = [l for l in block.strip().split("\n") if l.strip()]
        idx = next((i for i, l in enumerate(lines) if TS_LINE.search(l)), None)
        if idx is None:
            continue
        m = TS_LINE.search(lines[idx])
        start, end = to_seconds(m.group(1)), to_seconds(m.group(2))
        text = " ".join(lines[idx + 1:])
        vm = VOICE.search(text)
        if vm:
            speaker, body = vm.group(1).strip(), vm.group(2)
        elif re.match(r"^[^:]{2,60}:\s", TAG.sub("", text)):
            speaker, body = TAG.sub("", text).split(":", 1)
        else:
            speaker, body = "Desconhecido", text
        body = re.sub(r"\s+", " ", html.unescape(TAG.sub("", body))).strip()
        if body:
            cues.append({"start": start, "end": max(end, start), "speaker": speaker.strip(), "text": body})
    cues.sort(key=lambda c: c["start"])
    return cues


def merge_turns(cues):
    turns = []
    for c in cues:
        if turns and turns[-1]["speaker"] == c["speaker"]:
            t = turns[-1]
            t["end"] = max(t["end"], c["end"])
            t["text"] += " " + c["text"]
            t["cues"].append(c)
        else:
            turns.append({**c, "cues": [c]})
    return turns


def analyse(cues, eu_name=None):
    turns = merge_turns(cues)
    names = list(dict.fromkeys(c["speaker"] for c in cues))
    eu = next((n for n in names if eu_name and same_person(n, eu_name)), None)

    st = {n: {"tempo_s": 0.0, "palavras": 0, "intervencoes": 0, "maior_s": 0.0, "texto": [],
              "interrompeu": 0, "interrompido": 0} for n in names}
    for c in cues:
        st[c["speaker"]]["tempo_s"] += c["end"] - c["start"]
    for i, t in enumerate(turns):
        s = st[t["speaker"]]
        s["intervencoes"] += 1
        s["maior_s"] = max(s["maior_s"], t["end"] - t["start"])
        s["texto"].append(t["text"])
        if i:
            prev = turns[i - 1]
            overlap = t["start"] < prev["end"] - 0.3
            cut = (t["start"] - prev["end"]) < 0.5 and not prev["text"].rstrip().endswith((".", "?", "!", "…"))
            if overlap or cut:
                s["interrompeu"] += 1
                st[prev["speaker"]]["interrompido"] += 1

    falado = sum(s["tempo_s"] for s in st.values()) or 1.0
    duracao = (max(c["end"] for c in cues) - min(c["start"] for c in cues)) if cues else 0.0
    oradores = []
    for n in names:
        s = st[n]
        texto = " ".join(s["texto"])
        palavras = len(re.findall(r"\w+", texto))
        bord = count_terms(texto, BORDOES_RE)
        hes = count_terms(texto, HESITACOES_RE)
        oradores.append({
            "nome": n,
            "eu": n == eu,
            "tempo_s": round(s["tempo_s"], 1),
            "pct": round(100 * s["tempo_s"] / falado, 1),
            "palavras": palavras,
            "intervencoes": s["intervencoes"],
            "ppm": round(palavras / (s["tempo_s"] / 60)) if s["tempo_s"] > 5 else 0,
            "maior_s": round(s["maior_s"], 1),
            "perguntas": texto.count("?"),
            "bordoes": dict(sorted(bord.items(), key=lambda kv: -kv[1])),
            "bordoes_100": round(100 * sum(bord.values()) / palavras, 2) if palavras else 0,
            "hesitacoes": dict(sorted(hes.items(), key=lambda kv: -kv[1])),
            "hesitacoes_100": round(100 * sum(hes.values()) / palavras, 2) if palavras else 0,
            "interrompeu": s["interrompeu"],
            "interrompido": s["interrompido"],
        })
    oradores.sort(key=lambda o: -o["tempo_s"])
    order = {o["nome"]: i for i, o in enumerate(oradores)}

    # Equilíbrio: 100 = todos falam o mesmo; 0 = uma só pessoa fala tudo.
    # Mede quanto o orador dominante se afasta da partilha justa (1/n).
    n = len([o for o in oradores if o["pct"] > 0])
    if n > 1:
        justo, maior = 1 / n, oradores[0]["pct"] / 100
        equilibrio = max(0, round(100 * (1 - (maior - justo) / (1 - justo))))
    else:
        equilibrio = 0

    t0 = min((c["start"] for c in cues), default=0)
    timeline = [[round(t["start"] - t0, 1), round(t["end"] - t0, 1), order[t["speaker"]]] for t in turns]

    return {
        "v": 1,
        "eu": eu,
        "duracao_s": round(duracao, 1),
        "falado_s": round(falado, 1),
        "equilibrio": equilibrio,
        "oradores": oradores,
        "timeline": timeline,
    }, turns, names


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("vtt", type=Path)
    ap.add_argument("--eu", help='O teu nome tal como aparece no .vtt (por omissão, o de config.json)')
    ap.add_argument("--saida", type=Path, help="Prefixo dos ficheiros de saída (por omissão, ao lado do .vtt)")
    a = ap.parse_args()

    a.eu = a.eu or nome_teams_configurado()
    cues = parse_vtt(a.vtt)
    if not cues:
        sys.exit(f"Nenhuma fala encontrada em {a.vtt}. É um .vtt válido?")
    dados, turns, names = analyse(cues, a.eu)

    base = a.saida or a.vtt.with_suffix("")
    t0 = cues[0]["start"]
    limpo = [f"# Duração: {hms(dados['duracao_s'])}", f"# Participantes: {', '.join(names)}", ""]
    limpo += [f"[{hms(t['start'] - t0)}] {t['speaker']}: {t['text']}\n" for t in turns]
    Path(f"{base}.limpo.txt").write_text("\n".join(limpo), encoding="utf-8")
    Path(f"{base}.analise.json").write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Duração {hms(dados['duracao_s'])} · {len(names)} oradores · equilíbrio {dados['equilibrio']}/100")
    print(f"{'Orador':<28}{'Tempo':>9}{'%':>7}{'Pal.':>7}{'Interv.':>8}{'ppm':>6}{'?':>4}{'Bord/100':>10}{'Interromp.':>11}")
    for o in dados["oradores"]:
        mark = " ◀ eu" if o["eu"] else ""
        print(f"{o['nome'][:27]:<28}{hms(o['tempo_s']):>9}{o['pct']:>6}%{o['palavras']:>7}{o['intervencoes']:>8}"
              f"{o['ppm']:>6}{o['perguntas']:>4}{o['bordoes_100']:>10}{o['interrompeu']:>6}/{o['interrompido']:<4}{mark}")
    if a.eu and not dados["eu"]:
        print(f"\n⚠ Não encontrei \"{a.eu}\" entre os oradores: {', '.join(names)}", file=sys.stderr)
    print(f"\n→ {base}.limpo.txt\n→ {base}.analise.json")


if __name__ == "__main__":
    main()
