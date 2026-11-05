# Caderno de Reuniões · CIO Office Portugal

Transcrições do Teams → atas, tarefas e coaching de comunicação, num caderno pessoal que
funciona offline no PC da empresa. Pensado para um ambiente fechado: sem internet, sem
instalações, com a IA interna (Kilo Code) usada por copiar e colar.

## Para distribuir à equipa

Envia o ficheiro **`dist/Caderno-de-Reunioes-CIO-Office.zip`**. Contém:

| Ficheiro | Para quê |
|---|---|
| `Caderno de Reuniões.html` | O caderno. Abre-se com o Edge (duplo clique). |
| `LEIA-ME.txt` | Arranque em 5 minutos. |
| `Procedimento - Caderno de Reuniões.pdf` | Guia passo a passo com imagens. |
| `Exemplo para experimentar/` | Uma transcrição fictícia para treinar. |
| `Para a equipa de IT/Nota técnica.txt` | O que o ficheiro faz, rede, dados e requisitos. |

## Como funciona

1. **Nova reunião** → escolhe o `.vtt` ou `.docx` do Teams → escolhe quem és.
2. **Copiar pedido** → cola no Kilo Code → espera pela resposta.
3. Copia a resposta → cola no caderno → **Guardar reunião**.

O caderno calcula sozinho quem falou quanto (a partir dos tempos da transcrição), prepara o
pedido com o contexto das reuniões anteriores e as tarefas pendentes, valida a resposta e guarda
tudo no navegador e, se a pessoa quiser, num ficheiro `.json` no OneDrive.

## Desenvolvimento

```
python3 ferramentas/construir.py            # gera dist/ (HTML + ZIP)
node ferramentas/gerar_procedimento.js      # regenera o PDF com capturas reais
```
Ver `CLAUDE.md` para a arquitetura e as regras, e `ROADMAP.md` para as próximas funcionalidades.
