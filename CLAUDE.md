# Caderno de Reuniões · CIO Office Portugal (Natixis)

Ferramenta da equipa: transcrições do Teams → um caderno HTML pessoal, offline e pesquisável.
Cada pessoa tem o seu caderno; o repositório guarda só o modelo e as ferramentas.

## Comandos (Kilo Code e Claude Code)
- `/configurar` — cria ou atualiza o caderno pessoal (nome, nome no Teams). Correr depois de cada `git pull`.
- `/reuniao <ficheiro.vtt> [ata|destaques|dados|intencao|conceitos]` — processa uma reunião.

## Estrutura
- `prompts/prompt_mestre.md` e `prompts/configurar.md` — a fonte única das instruções. Os comandos
  em `.kilo/commands/` (Kilo Code) e `.claude/commands/` (Claude Code) só apontam para eles.
- `.kilo/agents/secretario.md` — agente do Kilo Code com permissões limitadas (escreve só em `transcricoes/`).
- `kilo.jsonc` — configuração do Kilo Code (carrega este ficheiro como regras).
- `modelo/caderno.html` — o modelo da equipa (design, lógica, 3 reuniões de exemplo). Versionado.
- `caderno_reunioes.html` e `config.json` — **pessoais**, fora do git.
- `transcricoes/` — `.vtt`, textos limpos, análises e artigos. Fora do git.
- `ferramentas/analisar_vtt.py` — métricas exatas por orador a partir dos timestamps.
- `ferramentas/injetar.py` — insere uma reunião no caderno (valida, junta métricas, cópia `.bak`).
- `ferramentas/configurar.py` — gera o caderno pessoal a partir do modelo, mantendo as reuniões.
- `marca/` — logótipo oficial Natixis CIB (reduzido) e a especificação de cores da marca.

## Regras
- Nunca adicionar ao git cadernos, transcrições, `config.json` ou conteúdo de reuniões reais.
- Nunca editar o `caderno_reunioes.html` à mão para inserir reuniões: usar `injetar.py`.
- Mudanças de design fazem-se em `modelo/caderno.html`; depois `/configurar` aplica-as.
- O design segue Hallmark (Floor), Web Interface Guidelines, Emil Kowalski (motion) e tokens à
  shadcn: cores e espaçamentos só por tokens no `:root`; nada de rótulos em maiúsculas
  espaçadas, "·" a juntar metadados, emojis como ícones, cartões dentro de cartões; animação só
  para estados (nunca na paleta ⌘K nem ao mudar de vista); `prefers-reduced-motion` respeitado.
- Cores da marca vêm de `marca/brand-spec.md`, nunca de memória.
- Offline e sem dependências externas (sem CDNs, sem fontes remotas).
- Testes visuais: Playwright está disponível; verificar desktop, modo escuro, 320/390/768 px e sem JavaScript.
