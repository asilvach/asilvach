// Gera "docs/Procedimento - Caderno de Reuniões.pdf" com capturas reais do caderno.
// Uso: python3 ferramentas/construir.py && node ferramentas/gerar_procedimento.js && python3 ferramentas/construir.py
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CADERNO = 'file://' + path.join(ROOT, 'dist', 'Caderno de Reuniões.html');
const VTT = fs.readdirSync(path.join(ROOT, 'src', 'exemplos')).filter(f => f.endsWith('.vtt')).map(f => path.join(ROOT, 'src', 'exemplos', f))[0];
const EXEMPLOS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'exemplos.json'), 'utf8'));
const RESPOSTA = JSON.stringify(EXEMPLOS.find(e => e.id === 'exemplo-negociacao-fornecedor').conteudo, null, 2);
const LOGO = fs.readFileSync(path.join(ROOT, 'marca', 'natixis-cib.svg'), 'utf8');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  const shots = {};
  const snap = async (name, clip) => { shots[name] = 'data:image/png;base64,' + (await p.screenshot(clip ? { clip } : {})).toString('base64'); };
  const box = async sel => { const r = await p.locator(sel).first().boundingBox(); return { x: 288, y: Math.max(0, r.y - 16), width: 992, height: Math.min(800 - Math.max(0, r.y - 16), r.height + 32) }; };

  await p.goto(CADERNO); await p.waitForTimeout(500);
  await snap('inicio');
  await p.fill('#owner-name', 'Rita Silva'); await p.click('form[data-form=owner] button'); await p.waitForTimeout(300);
  await p.goto(CADERNO + '#/definicoes'); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#set-file').scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
  await snap('ficheiro', await box('section[aria-labelledby=set-file]'));
  await p.goto(CADERNO + '#/nova'); await p.waitForTimeout(300);
  await p.setInputFiles('#file-in', { name: path.basename(VTT), mimeType: 'text/vtt', buffer: fs.readFileSync(VTT) }); await p.waitForTimeout(400);
  await p.click('[data-alias="Eu"]'); await p.waitForTimeout(200);
  await snap('passo1', await box('section[aria-labelledby=st-1]'));
  await p.evaluate(() => document.querySelector('[aria-labelledby=st-2]').scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
  await snap('passo2', await box('section[aria-labelledby=st-2]'));
  await p.click('[data-action=copy-prompt]'); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('[aria-labelledby=st-3]').scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
  await snap('passo3', await box('section[aria-labelledby=st-3]'));
  await p.fill('#answer', RESPOSTA); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[aria-labelledby=st-4]').scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
  await snap('passo4', await box('section[aria-labelledby=st-4]'));
  await p.click('[data-action=save-meeting]'); await p.waitForTimeout(3200);
  await snap('reuniao');
  await p.evaluate(() => document.querySelector('#pa-h').scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
  await snap('plano', await box('section[aria-labelledby=pa-h]'));
  await p.goto(CADERNO + '#/tarefas'); await p.waitForTimeout(300); await snap('tarefas');

  const img = (k, alt) => `<figure><img src="${shots[k]}" alt="${alt}"></figure>`;
  const html = `<!DOCTYPE html><html lang="pt-PT"><head><meta charset="utf-8"><title>Procedimento - Caderno de Reuniões</title><style>
    @page { size: A4; margin: 18mm 16mm; }
    :root { --brand: #581d74; --ink: #1c1521; --ink2: #433d48; --ink3: #66616a; --line: #e2dde6; --soft: #f5e9fd; --fill: #f1edf4; }
    body { font: 10.5pt/1.55 "Segoe UI", system-ui, sans-serif; color: var(--ink); margin: 0; }
    .cover { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
    .cover .logo { width: 70mm; color: var(--ink); } .cover .logo svg { width: 100%; height: auto; }
    .cover h1 { font-size: 30pt; line-height: 1.1; margin: 0 0 4mm; } .cover p { font-size: 13pt; color: var(--ink2); margin: 0; }
    .cover .bar { height: 3mm; background: var(--brand); width: 40mm; margin-bottom: 8mm; }
    .cover small { color: var(--ink3); }
    h2 { font-size: 15pt; margin: 0 0 3mm; color: var(--ink); page-break-after: avoid; }
    h2 .n { display: inline-block; min-width: 9mm; height: 9mm; line-height: 9mm; text-align: center; border-radius: 50%; background: var(--soft); color: var(--brand); font-size: 11pt; margin-right: 3mm; }
    section { margin-bottom: 9mm; page-break-inside: avoid; }
    section.break { page-break-before: always; }
    p, li { color: var(--ink2); } ol, ul { padding-left: 6mm; } li { margin-bottom: 1.5mm; }
    b { color: var(--ink); }
    figure { margin: 3mm 0 0; border: 1px solid var(--line); border-radius: 3mm; overflow: hidden; }
    figure img { display: block; width: 100%; }
    .tip { background: var(--soft); border-radius: 2mm; padding: 3mm 4mm; color: var(--ink); }
    .kbd { border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 1mm; padding: 0 1.5mm; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; } td { padding: 2.5mm 3mm; border-bottom: 1px solid var(--line); vertical-align: top; } td:first-child { width: 42%; font-weight: 600; color: var(--ink); }
  </style></head><body>
  <div class="cover"><div class="logo">${LOGO}</div>
    <div><div class="bar"></div><h1>Caderno de Reuniões</h1><p>Procedimento de utilização</p><p>CIO Office Portugal</p></div>
    <small>Transforma as transcrições do Teams em atas, tarefas e coaching de comunicação. Funciona offline, no teu PC.</small></div>

  <section><h2>Em resumo</h2>
    <p>Por cada reunião fazes quatro coisas, em cerca de dois minutos:</p>
    <ol><li><b>Descarregas</b> a transcrição do Teams.</li><li><b>Escolhes</b> o ficheiro no caderno.</li><li><b>Copias</b> o pedido para o Kilo Code.</li><li><b>Colas</b> a resposta do Kilo Code no caderno.</li></ol>
    <p>O caderno faz o resto: guarda a ata, junta as tarefas de todas as reuniões, mede quem falou quanto e dá-te dicas sobre a tua comunicação.</p></section>

  <section><h2><span class="n">0</span>Antes de começar (uma vez)</h2>
    <ol><li>Copia a pasta <b>Caderno de Reuniões</b> para o teu OneDrive (ex.: Documentos).</li>
      <li>Abre <b>Caderno de Reuniões.html</b> com o <b>Microsoft Edge</b>: botão direito no ficheiro, Abrir com, Microsoft Edge.</li>
      <li>Escreve o teu nome e clica em <b>Guardar</b>.</li></ol>
    ${img('inicio', 'Ecrã inicial do caderno')}</section>

  <section class="break"><h2><span class="n">0</span>Guardar as reuniões num ficheiro teu</h2>
    <p>Em <b>Definições</b>, clica em <b>Criar ficheiro de dados</b> e guarda-o na mesma pasta do OneDrive. A partir daí, cada reunião fica gravada nesse ficheiro e não se perde se o navegador for limpo.</p>
    ${img('ficheiro', 'Definições, ficheiro de dados')}
    <p class="tip">Quando voltares a abrir o caderno noutro dia, o Edge pode pedir para <b>Voltar a ligar</b> o ficheiro. É só clicar no botão e confirmar.</p></section>

  <section><h2><span class="n">1</span>Descarregar a transcrição do Teams</h2>
    <ol><li>No Teams, abre a reunião no <b>Calendário</b> (ou o chat da reunião).</li>
      <li>Escolhe <b>Gravações e transcrições</b> e abre a transcrição.</li>
      <li>Clica em <b>Transferir</b> e escolhe <b>.vtt</b> (o <b>.docx</b> também serve).</li>
      <li>Guarda-o numa pasta tua. Ajuda pôr a data no nome: <b>2026-11-05 Comité IT.vtt</b>.</li></ol>
    <p class="tip">Para experimentar, usa o ficheiro da pasta <b>Exemplo para experimentar</b>.</p></section>

  <section class="break"><h2><span class="n">2</span>Escolher o ficheiro e dizer quem és</h2>
    <p>Clica em <b>Nova reunião</b>. Arrasta o ficheiro para a caixa (ou clica nela para o escolher). Confirma a data e escolhe o teu nome na lista de pessoas. O caderno lembra-se de ti nas próximas vezes.</p>
    ${img('passo1', 'Passo 1, escolher a transcrição')}</section>

  <section><h2><span class="n">3</span>Escolher o tipo de resumo</h2>
    <table><tr><td>Ata de reunião</td><td>Decisões e tarefas: quem faz o quê e quando. A escolha habitual.</td></tr>
      <tr><td>Dados quantitativos</td><td>Reuniões com números: orçamentos, métricas, KPI.</td></tr>
      <tr><td>Análise de intenção</td><td>Negociações e reuniões difíceis: tom, intenções, bloqueios.</td></tr>
      <tr><td>Destaques e Insights de conceito</td><td>Apresentações, formações e brainstorming.</td></tr></table>
    ${img('passo2', 'Passo 2, tipo de resumo')}</section>

  <section class="break"><h2><span class="n">4</span>Pedir o resumo ao Kilo Code</h2>
    <ol><li>Clica em <b>Copiar pedido</b>.</li>
      <li>Abre o <b>Kilo Code</b> no VS Code e começa uma <b>conversa nova</b>.</li>
      <li>Cola com <span class="kbd">Ctrl</span> + <span class="kbd">V</span> e envia.</li>
      <li>Espera até a resposta terminar. Começa por <b>{</b> e acaba em <b>}</b>.</li>
      <li>Copia a resposta inteira (se vier num bloco de código, usa o botão de copiar do bloco).</li></ol>
    ${img('passo3', 'Passo 3, copiar o pedido')}</section>

  <section><h2><span class="n">5</span>Colar a resposta e guardar</h2>
    <p>Cola a resposta na caixa do passo 4. Quando aparecer <b>Resposta válida</b>, clica em <b>Guardar reunião</b>.</p>
    ${img('passo4', 'Passo 4, colar a resposta')}</section>

  <section class="break"><h2>O que fica no caderno</h2>
    <p>Cada reunião tem: resumo, contexto (ligação a reuniões anteriores), temas com os minutos, decisões, plano de ação, participação de cada pessoa, o teu Radar de Comunicação e a transcrição completa.</p>
    ${img('reuniao', 'Uma reunião no caderno')}</section>

  <section><h2>Tarefas e atas</h2>
    <ul><li>Marca as tarefas quando estiverem feitas. Se numa reunião seguinte se disser que algo foi feito, o caderno fecha a tarefa sozinho.</li>
      <li><b>Copiar ata</b> copia a ata pronta para colar num email ou no Teams.</li>
      <li>Os botões com minutos (ex.: <b>01:40</b>) abrem a transcrição nesse momento.</li></ul>
    ${img('plano', 'Plano de ação')}</section>

  <section class="break"><h2>Vista Tarefas</h2>
    <p>Junta as ações de todas as reuniões, organizadas por prazo. Em atraso aparecem primeiro.</p>
    ${img('tarefas', 'Vista Tarefas')}</section>

  <section><h2>Se algo não correr bem</h2>
    <table>
      <tr><td>“A resposta está incompleta ou cortada”</td><td>No Kilo Code, escreve <b>Repete só o JSON, completo.</b> e cola a nova resposta.</td></tr>
      <tr><td>O Kilo Code respondeu com texto normal</td><td>Escreve <b>Responde só com o JSON pedido.</b> Confirma que colaste o pedido inteiro.</td></tr>
      <tr><td>A página abre em branco</td><td>Abre o ficheiro com o Microsoft Edge ou o Google Chrome.</td></tr>
      <tr><td>Não apareço na lista de pessoas</td><td>Escolhe o nome mais parecido com o teu; no Teams costuma ser “Apelido, Nome”.</td></tr>
      <tr><td>Mudei de PC ou limparam o navegador</td><td>Definições, <b>Abrir um ficheiro de dados existente</b>, e escolhe o teu ficheiro no OneDrive.</td></tr>
      <tr><td>Quero guardar uma cópia</td><td>Definições, <b>Descarregar cópia</b>.</td></tr></table></section>

  <section><h2>Confidencialidade</h2>
    <ul><li>O caderno não usa a internet: tudo fica no teu PC e no teu ficheiro de dados.</li>
      <li>O conteúdo só sai do caderno quando colas o pedido no Kilo Code, a ferramenta de IA interna.</li>
      <li>Não envies o caderno nem o ficheiro de dados a pessoas que não estiveram nas reuniões.</li></ul></section>
  </body></html>`;
  const tmp = path.join(ROOT, 'dist', 'procedimento.html');
  fs.writeFileSync(tmp, html);
  const q = await b.newPage();
  await q.goto('file://' + tmp); await q.waitForTimeout(300);
  await q.pdf({ path: path.join(ROOT, 'docs', 'Procedimento - Caderno de Reuniões.pdf'), format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } });
  fs.unlinkSync(tmp);
  await b.close();
  console.log('✓ docs/Procedimento - Caderno de Reuniões.pdf');
})();
