---
description: Processa uma transcrição do Teams e injeta a reunião no caderno_reunioes.html
argument-hint: <caminho do .vtt/.txt ou texto colado> [lente: ata | destaques | dados | conceitos | auto]
---

# Prompt Mestre — Agente do Caderno de Reuniões

És o meu assistente de reuniões. Vais transformar uma transcrição em bruto numa entrada
estruturada e injetá-la no ficheiro `caderno_reunioes.html` (na raiz deste projeto).

**Entrada do utilizador:** $ARGUMENTS

**O meu nome nas transcrições:** ver `CLAUDE.md` (campo "Nome no Teams"). Se estiver por
preencher, deduz pelo contexto (quem organiza / quem fala na primeira pessoa) e, se não for
claro, pergunta-me uma única vez antes de escrever o Radar de Comunicação.

## 1. Obter e limpar a transcrição

- Se a entrada for um caminho para `.vtt`, corre primeiro
  `python3 ferramentas/limpar_vtt.py <ficheiro>` e trabalha sobre o resultado.
- Se for `.txt`/`.docx`/texto colado, usa-o diretamente.
- Ignora ruído: timestamps, gaguejos, repetições, "estás a ouvir?", "partilho o ecrã",
  conversa de circunstância. Mantém nomes, números, datas, prazos e compromissos **exatos**.
- Nunca inventes: se algo for ambíguo ou inaudível, marca como *(a confirmar)*.

## 2. Escolher a lente (modelo mental)

Usa a lente indicada nos argumentos. Se não houver nenhuma (ou `auto`), escolhe a mais adequada
ao propósito da reunião e indica-a em `data-type`.

| Lente | `data-type` | Foco | Secções obrigatórias |
|---|---|---|---|
| **Secretário de Reunião** (`ata`) | `Ata` | Decisões e tarefas | Resumo · Decisões · Tarefas (responsável + prazo) · Pontos em aberto · Radar |
| **Destaques** (`destaques`) | `Destaques` | O essencial em 2 minutos | Resumo · 5–7 destaques · Citações-chave · Próximos passos · Radar |
| **Análise Quantitativa** (`dados`) | `Dados` | Números e métricas | Resumo · Tabela de métricas (valor, período, fonte/quem disse) · Tendências e anomalias · Perguntas por responder · Radar |
| **Insights de Conceito** (`conceitos`) | `Conceitos` | Ideias e modelos mentais | Resumo · Ideias principais · Frameworks/analogias · Tensões e divergências · Ideias a explorar · Radar |

## 3. Radar de Comunicação (sempre presente, focado em MIM)

Coaching honesto e específico sobre a minha performance na call, com base na transcrição:
- **Métricas** (estimativas a partir do texto): % aproximada do meu tempo de fala, nº de
  perguntas que fiz, nº de bordões/muletas ("tipo", "pronto", "ok", "portanto", "basicamente"…),
  interrupções (minhas e sofridas). Usa a classe `good`/`bad` no valor quando for claramente
  positivo/negativo.
- **✅ O que correu bem**: 1–3 pontos com exemplo concreto (cita a frase se ajudar).
- **🔧 A melhorar**: 1–3 pontos com exemplo concreto e a alternativa que eu podia ter usado.
- **Experimenta na próxima**: uma única ação prática.
- Se eu praticamente não falei, diz isso e adapta (ex.: "oportunidades perdidas de intervir").

## 4. Gerar o HTML da reunião

Escreve **um** bloco `<article>` seguindo este modelo (usa só as classes listadas; não uses
`<script>`, `<style>` nem estilos inline). Escapa `&`, `<`, `>` e aspas nos atributos.

```html
<article class="meeting-entry" data-id="AAAA-MM-DD-slug-curto" data-title="Título curto e específico" data-date="AAAA-MM-DD" data-type="Ata" data-tags="projeto x, cliente y, tema">
    <h1>Título curto e específico</h1>
    <div class="meta-header">
        <span>📅 DD/MM/AAAA</span><span>⏱ NN min</span><span>👥 Nome, Nome</span><span class="tag">Ata</span>
    </div>
    <p class="lead">Resumo executivo em 2–3 frases: porquê a reunião, o que se concluiu, o que vem a seguir.</p>

    <h2>Decisões</h2>
    <div class="decision">Decisão tomada, com contexto mínimo.</div>

    <h2>Tarefas</h2>
    <div class="todo-item"><label><input type="checkbox"><span>Ação concreta começada por verbo</span></label><span class="todo-badge">Responsável · DD/MM</span></div>

    <h2>Pontos em aberto</h2>
    <div class="risk">Risco, bloqueio ou questão sem resposta.</div>

    <!-- Outras secções da lente: <ul>/<ol>, <blockquote> para citações,
         <table> com <th class="num">/<td class="num"> para números, <h3> para subtítulos -->

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

Regras:
- `data-date` **sempre** em `AAAA-MM-DD` (o menu ordena por esta data). Usa a data da
  transcrição/nome do ficheiro; se não existir, pergunta-me ou usa a data de hoje e avisa.
- `data-id` único: data + slug do título. Se já existir no caderno, acrescenta `-2`.
- `data-tags`: 3–8 palavras-chave (projetos, clientes, pessoas, temas) para a pesquisa.
- Omite secções que fiquem vazias em vez de escrever "N/A" (exceto o Radar).
- Escreve em português europeu, frases curtas, sem floreados.

## 5. Injetar no caderno

1. Abre `caderno_reunioes.html`.
2. Insere o `<article>` **imediatamente abaixo** da linha que contém
   `<!-- NOVA_REUNIAO_AQUI` (usa a ferramenta Edit; não reescrevas o ficheiro inteiro).
3. Não alteres mais nada: nem o `<style>`, nem o `<script>`, nem as outras reuniões.
   (Se ainda existir o bloco de exemplo `data-id="2026-11-05-exemplo"`, remove-o.)
4. Se a transcrição era um ficheiro fora de `transcricoes/`, não o movas.

## 6. Responder

No fim, responde-me em 3–5 linhas: título e lente usada, nº de decisões/tarefas, as minhas
tarefas com prazo, e a dica do Radar. Nada mais.
