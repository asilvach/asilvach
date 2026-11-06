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
// Resposta do Kilo Code simulada a partir do exemplo fictício (sem os campos que só o caderno acrescenta)
const clean = it => { const { feito, ev, id, dito_por, concluida_em, ...x } = it; return x; };
const RESPOSTA = { ...EX, ...Object.fromEntries(['decisoes', 'tarefas', 'pedidos', 'propostas', 'perguntas', 'bloqueios', 'retomar'].map(k => [k, (EX[k] || []).map(clean)])) };
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
    await p.evaluate(() => { location.hash = '#/'; }); await sleep(600); // só o hash: recarregar perde a pasta simulada
    await snap('rever-aviso', 'section[aria-labelledby=pasta-h]');
    await p.click('a[href^="#/rever/"]'); await sleep(1500);
    await top('.rv-list'); await snap('rever');
    await p.click('form[data-form=review] [type=submit]'); await sleep(1500);
    await snap('reuniao');
    await top('#wt-h'); await snap('espera', 'section[aria-labelledby=wt-h]');
    await p.goto(URL + '#/tarefas'); await sleep(400); await snap('tarefas');
    await p.evaluate(() => { location.hash = '#/plano/novo?pessoas=Pedro%20Alves&titulo=Ponto%20semanal%20com%20o%20fornecedor'; }); await sleep(600);
    await p.fill('#pl-obj', 'Fechar a data de abertura do acesso'); await p.click('[data-action=plan-add-all]'); await sleep(2900); await top('.crumbs'); await snap('plano');
    await p.goto(URL + '#/nota'); await sleep(400);
    await p.fill('#n-titulo', 'Revisão de SLA (presencial)'); await p.fill('#n-pessoas', 'Pedro Alves');
    await p.fill('#n-texto', 'Tempos de resposta dentro do previsto, exceto em outubro.\nD: Manter o SLA de 4 horas\nT: Enviar o relatório mensal até 20/11\nE: Pedro Alves — mandar os números de outubro\n?: Quem aprova as exceções?'); await sleep(300);
    await top('form[data-form=note]'); await snap('nota');
    await p.goto(URL + '#/p/exemplo'); await sleep(600); await snap('projeto');
    await top('#mta-h'); await sleep(100); await snap('mta', 'section[aria-labelledby=mta-h]');
    // Plano B: copiar e colar
    await p.goto(URL + '#/nova'); await sleep(400);
    await p.setInputFiles('#file-in', { name: '2026-11-04 Fornecedor pagamentos.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) }); await sleep(500);
    await top('[aria-labelledby=st-1]'); await snap('b1', 'section[aria-labelledby=st-1]');
    await p.click('[data-action=copy-prompt]'); await sleep(3000);
    await p.fill('#answer', JSON.stringify(RESPOSTA, null, 2)); await sleep(500);
    await top('[aria-labelledby=st-3]'); await snap('b3', 'section[aria-labelledby=st-3]');

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
      <small>O teu caderno de reuniões: o que se decidiu, o que tens de fazer e o que está à espera de outras pessoas, com a frase da transcrição que o prova. Funciona no teu PC, sem internet.</small></div>

    <section><h2>Em resumo</h2>
      <p>Depois de preparado (uma vez, 5 minutos), cada reunião são três gestos:</p>
      <div class="flow"><div><b>1. Teams</b>Transfere a transcrição para a pasta <code>entrada</code>.</div><div><b>2. Kilo Code</b>Duplo clique em <b>Atualizar caderno</b> (ou “atualiza o caderno” no VS Code).</div><div><b>3. Caderno</b>Abre-o, revê o que o Kilo Code encontrou e guarda.</div></div>
      <p style="margin-top:4mm">O caderno e o Kilo Code não comunicam diretamente: trocam ficheiros na pasta <code>entrada</code>. O Kilo Code lê a transcrição e escreve a resposta; tu revês e o caderno guarda e arruma tudo em <code>entrada/processadas</code>. O caderno não precisa de estar aberto enquanto o Kilo Code trabalha.</p></section>

    <section><h2><span class="n">0</span>Preparar (uma vez)</h2>
      <ol><li>Copia a pasta <b>Caderno de Reuniões</b> do ZIP para o teu <b>OneDrive</b> (ex.: Documentos).</li>
        <li>Abre <b>Caderno de Reuniões.html</b> com o <b>Microsoft Edge</b> ou o <b>Google Chrome</b>: botão direito no ficheiro, Abrir com. Guarda-o nos favoritos.</li>
        <li>Escreve o teu nome e clica em <b>Guardar</b>.</li></ol>
      ${img('inicio', 'Ecrã inicial')}</section>

    <section class="break"><h2><span class="n">0</span>Ligar a pasta do caderno</h2>
      <p>Clica em <b>Escolher a pasta do caderno</b> e escolhe a pasta <b>Caderno de Reuniões</b> (a que contém este ficheiro). Confirma <b>Permitir</b> quando o navegador perguntar. As reuniões passam a ficar guardadas no ficheiro <code>caderno-dados.json</code> dessa pasta.</p>
      ${img('ligar', 'Ligar a pasta')}
      <p class="tip">Noutro dia, o navegador pode pedir para <b>Voltar a ligar a pasta</b>. É um clique.</p></section>

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

    <section class="break"><h2><span class="n">3</span>Rever antes de guardar</h2>
      <p>Abre o caderno (ou espera uns segundos, se já estiver aberto). A reunião aparece no Início como <b>pronta a rever</b>:</p>
      ${img('rever-aviso', 'Reunião pronta a rever')}
      <p>Clica em <b>Rever</b>. Cada item mostra o tipo, o texto, a pessoa, o prazo e a frase da transcrição em que foi dito, com o minuto. Podes mudar o tipo (por exemplo, de tarefa para proposta), corrigir o texto, a pessoa e o prazo, ou desmarcar o que não queres guardar. Os itens marcados <b>A confirmar</b> são os que o Kilo Code não tinha a certeza: ninguém assumiu claramente, o prazo não foi dito ou a frase não aparece na transcrição.</p>
      ${img('rever', 'Rever antes de guardar')}
      <p class="tip">Uma tarefa só existe quando alguém a assumiu. Um pedido a quem não respondeu fica como <b>pedido</b>; uma ideia sem acordo fica como <b>proposta</b>. Tarefas anteriores só são fechadas se as confirmares.</p></section>

    <section class="break"><h2>A reunião no caderno</h2>
      <p>Cada reunião tem sempre a mesma estrutura: objetivo, temas, decisões, as minhas tarefas, à espera de outros, bloqueios e para retomar. Os botões com minutos (ex.: <b>01:36</b>) abrem a transcrição nesse momento. <b>Copiar ata</b> copia a ata pronta para colar num email ou no Teams.</p>
      ${img('reuniao', 'Uma reunião no caderno')}
      ${img('espera', 'À espera de outros')}</section>

    <section class="break"><h2>Vista Tarefas</h2><p>Duas listas: <b>As minhas</b> (o que assumiste) e <b>À espera de outros</b> (o que outras pessoas assumiram e os pedidos que lhes fizeste). Ao marcar uma tarefa como feita, o caderno regista a data.</p>${img('tarefas', 'Vista Tarefas')}</section>

    <section class="break"><h2>Preparar a próxima reunião e o Outlook</h2>
      <p>Em <b>Agenda</b>, clica em <b>Planear reunião</b> ou traz as reuniões do Outlook: no Outlook, abre a reunião (ou o calendário), <b>Ficheiro</b>, <b>Guardar como</b>, formato <b>iCalendar (.ics)</b>, e guarda o ficheiro na pasta <code>entrada</code>. O caderno mostra, ao lado, o que te devem, o que deves, o que ficou em aberto e as decisões com essas pessoas. Usa o <b>+</b> para pôr cada ponto na agenda.</p>
      ${img('plano', 'Preparar uma reunião')}
      <ul><li><b>Abrir no Outlook</b>: descarrega um ficheiro de calendário; abre-o e o Outlook cria o compromisso com a agenda e um lembrete.</li>
        <li><b>Enviar a agenda por email</b>: abre um email novo no Outlook com a agenda.</li>
        <li>Nas tarefas à espera de outra pessoa, <b>Lembrar</b> prepara uma mensagem de seguimento. Em <b>Tarefas</b>, <b>Prazos para o Outlook</b> põe os prazos no teu calendário.</li></ul></section>

    <section class="break"><h2>Reuniões sem transcrição: nota rápida</h2>
      <p>Para reuniões presenciais ou chamadas sem transcrição: <b>Nova reunião</b>, <b>nota rápida</b>. Escreve à vontade e começa as linhas por <code>D:</code> (decisão), <code>T:</code> (tarefa tua), <code>E: Nome — …</code> (à espera de alguém), <code>?</code> (pergunta), <code>B:</code> (bloqueio) ou <code>R:</code> (retomar). Acaba com “até 20/11” para dar um prazo. Não passa pelo Kilo Code.</p>
      ${img('nota', 'Nota rápida')}</section>

    <section class="break"><h2>Projetos: a evolução ao longo das reuniões</h2>
      <p>Em <b>Projetos</b>, juntas as reuniões de um mesmo assunto. Cria o projeto (nome, descrição, palavras-chave, pessoas), confirma as reuniões que lhe pertencem e clica em <b>Reconstruir o histórico</b>. A página mostra o que mudou desde a última reunião, os compromissos em aberto, os bloqueios e as decisões. A saúde do projeto usa só factos ditos nas reuniões.</p>
      ${img('projeto', 'Página de um projeto')}
      <p class="tip">O caderno também sugere projetos sozinho quando vê a mesma pessoa ou o mesmo tema em 3 ou mais reuniões.</p></section>

    <section><h2>Tendência dos marcos</h2>
      <p>Cada linha é a data prevista de um marco, reunião a reunião. Uma linha plana é um projeto controlado; uma linha a subir é um projeto a escorregar. Os alertas assinalam, por exemplo, quando alguém disse que o estado era verde no mesmo dia em que uma data mudou.</p>
      ${img('mta', 'Tendência dos marcos')}</section>

    <section class="break"><h2>Plano B: copiar e colar</h2>
      <p>Se o modo pasta não estiver disponível: em <b>Nova reunião</b>, desce até <b>Sem a pasta: copiar e colar</b>, escolhe o ficheiro, clica em <b>Copiar pedido</b>, cola no Kilo Code, copia a resposta e cola-a no passo 3. Revês os itens no mesmo ecrã e clicas em <b>Guardar reunião</b>.</p>
      ${img('b1', 'Plano B, passo 1')}${img('b3', 'Plano B, passo 3')}</section>

    <section class="break"><h2>Se algo não correr bem</h2><table>
      <tr><td>“Não encontrei o Kilo Code no terminal”</td><td>O Kilo Code do terminal não está instalado neste PC. Usa o VS Code: abre a pasta e escreve “atualiza o caderno”.</td></tr>
      <tr><td>“O Kilo Code não conseguiu terminar”</td><td>Abre o Kilo Code nesta pasta (terminal ou VS Code) e escreve “atualiza o caderno”, para veres o que ele pede.</td></tr>
      <tr><td>O VS Code não mostra o /reuniao</td><td>Confirma que abriste a pasta <b>Caderno de Reuniões</b>. Escreve <code>/reload</code>, ou simplesmente “atualiza o caderno”.</td></tr>
      <tr><td>O Kilo Code diz para abrir o caderno</td><td>Acontece só antes da primeira utilização: abre o caderno no Edge ou no Chrome, liga a pasta e volta a escrever <code>/reuniao</code>.</td></tr>
      <tr><td>O caderno mostra “resposta não é válida”, ou a resposta é fraca</td><td>No ecrã de revisão, clica em <b>Pedir outra resposta ao Kilo Code</b> e escreve outra vez <code>/reuniao</code>.</td></tr>
      <tr><td>“Voltar a ligar a pasta” ou “Não gravado na pasta”</td><td>Clica no aviso e escolhe <b>Permitir</b>. É uma proteção do navegador. Até lá, os dados ficam neste navegador e são juntados à pasta quando voltares a ligar.</td></tr>
      <tr><td>A página abre em branco</td><td>Abre o ficheiro com o Microsoft Edge ou o Google Chrome.</td></tr>
      <tr><td>Mudei de PC ou tenho duas janelas abertas</td><td>Abre o caderno da pasta do OneDrive e liga outra vez a pasta: as reuniões estão no <code>caderno-dados.json</code>. As alterações de cada lado são juntadas, sem se apagarem. Se o OneDrive criar uma cópia em conflito, o caderno oferece-se para a juntar.</td></tr>
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
