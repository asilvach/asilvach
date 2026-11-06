# Roadmap · Caderno de Reuniões

Prioridade = valor no dia a dia ÷ esforço. ✅ feito · 🔜 próximo · 💡 ideia

## v9 (atual): preparar, seguir e o Outlook

| | Feature |
|---|---|
| ✅ | Agenda: planear reuniões ou trazê-las do Outlook (.ics guardado no Outlook, escolhido ou deixado em `entrada`) |
| ✅ | Preparar a reunião: o que me devem, o que devo, o que está em aberto e as decisões com essas pessoas; agenda com um clique |
| ✅ | Para o Outlook sem rede: compromisso .ics com agenda, participantes e lembrete; email com a agenda (mailto) |
| ✅ | A ata fica ligada à reunião planeada; pontos da agenda não falados vão para "Para retomar" |
| ✅ | Editar qualquer item depois de guardar (tipo, texto, pessoa, prazo) e acrescentar tarefas, pedidos e decisões |
| ✅ | Tarefas avulsas (sem reunião) e prazos para o Outlook (.ics) |
| ✅ | Lembrar: mensagem de seguimento pronta para o Teams ou email no Outlook |
| ✅ | Revisão da semana (copiar como ponto de situação) e registo de decisões pesquisável |
| ✅ | Atualizar reuniões antigas para o formato com citações (copiar e colar ou pasta) |
| ✅ | Coaching: meta pessoal com a evolução ao longo das reuniões |

## v8: organização pessoal fiável

| | Feature |
|---|---|
| ✅ | Resumo com estrutura fixa: objetivo, temas, decisões, as minhas tarefas, à espera de outros, bloqueios, para retomar |
| ✅ | Tarefas só quando alguém assume; pedidos, propostas e perguntas separados; nada de responsáveis ou prazos inventados |
| ✅ | Cada item guarda a citação e o minuto; o caderno verifica a citação na transcrição e marca o que é para confirmar |
| ✅ | Rever antes de guardar (modo pasta e copiar e colar): confirmar, editar, reclassificar ou tirar cada item |
| ✅ | Tarefas anteriores só fecham com citação e confirmação; data de conclusão registada |
| ✅ | Nota rápida para reuniões sem transcrição (prefixos D:, T:, E:, ?, B:, R:) |
| ✅ | Tarefas: "As minhas" e "À espera de outros"; Pessoas mostra o que está à espera de cada um |
| ✅ | Ctrl K encontra decisões e salta para o minuto |
| ✅ | Sincronização sem perdas: junção registo a registo, apagados registados, sem importações duplicadas, aviso de falha de escrita, cópias de conflito do OneDrive |
| ✅ | Coaching numa janela à parte (botão "Coaching" na reunião), com comparação à reunião anterior; não avalia outras pessoas; saúde dos projetos só com factos ditos |
| ✅ | "Cumpridas no prazo" só com data de conclusão; Edge ou Chrome em todas as mensagens |

## v4: caderno autónomo para ambiente fechado

| | Feature |
|---|---|
| ✅ | Um só ficheiro HTML offline; sem Python, servidor ou agente |
| ✅ | Lê `.vtt`, `.docx` e texto do Teams; métricas calculadas no navegador |
| ✅ | Assistente "Nova reunião" em 4 passos; pedido gerado para o Kilo Code; resposta JSON validada |
| ✅ | Contexto de reuniões anteriores e fecho automático de tarefas pendentes |
| ✅ | Temas com minutos, transcrição completa, "Copiar ata" |
| ✅ | Ficheiro de dados no OneDrive, cópias de segurança, CSP sem rede, nota técnica para IT |

## v5: Projetos (PMO crítico)

| | Feature |
|---|---|
| ✅ | Projetos declarados, sugeridos (pessoas/temas recorrentes) e associados pelo Kilo Code |
| ✅ | Extração PMO por reunião com códigos estáveis; reconstrução do histórico a partir das atas |
| ✅ | Tendência de marcos (MTA), estado reunião a reunião, burn-up do backlog |
| ✅ | Alertas: melancia, deriva, dores crónicas, reaberturas, decisões arrastadas, ações repetidas, convergência, satisfação, hesitação |
| ✅ | Perguntas para a próxima reunião e relatório para o head |

## v7: acabamento

| | Feature |
|---|---|
| ✅ | Botão principal em degradê violeta Natixis, com brilho e sombra tingida; a luz desloca-se no hover |
| ✅ | Fita de quem falou em cápsulas com brilho, trilho fundo e marcas de tempo a cada quarto |
| ✅ | Fio de marca no topo, indicador no item ativo, gráficos com área em degradê |
| ✅ | Lista lateral alinha o mês ao topo para nenhuma reunião ficar meio tapada |

