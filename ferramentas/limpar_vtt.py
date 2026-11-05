#!/usr/bin/env python3
"""Limpa uma transcrição do Teams (.vtt) para texto legível.

- Remove o cabeçalho WEBVTT, IDs de cue e timestamps.
- Junta falas consecutivas da mesma pessoa num só parágrafo.
- Mantém o timestamp de início de cada intervenção ([hh:mm:ss]) e indica a duração total.

Uso:  python3 ferramentas/limpar_vtt.py transcricoes/reuniao.vtt > transcricoes/reuniao.txt
"""
import html
import re
import sys

TS = re.compile(r"(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+((\d{1,2}:)?\d{2}:\d{2})[.,]\d{3}")
VOICE = re.compile(r"<v\s+([^>]+)>(.*?)(</v>|$)", re.S)
TAG = re.compile(r"</?[^>]+>")


def norm_ts(t: str) -> str:
    parts = t.split(":")
    return ":".join(["00"] * (3 - len(parts)) + parts)


def main(path: str) -> None:
    with open(path, encoding="utf-8-sig") as f:
        blocks = re.split(r"\n\s*\n", f.read().replace("\r\n", "\n"))

    turns, last_end = [], "00:00:00"
    for block in blocks:
        lines = [l for l in block.strip().split("\n") if l.strip()]
        ts_idx = next((i for i, l in enumerate(lines) if TS.search(l)), None)
        if ts_idx is None:
            continue
        start = norm_ts(lines[ts_idx].split("-->")[0].strip().split(".")[0].split(",")[0])
        last_end = norm_ts(TS.search(lines[ts_idx]).group(2))
        text = " ".join(lines[ts_idx + 1:])
        m = VOICE.search(text)
        speaker, body = (m.group(1).strip(), m.group(2)) if m else ("?", text)
        if ":" in body and speaker == "?":  # formato "Nome: texto"
            speaker, body = body.split(":", 1)
        body = html.unescape(TAG.sub("", body)).strip()
        if not body:
            continue
        if turns and turns[-1][1] == speaker:
            turns[-1][2].append(body)
        else:
            turns.append([start, speaker.strip(), [body]])

    print(f"# Duração aproximada: {last_end}")
    print(f"# Participantes: {', '.join(dict.fromkeys(t[1] for t in turns))}\n")
    for start, speaker, parts in turns:
        print(f"[{start}] {speaker}: {' '.join(parts)}\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
