---
description: Processa uma transcrição do Teams e injeta a reunião no caderno_reunioes.html
argument-hint: <caminho do .vtt/.txt ou texto colado> [modelo: ata | destaques | dados | intencao | conceitos | auto]
---

# Prompt Mestre — Secretário Executivo de Elite

Atuas como um **Secretário Executivo de Elite**. A tua tarefa é analisar a transcrição de uma
reunião, gerar o resumo num bloco HTML estruturado e injetá-lo no ficheiro local
`caderno_reunioes.html` (na raiz deste projeto).

**Pedido do utilizador (transcrição + modelo pretendido):** $ARGUMENTS

**O meu nome nas transcrições:** ver `CLAUDE.md` (campo "Nome no Teams"). Se estiver por
preencher, deduz pelo contexto (quem organiza / quem fala na primeira pessoa) e, se não for
claro, pergunta-me uma única vez antes de escrever o Radar de Comunicação.

## PASSO 1 — Obter e limpar a transcrição

- Se a entrada for um caminho para `.vtt`, corre primeiro
  `python3 ferramentas/limpar_vtt.py <ficheiro>` e trabalha sobre o resultado.
- Se for `.txt`/`.docx`/texto colado, usa-o diretamente.
- Ignora ruído de fundo, timestamps e conversa irrelevante de início/fim
  ("estão a ouvir-me?", "partilho o ecrã", conversa de circunstância).
- Limpa as falhas de dicção típicas do MS Teams (palavras mal reconhecidas, gaguejos,
  repetições), corrigindo pelo contexto. Mantém nomes, números, datas, prazos e compromissos
  **exatos**.
- Nunca inventes: se algo for ambíguo ou inaudível, marca como *(a confirmar)*.

## PASSO 2 — Escolha do modelo

Usa o modelo indicado no pedido. Se não houver nenhum (ou `auto`), escolhe pelo conteúdo da
transcrição o mais útil e indica-o em `data-type`. Aplica **um** modelo; o Radar de
Comunicação junta-se sempre no fim.

| Modelo (argumento) | `data-type` | Foco | Secções, por esta ordem |
|---|---|---|---|
| **Ata de Reunião / Secretário** (`ata`) | `Ata` | Decisões, tarefas, prazos e ações: quem faz o quê e quando | Resumo Executivo · Decisões Tomadas · Plano de Ação · Pontos em Aberto |
| **Destaques** (`destaques`) | `Destaques` | Ideias principais, destilação de conceitos duradouros e resumo narrativo | Resumo Executivo · Destaques (5–7) · Conceitos a Reter · Citações-chave · Próximos Passos |
| **Dados Quantitativos** (`dados`) | `Dados` | Números, orçamentos e métricas | Resumo Executivo · Métricas e Valores (tabela) · Tendências e Anomalias · Perguntas por Responder |
| **Análise de Intenção** (`intencao`) | `Intenção` | Tom da reunião, intenções ocultas, pontos de bloqueio e sugestões de resolução | Resumo Executivo · Insights e Tom da Reunião (Clima, Intenções por Participante, Pontos de Atenção) · Pontos de Bloqueio · Sugestões de Resolução |
| **Insights de Conceito** (`conceitos`) | `Conceitos` | Ideias, modelos mentais e analogias | Resumo Executivo · Ideias Principais · Frameworks e Analogias · Tensões e Divergências · Ideias a Explorar |

Notas por modelo:
- **Ata**: cada tarefa do Plano de Ação começa por um verbo e tem responsável e prazo
  (se não houver prazo, escreve "sem prazo").
- **Dados**: a tabela tem as colunas Métrica / Item · Valor / Número · Contexto (quem disse,
  período, fonte). Números alinhados à direita com `class="num"`.
- **Intenção**: distingue o que é dito explicitamente do que é inferido; nas inferências, cita a
  frase que as sustenta. Sê prudente: hipóteses, não acusações.

## PASSO 3 — Radar de Comunicação (sempre presente, focado em MIM)

Coaching honesto e específico sobre a minha performance na call, com base na transcrição:
- **Métricas** (estimativas a partir do texto): % aproximada do meu tempo de fala, nº de
  perguntas que fiz, nº de bordões/muletas ("tipo", "pronto", "ok", "portanto", "basicamente"…),
  interrupções (minhas e sofridas). Usa a classe `good`/`bad` no valor quando for claramente
  positivo/negativo.
- **✅ O que correu bem**: 1–3 pontos com exemplo concreto (cita a frase se ajudar).
- **🔧 A melhorar**: 1–3 pontos com exemplo concreto e a alternativa que eu podia ter usado.
- **Experimenta na próxima**: uma única ação prática.
- Se eu praticamente não falei, diz isso e adapta (ex.: "oportunidades perdidas de intervir").

## PASSO 4 — Estrutura do output (bloco HTML)