## v6: novo design

| | Feature |
|---|---|
| ✅ | Tipografia própria embutida (Lexend nos títulos, IBM Plex Sans no texto; licença OFL, sem rede) |
| ✅ | Barra superior com "Ir para…" e "Nova reunião" em todas as larguras; barra lateral mais leve |
| ✅ | Início "A tua semana": uma frase com o essencial, última reunião, tarefas e saúde dos projetos |
| ✅ | Secções separadas por linhas finas em vez de cartões; cores Natixis em OKLCH, claro e escuro |
| ✅ | Animação só para estados, curvas próprias, `prefers-reduced-motion` respeitado |

## v2

| | Feature | Para quê |
|---|---|---|
| ✅ | **Métricas exatas por orador** (`analisar_vtt.py`) | Tempo de fala e % por pessoa, palavras, intervenções, ritmo (ppm), perguntas, maior monólogo e interrupções, calculados pelos timestamps do `.vtt`. O Claude não estima nada. |
| ✅ | **Painel de Participação + Linha do tempo** | Ver quem dominou e quando cada pessoa falou. Índice de equilíbrio da conversa. |
| ✅ | **Radar com números** | Cartões com estado (Bom / Atenção / A melhorar) para o teu discurso: tempo de fala vs. partilha justa, ritmo, bordões, hesitações, perguntas, monólogo, interrupções. |
| ✅ | **Evolução** | Gráficos das tuas métricas ao longo do tempo, tendência, bordões mais frequentes, histórico de dicas. |
| ✅ | **Tarefas globais** | Todas as tarefas de todas as reuniões: minhas/todas, em atraso, próximos 7 dias, estado guardado. |
| ✅ | **Pessoas** | Com quem te reúnes, quantas vezes, quanto falam, tarefas em aberto de cada pessoa. |
| ✅ | **Paleta ⌘K** | Saltar para reuniões, tarefas, vistas e ações; pesquisa sem acentos, com excertos. |
| ✅ | **Notas pessoais por reunião** | Guardadas no navegador e incluídas na pesquisa. |
| ✅ | **Injeção segura** (`injetar.py`) | Valida o HTML, evita duplicados, faz cópia de segurança, remove exemplos. |
| ✅ | Tema claro/escuro, telemóvel, impressão/PDF, atalhos (`/`, `j`/`k`, ⌘K), acessibilidade (teclado, foco, leitores de ecrã, *reduced motion*) | |

## 🔜 Próximo (maior impacto)

1. **Processar em lote** — `/reuniao transcricoes/*.vtt`: processa todas as transcrições novas de uma vez (saltando as que já estão no caderno).
2. ~~Suporte a `.docx` do Teams~~ (feito na v4). **Plaud** — o analisador passa a ler também o `.docx` exportado pelo Teams e as transcrições do Plaud (já há um conector Plaud nesta conta).
3. **Briefing pré-reunião** — `/preparar <pessoa ou projeto>`: junta as últimas reuniões, as decisões, as tarefas em aberto e o histórico de comunicação com essas pessoas numa página de preparação.
4. **Resumo semanal** — `/semana`: decisões, tarefas criadas/fechadas, horas em reuniões e evolução da comunicação, com uma sugestão de foco para a semana seguinte.
5. **Decisões globais** — vista "Decisões", pesquisável, com data e reunião de origem. Responde a "quando é que decidimos X?".
6. **Estado das tarefas no ficheiro** — hoje o "feito" fica no navegador; passar a gravá-lo no HTML (via Claude ou exportação) para não se perder ao mudar de computador.
7. **Exportar** — follow-up por email (rascunho no Gmail com o Plano de Ação), `.ics` com os prazos, Markdown para o Notion/Confluence.

## 💡 Mais tarde

- **Coaching mais fundo**: rácio perguntas abertas/fechadas, tempo até à primeira intervenção, quem interrompe quem (matriz), palavras de compromisso vs. hesitação, comparação por tipo de reunião (1:1 vs. clientes).
- **Objetivos pessoais**: definir metas ("bordões < 2/100 até dezembro") e ver o progresso na Evolução.
- **Projetos**: agrupar reuniões por tag/projeto, com uma cronologia de decisões e riscos.
- **Diarização sem nomes**: quando o `.vtt` não tem oradores, separar vozes pelo texto e pedir confirmação.
- **Pesquisa semântica**: "reuniões onde se falou de atrasos com fornecedores", com um índice gerado pelo Claude.
- **Arquivo anual**: dividir o caderno por ano quando ficar grande (> ~300 reuniões), mantendo a pesquisa global.
