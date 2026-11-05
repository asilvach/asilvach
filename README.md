# Caderno de Reuniões · CIO Office Portugal

Transcrições do Teams → um caderno pessoal, offline e pesquisável, com atas, tarefas e coaching
de comunicação baseado em métricas reais. Cada pessoa da equipa tem o seu caderno, no seu PC.

## Para começar (cada pessoa, uma vez)

1. **Pré-requisitos:** [Kilo Code](https://kilo.ai) no VS Code (ou o Claude Code), Python 3.9+ e Git.
2. **Obter o projeto:**
   ```
   git clone https://github.com/asilvach/asilvach.git caderno-reunioes
   cd caderno-reunioes
   ```
3. **No Kilo Code, com a pasta aberta no VS Code:** `/configurar`
   Pergunta o teu nome e como apareces nas transcrições do Teams, e cria o **teu**
   `caderno_reunioes.html`. Sem assistente:
   `python ferramentas/configurar.py --nome "Ana Silva" --teams "Silva, Ana"`.
4. Abre o `caderno_reunioes.html` no Edge ou no Chrome (duplo clique). Traz 3 reuniões de
   exemplo, que desaparecem quando adicionares a primeira reunião tua.

## No dia a dia

1. No Teams, descarrega a transcrição (`.vtt`) para `transcricoes/`. Põe a data no nome, ex.:
   `2026-11-05-comite-it.vtt`.
2. No Kilo Code: `/reuniao transcricoes/2026-11-05-comite-it.vtt ata`
   Modelos: `ata`, `destaques`, `dados`, `intencao`, `conceitos` ou `auto`.
3. Atualiza o caderno no navegador (F5).

**Receber melhorias:** `git pull` e depois `/configurar`. O design é atualizado e as tuas
reuniões ficam intactas (é guardada uma cópia `.bak`).

## Kilo Code

- **Comandos:** `/reuniao` e `/configurar` (em `.kilo/commands/`). Se o Kilo Code não os mostrar,
  usa `/reload` ou abre uma conversa nova.
- **Agente "secretario"** (opcional, recomendado): escolhe-o no seletor de agentes do Kilo Code.
  Só escreve em `transcricoes/`, corre as ferramentas Python sem pedir confirmação e não mexe no
  design. Para mudar o design, usa o agente Code.
- **Modelo:** o Prompt Mestre funciona com o modelo escolhido no Kilo Code (ex.: Claude Sonnet 4.6).
- As regras do projeto (`CLAUDE.md`) são carregadas através do `kilo.jsonc`.

O Claude Code continua a funcionar com os mesmos comandos: ambos usam `prompts/`.

## O que tens no caderno

- **Início:** o mês em números, a última reunião com a fita de quem falou quando, as tuas
  tarefas e o teu foco de comunicação.
- **Reunião:** o resumo no modelo escolhido; a fita de quem falou quando (clica numa pessoa para
  a isolar); participação por pessoa (tempo, %, palavras, ritmo, perguntas, interrupções);
  Radar de Comunicação com os teus números e coaching; notas pessoais.
- **Tarefas:** todas as ações de todas as reuniões, por prazo, com o estado guardado.
- **Pessoas:** com quem te reúnes, quanto falam e as tarefas em aberto de cada uma.
- **Evolução:** a tua comunicação ao longo do tempo, com a zona recomendada e a tendência.
- **Pesquisa:** `/` na barra lateral, ou `Ctrl K` para ir a qualquer lado. Ignora acentos.
  Atalhos `J`/`K` para a reunião seguinte e anterior.

## Privacidade

- O caderno, o `config.json` e as transcrições são **pessoais** e estão no `.gitignore`:
  nunca vão para o repositório.
- Tudo funciona offline, sem servidores nem serviços externos. O estado das tarefas, as notas e
  o tema ficam guardados no navegador.
- O processamento das transcrições é feito pelo modelo configurado no Kilo Code (ou no Claude Code). Segue as regras internas da Natixis
  sobre o uso de ferramentas de IA com informação da empresa.

## Peças

| Peça | Função |
|---|---|
| `modelo/caderno.html` | O modelo da equipa: design, lógica e exemplos |
| `ferramentas/configurar.py` | Cria ou atualiza o caderno pessoal |
| `ferramentas/analisar_vtt.py` | Limpa o `.vtt` e calcula métricas exatas por orador |
| `ferramentas/injetar.py` | Insere uma reunião no caderno, com validação e cópia de segurança |
| `prompts/` | O Prompt Mestre e as instruções de configuração (fonte única) |
| `.kilo/`, `kilo.jsonc` | Comandos, agente e regras para o Kilo Code |
| `.claude/commands/` | Os mesmos comandos para o Claude Code |
| `marca/` | Logótipo Natixis CIB e especificação das cores da marca |
| `ROADMAP.md` | Próximas funcionalidades |
