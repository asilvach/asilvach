# 📒 Caderno de Reuniões

Duas peças:

1. **O Caderno** — `caderno_reunioes.html`. Abre no Chrome/Edge (duplo clique). Funciona offline:
   menu lateral gerado automaticamente, pesquisa global (ignora acentos, várias palavras,
   destaca os resultados), filtros por tipo, tarefas com checkbox que ficam guardadas no navegador,
   links diretos para cada reunião (`#r-…`), modo escuro e impressão/PDF.
   Tecla `/` foca a pesquisa; `Esc` limpa.
2. **O Agente** — o Prompt Mestre em `.claude/commands/reuniao.md`, disponível no Claude Code como `/reuniao`.

## Rotina diária

1. Descarrega o transcript `.vtt` do Teams e guarda-o em `transcricoes/`.
2. No Claude Code, nesta pasta:
   ```
   /reuniao transcricoes/2026-11-05-kickoff.vtt ata
   ```
   Modelos: `ata` (Ata de Reunião / Secretário), `destaques`, `dados` (Dados Quantitativos),
   `intencao` (Análise de Intenção), `conceitos` (Insights de Conceito) ou `auto`. Também podes colar o texto diretamente.
3. Atualiza o `caderno_reunioes.html` no navegador (F5) — a reunião nova aparece no topo.

Sem Claude Code? Copia o conteúdo de `.claude/commands/reuniao.md` e substitui `$ARGUMENTS`
pela transcrição + lente.

**Antes de começar:** preenche o teu nome do Teams em `CLAUDE.md` e apaga a reunião de exemplo
(ou deixa o `/reuniao` apagá-la na primeira vez).