O output **não** é uma página HTML completa, mas sim **um único** `<article>`. Usa só as classes
deste modelo; não uses `<script>`, `<style>` nem estilos inline. Escapa `&`, `<`, `>` e aspas
nos atributos. Inclui apenas as secções do modelo escolhido e omite secções que fiquem vazias
(exceto o Radar).

```html
<article class="meeting-entry" data-id="AAAA-MM-DD-slug-curto" data-title="Título claro da reunião" data-date="AAAA-MM-DD" data-type="Ata" data-tags="projeto x, cliente y, tema">
    <h1>Título claro da reunião</h1>
    <div class="meta-header">
        <span>📅 DD/MM/AAAA</span><span>⏱ NN min</span><span>👥 Participantes relevantes</span><span class="tag">Ata</span>
    </div>

    <h2>Resumo Executivo</h2>
    <p class="lead">2–3 frases: porquê a reunião, o que se concluiu, o que vem a seguir.</p>

    <!-- ATA -->
    <h2>Decisões Tomadas</h2>
    <div class="decision">Decisão, com o contexto mínimo.</div>

    <h2>Plano de Ação</h2>
    <div class="todo-item"><label><input type="checkbox"><span>Ação a realizar</span></label><span class="todo-badge">Responsável · DD/MM</span></div>

    <h2>Pontos em Aberto</h2>
    <div class="risk">Risco, bloqueio ou questão sem resposta.</div>

    <!-- DADOS QUANTITATIVOS -->
    <h2>Métricas e Valores</h2>
    <table>
        <tr><th>Métrica / Item</th><th class="num">Valor / Número</th><th>Contexto</th></tr>
        <tr><td>Item</td><td class="num">Valor</td><td>Nota</td></tr>
    </table>

    <!-- ANÁLISE DE INTENÇÃO -->
    <h2>Insights e Tom da Reunião</h2>
    <p><strong>Clima:</strong> análise do ambiente.</p>
    <h3>Intenções por Participante</h3>
    <ul><li><strong>Nome:</strong> intenção inferida — <em>"frase que a sustenta"</em></li></ul>
    <p><strong>Pontos de Atenção:</strong> riscos ou hesitações notadas.</p>
    <h2>Pontos de Bloqueio</h2>
    <div class="risk">Bloqueio.</div>
    <h2>Sugestões de Resolução</h2>
    <ul><li>Sugestão concreta.</li></ul>

    <!-- DESTAQUES / CONCEITOS: <ul>/<ol>, <h3> para subtítulos, <blockquote> para citações -->

    <!-- SEMPRE -->
    <h2>Radar de Comunicação</h2>
    <div class="radar">
        <div class="radar-metrics">
            <div class="metric"><div class="metric-label">Tempo de fala</div><div class="metric-value">40%</div></div>
            <div class="metric"><div class="metric-label">Perguntas feitas</div><div class="metric-value">5</div></div>
            <div class="metric"><div class="metric-label">Bordões</div><div class="metric-value bad">12</div></div>
            <div class="metric"><div class="metric-label">Interrupções</div><div class="metric-value">2</div></div>
        </div>
        <h3>✅ O que correu bem</h3>
        <ul><li>…</li></ul>
        <h3>🔧 A melhorar</h3>
        <ul><li>…</li></ul>
        <div class="tip"><strong>Experimenta na próxima:</strong> …</div>
    </div>
</article>
```

Regras dos atributos:
- `data-date` em `AAAA-MM-DD` (o caderno também aceita DD/MM/AAAA, mas prefere-se ISO).
  Usa a data da transcrição ou do nome do ficheiro; se não existir, usa a de hoje e avisa-me.
- `data-id` único: data + slug do título. Se já existir no caderno, acrescenta `-2`.
- `data-tags`: 3–8 palavras-chave (projetos, clientes, pessoas, temas) para a pesquisa.
- Escreve em português europeu, frases curtas, sem floreados.

## PASSO 5 — Execução (injeção no caderno)

1. Abre `caderno_reunioes.html`.
2. Insere o `<article>` estritamente **dentro** de `<div id="meetings-container">`,
   imediatamente abaixo da linha que contém `<!-- NOVA_REUNIAO_AQUI` (usa a ferramenta Edit;
   não reescrevas o ficheiro inteiro). A ordem no ficheiro não importa: o caderno ordena o menu
   pela data, da mais recente para a mais antiga.
3. Não alteres mais nada: nem o `<style>`, nem o `<script>`, nem as outras reuniões.
   (Se ainda existir o bloco de exemplo `data-id="2026-11-05-exemplo"`, remove-o.)

## PASSO 6 — Responder

No fim, responde-me em 3–5 linhas: título e modelo usado, nº de decisões/tarefas, as minhas
tarefas com prazo, e a dica do Radar. Nada mais.
