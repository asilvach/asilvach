# 📒 Caderno de Reuniões

Transcrições do Teams → um caderno pessoal, offline e pesquisável, com atas, tarefas e coaching
de comunicação baseado em métricas reais.

## As peças

| Peça | O que faz |
|---|---|
| `caderno_reunioes.html` | A app. Abre no Chrome/Edge com duplo clique. Funciona offline e sem dependências. |
| `.claude/commands/reuniao.md` | O Prompt Mestre, disponível no Claude Code como `/reuniao`. |
| `ferramentas/analisar_vtt.py` | Limpa o `.vtt` e calcula métricas exatas por orador. |
| `ferramentas/injetar.py` | Insere a reunião no caderno com validação e cópia de segurança. |
| `ROADMAP.md` | Próximas features, por prioridade. |

## O que tens no caderno

- **Início**: reuniões e horas do mês, as tuas tarefas (e as que estão em atraso), o teu tempo de fala médio, o foco de comunicação atual.
- **Reunião**: resumo segundo o modelo escolhido; painel de **Participação** (tempo e % de cada pessoa, palavras, ritmo, perguntas, interrupções, equilíbrio da conversa); **linha do tempo** de quem falou quando; **Radar de Comunicação** com os teus números e coaching; notas pessoais.
- **Tarefas**: todas as tarefas de todas as reuniões, agrupadas por prazo, com o estado guardado.
- **Pessoas**: com quem te reúnes, quanto falam, tarefas em aberto de cada uma.
- **Evolução**: gráficos do teu tempo de fala, ritmo, bordões, hesitações, perguntas e monólogos ao longo do tempo.
- **Pesquisa**: barra lateral (tecla `/`) e paleta `Ctrl/⌘ K`. Ignora acentos e realça os resultados.
- Tema claro/escuro (botão no topo), telemóvel, impressão/PDF, `j`/`k` para a reunião seguinte/anterior.

## Começar

1. Preenche o teu **Nome no Teams** no `CLAUDE.md`, exatamente como aparece no `.vtt`.
2. Abre o `caderno_reunioes.html`. Tem 3 reuniões de exemplo, que desaparecem quando adicionares a primeira reunião real.

## Rotina diária

1. Descarrega o transcript `.vtt` do Teams para `transcricoes/`. Põe a data no nome, ex.: `2026-11-05-kickoff.vtt`.
2. No Claude Code, nesta pasta:
   ```
   /reuniao transcricoes/2026-11-05-kickoff.vtt ata
   ```
   Modelos: `ata`, `destaques`, `dados`, `intencao`, `conceitos` ou `auto`.
3. Atualiza o caderno no navegador (F5).

O estado das tarefas, as notas e o tema ficam guardados no navegador (localStorage). As
reuniões ficam no ficheiro HTML.
