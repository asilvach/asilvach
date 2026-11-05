// Gera "docs/Procedimento - Caderno de Reuniões.pdf" com capturas reais do caderno (modo pasta e plano B).
// Uso: python3 ferramentas/construir.py && node ferramentas/gerar_procedimento.js && python3 ferramentas/construir.py
// Serve dist/ num servidor local temporário só para as capturas: a pasta é simulada com o sistema de
// ficheiros privado do Chromium (o seletor de pastas real não pode ser usado num navegador automático).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8790 + Math.floor(Math.random() * 100);
const URL = `http://127.0.0.1:${PORT}/${encodeURIComponent('Caderno de Reuniões.html')}`;
const VTT = fs.readdirSync(path.join(ROOT, 'src', 'exemplos')).filter(f => f.endsWith('.vtt')).map(f => path.join(ROOT, 'src', 'exemplos', f))[0];
const EX = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'exemplos.json'), 'utf8')).find(e => e.id === 'exemplo-negociacao-fornecedor').conteudo;
const RESPOSTA = { tipo: 'Intenção', ...EX, tarefas: EX.tarefas.map(({ feito, ...t }) => t) };
const LOGO = fs.readFileSync(path.join(ROOT, 'marca', 'natixis-cib.svg'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: path.join(ROOT, 'dist'), stdio: 'ignore' });
  await sleep(800);
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: 'pt-PT' });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await ctx.addInitScript(() => { window.showDirectoryPicker = async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Caderno de Reuniões', { create: true }); });
    const p = await ctx.newPage();
    const shots = {};
    const snap = async (name, sel) => {
      let clip;
      if (sel) { const r = await p.locator(sel).first().boundingBox(); clip = { x: Math.max(0, r.x - 16), y: Math.max(0, r.y - 16), width: Math.min(1280 - Math.max(0, r.x - 16), r.width + 32), height: Math.min(800 - Math.max(0, r.y - 16), r.height + 32) }; }
      shots[name] = 'data:image/png;base64,' + (await p.screenshot(clip ? { clip } : {})).toString('base64');
    };
    const top = async sel => { await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start' }), sel); await sleep(150); };
    const put = (name, text) => p.evaluate(async ([name, text]) => { const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('Caderno de Reuniões', { create: true }); const d = await root.getDirectoryHandle('entrada', { create: true }); const fh = await d.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(text); await w.close(); }, [name, text]);

    await p.goto(URL); await sleep(500);
    await snap('inicio');
    await p.fill('#owner-name', 'Rita Silva'); await p.click('form[data-form=owner] button'); await sleep(400);
    await snap('ligar', 'section[aria-labelledby=pasta-h]');
    await p.click('[data-action=connect-folder]'); await sleep(900);
    await p.goto(URL + '#/nova'); await sleep(400);
    await snap('vazia', 'section[aria-labelledby=pasta-h]');
    const vtt = fs.readFileSync(VTT, 'utf8').replace(/<v Eu>/g, '<v Silva, R.>');
    await put('2026-11-04 Fornecedor pagamentos.vtt', vtt); await sleep(5200);
    await snap('quem', 'section[aria-labelledby=pasta-h]');
    await p.click('[data-inbox-who][data-alias="Silva, R."]'); await sleep(5200);
    await snap('pronta', 'section[aria-labelledby=pasta-h]');
    await put('2026-11-04 Fornecedor pagamentos.resposta.json', JSON.stringify(RESPOSTA, null, 2)); await sleep(14000);
    const id = await p.evaluate(() => document.querySelector('.m-item')?.dataset.id);
    await p.goto(URL + '#/r/' + encodeURIComponent(id)); await sleep(500);
    await snap('reuniao');
    await top('#pa-h'); await snap('plano', 'section[aria-labelledby=pa-h]');
    await p.goto(URL + '#/tarefas'); await sleep(400); await snap('tarefas');
    // Plano B: copiar e colar
    await p.goto(URL + '#/nova'); await sleep(400);
    await p.setInputFiles('#file-in', { name: '2026-11-04 Fornecedor pagamentos.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) }); await sleep(500);
    await top('[aria-labelledby=st-1]'); await snap('b1', 'section[aria-labelledby=st-1]');
    await p.click('[data-action=copy-prompt]'); await sleep(3000);
    await p.fill('#answer', JSON.stringify(RESPOSTA, null, 2)); await sleep(500);
    await top('[aria-labelledby=st-4]'); await snap('b4', 'section[aria-labelledby=st-4]');

    const img = (k, alt) => `<figure><img src="${shots[k]}" alt="${alt}"></figure>`;
    const html = `<!DOCTYPE html><html lang="pt-PT"><head><meta charset="utf-8"><title>Procedimento - Caderno de Reuniões</title><style>
      @page { size: A4; margin: 18mm 16mm; }
      :root { --brand: #581d74; --ink: #1c1521; --ink2: #433d48; --ink3: #66616a; --line: #e2dde6; --soft: #f5e9fd; }
      body { font: 10.5pt/1.55 "Segoe UI", system-ui, sans-serif; color: var(--ink); margin: 0; }
      .cover { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
      .cover .logo { width: 70mm; color: var(--ink); } .cover .logo svg { width: 100%; height: auto; }
      .cover h1 { font-size: 30pt; line-height: 1.1; margin: 0 0 4mm; } .cover p { font-size: 13pt; color: var(--ink2); margin: 0; }
      .cover .bar { height: 3mm; background: var(--brand); width: 40mm; margin-bottom: 8mm; } .cover small { color: var(--ink3); }
      h2 { font-size: 15pt; margin: 0 0 3mm; page-break-after: avoid; }
      h2 .n { display: inline-block; min-width: 9mm; height: 9mm; line-height: 9mm; text-align: center; border-radius: 50%; background: var(--soft); color: var(--brand); font-size: 11pt; margin-right: 3mm; }
      section { margin-bottom: 9mm; page-break-inside: avoid; } section.break { page-break-before: always; }
      p, li { color: var(--ink2); } ol, ul { padding-left: 6mm; } li { margin-bottom: 1.5mm; } b, code { color: var(--ink); }
      code { font-family: Consolas, monospace; font-size: 9.5pt; background: #f1edf4; padding: 0 1mm; border-radius: 1mm; }
      figure { margin: 3mm 0 0; border: 1px solid var(--line); border-radius: 3mm; overflow: hidden; } figure img { display: block; width: 100%; }
      .tip { background: var(--soft); border-radius: 2mm; padding: 3mm 4mm; color: var(--ink); }
      .flow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: 4mm; }
      .flow div { border: 1px solid var(--line); border-radius: 2mm; padding: 3mm; } .flow b { display: block; color: var(--brand); margin-bottom: 1mm; }
      table { width: 100%; border-collapse: collapse; } td { padding: 2.5mm 3mm; border-bottom: 1px solid var(--line); vertical-align: top; } td:first-child { width: 42%; font-weight: 600; color: var(--ink); }
    </style></head><body>
    <div class="cover"><div class="logo">${LOGO}</div>
      <div><div class="bar"></div><h1>Caderno de Reuniões</h1><p>Procedimento de utilização</p><p>CIO Office Portugal</p></div>
      <small>Transforma as transcrições do Teams em atas, tarefas e coaching de comunicação, com o Kilo Code. Funciona no teu PC, sem internet.</small></div>

    <section><h2>Em resumo</h2>
      <p>Depois de preparado (uma vez, 5 minutos), cada reunião são três gestos:</p>
      <div class="flow"><div><b>1. Teams</b>Transfere a transcrição para a pasta <code>entrada</code>.</div><div><b>2. Kilo Code</b>Duplo clique em <b>Atualizar caderno</b> (ou “atualiza o caderno” no VS Code).</div><div><b>3. Caderno</b>Abre-o: a reunião aparece sozinha, com ata, tarefas e o teu Radar.</div></div>
      <p style="margin-top:4mm">O caderno e o Kilo Code não comunicam diretamente: trocam ficheiros na pasta <code>entrada</code>. O Kilo Code lê a transcrição e escreve a resposta; o caderno importa-a e arruma tudo em <code>entrada/processadas</code>. O caderno não precisa de estar aberto enquanto o Kilo Code trabalha.</p></section>

    <section><h2><span class="n">0</span>Preparar (uma vez)</h2>
      <ol><li>Copia a pasta <b>Caderno de Reuniões</b> do ZIP para o teu <b>OneDrive</b> (ex.: Documentos).</li>
        <li>Abre <b>Caderno de Reuniões.html</b> com o <b>Microsoft Edge</b>: botão direito no ficheiro, Abrir com, Microsoft Edge. Guarda-o nos favoritos.</li>
        <li>Escreve o teu nome e clica em <b>Guardar</b>.</li></ol>
      ${img('inicio', 'Ecrã inicial')}</section>

    <section class="break"><h2><span class="n">0</span>Ligar a pasta do caderno</h2>
      <p>Clica em <b>Escolher a pasta do caderno</b> e escolhe a pasta <b>Caderno de Reuniões</b> (a que contém este ficheiro). Confirma <b>Permitir</b> quando o Edge perguntar. As reuniões passam a ficar guardadas no ficheiro <code>caderno-dados.json</code> dessa pasta.</p>
      ${img('ligar', 'Ligar a pasta')}
      <p class="tip">Noutro dia, o Edge pode pedir para <b>Voltar a ligar a pasta</b>. É um clique.</p></section>

    <section><h2><span class="n">0</span>Escolher como usar o Kilo Code</h2>
      <table><tr><td>Sem abrir nada (recomendado)</td><td>Na pasta do caderno, faz <b>duplo clique em “Atualizar caderno.bat”</b>. Abre-se uma janela preta: o Kilo Code trata das transcrições novas e, no fim, abre o caderno. Usa o Kilo Code do terminal.</td></tr>
        <tr><td>No VS Code</td><td><b>File</b>, <b>Open Folder…</b>, a pasta <b>Caderno de Reuniões</b>. No painel do Kilo Code escreve <b>atualiza o caderno</b> (ou <code>/reuniao</code>).</td></tr></table>
      <p class="tip">Em ambos os casos, o Kilo Code só pode escrever as respostas na pasta <code>entrada</code>: as regras estão no ficheiro <code>kilo.jsonc</code> da pasta.</p></section>

    <section class="break"><h2><span class="n">1</span>Guardar a transcrição na pasta entrada</h2>
      <ol><li>No Teams, abre a reunião no <b>Calendário</b> (ou o chat da reunião), <b>Gravações e transcrições</b>.</li>
        <li>Na transcrição, <b>Transferir</b> em <b>.vtt</b> (o <b>.docx</b> também serve).</li>
        <li>Guarda-o em <code>Caderno de Reuniões\\entrada</code>. Ajuda pôr a data no nome: <code>2026-11-05 Comité IT.vtt</code>.</li></ol>
      <p>Se o caderno estiver aberto, deteta o ficheiro em poucos segundos e prepara um pedido com as métricas exatas. Se não te reconhecer, pergunta qual és tu:</p>
      ${img('quem', 'Quem és tu?')}</section>

    <section><h2><span class="n">2</span>Pedir o resumo ao Kilo Code</h2>
      <ol><li>Faz <b>duplo clique em “Atualizar caderno.bat”</b> (ou escreve “atualiza o caderno” no Kilo Code do VS Code).</li><li>Espera até terminar. Não precisas de copiar nada.</li></ol>
      <p>Com o caderno aberto, vês o estado na caixa de entrada:</p>
      ${img('pronta', 'Transcrição pronta')}</section>

    <section class="break"><h2><span class="n">3</span>A reunião aparece no caderno</h2>
      <p>Abre o caderno (ou espera uns segundos, se já estiver aberto): ele importa a resposta e mostra <b>Nova reunião importada</b>. Cada reunião tem: resumo, contexto (ligação a reuniões anteriores), temas com os minutos, decisões, plano de ação, participação de cada pessoa, o teu Radar de Comunicação e a transcrição completa.</p>
      ${img('reuniao', 'Uma reunião no caderno')}</section>

    <section><h2>Tarefas e atas</h2>
      <ul><li>Marca as tarefas quando estiverem feitas. Se numa reunião seguinte se disser que algo foi feito, o caderno fecha-a sozinho.</li>
        <li><b>Copiar ata</b> copia a ata pronta para colar num email ou no Teams.</li>
        <li>Os botões com minutos (ex.: <b>01:40</b>) abrem a transcrição nesse momento.</li></ul>
      ${img('plano', 'Plano de ação')}</section>

    <section class="break"><h2>Vista Tarefas</h2><p>Junta as ações de todas as reuniões, por prazo. As atrasadas aparecem primeiro.</p>${img('tarefas', 'Vista Tarefas')}</section>

    <section><h2>Plano B: copiar e colar</h2>
      <p>Se o modo pasta não estiver disponível: em <b>Nova reunião</b>, desce até <b>Sem a pasta: copiar e colar</b>, escolhe o ficheiro, clica em <b>Copiar pedido</b>, cola no Kilo Code, copia a resposta e cola-a no passo 4.</p>
      ${img('b1', 'Plano B, passo 1')}${img('b4', 'Plano B, passo 4')}</section>

    <section class="break"><h2>Se algo não correr bem</h2><table>
      <tr><td>“Não encontrei o Kilo Code no terminal”</td><td>O Kilo Code do terminal não está instalado neste PC. Usa o VS Code: abre a pasta e escreve “atualiza o caderno”.</td></tr>
      <tr><td>“O Kilo Code não conseguiu terminar”</td><td>Abre o Kilo Code nesta pasta (terminal ou VS Code) e escreve “atualiza o caderno”, para veres o que ele pede.</td></tr>
      <tr><td>O VS Code não mostra o /reuniao</td><td>Confirma que abriste a pasta <b>Caderno de Reuniões</b>. Escreve <code>/reload</code>, ou simplesmente “atualiza o caderno”.</td></tr>
      <tr><td>O Kilo Code diz para abrir o caderno</td><td>Acontece só antes da primeira utilização: abre o caderno no Edge, liga a pasta e volta a escrever <code>/reuniao</code>.</td></tr>
      <tr><td>O caderno mostra “resposta não é válida”</td><td>No Kilo Code, escreve outra vez <code>/reuniao</code>. Ele refaz a resposta.</td></tr>
      <tr><td>“Voltar a ligar a pasta”</td><td>Clica no botão e escolhe <b>Permitir</b>. É uma proteção do Edge.</td></tr>
      <tr><td>A página abre em branco</td><td>Abre o ficheiro com o Microsoft Edge ou o Google Chrome.</td></tr>
      <tr><td>Mudei de PC</td><td>Abre o caderno da pasta do OneDrive e liga outra vez a pasta: as reuniões estão no <code>caderno-dados.json</code>.</td></tr>
      <tr><td>Quero uma cópia de segurança</td><td>Definições, <b>Descarregar cópia</b>.</td></tr></table></section>

    <section><h2>Confidencialidade</h2><ul>
      <li>O caderno não usa a internet: tudo fica no teu PC e na tua pasta do OneDrive.</li>
      <li>O conteúdo só é lido pelo Kilo Code, a ferramenta de IA interna, na tua pasta.</li>
      <li>Não partilhes a pasta nem o <code>caderno-dados.json</code> com quem não esteve nas reuniões.</li></ul></section>
    </body></html>`;
    const tmp = path.join(ROOT, 'dist', 'procedimento.html');
    fs.writeFileSync(tmp, html);
    const q = await b.newPage();
    await q.goto('file://' + tmp); await sleep(300);
    await q.pdf({ path: path.join(ROOT, 'docs', 'Procedimento - Caderno de Reuniões.pdf'), format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } });
    fs.unlinkSync(tmp);
    console.log('✓ docs/Procedimento - Caderno de Reuniões.pdf');
  } finally { await b.close(); srv.kill(); }
})();
