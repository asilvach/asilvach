
(() => {
'use strict';

/* ════════════════ Utilitários ════════════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const normAligned = s => String(s ?? '').split('').map(c => (norm(c) || ' ')[0]).join('');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const words = q => norm(q).split(/\s+/).filter(Boolean);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const pad = n => String(n).padStart(2, '0');
const localISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = localISO(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return localISO(d); };
const isISO = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
const LOCALE = 'pt-PT';
const DTF = {
  long: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }),
  weekday: new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }),
  month: new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }),
  mon: new Intl.DateTimeFormat(LOCALE, { month: 'short' }),
  time: new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' }),
};
const toDate = iso => new Date(iso + 'T12:00:00');
const fmtDate = (iso, style = 'long') => {
  if (!isISO(iso)) return iso || '';
  const dt = toDate(iso);
  if (style === 'short') return `${dt.getDate()} ${DTF.mon.format(dt).replace('.', '')}${iso.slice(0, 4) !== TODAY.slice(0, 4) ? ' ' + iso.slice(0, 4) : ''}`;
  return DTF[style].format(dt);
};
const NF0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }), NF1 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const nf = (v, d = 0) => (d ? NF1 : NF0).format(Number(v || 0));
const pctf = v => (v < 10 ? NF1 : NF0).format(v || 0) + '%';
const plural = (n, one, many) => `${nf(n)} ${n === 1 ? one : many}`;
const LF = new Intl.ListFormat(LOCALE, { type: 'conjunction' });
const fmtDur = s => { s = Math.round(s || 0); if (s < 60) return `${s} s`; const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${pad(m)}` : `${m} min`; };
const clock = s => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${pad(m)}:${pad(x)}`; };
const parseClock = t => { const p = String(t || '').trim().replace(/^\[|\]$/g, '').split(':').map(Number); if (!p.length || p.some(isNaN)) return null; while (p.length < 3) p.unshift(0); return p[0] * 3600 + p[1] * 60 + p[2]; };
const initials = n => String(n).replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const displayName = n => String(n || '').includes(',') ? n.split(',').map(s => s.trim()).reverse().join(' ') : String(n || '');
const firstName = n => displayName(n).split(/\s+/)[0];
const curly = s => String(s).replace(/"([^"]*)"/g, '“$1”');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const VOG = { a: '[aáàâãä]', e: '[eéèêë]', i: '[iíìîï]', o: '[oóòôõö]', u: '[uúùûü]', c: '[cç]', n: '[nñ]' };
const termRe = w => w.length ? new RegExp('(' + w.map(x => [...x].map(ch => VOG[ch] || reEsc(ch)).join('')).join('|') + ')', 'gi') : null;
const markStr = (s, re) => re ? String(s).split(re).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join('') : esc(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const prefs = {
  get(k, d) { try { const v = localStorage.getItem('caderno:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('caderno:' + k, JSON.stringify(v)); } catch (e) {} },
};
let toastT;
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); };

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  tasks: '<path d="m3 6 2 2 3-3"/><path d="m3 13 2 2 3-3"/><path d="M12 6h9M12 13h9M5 20h16"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4.5-6.5"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  up: '<path d="m4 15 6-6 4 4 6-6"/><path d="M14 7h6v6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8V3M8 21v-7h8v7"/>',
};
const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ════════════════ Leitura de transcrições ════════════════ */
const TS = /((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s+-->\s+((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})/;
const toSec = ts => { const p = ts.replace(',', '.').split(':').map(Number); while (p.length < 3) p.unshift(0); return p[0] * 3600 + p[1] * 60 + p[2]; };
const decoder = document.createElement('textarea');
const decodeEntities = s => { decoder.innerHTML = s; return decoder.value; };
const WORD = /[\p{L}\p{N}]+/gu;
const countWords = t => (String(t).match(WORD) || []).length;

function parseVTT(raw) {
  const cues = [];
  for (const block of raw.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = block.split('\n').filter(l => l.trim());
    const i = lines.findIndex(l => TS.test(l)); if (i < 0) continue;
    const m = lines[i].match(TS), start = toSec(m[1]), end = Math.max(toSec(m[2]), start);
    let text = lines.slice(i + 1).join(' '), speaker = 'Desconhecido';
    const v = text.match(/<v(?:\.[^\s>]+)?\s+([^>]+)>([\s\S]*?)(?:<\/v>|$)/);
    if (v) { speaker = v[1].trim(); text = v[2]; }
    else { const plain = text.replace(/<[^>]+>/g, ''); const n = plain.match(/^([^:]{2,60}):\s([\s\S]*)$/); if (n) { speaker = n[1].trim(); text = n[2]; } }
    text = decodeEntities(text.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (text) cues.push({ start, end, speaker, text });
  }
  return cues.sort((a, b) => a.start - b.start);
}
/* Texto simples ou .docx do Teams: "Nome   0:03" + texto, "[00:01] Nome: texto" ou "Nome: texto" */
function parsePlain(raw) {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  const A = /^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:[.,]\d+)?\]?\s+([^:\[\]]{2,60}?):\s*(.*)$/;
  const B = /^(.{2,60}?)\s+((?:\d{1,2}:)?\d{1,2}:\d{2})(?:[.,]\d+)?$/;
  const C = /^([^:]{2,50}):\s+(.+)$/;
  const timed = lines.filter(l => A.test(l) || (B.test(l) && !/[.!?]$/.test(l))).length;
  const out = []; let cur = null;
  for (const l of lines) {
    let m;
    if (timed >= 2 && (m = l.match(A))) { cur = { start: toSec(m[1]), speaker: m[2].trim(), text: m[3] }; out.push(cur); }
    else if (timed >= 2 && (m = l.match(B)) && !/[.!?]$/.test(l)) { cur = { start: toSec(m[2]), speaker: m[1].trim(), text: '' }; out.push(cur); }
    else if (timed < 2 && (m = l.match(C))) { cur = { start: null, speaker: m[1].trim(), text: m[2] }; out.push(cur); }
    else if (cur) cur.text += (cur.text ? ' ' : '') + l;
  }
  const cues = out.filter(c => c.text.trim());
  if (!cues.length) return { cues: [], aproximado: true };
  let t = 0;
  cues.forEach((c, i) => {
    const est = Math.max(2, countWords(c.text) / 2.5);
    if (c.start == null) { c.start = t; c.end = t + est; t = c.end + 0.6; }
    else { const next = cues.slice(i + 1).find(x => x.start != null); c.end = next ? Math.max(c.start + 1, Math.min(next.start - 0.3, c.start + est * 1.6)) : c.start + est; }
  });
  return { cues, aproximado: true };
}
async function docxText(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('O ficheiro .docx parece estar danificado.');
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  for (let k = 0; k < n; k++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    if (name === 'word/document.xml') {
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const data = u8.subarray(start, start + csize);
      const xml = method === 0 ? new TextDecoder().decode(data) : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      return [...doc.getElementsByTagNameNS('*', 'p')].map(pp => [...pp.getElementsByTagNameNS('*', 't')].map(t => t.textContent).join('')).join('\n');
    }
    p += 46 + nlen + elen + clen;
  }
  throw new Error('Não encontrei texto dentro do .docx.');
}
async function readTranscript(file) {
  const name = file.name || '';
  if (/\.docx$/i.test(name)) return { ...parsePlain(await docxText(await file.arrayBuffer())), fonte: 'docx' };
  const text = await file.text();
  if (/^﻿?WEBVTT/.test(text) || TS.test(text)) return { cues: parseVTT(text), aproximado: false, fonte: 'vtt' };
  return { ...parsePlain(text), fonte: 'texto' };
}
function mergeTurns(cues) {
  const turns = [];
  for (const c of cues) {
    const t = turns[turns.length - 1];
    if (t && t.speaker === c.speaker) { t.end = Math.max(t.end, c.end); t.text += ' ' + c.text; t.spoken += c.end - c.start; }
    else turns.push({ start: c.start, end: c.end, speaker: c.speaker, text: c.text, spoken: c.end - c.start });
  }
  return turns;
}

/* ════════════════ Métricas ════════════════ */
const BORDOES = ['tipo', 'pronto', 'prontos', 'portanto', 'basicamente', 'literalmente', 'ok', 'okay', 'pá', 'digamos', 'ou seja', 'quer dizer', 'sei lá', 'olha', 'no fundo', 'efetivamente', 'em termos de', 'de certa forma', 'hum', 'hmm', 'ahn', 'eh', 'uhm', ['não é', 'não é(?=\\s*[?,])'], ['né', 'né(?![\\p{L}\\p{N}])']];
const HESITACOES = ['acho que', 'se calhar', 'talvez', 'não sei se', 'um bocadinho', 'só queria', 'mais ou menos', 'penso que', 'não tenho a certeza', 'de alguma forma', 'eventualmente', 'à partida', 'em princípio'];
const compileTerms = list => list.map(t => Array.isArray(t) ? [t[0], new RegExp('(?<![\\p{L}\\p{N}_])' + t[1], 'giu')] : [t, new RegExp('(?<![\\p{L}\\p{N}_])' + reEsc(t) + '(?![\\p{L}\\p{N}_])', 'giu')]);
const BORDOES_RE = compileTerms(BORDOES), HES_RE = compileTerms(HESITACOES);
const countTerms = (text, list) => { const o = {}; for (const [l, re] of list) { const n = (text.match(re) || []).length; if (n) o[l] = n; } return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1])); };
const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const samePerson = (a, b) => { const x = tokens(a), y = tokens(b); return !!(x.length && y.length && (x.every(w => y.includes(w)) || y.every(w => x.includes(w)))); };

function analyse(turns, euAlias) {
  if (!turns.length) return null;
  const names = [...new Set(turns.map(t => t.speaker))];
  const st = Object.fromEntries(names.map(n => [n, { tempo: 0, interv: 0, maior: 0, texto: [], fez: 0, sofreu: 0 }]));
  turns.forEach((t, i) => {
    const s = st[t.speaker]; s.tempo += t.spoken; s.interv++; s.maior = Math.max(s.maior, t.end - t.start); s.texto.push(t.text);
    if (i) { const p = turns[i - 1]; if (t.start < p.end - 0.3 || ((t.start - p.end) < 0.5 && !/[.?!…]$/.test(p.text.trim()))) { s.fez++; st[p.speaker].sofreu++; } }
  });
  const falado = names.reduce((a, n) => a + st[n].tempo, 0) || 1;
  const t0 = turns[0].start, dur = Math.max(...turns.map(t => t.end)) - t0;
  const euName = euAlias ? names.find(n => samePerson(n, euAlias)) : null;
  const oradores = names.map(n => {
    const s = st[n], texto = s.texto.join(' '), palavras = countWords(texto), b = countTerms(texto, BORDOES_RE), h = countTerms(texto, HES_RE);
    const sb = Object.values(b).reduce((a, x) => a + x, 0), sh = Object.values(h).reduce((a, x) => a + x, 0);
    return { nome: n, eu: n === euName, tempo_s: s.tempo, pct: 100 * s.tempo / falado, palavras, intervencoes: s.interv, ppm: s.tempo > 5 ? Math.round(palavras / (s.tempo / 60)) : 0, maior_s: s.maior, perguntas: (texto.match(/\?/g) || []).length, bordoes: b, bordoes_100: palavras ? 100 * sb / palavras : 0, hesitacoes: h, hesitacoes_100: palavras ? 100 * sh / palavras : 0, interrompeu: s.fez, interrompido: s.sofreu };
  }).sort((a, b) => b.tempo_s - a.tempo_s);
  const order = Object.fromEntries(oradores.map((o, i) => [o.nome, i]));
  const n = oradores.filter(o => o.pct > 0).length;
  const equilibrio = n > 1 ? Math.max(0, Math.round(100 * (1 - (oradores[0].pct / 100 - 1 / n) / (1 - 1 / n)))) : 0;
  return { eu: euName, duracao_s: dur, falado_s: falado, equilibrio, oradores, order, timeline: turns.map(t => [t.start - t0, t.end - t0, order[t.speaker]]), t0 };
}

/* ════════════════ Estado e armazenamento ════════════════
   Dados: IndexedDB do navegador e, com o modo pasta, o ficheiro caderno-dados.json na pasta do caderno.
   Modo pasta: o caderno vigia entrada/, prepara um .pedido.md por transcrição e importa o .resposta.json
   que o Kilo Code lá escreve. */
const DEFAULT_STATE = { versao: 3, guardado_em: null, dono: '', aliases: [], equipa: 'CIO Office Portugal', coaching: false, reunioes: [], fila: [], importados: [], projetos: [], apagados: {} };
let STATE = structuredClone(DEFAULT_STATE);
let EXEMPLOS = []; try { EXEMPLOS = JSON.parse($('#exemplos').textContent) || []; } catch (e) {}
let EXEMPLO_PROJETO = null; try { EXEMPLO_PROJETO = JSON.parse($('#exemplo-projeto')?.textContent || 'null'); } catch (e) {}
let dirHandle = null, dirPerm = 'none', inboxBusy = false;
let fileStamp = null, writeFailed = false, CONFLITOS = []; // fileStamp: guardado_em do ficheiro da pasta lido ou escrito pela última vez
let INBOX = { aguardar: [], quem: [], erros: [], rever: [] }; // aguardar: pedidos à espera do Kilo Code; quem: transcrições sem "quem és tu"; rever: respostas prontas a rever
const INSTR_FILE = 'instrucoes-para-o-kilo.md', DATA_FILE = 'caderno-dados.json', INBOX_DIR = 'entrada', DONE_DIR = 'processadas';
const TRANSCRIPT_RE = /\.(vtt|docx|txt)$/i;
const FS_OK = 'showDirectoryPicker' in window;
const idb = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('caderno-cio-office', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const op = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
  return { get: k => op('readonly', s => s.get(k)), set: (k, v) => op('readwrite', s => s.put(v, k)), del: k => op('readwrite', s => s.delete(k)) };
})();
const fixState = s => {
  const st = Object.assign(structuredClone(DEFAULT_STATE), s || {});
  for (const k of ['fila', 'importados', 'projetos', 'reunioes', 'aliases']) if (!Array.isArray(st[k])) st[k] = [];
  if (!st.apagados || typeof st.apagados !== 'object') st.apagados = {};
  return st;
};
const stamp = () => new Date().toISOString();
const touch = (...os) => { const t = stamp(); os.forEach(o => { if (o) o.alterado_em = t; }); };
const when = o => o?.alterado_em || o?.criado_em || '';

/* Junção de dois estados (este navegador e o ficheiro da pasta, uma cópia importada ou uma cópia de conflito do OneDrive).
   Junta registo a registo: reuniões, tarefas e projetos por id, ganha a alteração mais recente; os apagados ficam
   registados para não voltarem; uma transcrição importada duas vezes (dois separadores ou dois PCs) fica só uma vez.
   Muda `local` no próprio objeto e devolve quantos registos vieram de `other`. */
function mergeState(local, other) {
  other = fixState(other);
  let vindos = 0;
  for (const [id, t] of Object.entries(other.apagados)) if (!local.apagados[id] || local.apagados[id] < t) local.apagados[id] = t;
  const mergeItems = (base, older) => {
    for (const k of ['tarefas', 'pedidos']) {
      const a = base.conteudo?.[k], b = older.conteudo?.[k];
      if (!Array.isArray(a) || !Array.isArray(b)) continue;
      a.forEach((it, i) => { const o = it.id && b.find(x => x.id === it.id); if (o && when(o) > when(it)) a[i] = o; });
    }
    return base;
  };
  const byId = new Map(local.reunioes.map((r, i) => [r.id, i]));
  for (const r of other.reunioes) {
    const i = byId.get(r.id);
    if (i == null) { local.reunioes.push(r); byId.set(r.id, local.reunioes.length - 1); vindos++; continue; }
    const mine = local.reunioes[i];
    if (when(r) > when(mine)) { local.reunioes[i] = mergeItems(r, mine); vindos++; } else mergeItems(mine, r);
  }
  // A mesma transcrição importada duas vezes: fica a primeira
  const porOrigem = new Map();
  for (const r of local.reunioes.slice().sort((x, y) => (x.criado_em || '').localeCompare(y.criado_em || ''))) {
    if (!r.origem) continue;
    if (porOrigem.has(r.origem)) local.apagados[r.id] = local.apagados[r.id] || stamp(); else porOrigem.set(r.origem, r.id);
  }
  local.reunioes = local.reunioes.filter(r => !local.apagados[r.id]);
  const pj = new Map(local.projetos.map((p, i) => [p.id, i]));
  for (const p of other.projetos) { const i = pj.get(p.id); if (i == null) { local.projetos.push(p); vindos++; } else if (when(p) > when(local.projetos[i])) { local.projetos[i] = p; vindos++; } }
  local.projetos = local.projetos.filter(p => !local.apagados[p.id]);
  local.aliases = [...new Set([...(local.aliases || []), ...(other.aliases || [])])];
  if (!local.dono && other.dono) local.dono = other.dono;
  local.importados = [...new Set([...local.importados, ...other.importados])].slice(-300);
  for (const j of other.fila) if (!local.fila.some(x => x.base === j.base)) local.fila.push(j);
  local.historicos = { ...(other.historicos || {}), ...(local.historicos || {}) };
  return vindos;
}
async function loadState() {
  let s = null;
  try { s = await idb.get('estado'); } catch (e) { console.warn('IndexedDB indisponível', e); }
  if (!s) { try { s = JSON.parse(localStorage.getItem('caderno:estado') || 'null'); } catch (e) {} }
  STATE = fixState(s);
  try { dirHandle = (await idb.get('pasta')) || null; } catch (e) {}
  if (dirHandle) { try { dirPerm = await dirHandle.queryPermission({ mode: 'readwrite' }); } catch (e) { dirPerm = 'prompt'; } }
  if (dirHandle && dirPerm === 'granted') await syncFromFolder();
}
async function readJSONFile(dir, name) {
  try { const fh = await dir.getFileHandle(name); const txt = await (await fh.getFile()).text(); return txt.trim() ? JSON.parse(txt) : null; }
  catch (e) { if (e.name === 'NotFoundError') return null; throw e; }
}
async function writeFile(dir, name, content) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(content); await w.close(); }
/* Lê o ficheiro da pasta e junta-o ao que está neste navegador (nunca substitui). Devolve true se trouxe alterações. */
async function syncFromFolder() {
  if (!dirHandle || dirPerm !== 'granted') return false;
  let changed = false;
  try {
    const d = await readJSONFile(dirHandle, DATA_FILE);
    if (d && Array.isArray(d.reunioes) && d.guardado_em !== fileStamp) {
      changed = mergeState(STATE, d) > 0;
      fileStamp = d.guardado_em || null;
      await saveLocal();
    }
    CONFLITOS = [];
    for await (const [name, h] of dirHandle.entries()) if (h.kind === 'file' && name !== DATA_FILE && /^caderno-dados.*\.json$/i.test(name)) CONFLITOS.push(name);
  } catch (e) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') { dirPerm = 'prompt'; renderSaveState(); }
    else { console.warn('Não foi possível ler o ficheiro de dados', e); toast('O ficheiro caderno-dados.json não pôde ser lido. Os dados deste PC continuam a ser usados.'); }
  }
  return changed;
}
async function saveLocal() {
  try { await idb.set('estado', STATE); } catch (e) { try { localStorage.setItem('caderno:estado', JSON.stringify(STATE)); } catch (e2) { toast('Não foi possível guardar neste navegador. Liga a pasta do caderno ou exporta uma cópia.'); } }
}
/* Grava neste navegador e na pasta. Se o ficheiro da pasta mudou desde a última leitura (outro separador ou outro PC),
   junta primeiro e só depois grava: nada do que foi gravado noutro lado se perde. */
async function persist(msg) {
  STATE.guardado_em = stamp();
  await saveLocal();
  if (dirHandle && dirPerm === 'granted') {
    try {
      const d = await readJSONFile(dirHandle, DATA_FILE);
      if (d && Array.isArray(d.reunioes) && d.guardado_em && d.guardado_em !== fileStamp && mergeState(STATE, d)) afterRemoteChange();
      STATE.guardado_em = stamp();
      await writeFile(dirHandle, DATA_FILE, JSON.stringify(STATE)); fileStamp = STATE.guardado_em;
      await saveLocal();
      await writeFile(dirHandle, INSTR_FILE, genericInstructions());
      if (writeFailed) { writeFailed = false; toast('A pasta voltou a ser gravada.'); }
    } catch (e) {
      writeFailed = true;
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') dirPerm = 'prompt';
      toast('Não consegui gravar na pasta. Os dados estão só neste navegador: clica em “Voltar a ligar a pasta”.');
    }
  }
  renderSaveState(); if (msg && !writeFailed) toast(msg);
}
/* Chegaram dados de outro lado: refaz as listas e a vista, sem interromper quem está a escrever */
function afterRemoteChange() {
  rebuild(); renderList(); renderNav();
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (!typing && !['nova', 'rever', 'nota'].includes(current?.view)) route();
}
function renderSaveState() {
  const el = $('#save-state');
  const at = STATE.guardado_em ? DTF.time.format(new Date(STATE.guardado_em)) : null;
  if (dirHandle && (dirPerm !== 'granted' || writeFailed)) { el.innerHTML = `<button class="btn-link" type="button" data-action="relink" style="border:0;background:none;padding:0">${writeFailed ? 'Não gravado na pasta. Voltar a ligar' : 'Clica para voltar a ligar a pasta'}</button>`; el.className = 'save-state warn'; return; }
  el.className = 'save-state';
  el.textContent = dirHandle ? `Pasta ${dirHandle.name}${at ? ', guardado às ' + at : ''}` : (at ? `Guardado neste PC às ${at}` : 'Offline. Tudo fica neste computador.');
}
async function connectFolder() {
  try {
    const h = await window.showDirectoryPicker({ id: 'caderno-reunioes', mode: 'readwrite' });
    if ((await h.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await h.requestPermission({ mode: 'readwrite' })) !== 'granted') return;
    dirHandle = h; dirPerm = 'granted'; writeFailed = false; fileStamp = null; await idb.set('pasta', h);
    await (await h.getDirectoryHandle(INBOX_DIR, { create: true })).getDirectoryHandle(DONE_DIR, { create: true });
    const antes = STATE.reunioes.length;
    await syncFromFolder(); // junta o que a pasta já tinha ao que está neste navegador
    const vindas = STATE.reunioes.length - antes;
    await persist(`Pasta ${h.name} ligada${vindas > 0 ? `: ${plural(vindas, 'reunião veio', 'reuniões vieram')} da pasta` : ''}. Põe as transcrições em ${INBOX_DIR}.`); rebuild(); renderAll(); scanInbox();
  } catch (e) { if (e.name !== 'AbortError') toast('Não foi possível ligar a pasta: ' + e.message); }
}
async function relinkFolder() {
  try { dirPerm = await dirHandle.requestPermission({ mode: 'readwrite' }); if (dirPerm === 'granted') { writeFailed = false; await syncFromFolder(); rebuild(); await persist('Pasta ligada.'); renderAll(); scanInbox(); } else renderSaveState(); }
  catch (e) { toast('Não foi possível voltar a ligar: ' + e.message); }
}
async function unlinkFolder() { dirHandle = null; dirPerm = 'none'; writeFailed = false; fileStamp = null; CONFLITOS = []; INBOX = { aguardar: [], quem: [], erros: [], rever: [] }; try { await idb.del('pasta'); } catch (e) {} renderAll(); toast('O caderno deixou de usar a pasta. Os dados continuam neste PC.'); }
async function mergeConflicts() {
  let n = 0;
  for (const name of CONFLITOS) {
    try { const d = await readJSONFile(dirHandle, name); if (d && Array.isArray(d.reunioes)) { n += mergeState(STATE, d); await dirHandle.removeEntry(name); } }
    catch (e) { toast(`Não consegui ler ${name}: ${e.message}`); }
  }
  CONFLITOS = [];
  await persist(`Cópias juntas: ${plural(n, 'registo recuperado', 'registos recuperados')}.`); rebuild(); renderAll();
}
function exportData() {
  const blob = new Blob([JSON.stringify(STATE, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `caderno-reunioes-copia-${TODAY}.json`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Cópia de segurança descarregada.');
}
async function importData(file) {
  try {
    const d = JSON.parse(await file.text());
    if (!d || !Array.isArray(d.reunioes)) throw new Error('Este ficheiro não é uma cópia do caderno.');
    const n = mergeState(STATE, d);
    await persist(`Cópia junta: ${plural(n, 'registo novo ou mais recente', 'registos novos ou mais recentes')}.`); rebuild(); renderAll();
  } catch (e) { toast(e.message); }
}

/* Instruções para o Kilo Code processar uma transcrição mesmo com o caderno fechado */
function genericInstructions() {
  const recent = meetings.filter(m => !m.exemplo).slice(0, 8);
  const open = allTodos.filter(t => !isDone(t) && !t.m.exemplo).slice(0, 30).map(t => ({ code: 'T-' + t.key, t }));
  const job = { generic: true, data: null, date: '', turns: [], related: recent, pendentes: open, aproximado: false };
  return `<!-- Gerado automaticamente pelo Caderno de Reuniões (${new Date().toISOString()}). Não edites: é reescrito sempre que o caderno guarda. -->\n\n` +
    buildPrompt(job, 'entrada/NOME.resposta.json, em que NOME é o nome do ficheiro da transcrição sem a extensão');
}

/* ── Caixa de entrada (modo pasta) ── */
const baseName = n => n.replace(/\.(vtt|docx|txt|pedido\.md|resposta\.json|erro\.txt)$/i, '');
const dateFromFile = (name, lastModified) => { const m = name.match(/(\d{4})[-_.](\d{2})[-_.](\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : (lastModified ? localISO(new Date(lastModified)) : TODAY); };
function prepareJob({ cues, aproximado, fonte, alias, date, nome, origem }) {
  const turns = mergeTurns(cues), data = analyse(turns, alias);
  const job = { cues, turns, data, alias, date, aproximado, fonte, ficheiro: nome, origem: origem || null, related: [], pendentes: [] };
  if (!usingExamples()) {
    job.related = relatedOf({ id: '__nova__', people: data ? data.oradores.map(o => o.nome) : [], tags: [], date }, 3);
    job.pendentes = pendingFor(date);
  }
  return job;
}
// Tarefas e pedidos em aberto dos últimos 90 dias, com códigos T1, T2… para o pedido
const pendingFor = date => { const since = addDays(date, -90); return allTodos.filter(t => !isDone(t) && !t.m.exemplo && (t.m.date || '') >= since && (t.m.date || '') <= date).slice(0, 25).map((t, i) => ({ code: 'T' + (i + 1), t })); };
/* Rascunho para rever: a resposta já validada, com a evidência verificada e as tarefas anteriores que a resposta dá como feitas */
function makeDraft(job, p, codes) {
  checkEvidence(p, job.turns || []);
  const concl = [];
  for (const x of p.tarefas_concluidas || []) {
    const key = codes[x.codigo] || String(x.codigo).replace(/^T-/, '');
    const t = key && allTodos.find(y => y.key === key && !isDone(y));
    if (t && !concl.some(c => c.t === t)) concl.push({ t, x });
  }
  return { job, p, concl };
}
function recordFromJob(job, p) {
  const names = job.data ? job.data.oradores.map(o => o.nome) : (job.pessoas || [...new Set((job.turns || []).map(t => t.speaker))]);
  const order = Object.fromEntries(names.map((n, i) => [n, i]));
  const tipo = job.fonte === 'nota' ? 'Nota rápida' : 'Reunião';
  const now = stamp();
  const rec = {
    id: `${job.date}-${slug(p.titulo || 'reuniao')}-${uid().slice(-4)}`, criado_em: now, alterado_em: now, data: job.date, tipo, fonte: job.fonte, aproximado: job.aproximado, eu: job.alias || null, ficheiro: job.ficheiro || null, origem: job.origem || null,
    oradores: names, falas: (job.turns || []).map(t => [+t.start.toFixed(2), +t.end.toFixed(2), order[t.speaker], t.text, +t.spoken.toFixed(2)]), conteudo: p, notas: '',
  };
  linkProject(rec);
  return rec;
}
function linkProject(rec) {
  const pmo = rec.conteudo?.pmo; const p = pmo && matchProject(pmo.projeto);
  if (p) { rec.projeto = p.id; pmo.projeto = p.nome; assignCodes(p, pmo, meetings); }
}
const PERSON_FIELD = { tarefas: 'responsavel', pedidos: 'para' };
/* Aplica a revisão ao rascunho e devolve a reunião pronta a guardar. Só fecha as tarefas anteriores confirmadas. */
function finishDraft(d, rv) {
  const p = d.p, job = d.job;
  if (rv.titulo) p.titulo = rv.titulo;
  if (isISO(rv.date)) job.date = rv.date;
  const out = Object.fromEntries(ITEM_KINDS.map(([k]) => [k, []]));
  for (const r of rv.items) {
    if (!r.keep) continue;
    const src = p[r.from]?.[r.i] || {};
    const pessoa = r.pessoa.trim();
    const o = { id: src.id || uid(), minuto: src.minuto || '', citacao: src.citacao || '', ev: src.ev || 'sem', dito_por: src.dito_por || '', confirmar: src.confirmar || '' };
    if (isTaskKind(r.kind)) {
      Object.assign(o, { acao: r.texto.trim(), prazo: isISO(r.prazo) ? r.prazo : null, prazo_dito: src.prazo_dito || '', feito: false });
      if (o.prazo && o.prazo !== src.prazo && !o.prazo_dito) o.prazo_dito = 'definido por ti na revisão';
      if (r.kind === 'tarefas') o.responsavel = pessoa; else { o.para = pessoa; o.quem = src.quem || ''; }
    } else Object.assign(o, { texto: r.texto.trim(), quem: r.kind === r.from ? (src.quem || '') : '' });
    if (!itemText(o)) continue;
    if (r.ok) o.confirmar = '';
    else {
      if (pessoa) o.confirmar = o.confirmar.replace(/Ninguém assumiu claramente[^.]*\.(\s*[^.]*”\.)?/, '').replace('Não é claro a quem foi pedido.', '');
      if (o.prazo_dito) o.confirmar = o.confirmar.replace('Prazo sem as palavras ditas.', '');
      if (r.kind === 'tarefas' && !pessoa) addFlag(o, 'Ninguém assumiu claramente.');
      o.confirmar = o.confirmar.replace(/\s+/g, ' ').trim();
    }
    out[r.kind].push(o);
  }
  Object.assign(p, out);
  const fechadas = d.concl.filter((c, i) => rv.concl.includes(i));
  p.tarefas_concluidas = fechadas.map(c => c.x);
  const rec = recordFromJob(job, p);
  rec.revisto_em = stamp();
  for (const c of fechadas) { Object.assign(c.t.t, { feito: true, concluida_em: rec.data, fechada_em: rec.id, evidencia_conclusao: { minuto: c.x.minuto, citacao: c.x.citacao } }); touch(c.t.t, c.t.m.rec); }
  return rec;
}
function rememberAlias(alias) { if (alias && !(STATE.aliases || []).some(a => samePerson(a, alias))) STATE.aliases = [...(STATE.aliases || []), alias]; }
async function fileFromInbox(inbox, name) { return (await inbox.getFileHandle(name)).getFile(); }
async function moveToDone(inbox, names) {
  const done = await inbox.getDirectoryHandle(DONE_DIR, { create: true });
  for (const n of names) {
    try { const f = await fileFromInbox(inbox, n); await writeFile(done, n, await f.arrayBuffer()); await inbox.removeEntry(n); }
    catch (e) { console.warn('Não foi possível mover', n, e.name, e.message); }
  }
}
const REVIEW_CACHE = new Map(); // base -> { mod, titulo, n }: evita validar a mesma resposta a cada 4 s
async function scanInbox() {
  if (!dirHandle || dirPerm !== 'granted' || inboxBusy) return;
  inboxBusy = true;
  const before = JSON.stringify(INBOX);
  try {
    const inbox = await dirHandle.getDirectoryHandle(INBOX_DIR, { create: true });
    const files = new Map();
    for await (const [name, h] of inbox.entries()) if (h.kind === 'file' && !/^(~\$|\.)/.test(name)) files.set(name, h);
    const bases = new Map();
    for (const name of files.keys()) { const b = baseName(name); if (!bases.has(b)) bases.set(b, {}); const o = bases.get(b);
      if (/\.erro\.txt$/i.test(name)) o.erro = name; else if (/\.pedido\.md$/i.test(name)) o.pedido = name; else if (/\.resposta\.json$/i.test(name)) o.resposta = name; else if (TRANSCRIPT_RE.test(name)) o.transcricao = name; }
    const aguardar = [], quem = [], erros = [], rever = [];
    let imported = 0, changed = false;
    for (const [b, o] of bases) {
      if (!o.transcricao && /\.historico$/.test(b)) {
        const pid = (STATE.historicos || {})[b], pp = pid && projectById(pid);
        if (o.resposta && pp) {
          const rf = await fileFromInbox(inbox, o.resposta);
          if (Date.now() - rf.lastModified < 8000) { aguardar.push({ base: b, ficheiro: `histórico de ${pp.nome}` }); continue; }
          try { const n = applyHistory(pp, await rf.text()); delete STATE.historicos[b]; changed = true; imported++; await moveToDone(inbox, [o.pedido, o.resposta, o.erro].filter(Boolean)); toast(`Histórico de ${pp.nome}: ${plural(n, 'reunião atualizada', 'reuniões atualizadas')}.`); }
          catch (err) { await writeFile(inbox, `${b}.erro.txt`, `A resposta do Kilo Code para o histórico de "${pp.nome}" não é válida:\n${err.message}\n\nNo Kilo Code escreve outra vez /reuniao para a refazer.\n`); await inbox.removeEntry(o.resposta); erros.push({ base: b, msg: err.message }); }
        } else if (o.pedido && pp) aguardar.push({ base: b, ficheiro: `histórico de ${pp.nome}` });
        continue;
      }
      if (!o.transcricao) continue;
      if (STATE.importados.includes(b)) { await moveToDone(inbox, [o.transcricao, o.pedido, o.resposta, o.erro].filter(Boolean)); continue; }
      const job0 = STATE.fila.find(j => j.base === b);
      if (o.resposta) {
        const rf = await fileFromInbox(inbox, o.resposta);
        if (Date.now() - rf.lastModified < 8000) { aguardar.push({ base: b, ficheiro: o.transcricao, date: job0?.date, aRecebir: true }); continue; } // o Kilo Code pode ainda estar a escrever
        let info = REVIEW_CACHE.get(b);
        if (!info || info.mod !== rf.lastModified) {
          try { const p = normalizeAI(extractJSON(await rf.text())); info = { mod: rf.lastModified, titulo: p.titulo || o.transcricao, n: ITEM_KINDS.reduce((x, [k]) => x + p[k].length, 0) }; REVIEW_CACHE.set(b, info); }
          catch (err) {
            await writeFile(inbox, `${b}.erro.txt`, `A resposta do Kilo Code para "${o.transcricao}" não é válida:\n${err.message}\n\nNo Kilo Code escreve outra vez /reuniao para a refazer.\n`);
            await inbox.removeEntry(o.resposta); erros.push({ base: b, msg: err.message }); continue;
          }
        }
        rever.push({ base: b, ficheiro: o.transcricao, titulo: info.titulo, n: info.n, date: job0?.date });
        continue;
      }
      if (o.pedido && job0) { aguardar.push({ base: b, ficheiro: o.transcricao, date: job0.date }); if (o.erro) erros.push({ base: b, msg: 'A última resposta não era válida; o pedido continua à espera.' }); continue; }
      // Transcrição nova (ou pedido sem registo): preparar o pedido
      const f = await fileFromInbox(inbox, o.transcricao);
      let r; try { r = await readTranscript(f); } catch (err) { erros.push({ base: b, msg: `${o.transcricao}: ${err.message}` }); continue; }
      if (!r.cues.length) { erros.push({ base: b, msg: `${o.transcricao}: não encontrei falas.` }); continue; }
      const speakers = [...new Set(r.cues.map(c => c.speaker))];
      const pend = STATE.fila.find(j => j.base === b && j.alias !== undefined);
      let alias = pend ? pend.alias : (speakers.find(s => isMe(s)) ?? (speakers.length === 1 ? speakers[0] : undefined));
      if (alias === undefined) { quem.push({ base: b, ficheiro: o.transcricao, speakers }); continue; }
      const date = pend?.date || dateFromFile(o.transcricao, f.lastModified);
      const job = prepareJob({ ...r, alias, date, nome: o.transcricao, origem: b });
      const prompt = buildPrompt(job, `entrada/${b}.resposta.json`);
      await writeFile(inbox, `${b}.pedido.md`, prompt);
      if (o.erro) await inbox.removeEntry(o.erro).catch(() => {});
      STATE.fila = STATE.fila.filter(j => j.base !== b).concat({ base: b, ficheiro: o.transcricao, alias, date, codes: Object.fromEntries(job.pendentes.map(x => [x.code, x.t.key])), criado: stamp() });
      changed = true; aguardar.push({ base: b, ficheiro: o.transcricao, date });
    }
    const liveBases = new Set([...bases.entries()].filter(([, o]) => o.transcricao).map(([b]) => b));
    if (STATE.fila.some(j => !liveBases.has(j.base))) { STATE.fila = STATE.fila.filter(j => liveBases.has(j.base)); changed = true; }
    INBOX = { aguardar, quem, erros, rever };
    if (changed) { await persist(); if (imported) { rebuild(); renderList(); renderNav(); if (current?.view === 'p') route(); } }
    if (changed || JSON.stringify(INBOX) !== before) refreshInboxUI();
  } catch (e) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') { dirPerm = 'prompt'; renderSaveState(); }
    else console.warn('scanInbox', e);
  } finally { inboxBusy = false; }
}
/* Abre uma resposta da caixa de entrada para rever */
async function loadInboxDraft(b) {
  const inbox = await dirHandle.getDirectoryHandle(INBOX_DIR);
  const names = []; for await (const [name] of inbox.entries()) names.push(name);
  const tr = names.find(n => baseName(n) === b && TRANSCRIPT_RE.test(n) && !/\.erro\.txt$/i.test(n)), rs = names.find(n => n === `${b}.resposta.json`);
  if (!tr || !rs) throw new Error('Esta resposta já não está na pasta entrada.');
  const p = normalizeAI(extractJSON(await (await fileFromInbox(inbox, rs)).text()));
  const f = await fileFromInbox(inbox, tr), r = await readTranscript(f);
  const job0 = STATE.fila.find(j => j.base === b);
  const speakers = [...new Set(r.cues.map(c => c.speaker))];
  const fromAI = p.eu_na_transcricao && speakers.find(sp => samePerson(sp, p.eu_na_transcricao));
  const job = prepareJob({ ...r, alias: job0?.alias ?? fromAI ?? speakers.find(sp => isMe(sp)) ?? null, date: job0?.date || dateFromFile(tr, f.lastModified), nome: tr, origem: b });
  const codes = job0?.codes || {};
  return { ...makeDraft(job, p, codes), base: b, files: [tr, `${b}.pedido.md`, rs, `${b}.erro.txt`].filter(n => names.includes(n)) };
}
async function saveInboxDraft(d, rv) {
  await syncFromFolder(); rebuild();
  if (STATE.importados.includes(d.base) || STATE.reunioes.some(r => r.origem === d.base)) { toast('Esta reunião já foi guardada noutra janela.'); go('#/'); return; }
  const rec = finishDraft(d, rv);
  rememberAlias(d.job.alias);
  STATE.reunioes.push(rec);
  STATE.fila = STATE.fila.filter(j => j.base !== d.base);
  STATE.importados = [...STATE.importados.slice(-300), d.base];
  await persist('Reunião guardada.');
  const inbox = await dirHandle.getDirectoryHandle(INBOX_DIR);
  await moveToDone(inbox, d.files);
  REVIEW_CACHE.delete(d.base); REVIEW = null;
  rebuild(); renderList(); renderNav(); go(meetingHref({ id: rec.id })); scanInbox();
}
/* Recusar a resposta: apaga-a para o Kilo Code a refazer com /reuniao */
async function rejectInboxDraft(d) {
  const inbox = await dirHandle.getDirectoryHandle(INBOX_DIR);
  await inbox.removeEntry(`${d.base}.resposta.json`).catch(() => {});
  REVIEW_CACHE.delete(d.base); REVIEW = null;
  toast('Resposta posta de lado. No Kilo Code escreve outra vez /reuniao para a refazer.'); go('#/'); scanInbox();
}
async function setInboxWho(base, alias) {
  const f = INBOX.quem.find(q => q.base === base); if (!f) return;
  STATE.fila = STATE.fila.filter(j => j.base !== base).concat({ base, ficheiro: f.ficheiro, alias, date: null, codes: {}, criado: stamp() });
  rememberAlias(alias); await persist(); scanInbox();
}
function refreshInboxUI() {
  const v = current?.view ?? '';
  if (v === '' || v === 'nova') { const y = main.scrollTop; route(); main.scrollTop = y; }
  renderNav();
}
setInterval(() => { if (document.visibilityState === 'visible') scanInbox(); }, 4000);
window.addEventListener('focus', async () => { const n = CONFLITOS.length; if ((await syncFromFolder()) || CONFLITOS.length !== n) afterRemoteChange(); scanInbox(); });

/* ════════════════ Modelo das reuniões ════════════════ */
const OWNER = () => (STATE.dono || '').trim();
const TEAM = () => STATE.equipa || 'CIO Office Portugal';
function isMe(name) {
  const n = norm(name).trim(); if (!n) return false;
  if (n === 'eu') return true;
  if (OWNER() && samePerson(OWNER(), name)) return true;
  return (STATE.aliases || []).some(a => samePerson(a, name));
}
let meetings = [], byId = new Map(), allTodos = [];
const usingExamples = () => !STATE.reunioes.length;
function toMeeting(r) {
  const c = r.conteudo || {};
  const turns = (r.falas || []).map(f => ({ start: f[0], end: f[1], speaker: r.oradores[f[2]], text: f[3], spoken: f[4] ?? (f[1] - f[0]) }));
  const alias = r.eu || (STATE.aliases || []).find(a => (r.oradores || []).some(o => samePerson(o, a))) || OWNER();
  const data = analyse(turns, alias);
  const m = {
    rec: r, id: r.id, title: c.titulo || r.titulo || 'Reunião sem título', date: r.data, type: r.tipo || (c.v === 2 ? 'Reunião' : 'Ata'),
    tags: c.etiquetas || [], data, turns, exemplo: !!r.exemplo, aproximado: !!r.aproximado,
    people: data ? data.oradores.map(o => o.nome) : (r.oradores || []), dur: data?.duracao_s || 0,
    lead: c.resumo || '', tip: cap(c.radar?.experimenta || ''), c,
  };
  // Tarefas (assumidas por alguém) e pedidos (à espera de outra pessoa). A chave é o id da tarefa; nas reuniões antigas, a posição.
  m.todos = [
    ...(c.tarefas || []).map((t, i) => ({ key: t.id || r.id + '#' + i, i, kind: 'tarefa', text: t.acao, owner: t.responsavel, due: t.prazo, t, m })),
    ...(c.pedidos || []).map((t, i) => ({ key: t.id || r.id + '#p' + i, i, kind: 'pedido', text: t.acao, owner: t.para, due: t.prazo, t, m })),
  ];
  const secText = (c.seccoes || []).map(s => [s.titulo, s.texto, ...(s.itens || []).map(x => typeof x === 'string' ? x : [x.quem, x.texto, x.citacao].join(' ')), ...(s.linhas || []).flat()].join(' ')).join(' ');
  const itemsText = ITEM_KINDS.flatMap(([k]) => (c[k] || []).map(it => [itemText(it), it.responsavel, it.para, it.quem, it.citacao].filter(Boolean).join(' '))).join(' ');
  m.flags = ITEM_KINDS.reduce((n, [k]) => n + (c[k] || []).filter(it => it.confirmar).length, 0);
  m.text = [c.objetivo, m.lead, c.contexto, (c.temas || []).map(t => t.titulo + ' ' + t.resumo).join(' '), secText, itemsText, (c.notas_ia || []).map(n => n.titulo + ' ' + n.texto).join(' '), c.v === 2 ? '' : m.todos.map(t => t.text + ' ' + t.owner).join(' '), (c.radar?.correu_bem || []).join(' '), (c.radar?.a_melhorar || []).join(' '), c.radar?.experimenta, turns.map(t => t.speaker + ' ' + t.text).join(' ')].filter(Boolean).join(' ').replace(/\s+/g, ' ');
  m.ntext = normAligned(m.text);
  m.search = norm([m.title, m.type, m.tags.join(' '), m.date, fmtDate(m.date), m.people.join(' '), m.text, r.notas || ''].join(' '));
  return m;
}
function rebuild() {
  const recs = usingExamples() ? EXEMPLOS : STATE.reunioes;
  meetings = recs.map(toMeeting).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.rec.criado_em || '').localeCompare(a.rec.criado_em || ''));
  byId = new Map(meetings.map(m => [m.id, m]));
  allTodos = meetings.flatMap(m => m.todos);
}
const meOf = m => m.data?.oradores.find(o => o.eu || isMe(o.nome)) || null;
const colorsOf = m => { let k = 1; return (m.data?.oradores || []).map(o => (o.eu || isMe(o.nome)) ? 0 : Math.min(6, k++)); };
const nameOf = n => isMe(n) && OWNER() ? `${firstName(OWNER())} (tu)` : displayName(n);
const personLabel = n => isMe(n) && OWNER() ? displayName(OWNER()) : displayName(n);
const isDone = t => !!t.t.feito;
const mineTodo = t => t.kind !== 'pedido' && isMe(t.owner);
const waitingTodo = t => !mineTodo(t); // à espera de outra pessoa: tarefa assumida por outra pessoa ou pedido que fiz
const knowsMe = () => !!OWNER() || (STATE.aliases || []).length > 0 || usingExamples();
async function setDone(t, v) {
  t.t.feito = v;
  if (v) t.t.concluida_em = t.t.concluida_em || TODAY; else { delete t.t.fechada_em; delete t.t.concluida_em; }
  touch(t.t, t.m.rec);
  renderNav();
  if (!t.m.exemplo) await persist();
}
const relatedOf = (m, max = 4) => {
  const mine = new Set(m.people.filter(p => !isMe(p)).map(norm));
  return meetings.filter(x => x !== m && (x.date || '') <= (m.date || '9999')).map(x => ({ x, score: x.people.filter(p => !isMe(p) && mine.has(norm(p))).length + x.tags.filter(t => m.tags.map(norm).includes(norm(t))).length }))
    .filter(o => o.score >= 2 || (o.score >= 1 && mine.size <= 2)).sort((a, b) => b.score - a.score || (b.x.date || '').localeCompare(a.x.date || '')).slice(0, max).map(o => o.x);
};

/* ════════════════ Coaching ════════════════ */
const METRICS = [
  { k: 'pct', l: 'Tempo de fala', fmt: v => pctf(v), better: 'mid', help: 'Percentagem do tempo falado' },
  { k: 'ppm', l: 'Ritmo', fmt: v => `${nf(v)} ppm`, band: [120, 170], better: 'mid', help: 'Palavras por minuto; ideal entre 120 e 170' },
  { k: 'bordoes_100', l: 'Bordões', fmt: v => `${nf(v, 1)} por 100 palavras`, band: [0, 2], better: 'low', help: 'Ideal abaixo de 2 por 100 palavras' },
  { k: 'hesitacoes_100', l: 'Hesitações', fmt: v => `${nf(v, 1)} por 100 palavras`, band: [0, 1.5], better: 'low', help: '“Acho que”, “se calhar”; ideal abaixo de 1,5' },
  { k: 'perguntas', l: 'Perguntas feitas', fmt: v => nf(v), band: [3, null], better: 'high', help: 'Perguntas puxam pelos outros; ideal 3 ou mais' },
  { k: 'maior_s', l: 'Maior monólogo', fmt: v => fmtDur(v), band: [0, 90], better: 'low', help: 'Intervenção mais longa; ideal abaixo de 90 s' },
];
function status(k, v, o = {}) {
  switch (k) {
    case 'pct': { const fair = 100 / Math.max(2, o.n || 2); return v >= fair * .6 && v <= fair * 1.5 ? 'ok' : (v >= fair * .35 && v <= fair * 2 ? 'warn' : 'bad'); }
    case 'ppm': return v >= 120 && v <= 170 ? 'ok' : v >= 100 && v <= 190 ? 'warn' : 'bad';
    case 'bordoes_100': return v < 2 ? 'ok' : v < 4 ? 'warn' : 'bad';
    case 'hesitacoes_100': return v < 1.5 ? 'ok' : v < 3 ? 'warn' : 'bad';
    case 'perguntas': return v >= 3 ? 'ok' : v >= 1 ? 'warn' : 'bad';
    case 'maior_s': return v < 90 ? 'ok' : v < 180 ? 'warn' : 'bad';
    case 'interrompeu': return v <= 1 ? 'ok' : v <= 3 ? 'warn' : 'bad';
  }
  return 'ok';
}
const STATUS_LABEL = { ok: 'Bom', warn: 'Atenção', bad: 'A melhorar' };
const topTerms = (obj, n = 3) => LF.format(Object.entries(obj || {}).slice(0, n).map(([w, c]) => `“${w}” ${c}×`));

/* ════════════════ Pedido para o Kilo Code ════════════════ */
/* Listas de uma reunião (formato 2). Cada item guarda a evidência: "citacao" (frase da transcrição) e "minuto".
   "confirmar" diz porque é que o item precisa de ser confirmado (vazio quando está claro). */
const ITEM_KINDS = [
  ['decisoes', 'Decisão', 'Decisões'],
  ['tarefas', 'Tarefa', 'Tarefas'],
  ['pedidos', 'Pedido a alguém', 'Pedidos a outras pessoas'],
  ['propostas', 'Proposta', 'Propostas'],
  ['perguntas', 'Pergunta em aberto', 'Perguntas em aberto'],
  ['bloqueios', 'Bloqueio', 'Bloqueios'],
  ['retomar', 'Para retomar', 'Para retomar'],
];
const KIND_LABEL = Object.fromEntries(ITEM_KINDS.map(([k, one]) => [k, one]));
const isTaskKind = k => k === 'tarefas' || k === 'pedidos';
const itemText = it => it.acao || it.texto || '';
const coachingOn = () => !!STATE.coaching;

function buildPrompt(w, respostaPara) {
  const d = w.data, me = d?.oradores.find(o => o.eu);
  const coach = coachingOn();
  const n = d?.oradores.length || 0, fair = n ? 100 / Math.max(2, n) : 0;
  const metricas = d && coach ? d.oradores.filter(o => o.eu).map(o => `- ${o.nome} (DONO DO CADERNO): ${pctf(o.pct)} do tempo de fala (partilha justa ${pctf(fair)}), ${o.intervencoes} intervenções, ${w.aproximado ? '' : o.ppm + ' palavras/min, '}${o.perguntas} perguntas, maior intervenção ${fmtDur(o.maior_s)}, bordões ${nf(o.bordoes_100, 1)}/100 palavras (${topTerms(o.bordoes) || 'nenhum'}), hesitações ${nf(o.hesitacoes_100, 1)}/100 (${topTerms(o.hesitacoes, 2) || 'nenhuma'})`).join('\n') : '';
  const decOf = x => x.c.v === 2 ? (x.c.decisoes || []).map(i => i.texto) : (x.c.seccoes || []).filter(s => s.tipo === 'decisoes').flatMap(s => s.itens);
  const ctx = w.related.length ? w.related.map(x => `- ${fmtDate(x.date)}: "${x.title}". ${x.c.objetivo ? x.c.objetivo + ' ' : ''}${x.lead}${decOf(x).slice(0, 3).map(i => ` Decisão: ${i}`).join('')}`).join('\n') : '(nenhuma)';
  const pend = w.pendentes.length ? w.pendentes.map(p => `- ${p.code}: ${p.t.text} (${p.t.kind === 'pedido' ? 'pedido a' : 'responsável'}: ${p.t.owner || '?'}${p.t.due ? ', prazo ' + p.t.due : ''}; da reunião "${p.t.m.title}")`).join('\n') : '(nenhuma)';
  const lines = w.turns.map(t => `[${clock(t.start - (d?.t0 || 0))}] ${t.speaker}: ${t.text}`).join('\n');
  const item = '{"texto": "...", "quem": "quem disse", "minuto": "mm:ss", "citacao": "frase exata", "confirmar": ""}';
  return `És o secretário pessoal de ${OWNER() || 'uma pessoa'} (${TEAM()}, Natixis). O caderno serve para ${OWNER() ? 'esta pessoa' : 'ela'} se lembrar do que foi decidido, do que tem de fazer e do que está à espera de outras pessoas.
Analisa a transcrição de reunião ${w.generic ? 'indicada (ficheiro na pasta entrada)' : 'no fim deste pedido'} e responde APENAS com um objeto JSON válido: sem texto antes ou depois, sem blocos de código, sem comentários. Escreve em português europeu.

${respostaPara ? `ONDE RESPONDER: escreve a resposta (só o objeto JSON) no ficheiro ${respostaPara}. Não alteres nenhum outro ficheiro.\n\n` : ''}${w.generic ? `DATA DA REUNIÃO: a data no início do nome do ficheiro (AAAA-MM-DD). Se o nome não tiver data, não convertas prazos relativos: deixa "prazo": null e marca "confirmar".
DONO DO CADERNO: ${OWNER() || 'não indicado'}${(STATE.aliases || []).length ? ` (nas transcrições costuma aparecer como ${LF.format(STATE.aliases.map(a => `"${a}"`))})` : ''}. Identifica qual dos oradores é esta pessoa e indica o nome exatamente como aparece na transcrição em "eu_na_transcricao" (null se não participou). Quando esta pessoa for responsável, usa "responsavel": "Eu".
` : `DATA DA REUNIÃO: ${w.date}.
DONO DO CADERNO: ${OWNER() || 'não indicado'}${me ? ` (na transcrição aparece como "${me.nome}")` : ''}. Quando esta pessoa for responsável, usa "responsavel": "Eu".
`}
REUNIÕES ANTERIORES COM AS MESMAS PESSOAS (só para o campo "contexto"):
${ctx}

TAREFAS EM ABERTO DE REUNIÕES ANTERIORES:
${pend}

${projectsPromptBlock(w.generic ? null : w.date)}
REGRAS (lê com atenção: o caderno verifica cada citação na transcrição)
- Nunca inventes responsável, prazo, conclusão nem decisão. Se algo não for claro, mantém o item e escreve em "confirmar" o motivo, numa frase curta. Nos outros casos "confirmar" fica "".
- "citacao": a frase da transcrição que sustenta o item, copiada tal e qual (até 25 palavras). "minuto": o mm:ss dessa fala. Todos os itens levam citação.
- "tarefas": só quando alguém ASSUME claramente fazer algo ("eu trato", "fico com isso", "envio até sexta", "consigo preparar"). "responsavel" é quem assumiu ("Eu" para o dono do caderno). Se ninguém assumiu, não é tarefa.
- "pedidos": alguém pediu a outra pessoa que fizesse algo e essa pessoa não o assumiu claramente. "para" é a quem foi pedido; "quem" é quem pediu.
- "decisoes": só o que ficou explicitamente decidido ou acordado ("fica decidido", "avançamos com", "combinado"). Uma sugestão sem acordo é "propostas".
- "propostas": sugestões ou ideias sem decisão.
- "perguntas": perguntas que ficaram sem resposta na reunião.
- "bloqueios": o que impede ou atrasa o trabalho, dito por alguém.
- "retomar": assuntos que alguém disse para voltar a falar ou que ficaram por fechar.
- Prazos: "prazo_dito" são as palavras usadas ("até sexta", "dia vinte de outubro"). "prazo" é a data AAAA-MM-DD só se for inequívoca a partir da data da reunião; senão null e "confirmar". Sem prazo dito, ambos null.
- "tarefas_concluidas": só tarefas da lista acima de que alguém disse explicitamente que JÁ estão feitas ("já enviei", "está feito"), com a citação. Intenções ("vou tratar") não contam.
- Ignora cumprimentos e conversa de circunstância. Corrige pelo contexto os erros de reconhecimento de voz, mas a citação fica como está na transcrição.
- "objetivo": uma frase, para que foi a reunião. "resumo": 2 a 3 frases factuais. "contexto": 1 a 2 frases que ligam a reuniões anteriores (vazio se não houver ligação).
- "temas": os assuntos, por ordem, com "inicio" e "fim" (mm:ss) e um resumo de 1 frase.
- Frases curtas e diretas. Sem emojis.${coach ? `
- "radar" (coaching só para o dono do caderno; não avalies as outras pessoas): o que correu bem, o que melhorar (cita a frase e dá a alternativa) e uma ação para a próxima reunião.${metricas ? `\nMÉTRICAS DO DONO DO CADERNO (calculadas pelo caderno; não as recalcules):\n${metricas}` : ''}` : ''}

FORMATO DA RESPOSTA (JSON):
{
${w.generic ? '  "eu_na_transcricao": "nome do dono do caderno tal como aparece na transcrição, ou null",\n' : ''}  "titulo": "título curto e específico",
  "etiquetas": ["3 a 8 palavras-chave: projetos, clientes, temas"],
  "objetivo": "...",
  "resumo": "...",
  "contexto": "...",
  "temas": [{"titulo": "...", "inicio": "mm:ss", "fim": "mm:ss", "resumo": "..."}],
  "decisoes": [${item}],
  "tarefas": [{"acao": "verbo no infinitivo...", "responsavel": "quem assumiu", "prazo": "AAAA-MM-DD ou null", "prazo_dito": "palavras ditas ou null", "minuto": "mm:ss", "citacao": "frase exata", "confirmar": ""}],
  "pedidos": [{"acao": "...", "para": "a quem foi pedido", "quem": "quem pediu", "prazo": null, "prazo_dito": null, "minuto": "mm:ss", "citacao": "frase exata", "confirmar": ""}],
  "propostas": [${item}],
  "perguntas": [${item}],
  "bloqueios": [${item}],
  "retomar": [${item}],
  "tarefas_concluidas": [{"codigo": "T1", "minuto": "mm:ss", "citacao": "frase exata"}]${coach ? ',\n  "radar": {"correu_bem": ["..."], "a_melhorar": ["..."], "experimenta": "..."}' : ''}${projects().length ? ',\n  ' + PMO_SCHEMA : ''}
}

${w.generic ? 'TRANSCRIÇÃO: lê o ficheiro da transcrição inteiro (.vtt, .docx ou .txt na pasta entrada). Cada fala tem o nome de quem fala e os tempos.' : `TRANSCRIÇÃO (${w.turns.length} intervenções${d ? ', ' + fmtDur(d.duracao_s) : ''}):\n${lines}`}`;
}
function extractJSON(text) {
  let t = String(text || '').trim().replace(/^﻿/, '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0) throw new Error('Não encontrei a resposta do Kilo Code. Copia a resposta inteira, do primeiro { ao último }.');
  if (b <= a) throw new Error('A resposta está incompleta ou cortada. No Kilo Code escreve: "Repete só o JSON, completo." e cola a nova resposta.');
  t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch (e) {
    const fixed = t.replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch (e2) { throw new Error('A resposta está incompleta ou cortada. No Kilo Code escreve: "Repete só o JSON, completo." e cola a nova resposta.'); }
  }
}
function normalizeAI(o) {
  const str = v => typeof v === 'string' ? v.trim() : (v == null ? '' : String(v));
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const date = v => isISO(str(v)) ? str(v) : null;
  const nul = v => { const x = str(v); return x && !/^(null|n\/a|-|\?|\(?a confirmar\)?|desconhecido|ninguém|ninguem)$/i.test(x) ? x : ''; };
  const base = x => ({ minuto: str(x?.minuto), citacao: str(x?.citacao).replace(/^["“'«]|["”'»]$/g, ''), confirmar: nul(x?.confirmar) });
  const plain = v => arr(v).map(x => typeof x === 'string' ? { texto: str(x), quem: '', minuto: '', citacao: '', confirmar: '' } : { texto: str(x?.texto || x?.titulo || x?.item), quem: nul(x?.quem), ...base(x) }).filter(x => x.texto);
  const c = {
    v: 2, eu_na_transcricao: o.eu_na_transcricao == null ? null : str(o.eu_na_transcricao),
    titulo: str(o.titulo), etiquetas: arr(o.etiquetas).map(str).filter(Boolean).slice(0, 10),
    objetivo: str(o.objetivo), resumo: str(o.resumo), contexto: str(o.contexto),
    temas: arr(o.temas).map(t => ({ titulo: str(t?.titulo), inicio: str(t?.inicio), fim: str(t?.fim), resumo: str(t?.resumo) })).filter(t => t.titulo),
    decisoes: plain(o.decisoes), propostas: plain(o.propostas), perguntas: plain(o.perguntas), bloqueios: plain(o.bloqueios), retomar: plain(o.retomar),
    tarefas: arr(o.tarefas).map(t => ({ acao: str(t?.acao || t?.tarefa || t?.texto), responsavel: nul(t?.responsavel), prazo: date(t?.prazo), prazo_dito: nul(t?.prazo_dito), ...base(t), feito: false })).filter(t => t.acao),
    pedidos: arr(o.pedidos).map(t => ({ acao: str(t?.acao || t?.texto), para: nul(t?.para), quem: nul(t?.quem), prazo: date(t?.prazo), prazo_dito: nul(t?.prazo_dito), ...base(t), feito: false })).filter(t => t.acao),
    tarefas_concluidas: arr(o.tarefas_concluidas).map(x => typeof x === 'string' ? { codigo: str(x), minuto: '', citacao: '' } : { codigo: str(x?.codigo), ...base(x) }).filter(x => x.codigo),
    pmo: normalizePMO(o.pmo),
    radar: { correu_bem: arr(o.radar?.correu_bem).map(str).filter(Boolean), a_melhorar: arr(o.radar?.a_melhorar).map(str).filter(Boolean), experimenta: str(o.radar?.experimenta) },
  };
  // Resposta no formato antigo (secções): as decisões passam para a lista, o resto fica como notas
  const secs = arr(o.seccoes).filter(s => s && typeof s === 'object');
  if (secs.length) {
    secs.filter(s => s.tipo === 'decisoes').forEach(s => arr(s.itens).forEach(i => { const t = str(typeof i === 'string' ? i : i?.texto); if (t) c.decisoes.push({ texto: t, quem: '', minuto: '', citacao: '', confirmar: '' }); }));
    c.notas_ia = secs.filter(s => s.tipo !== 'decisoes').map(s => ({ titulo: str(s.titulo) || 'Notas', texto: s.texto ? str(s.texto) : arr(s.itens).map(i => typeof i === 'string' ? i : [i?.quem, i?.texto].filter(Boolean).join(': ')).map(str).filter(Boolean).join('\n') })).filter(s => s.texto);
  }
  const total = ITEM_KINDS.reduce((n, [k]) => n + c[k].length, 0);
  if (!c.resumo && !c.objetivo && !total) throw new Error('A resposta não tem resumo nem itens. Confirma que copiaste a resposta do Kilo Code a este pedido.');
  return c;
}

/* ── Evidência: cada citação tem de existir na transcrição ── */
const qkey = s => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
function findQuote(q, turns, t0, hint) {
  const k = qkey(q), toks = k.split(' ').filter(Boolean);
  if (toks.length < 3) return null;
  let best = null;
  turns.forEach((t, i) => {
    const txt = qkey(t.text + ' ' + (turns[i + 1]?.text || ''));
    let score = txt.includes(k) ? 1 : 0;
    if (!score) { const set = new Set(txt.split(' ')); score = toks.filter(w => set.has(w)).length / toks.length; }
    if (score < 0.8) return;
    const sec = t.start - t0, dist = hint == null ? 0 : Math.abs(sec - hint);
    if (!best || score > best.score || (score === best.score && dist < best.dist)) best = { i, score, dist, sec };
  });
  return best && { seg: Math.round(best.sec), quem: turns[best.i].speaker };
}
const addFlag = (it, msg) => { const key = msg.replace(/[.:].*$/, ''); if (!String(it.confirmar || '').includes(key)) it.confirmar = it.confirmar ? `${it.confirmar} ${msg}` : msg; };
/* Verifica a evidência de todos os itens; corrige o minuto pela fala encontrada e marca o que tem de ser confirmado */
function checkEvidence(c, turns) {
  const t0 = turns[0]?.start || 0;
  const all = [...ITEM_KINDS.flatMap(([k]) => (c[k] || []).map(it => [k, it])), ...(c.tarefas_concluidas || []).map(it => ['concluidas', it])];
  for (const [k, it] of all) {
    if (!turns.length) { it.ev = 'sem'; continue; }
    if (!it.citacao) { it.ev = 'sem'; addFlag(it, 'Sem citação da transcrição.'); continue; }
    const f = findQuote(it.citacao, turns, t0, parseClock(it.minuto));
    if (f) { it.ev = 'ok'; it.minuto = clock(f.seg); it.dito_por = f.quem; }
    else { it.ev = 'nao'; addFlag(it, 'A citação não aparece na transcrição.'); }
    if (k === 'tarefas' && !it.responsavel) addFlag(it, 'Ninguém assumiu claramente.');
    if (k === 'pedidos' && !it.para) addFlag(it, 'Não é claro a quem foi pedido.');
    if (isTaskKind(k) && it.prazo && !it.prazo_dito) addFlag(it, 'Prazo sem as palavras ditas.');
  }
  return c;
}

/* ════════════════ Projetos (PMO crítico) ════════════════
   Um projeto é declarado pela pessoa (nome, descrição, palavras-chave, pessoas). Cada reunião pode
   pertencer a um projeto (rec.projeto). O Kilo Code extrai, por reunião, um bloco "pmo" que ATUALIZA
   itens com código estável (M marcos, B backlog, R riscos, D decisões pendentes). O caderno junta tudo
   numa linha do tempo e calcula métricas e alertas. */
const PMO_KINDS = [['marcos', 'M', 'nome'], ['backlog', 'B', 'titulo'], ['riscos', 'R', 'titulo'], ['decisoes_pendentes', 'D', 'titulo']];
const DELIVERED = ['entregue', 'validado'];
// Estado de um item na primeira vez que aparece, se a reunião não o disser
const PMO_FIRST = { marcos: { concluido: false }, backlog: { estado: 'novo' }, riscos: { estado: 'aberto' }, decisoes_pendentes: { estado: 'pendente' } };
const projects = () => STATE.projetos || [];
let DEMO = null; // projeto de exemplo (só para ver como fica)
const projectById = id => id === 'exemplo' ? DEMO?.p : projects().find(p => p.id === id);
const meetingsOf = (p, list) => (list || (p.id === 'exemplo' ? DEMO.meetings : meetings)).filter(m => m.rec.projeto === p.id).slice().sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.rec.criado_em || '').localeCompare(b.rec.criado_em || ''));
const tokensOf = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 2);
const similar = (a, b) => { const x = new Set(tokensOf(a)), y = tokensOf(b); if (!x.size || !y.length) return false; const inter = y.filter(w => x.has(w)).length; return inter / Math.max(x.size, y.length) >= 0.6; };

function normalizePMO(o) {
  if (!o || typeof o !== 'object') return null;
  const str = v => typeof v === 'string' ? v.trim() : (v == null ? '' : String(v));
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const pick = v => (list) => { const n = norm(str(v)).replace(/\s+/g, '-'); return n ? list.find(x => n === x || n.startsWith(x)) || null : null; }; // null = não foi dito
  const code = v => { const s = str(v).toUpperCase(); return /^[MBRD]\d+$/.test(s) ? s : null; };
  const date = v => isISO(str(v)) ? str(v) : null;
  const RAG = { verde: 'verde', green: 'verde', amarelo: 'amarelo', amber: 'amarelo', yellow: 'amarelo', laranja: 'amarelo', vermelho: 'vermelho', red: 'vermelho' };
  const num = (v, lo, hi) => v === null || v === '' || v === undefined || !isFinite(+v) ? null : Math.max(lo, Math.min(hi, +v));
  const out = {
    projeto: str(o.projeto) || null,
    estado: o.estado && typeof o.estado === 'object' && o.estado.explicito && RAG[norm(str(o.estado.rag))] ? { rag: RAG[norm(str(o.estado.rag))], razao: str(o.estado.razao), explicito: true, citacao: str(o.estado.citacao) } : null, // só o estado dito por alguém
    marcos: arr(o.marcos).map(x => ({ codigo: code(x?.codigo), nome: str(x?.nome), data_prevista: date(x?.data_prevista), concluido: typeof x?.concluido === 'boolean' ? x.concluido : null, nota: str(x?.nota), citacao: str(x?.citacao) })).filter(x => x.nome || x.codigo),
    backlog: arr(o.backlog).map(x => ({ codigo: code(x?.codigo), titulo: str(x?.titulo), tipo: pick(x?.tipo)(['pedido', 'melhoria', 'bug', 'dor']), versao: (str(x?.versao).toUpperCase().match(/V\d+/) || [null])[0], prioridade: pick(x?.prioridade)(['must-have', 'sonho', 'normal']), estado: pick(x?.estado)(['novo', 'analise', 'desenvolvimento', 'entregue', 'validado', 'recusado']), nota: str(x?.nota), citacao: str(x?.citacao) })).filter(x => x.titulo || x.codigo),
    riscos: arr(o.riscos).map(x => ({ codigo: code(x?.codigo), titulo: str(x?.titulo), gravidade: pick(x?.gravidade)(['alta', 'media', 'baixa']), estado: pick(x?.estado)(['aberto', 'mitigado', 'fechado', 'materializado']), responsavel: str(x?.responsavel), mitigacao: str(x?.mitigacao), citacao: str(x?.citacao) })).filter(x => x.titulo || x.codigo),
    decisoes_pendentes: arr(o.decisoes_pendentes).map(x => ({ codigo: code(x?.codigo), titulo: str(x?.titulo), estado: pick(x?.estado)(['pendente', 'decidida']), decisao: str(x?.decisao), citacao: str(x?.citacao) })).filter(x => x.titulo || x.codigo),
    satisfacao: o.satisfacao && typeof o.satisfacao === 'object' && num(o.satisfacao.nota, -2, 2) !== null && str(o.satisfacao.evidencia) ? { nota: num(o.satisfacao.nota, -2, 2), evidencia: str(o.satisfacao.evidencia) } : null,
    adocao: o.adocao && typeof o.adocao === 'object' ? { percentagem: str(o.adocao.citacao) ? num(o.adocao.percentagem, 0, 100) : null, ainda_manual: arr(o.adocao.ainda_manual).map(str).filter(Boolean), citacao: str(o.adocao.citacao) } : null,
    perguntas_pmo: arr(o.perguntas_pmo).map(str).filter(Boolean).slice(0, 6),
  };
  return out;
}

/* Linha do tempo: aplica os blocos pmo das reuniões, por ordem de data */
function projectTimeline(p, list) {
  const ms = meetingsOf(p, list);
  const maps = Object.fromEntries(PMO_KINDS.map(([k]) => [k, new Map()]));
  const snaps = [];
  for (const m of ms) {
    const pmo = m.c.pmo;
    if (pmo) for (const [kind, , label] of PMO_KINDS) for (const it of pmo[kind] || []) {
      if (!it.codigo) continue;
      const map = maps[kind], prev = map.get(it.codigo);
      const e = prev || { codigo: it.codigo, hist: [], first: m.date, firstId: m.id, mentions: 0, ...PMO_FIRST[kind] };
      for (const [k, v] of Object.entries(it)) if (k !== 'codigo' && v !== '' && v !== null && v !== undefined) e[k] = v; // o que não foi dito não muda
      if (!e[label]) e[label] = it[label] || e[label] || it.codigo;
      e.mentions++; e.last = m.date; e.lastId = m.id;
      e.hist.push({ date: m.date, id: m.id, ...Object.fromEntries(Object.entries(e).filter(([k]) => !['hist', 'mentions', 'first', 'firstId', 'last', 'lastId'].includes(k))) });
      map.set(it.codigo, e);
    }
    const back = [...maps.backlog.values()];
    snaps.push({
      m, pmo, date: m.date,
      rag: pmo?.estado?.explicito ? pmo.estado.rag : null,
      pedidos: back.length, entregues: back.filter(b => DELIVERED.includes(b.estado)).length,
      novos: (pmo?.backlog || []).filter(b => b.codigo && maps.backlog.get(b.codigo)?.firstId === m.id).length,
      riscos: ['alta', 'media', 'baixa'].map(g => [...maps.riscos.values()].filter(r => r.gravidade === g && ['aberto', 'materializado'].includes(r.estado)).length),
      decisoes: [...maps.decisoes_pendentes.values()].filter(d => d.estado === 'pendente').length,
      satisfacao: pmo?.satisfacao?.nota ?? null, adocao: pmo?.adocao?.percentagem ?? null,
      marcos: Object.fromEntries([...maps.marcos.values()].map(x => [x.codigo, x.data_prevista])),
    });
  }
  return { ms, maps, snaps };
}
/* Dá código aos itens novos (ou reconhece-os pelo título, se o Kilo Code não reutilizou o código) */
function assignCodes(p, pmo, list, excludeId) {
  if (!pmo) return;
  const tl = projectTimeline(p, (list || meetings).filter(m => m.id !== excludeId));
  for (const [kind, prefix, label] of PMO_KINDS) {
    const map = tl.maps[kind];
    let next = Math.max(0, ...[...map.keys()].map(c => +c.slice(1) || 0)) + 1;
    const used = new Set(map.keys());
    for (const it of pmo[kind] || []) {
      if (it.codigo && !it.codigo.startsWith(prefix)) it.codigo = null;
      if (it.codigo && (used.has(it.codigo) || !map.size)) { used.add(it.codigo); continue; }
      const match = [...map.values()].find(e => similar(e[label] || '', it[label] || ''));
      if (match) it.codigo = match.codigo;
      else if (!it.codigo || used.has(it.codigo)) { while (used.has(prefix + next)) next++; it.codigo = prefix + next++; }
      used.add(it.codigo);
    }
  }
}
function matchProject(name) { if (!name) return null; return projects().find(p => norm(p.nome) === norm(name)) || projects().find(p => similar(p.nome, name)) || null; }

/* Métricas e alertas de um projeto */
function projectMetrics(p, list) {
  const tl = projectTimeline(p, list), { ms, maps, snaps } = tl;
  const last = snaps.length ? snaps[snaps.length - 1] : null;
  const lastWith = key => [...snaps].reverse().find(s => s[key] != null);
  const rag = lastWith('rag'), ragPmo = rag?.pmo?.estado;
  const ragDito = ragPmo?.explicito ? ragPmo : null; // só o estado dito por alguém entra nos alertas
  const marcos = [...maps.marcos.values()].map(x => {
    const dates = x.hist.map(h => h.data_prevista).filter(Boolean);
    const first = dates[0] || null, lastD = dates[dates.length - 1] || null;
    let replans = 0; for (let i = 1; i < dates.length; i++) if (dates[i] !== dates[i - 1]) replans++;
    const slip = first && lastD ? Math.round((toDate(lastD) - toDate(first)) / 864e5) : 0;
    const recentSlip = x.hist.length >= 2 && x.hist[x.hist.length - 1].data_prevista && x.hist[x.hist.length - 2].data_prevista && x.hist[x.hist.length - 1].data_prevista > x.hist[x.hist.length - 2].data_prevista;
    return { ...x, primeira: first, atual: lastD, replans, slip, recentSlip, atrasado: !x.concluido && lastD && lastD < TODAY };
  }).sort((a, b) => (a.atual || '9999').localeCompare(b.atual || '9999'));
  const back = [...maps.backlog.values()];
  const open = back.filter(b => !DELIVERED.includes(b.estado) && b.estado !== 'recusado');
  const vNum = v => +(String(v || '').match(/\d+/) || [0])[0];
  const pushed = back.filter(b => { const vs = b.hist.map(h => vNum(h.versao)).filter(Boolean); return vs.length > 1 && vs[vs.length - 1] > vs[0]; });
  const reopened = back.filter(b => { let was = false; for (const h of b.hist) { if (DELIVERED.includes(h.estado)) was = true; else if (was && h.estado !== 'recusado') return true; } return false; });
  const chronic = open.filter(b => b.mentions >= 3);
  const riscos = [...maps.riscos.values()], riscosAbertos = riscos.filter(r => ['aberto', 'materializado'].includes(r.estado));
  const decisoes = [...maps.decisoes_pendentes.values()].filter(d => d.estado === 'pendente').map(d => ({ ...d, idade: ms.filter(m => (m.date || '') >= (d.first || '')).length }));
  const todos = ms.flatMap(m => m.todos);
  // Cumpridas no prazo: só conta o que tem prazo e data de conclusão registada
  const comData = todos.filter(t => t.due && isDone(t) && t.t.concluida_em);
  const sayDo = comData.length ? Math.round(100 * comData.filter(t => t.t.concluida_em <= t.due).length / comData.length) : null;
  const semData = todos.filter(t => t.due && isDone(t) && !t.t.concluida_em).length;
  const overdue = todos.filter(t => !isDone(t) && t.due && t.due < TODAY);
  const idx = new Map(ms.map((m, i) => [m.id, i]));
  const zombies = todos.filter(t => !isDone(t) && (ms.length - 1 - (idx.get(t.m.id) ?? ms.length)) >= 3);
  const durTotal = ms.reduce((s, m) => s + (m.dur || 0), 0);
  const gaps = ms.slice(1).map((m, i) => (toDate(m.date) - toDate(ms[i].date)) / 864e5).filter(x => x >= 0);
  const cadence = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const delivered = back.filter(b => DELIVERED.includes(b.estado)).length;
  const sat = snaps.filter(s => s.satisfacao != null), ado = snaps.filter(s => s.adocao != null);
  const satTrend = sat.length >= 2 ? sat[sat.length - 1].satisfacao - sat[Math.max(0, sat.length - 3)].satisfacao : 0;
  // Alertas
  const alerts = [];
  const slipping = marcos.filter(x => x.recentSlip && !x.concluido);
  if (ragDito?.rag === 'verde' && (slipping.length || overdue.length >= 2 || riscosAbertos.some(r => r.gravidade === 'alta')))
    alerts.push({ s: 'bad', t: 'Verde por fora, vermelho por dentro', d: `O estado reportado é verde, mas ${LF.format([slipping.length ? plural(slipping.length, 'marco escorregou', 'marcos escorregaram') + ' na última reunião' : '', overdue.length >= 2 ? plural(overdue.length, 'ação está em atraso', 'ações estão em atraso') : '', riscosAbertos.some(r => r.gravidade === 'alta') ? 'há riscos altos em aberto' : ''].filter(Boolean))}.` });
  const greenSlips = snaps.filter(sn => sn.rag === 'verde' && sn.pmo?.estado?.explicito && sn.pmo.marcos.some(mk => { const e = maps.marcos.get(mk.codigo); if (!e || !mk.data_prevista) return false; const i = e.hist.findIndex(h => h.id === sn.m.id); return i > 0 && e.hist[i - 1].data_prevista && mk.data_prevista > e.hist[i - 1].data_prevista; }));
  if (greenSlips.length && !(ragDito?.rag === 'verde' && slipping.length)) alerts.push({ s: 'warn', t: 'Verde enquanto escorregava', d: `Em ${plural(greenSlips.length, 'reunião', 'reuniões')} (${LF.format(greenSlips.map(sn => fmtDate(sn.date, 'short')))}) alguém disse que o estado era verde no mesmo dia em que um marco mudou de data.` });
  marcos.filter(x => !x.concluido && x.replans >= 2).forEach(x => alerts.push({ s: 'bad', t: `“${x.nome}” já mudou de data ${x.replans} vezes`, d: `Deriva acumulada de ${plural(x.slip, 'dia', 'dias')}: de ${fmtDate(x.primeira, 'short')} para ${fmtDate(x.atual, 'short')}.` }));
  marcos.filter(x => x.atrasado).forEach(x => alerts.push({ s: 'bad', t: `“${x.nome}” passou a data prevista`, d: `Previsto para ${fmtDate(x.atual, 'short')} e ainda não concluído.` }));
  if (chronic.length) alerts.push({ s: 'warn', t: plural(chronic.length, 'dor crónica', 'dores crónicas'), d: `Itens falados em 3 ou mais reuniões sem serem resolvidos: ${LF.format(chronic.slice(0, 3).map(b => `“${b.titulo}”`))}.` });
  if (reopened.length) alerts.push({ s: 'warn', t: plural(reopened.length, 'item reaberto', 'itens reabertos'), d: `Dados como entregues e depois voltaram a ser problema: ${LF.format(reopened.slice(0, 3).map(b => `“${b.titulo}”`))}.` });
  decisoes.filter(d => d.idade >= 3).forEach(d => alerts.push({ s: 'warn', t: 'Decisão arrastada', d: `“${d.titulo}” está por decidir há ${plural(d.idade, 'reunião', 'reuniões')}.` }));
  const repeated = []; todos.forEach(t => { const g = repeated.find(x => similar(x.text, t.text)); if (g) g.n++; else repeated.push({ text: t.text, n: 1, open: !isDone(t) }); });
  repeated.filter(r => r.n >= 3).forEach(r => alerts.push({ s: 'warn', t: `Ação pedida ${r.n} vezes`, d: `“${r.text}” foi combinada em ${r.n} reuniões diferentes. Ou falta dono, ou falta prazo, ou falta vontade.` }));
  if (zombies.length) alerts.push({ s: 'warn', t: plural(zombies.length, 'ação zombie', 'ações zombie'), d: 'Abertas há 3 ou mais reuniões sem fecho.' });
  const inferidos = [];
  if (sat.length >= 2 && satTrend < 0) inferidos.push({ t: 'Satisfação a descer', d: `De ${sat[Math.max(0, sat.length - 3)].satisfacao} para ${sat[sat.length - 1].satisfacao} (escala de −2 a +2), segundo frases ditas nas reuniões.` });
  if (pushed.length >= 2) alerts.push({ s: 'warn', t: 'Âmbito a fugir para a frente', d: `${plural(pushed.length, 'item foi empurrado', 'itens foram empurrados')} para uma versão posterior.` });
  const growth = snaps.length >= 3 ? snaps.slice(-3).reduce((s, x) => s + x.novos, 0) : 0, deliveredRecent = snaps.length >= 4 ? snaps[snaps.length - 1].entregues - snaps[snaps.length - 4].entregues : null;
  if (deliveredRecent !== null && growth > deliveredRecent + 1) alerts.push({ s: 'warn', t: 'O backlog cresce mais depressa do que se entrega', d: `${plural(growth, 'pedido novo', 'pedidos novos')} e ${plural(deliveredRecent, 'entrega', 'entregas')} nas últimas 3 reuniões.` });
  // Saúde: só a partir de factos ditos (datas de marcos, prazos, decisões); os indicadores inferidos ficam de fora
  const health = !ms.length ? null : alerts.some(a => a.s === 'bad') ? 'bad' : alerts.length ? 'warn' : 'ok';
  const perguntas = [...(last?.pmo?.perguntas_pmo || [])];
  return { tl, ms, snaps, last, rag: ragDito, marcos, back, open, pushed, reopened, chronic, riscos, riscosAbertos, decisoes, todos, sayDo, semData, overdue, zombies, durTotal, cadence, delivered, sat, ado, alerts, inferidos, health, perguntas, temPmo: snaps.some(s => s.pmo) };
}

/* Sugestões de projetos: pessoas ou temas recorrentes fora de projetos */
function projectSuggestions() {
  const free = meetings.filter(m => !m.exemplo && !m.rec.projeto);
  const people = new Map(), tags = new Map();
  free.forEach(m => { m.people.filter(p => !isMe(p)).forEach(p => { const k = [...people.keys()].find(x => samePerson(x, p)) || p; people.set(k, (people.get(k) || 0) + 1); }); m.tags.forEach(t => tags.set(norm(t), [(tags.get(norm(t))?.[0] || t), (tags.get(norm(t))?.[1] || 0) + 1])); });
  const taken = projects().flatMap(p => [...(p.pessoas || []), ...(p.palavras || []), p.nome]);
  const out = [];
  [...tags.values()].filter(([t, n]) => n >= 3 && !taken.some(x => similar(x, t))).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([t, n]) => out.push({ nome: cap(t), palavras: [t], pessoas: [], n, motivo: `${plural(n, 'reunião', 'reuniões')} com o tema “${t}”` }));
  [...people.entries()].filter(([p, n]) => n >= 3 && !taken.some(x => samePerson(x, p))).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([p, n]) => out.push({ nome: `Reuniões com ${displayName(p)}`, palavras: [], pessoas: [p], n, motivo: `${plural(n, 'reunião', 'reuniões')} com ${displayName(p)}` }));
  return out.slice(0, 3);
}
function candidateMeetings(p) {
  return meetings.filter(m => !m.exemplo).map(m => {
    let score = 0;
    if ((p.palavras || []).some(k => k && m.search.includes(norm(k)))) score += 2;
    if (norm(m.title).includes(norm(p.nome))) score += 2;
    if ((p.pessoas || []).some(x => m.people.some(y => samePerson(x, y)))) score += 1;
    return { m, score };
  }).filter(o => o.score > 0 || o.m.rec.projeto === p.id).sort((a, b) => (b.m.date || '').localeCompare(a.m.date || ''));
}

/* Bloco do pedido com os projetos acompanhados e o estado atual de cada um */
function projectsPromptBlock(maxDate) {
  const ps = projects(); if (!ps.length) return '';
  const lines = ps.map(p => {
    const tl = projectTimeline(p, meetings.filter(m => !maxDate || (m.date || '') <= maxDate));
    const it = (kind, f) => [...tl.maps[kind].values()].filter(f).slice(0, 25);
    const marcos = it('marcos', x => !x.concluido).map(x => `${x.codigo} ${x.nome}${x.data_prevista ? ` (previsto ${x.data_prevista})` : ''}`);
    const back = it('backlog', b => !DELIVERED.includes(b.estado) && b.estado !== 'recusado').map(b => `${b.codigo} ${b.titulo} [${[b.tipo, b.versao, b.prioridade, b.estado].filter(Boolean).join(', ')}]`);
    const ent = it('backlog', b => DELIVERED.includes(b.estado)).slice(-10).map(b => `${b.codigo} ${b.titulo}`);
    const ris = it('riscos', r => ['aberto', 'materializado'].includes(r.estado)).map(r => `${r.codigo} ${r.titulo} [${r.gravidade}]`);
    const dec = it('decisoes_pendentes', d => d.estado === 'pendente').map(d => `${d.codigo} ${d.titulo}`);
    return `- "${p.nome}": ${p.descricao || 'sem descrição'}${p.palavras?.length ? ` Palavras-chave: ${p.palavras.join(', ')}.` : ''}${p.pessoas?.length ? ` Pessoas: ${p.pessoas.join(', ')}.` : ''}
  Marcos em aberto: ${marcos.join('; ') || '(nenhum)'}
  Backlog em aberto: ${back.join('; ') || '(nenhum)'}
  Já entregue: ${ent.join('; ') || '(nada)'}
  Riscos abertos: ${ris.join('; ') || '(nenhum)'}
  Decisões pendentes: ${dec.join('; ') || '(nenhuma)'}`;
  }).join('\n');
  return `
PROJETOS EM ACOMPANHAMENTO (o dono do caderno acompanha-os como PMO):
${lines}
Se esta reunião for sobre um destes projetos, preenche "pmo" (senão "pmo": null).
REGRAS PMO: só factos ditos nesta reunião, cada um com "citacao". Reutiliza SEMPRE os códigos acima quando falares de um item que já existe; itens novos levam "codigo": null. Inclui só os itens falados nesta reunião e, em cada um, só os campos que foram ditos (os outros ficam null: um campo não dito não muda o estado). Um marco com nova data dita leva a nova "data_prevista". "estado" (verde/amarelo/vermelho) só se alguém o disse, com "explicito": true e a citação; senão "estado": null. "satisfacao" e "adocao" só se alguém as disse explicitamente, com citação; senão null. Em "perguntas_pmo" escreve 2 a 4 perguntas úteis para a próxima reunião.
`;
}
const PMO_SCHEMA = `"pmo": {
    "projeto": "nome exato do projeto, ou null",
    "estado": {"rag": "verde | amarelo | vermelho", "razao": "porquê, numa frase", "explicito": true, "citacao": "frase exata"},
    "marcos": [{"codigo": "M1 ou null", "nome": "...", "data_prevista": "AAAA-MM-DD", "concluido": false, "nota": "..."}],
    "backlog": [{"codigo": "B1 ou null", "titulo": "...", "tipo": "pedido | melhoria | bug | dor", "versao": "V1 | V2 | V3", "prioridade": "must-have | sonho | normal", "estado": "novo | analise | desenvolvimento | entregue | validado | recusado", "nota": "..."}],
    "riscos": [{"codigo": "R1 ou null", "titulo": "...", "gravidade": "alta | media | baixa", "estado": "aberto | mitigado | fechado | materializado", "responsavel": "...", "mitigacao": "..."}],
    "decisoes_pendentes": [{"codigo": "D1 ou null", "titulo": "...", "estado": "pendente | decidida", "decisao": "o que se decidiu, se decidida"}],
    "satisfacao": {"nota": 0, "evidencia": "citação"} ou null,
    "adocao": {"percentagem": 50, "citacao": "frase exata", "ainda_manual": ["o que ainda se faz à mão"]} ou null,
    "perguntas_pmo": ["..."]
  }`;

/* Reconstruir o histórico de um projeto a partir das atas já guardadas */
function buildHistoryPrompt(p, respostaPara) {
  const ms = meetingsOf(p);
  const blocks = ms.map(m => {
    const c = m.c;
    const secs = (c.seccoes || []).map(s => `${s.titulo}: ${s.tipo === 'texto' ? s.texto : s.tipo === 'tabela' ? s.linhas.map(r => r.join(' / ')).join('; ') : (s.itens || []).map(i => typeof i === 'string' ? i : `${i.quem ? i.quem + ': ' : ''}${i.texto}`).join('; ')}`).join('\n');
    return `### Reunião id="${m.id}" — ${m.date}, ${m.title}${m.dur ? `, ${fmtDur(m.dur)}` : ''}
Participantes: ${m.people.join(', ')}
Resumo: ${c.resumo || ''}
${c.contexto ? 'Contexto: ' + c.contexto + '\n' : ''}${(c.temas || []).length ? 'Temas: ' + c.temas.map(t => `${t.titulo} (${t.resumo})`).join('; ') + '\n' : ''}${secs}
Tarefas: ${m.todos.map(t => `${t.text} (${t.owner || '?'}${t.due ? ', ' + t.due : ''})`).join('; ') || '(nenhuma)'}${m.rec.ficheiro && dirHandle ? `\nTranscrição original (se precisares de pormenor): entrada/processadas/${m.rec.ficheiro}` : ''}`;
  }).join('\n\n');
  return `És um PMO crítico e experiente da equipa ${TEAM()} (Natixis). Reconstrói a evolução do projeto "${p.nome}" ao longo das reuniões abaixo (ordem cronológica) e responde APENAS com um objeto JSON válido: sem texto antes ou depois, sem blocos de código. Português europeu.
${respostaPara ? `\nONDE RESPONDER: escreve a resposta (só o objeto JSON) no ficheiro ${respostaPara}. Não alteres nenhum outro ficheiro.\n` : ''}
PROJETO: ${p.nome}. ${p.descricao || ''}${p.palavras?.length ? ` Palavras-chave: ${p.palavras.join(', ')}.` : ''}${p.pessoas?.length ? ` Pessoas: ${p.pessoas.join(', ')}.` : ''}
DONO DO CADERNO: ${OWNER() || 'não indicado'}.

O QUE FAZER
- Para cada reunião, o bloco "pmo" com o que mudou NESSA reunião: marcos (e a data prevista nessa altura), itens de backlog (pedidos, melhorias, bugs, dores), riscos, decisões pendentes, satisfação do interlocutor principal, adoção (percentagem do processo já feita com a solução nova, se se souber) e perguntas que um PMO devia ter feito a seguir.
- Dá códigos estáveis e reutiliza-os entre reuniões: M1, M2… para marcos; B1, B2… backlog; R1… riscos; D1… decisões. O mesmo item tem sempre o mesmo código.
- Sê factual: só o que foi dito. O estado verde/amarelo/vermelho, a satisfação e a adoção só se alguém os disse; senão null. Um campo não dito fica null (não muda o estado do item).
- Inclui todas as reuniões, mesmo as que não mudaram nada (nesse caso, listas vazias).

FORMATO
{"projeto": "${p.nome}", "reunioes": [{"id": "id da reunião", ${PMO_SCHEMA.replace('"pmo": ', '"pmo": ')}}]}

REUNIÕES (${ms.length})
${blocks}`;
}
function applyHistory(p, raw) {
  const o = extractJSON(raw);
  const list = Array.isArray(o.reunioes) ? o.reunioes : [];
  if (!list.length) throw new Error('A resposta não tem a lista "reunioes". Pede ao Kilo Code: "Repete só o JSON, completo."');
  let n = 0;
  const ms = meetingsOf(p);
  for (const r of list) {
    const m = ms.find(x => x.id === r.id) || ms.find(x => r.data && x.date === r.data);
    if (!m) continue;
    const pmo = normalizePMO(r.pmo || r); if (!pmo) continue;
    pmo.projeto = p.nome;
    m.rec.conteudo.pmo = pmo; m.c.pmo = pmo; n++;
  }
  // Códigos que faltem, por ordem cronológica
  for (const m of ms) if (m.c.pmo) assignCodes(p, m.c.pmo, meetings.filter(x => (x.date || '') < (m.date || '') || x === m).filter(x => x !== m), m.id);
  return n;
}

/* ════════════════ Interface: estado ════════════════ */
const view = $('#view'), main = $('#main');
let query = '', typeFilter = null, current = null;
const meetingHref = m => '#/r/' + encodeURIComponent(m.id);
const withState = h => { const p = new URLSearchParams(); if (query) p.set('q', query); if (typeFilter) p.set('tipo', typeFilter); const s = p.toString(); return h + (s ? '?' + s : ''); };
function readUrlState() { const q = location.hash.split('?')[1]; if (!q) return; const p = new URLSearchParams(q); query = p.get('q') || ''; typeFilter = p.get('tipo') || null; $('#search').value = query; }
function writeUrlState() { const base = location.hash.split('?')[0] || '#/'; history.replaceState(null, '', withState(base)); }

function renderBrand() { $('#brand-team').textContent = TEAM(); $('#brand-owner').textContent = OWNER() ? `Caderno de ${firstName(OWNER())}` : 'Caderno de reuniões'; }
function renderNav() {
  const open = allTodos.filter(t => !isDone(t)), mine = knowsMe() ? open.filter(mineTodo) : open;
  const late = mine.filter(t => t.due && t.due < TODAY).length;
  const items = [['', 'home', 'Início', ''], ['tarefas', 'tasks', 'Tarefas', mine.length ? `<span class="count ${late ? 'late' : ''}">${nf(mine.length)}<span class="sr-only"> em aberto${late ? `, ${late} em atraso` : ''}</span></span>` : ''], ['projetos', 'folder', 'Projetos', projects().length ? `<span class="count">${nf(projects().length)}</span>` : ''], ['pessoas', 'users', 'Pessoas', ''], ...(coachingOn() ? [['evolucao', 'chart', 'Evolução', '']] : []), ['ajuda', 'help', 'Como usar', ''], ['definicoes', 'gear', 'Definições', '']];
  $('#nav').innerHTML = items.map(([h, ic, l, extra]) => `<a href="#/${h}" data-view="${h}">${icon(ic)}<span>${l}</span>${extra}</a>`).join('');
  markNav();
}
function markNav() {
  const v = current?.view === 'p' ? 'projetos' : (current?.view ?? '');
  $$('#nav a').forEach(a => a.dataset.view === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $$('#list .m-item').forEach(a => a.dataset.id === current?.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
}
const filtered = () => { const w = words(query); return meetings.filter(m => (!typeFilter || m.type === typeFilter) && w.every(x => m.search.includes(x))); };
function snippet(m, w, len = 90) {
  if (!w.length) return '';
  const i = m.ntext.indexOf(w[0]); if (i < 0) return '';
  const s = Math.max(0, i - 30), e = Math.min(m.text.length, i + len);
  return (s ? '…' : '') + markStr(m.text.slice(s, e), termRe(w)) + (e < m.text.length ? '…' : '');
}
function renderList() {
  const w = words(query), re = termRe(w), vis = filtered(), groups = [];
  vis.forEach(m => { const label = isISO(m.date) ? DTF.month.format(toDate(m.date)) : 'Sem data'; const g = groups[groups.length - 1]; g && g[0] === label ? g[1].push(m) : groups.push([label, [m]]); });
  $('#list').innerHTML = vis.length ? groups.map(([label, arr]) => `<div role="group" aria-label="${esc(label)}"><div class="list-label">${esc(label)}</div>${arr.map(m => `
    <a class="m-item" href="${meetingHref(m)}" data-id="${esc(m.id)}">
      <span class="m-title">${markStr(m.title, re)}</span>
      <span class="m-meta"><span>${fmtDate(m.date, 'short')}</span>${m.dur ? `<span>${fmtDur(m.dur)}</span>` : ''}<span class="badge">${esc(m.type)}</span></span>
      ${w.length ? `<span class="m-snip">${snippet(m, w, 70)}</span>` : ''}
    </a>`).join('')}</div>`).join('')
    : `<p class="list-empty">${meetings.length ? 'Nenhuma reunião com esses termos.' : 'Ainda sem reuniões.'}</p>`;
  $('#list-count').textContent = vis.length === meetings.length ? nf(meetings.length) : `${nf(vis.length)} de ${nf(meetings.length)}`;
  const types = [...new Set(meetings.map(m => m.type))].sort();
  $('#chips').innerHTML = types.length > 1 ? types.map(t => `<button type="button" class="chip" aria-pressed="${t === typeFilter}" data-type="${esc(t)}">${esc(t)}</button>`).join('') : '';
  markNav();
}

function renderAll() { renderBrand(); renderNav(); renderList(); renderSaveState(); route(); }

/* ════════════════ Componentes ════════════════ */
function ribbon(m) {
  const d = m.data; if (!d?.timeline?.length) return '';
  const col = colorsOf(m), total = d.duracao_s || 1;
  const rects = d.timeline.map((t, i) => `<span class="seg" data-s="${col[t[2]]}" data-turn="${i}" style="--x:${(t[0] / total).toFixed(4)};--w:${Math.max(0.0035, (t[1] - t[0]) / total).toFixed(4)};--c:var(--sp${col[t[2]]})" title="${esc(displayName(d.oradores[t[2]].nome))}, ${clock(t[0])}, ${fmtDur(t[1] - t[0])}"></span>`).join('');
  const label = `Quem falou, quando: ${LF.format(d.oradores.map(o => `${displayName(o.nome)} ${pctf(o.pct)}`))}`;
  return `<figure class="ribbon" style="margin-inline:0" data-ribbon>
    <figcaption class="sr-only">${esc(label)}</figcaption>
    <div class="ribbon-track" role="img" aria-label="${esc(label)}">${rects}</div>
    <div class="ribbon-axis" aria-hidden="true"><span>0</span><span>${clock(total / 4)}</span><span>${clock(total / 2)}</span><span>${clock(total * 3 / 4)}</span><span>${clock(total)}</span></div>
    <div class="ribbon-keys">${d.oradores.map((o, i) => `<button type="button" class="ribbon-key" data-focus="${col[i]}" aria-pressed="false"><span class="key" style="--c:var(--sp${col[i]})"></span><span translate="no">${esc(nameOf(o.nome))}</span><b>${pctf(o.pct)}</b></button>`).join('')}</div>
    ${m.aproximado ? '<p class="field-help">Tempos aproximados: a transcrição não tinha a hora de fim de cada fala.</p>' : ''}
  </figure>`;
}
function participation(m) {
  const d = m.data; if (!d) return '';
  const col = colorsOf(m);
  return `<section class="r-sec" aria-labelledby="part-h">
    <h2 id="part-h">Participação</h2>
    <p class="sec-sub">Quanto tempo cada pessoa falou. Serve para te situares, não para avaliar ninguém.</p>
    <div class="equity"><span>Duração <b>${fmtDur(d.duracao_s)}</b></span><span>Tempo falado <b>${fmtDur(d.falado_s)}</b></span></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th scope="col">Pessoa</th><th scope="col" class="n">Tempo</th><th scope="col" class="n">Fala</th><th scope="col" class="n">Intervenções</th></tr></thead>
      <tbody>${d.oradores.map((o, i) => `<tr><td><span class="key" style="--c:var(--sp${col[i]})"></span> <span translate="no">${esc(personLabel(o.nome))}</span>${o.eu || isMe(o.nome) ? ' <span class="badge me">tu</span>' : ''}</td><td class="n">${fmtDur(o.tempo_s)}</td><td class="n">${pctf(o.pct)}</td><td class="n">${nf(o.intervencoes)}</td></tr>`).join('')}</tbody></table></div>
  </section>`;
}
function myNumbers(m) {
  const me = meOf(m); if (!me) return '';
  const n = m.data.oradores.length, fair = 100 / Math.max(2, n);
  const cards = [
    ['Tempo de fala', pctf(me.pct), status('pct', me.pct, { n }), `Partilha justa: ${pctf(fair)} entre ${n} pessoas`],
    m.aproximado ? null : ['Ritmo', `${nf(me.ppm)} ppm`, status('ppm', me.ppm), 'Ideal entre 120 e 170'],
    ['Bordões', `${nf(me.bordoes_100, 1)} por 100`, status('bordoes_100', me.bordoes_100), topTerms(me.bordoes) || 'Nenhum detetado'],
    ['Hesitações', `${nf(me.hesitacoes_100, 1)} por 100`, status('hesitacoes_100', me.hesitacoes_100), topTerms(me.hesitacoes, 2) || 'Discurso assertivo'],
    ['Perguntas feitas', nf(me.perguntas), status('perguntas', me.perguntas), 'Ideal 3 ou mais'],
    ['Maior monólogo', fmtDur(me.maior_s), status('maior_s', me.maior_s), 'Ideal abaixo de 90 s'],
    m.aproximado ? null : ['Interrupções', `${nf(me.interrompeu)} feitas`, status('interrompeu', me.interrompeu), `${nf(me.interrompido)} sofridas (estimativa)`],
  ].filter(Boolean);
  return `<div class="radar-stats">${cards.map(([l, v, s, h]) => `<div class="radar-stat"><div class="top"><span>${l}</span><span class="badge ${s}">${STATUS_LABEL[s]}</span></div><div class="v">${v}</div><div class="h">${esc(h)}</div></div>`).join('')}</div>`;
}
function lineChart(pts, opt = {}) {
  const W = 340, H = 130, P = { l: 30, r: 10, t: 10, b: 22 };
  const vals = pts.map(p => p.v);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (opt.band) { if (opt.band[0] != null) lo = Math.min(lo, opt.band[0]); if (opt.band[1] != null) hi = Math.max(hi, opt.band[1]); }
  if (opt.ref != null) { lo = Math.min(lo, opt.ref); hi = Math.max(hi, opt.ref); }
  if (opt.min != null) lo = opt.min; if (opt.max != null) hi = opt.max;
  if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
  if (opt.min == null && opt.max == null) { const span = hi - lo; hi += span * .1; lo = Math.max(0, lo - span * .1); }
  const x = i => P.l + (pts.length === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (pts.length - 1));
  const y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  let band = '';
  if (opt.band) { const b0 = opt.band[0] ?? lo, b1 = opt.band[1] ?? hi; band = `<rect class="band" x="${P.l}" width="${W - P.l - P.r}" y="${y(Math.min(hi, b1)).toFixed(1)}" height="${Math.max(0, y(Math.max(lo, b0)) - y(Math.min(hi, b1))).toFixed(1)}" rx="3"/>`; }
  const ref = opt.ref != null ? `<line class="ref" x1="${P.l}" x2="${W - P.r}" y1="${y(opt.ref).toFixed(1)}" y2="${y(opt.ref).toFixed(1)}"/>` : '';
  const f = v => nf(v, v < 10 ? 1 : 0);
  const gid = 'ga' + (++lineChart.n), base = (H - P.b).toFixed(1);
  const area = pts.length > 1 ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brand);stop-opacity:.24"/><stop offset="1" style="stop-color:var(--brand);stop-opacity:0"/></linearGradient></defs><path class="area" fill="url(#${gid})" d="${path}L${x(pts.length - 1).toFixed(1)},${base}L${x(0).toFixed(1)},${base}Z"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || '')}: ${esc(pts.map(p => `${fmtDate(p.date, 'short')}, ${opt.fmt(p.v)}`).join('; '))}">
    ${band}${area}${ref}
    <text class="ax" x="${P.l - 6}" y="${y(hi) + 4}" text-anchor="end">${f(hi)}</text><text class="ax" x="${P.l - 6}" y="${y(lo) + 4}" text-anchor="end">${f(lo)}</text>
    <path class="line" d="${path}"/>
    ${pts.map((p, i) => `<circle class="${i === pts.length - 1 ? 'last' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5"><title>${esc(p.title)}, ${fmtDate(p.date, 'short')}: ${opt.fmt(p.v)}</title></circle>`).join('')}
    <text class="ax" x="${x(0)}" y="${H - 6}" text-anchor="${pts.length === 1 ? 'middle' : 'start'}">${fmtDate(pts[0].date, 'short')}</text>
    ${pts.length > 1 ? `<text class="ax" x="${x(pts.length - 1)}" y="${H - 6}" text-anchor="end">${fmtDate(pts[pts.length - 1].date, 'short')}</text>` : ''}
  </svg>`;
}
lineChart.n = 0;
const ownerBadge = t => t.owner ? `<span class="badge ${mineTodo(t) ? 'me' : ''}" translate="no"${t.kind === 'pedido' ? ' title="Pedido: à espera desta pessoa"' : ''}>${esc(mineTodo(t) ? 'Eu' : (t.kind === 'pedido' ? 'Pedido a ' : '') + personLabel(t.owner))}</span>` : `<span class="badge">${t.kind === 'pedido' ? 'A quem?' : 'Sem responsável'}</span>`;
const dueBadge = (t, done) => t.due ? `<span class="badge ${!done && t.due < TODAY ? 'bad' : ''}"><span class="sr-only">${!done && t.due < TODAY ? 'Em atraso, prazo ' : 'Prazo '}</span>${fmtDate(t.due, 'short')}</span>` : '';
const closedNote = t => { const by = t.t.fechada_em && byId.get(t.t.fechada_em); return by ? `<a class="task-closed" href="${meetingHref(by)}">Concluída na reunião de ${fmtDate(by.date, 'short')}</a>` : ''; };
const taskRow = t => {
  const done = isDone(t);
  return `<div class="task ${done ? 'done' : ''}">
    <label><input type="checkbox" data-key="${esc(t.key)}" ${done ? 'checked' : ''}><span><span class="task-text">${esc(t.text)}</span></span></label>
    <span class="task-side">${t.t.confirmar ? `<span class="badge warn" title="${esc(t.t.confirmar)}">A confirmar</span>` : ''}${ownerBadge(t)}${dueBadge(t, done)}</span>
    <a class="task-from" href="${meetingHref(t.m)}">${esc(t.m.title)}, ${fmtDate(t.m.date, 'short')}</a>${closedNote(t)}
  </div>`;
};

/* ── Projetos: gráficos ── */
const RAG_LABEL = { verde: 'Verde', amarelo: 'Amarelo', vermelho: 'Vermelho' }, RAG_STATUS = { verde: 'ok', amarelo: 'warn', vermelho: 'bad' };
const HEALTH_LABEL = { ok: 'Sob controlo', warn: 'Atenção', bad: 'Crítico' };
const dnum = iso => toDate(iso).getTime();
function mtaChart(M) {
  const series = M.marcos.map((x, i) => ({ x, c: `var(--sp${(i % 6) + 1})`, pts: x.hist.filter(h => h.data_prevista && h.date).map(h => [dnum(h.date), dnum(h.data_prevista), h]) })).filter(s => s.pts.length);
  if (!series.length) return '<p class="muted">Ainda não há marcos com datas. Aparecem quando se fala de datas de entrega nas reuniões.</p>';
  const W = 720, H = 300, P = { l: 70, r: 70, t: 14, b: 34 };
  const xs = M.snaps.map(s => dnum(s.date)), all = series.flatMap(s => s.pts.map(p => p[1]));
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 - x0 < 7 * 864e5) { x0 -= 3 * 864e5; x1 += 4 * 864e5; }
  let y0 = Math.min(...all, x0), y1 = Math.max(...all, x1); const pad = (y1 - y0) * .08 || 864e5 * 3; y0 -= pad; y1 += pad;
  const X = t => P.l + (t - x0) / (x1 - x0) * (W - P.l - P.r), Y = t => P.t + (1 - (t - y0) / (y1 - y0)) * (H - P.t - P.b);
  const iso = t => localISO(new Date(t));
  const yt = Array.from({ length: 5 }, (_, i) => y0 + (y1 - y0) * i / 4), xt = M.snaps.length <= 6 ? M.snaps.map(s => dnum(s.date)) : Array.from({ length: 5 }, (_, i) => x0 + (x1 - x0) * i / 4);
  const d0 = Math.max(x0, y0), d1 = Math.min(x1, y1);
  return `<svg class="chart mta" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendência de marcos: ${esc(series.map(s => `${s.x.nome}, de ${fmtDate(s.x.primeira, 'short')} para ${fmtDate(s.x.atual, 'short')}`).join('; '))}">
    ${yt.map(t => `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/><text class="ax" x="${P.l - 8}" y="${Y(t) + 3}" text-anchor="end">${fmtDate(iso(t), 'short')}</text>`).join('')}
    ${xt.map(t => `<text class="ax" x="${X(t).toFixed(1)}" y="${H - 10}" text-anchor="middle">${fmtDate(iso(t), 'short')}</text>`).join('')}
    ${d1 > d0 ? `<line class="diag" x1="${X(d0).toFixed(1)}" y1="${Y(d0).toFixed(1)}" x2="${X(d1).toFixed(1)}" y2="${Y(d1).toFixed(1)}"><title>Linha de chegada: quando um marco toca esta linha, a data chegou</title></line>` : ''}
    ${series.map(s => `<g style="--c:${s.c}"><path class="mta-line" d="${s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('')}"/>
      ${s.pts.map(p => `<circle class="mta-dot" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.5"><title>${esc(s.x.nome)}: na reunião de ${fmtDate(p[2].date, 'short')}, previsto para ${fmtDate(p[2].data_prevista, 'short')}</title></circle>`).join('')}
      <text class="mta-label" x="${(X(s.pts[s.pts.length - 1][0]) + 8).toFixed(1)}" y="${(Y(s.pts[s.pts.length - 1][1]) + 4).toFixed(1)}">${esc(s.x.codigo)}</text></g>`).join('')}
  </svg>
  <div class="legend" style="margin-top:var(--s-2)">${series.map(s => `<span><span class="key" style="--c:${s.c}"></span>${esc(s.x.codigo)} ${esc(s.x.nome)}${s.x.replans ? `, ${plural(s.x.replans, 'mudança', 'mudanças')} de data` : ''}${s.x.concluido ? ', concluído' : ''}</span>`).join('')}</div>`;
}
function burnupChart(M) {
  const S = M.snaps.filter(s => s.pmo); if (!S.length) return '<p class="muted">Sem dados de backlog ainda.</p>';
  const W = 720, H = 220, P = { l: 36, r: 16, t: 12, b: 30 };
  const max = Math.max(4, ...S.map(s => s.pedidos)), n = S.length;
  const X = i => P.l + (n === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (n - 1)), Y = v => P.t + (1 - v / max) * (H - P.t - P.b);
  const bw = Math.max(4, Math.min(22, (W - P.l - P.r) / n * .45));
  const line = k => S.map((s, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(s[k]).toFixed(1)}`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Backlog: ${esc(S.map(s => `${fmtDate(s.date, 'short')}: ${s.entregues} entregues de ${s.pedidos}`).join('; '))}">
    ${[0, .5, 1].map(f => `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${Y(max * f).toFixed(1)}" y2="${Y(max * f).toFixed(1)}"/><text class="ax" x="${P.l - 6}" y="${Y(max * f) + 3}" text-anchor="end">${nf(max * f)}</text>`).join('')}
    ${S.map((s, i) => s.novos ? `<rect class="bar-new" x="${(X(i) - bw / 2).toFixed(1)}" y="${Y(s.novos).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - P.b - Y(s.novos)).toFixed(1)}" rx="2"><title>${fmtDate(s.date, 'short')}: ${plural(s.novos, 'pedido novo', 'pedidos novos')}</title></rect>` : '').join('')}
    <path class="line-scope" d="${line('pedidos')}"/><path class="line" d="${line('entregues')}"/>
    ${S.map((s, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(s.entregues).toFixed(1)}" r="3"><title>${fmtDate(s.date, 'short')}: ${s.entregues} entregues de ${s.pedidos} pedidos</title></circle>`).join('')}
    ${S.length <= 8 ? S.map((s, i) => `<text class="ax" x="${X(i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${fmtDate(s.date, 'short')}</text>`).join('') : `<text class="ax" x="${X(0)}" y="${H - 10}">${fmtDate(S[0].date, 'short')}</text><text class="ax" x="${X(n - 1)}" y="${H - 10}" text-anchor="end">${fmtDate(S[n - 1].date, 'short')}</text>`}
  </svg>
  <div class="legend" style="margin-top:var(--s-2)"><span><span class="key" style="--c:var(--ink-3)"></span>Pedidos acumulados</span><span><span class="key" style="--c:var(--brand)"></span>Entregues</span><span><span class="key" style="--c:var(--coral)"></span>Pedidos novos na reunião</span></div>`;
}
function ragStrip(M) {
  const S = M.snaps; if (!S.some(s => s.rag)) return '';
  return `<div class="rag-strip" role="list" aria-label="Estado reunião a reunião">${S.map(s => `<a role="listitem" class="rag-cell ${s.rag ? RAG_STATUS[s.rag] : 'none'}" href="${meetingHref(s.m)}" title="${esc(fmtDate(s.date, 'short'))}: ${esc(s.rag ? RAG_LABEL[s.rag] + (s.pmo?.estado?.explicito ? '' : ' (inferido)') : 'sem estado')}${s.pmo?.estado?.razao ? '. ' + esc(s.pmo.estado.razao) : ''}"><span class="sr-only">${esc(fmtDate(s.date))}: ${s.rag ? RAG_LABEL[s.rag] : 'sem estado'}</span></a>`).join('')}</div>
    <div class="rag-axis"><span>${fmtDate(S[0].date, 'short')}</span><span>${fmtDate(S[S.length - 1].date, 'short')}</span></div>`;
}

/* ── Projetos: vistas ── */
function projectDerivedQuestions(M) {
  const q = [...M.perguntas];
  M.marcos.filter(x => !x.concluido && x.replans >= 2).slice(0, 1).forEach(x => q.push(`“${x.nome}” já mudou de data ${x.replans} vezes. O que é diferente desta vez, e o que garante ${fmtDate(x.atual, 'short')}?`));
  M.decisoes.filter(d => d.idade >= 3).slice(0, 1).forEach(d => q.push(`Quem decide “${d.titulo}”, e até quando? Está pendente há ${plural(d.idade, 'reunião', 'reuniões')}.`));
  M.chronic.slice(0, 1).forEach(b => q.push(`“${b.titulo}” volta a cada reunião. Entra na versão atual ou fica explicitamente fora?`));
  if (M.zombies.length) q.push(`Há ${plural(M.zombies.length, 'ação aberta', 'ações abertas')} há 3 ou mais reuniões. Fechamos, reatribuímos ou abandonamos?`);
  return [...new Set(q)].slice(0, 6);
}
function viewProjects() {
  const ps = projects(), sug = projectSuggestions();
  return `<div class="page wide">
    <div class="page-head"><div><h1 tabindex="-1">Projetos</h1><p class="page-sub">A evolução de cada projeto ao longo das reuniões, com o olhar de um PMO crítico.</p></div>
      <div class="actions"><a class="btn primary btn-lg" href="#/projetos/novo">${icon('plus')}Novo projeto</a></div></div>
    <div class="stack">
      ${ps.length ? `<div class="panel" style="padding:0"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th scope="col">Projeto</th><th scope="col">Saúde</th><th scope="col">Estado reportado</th><th scope="col" class="n">Reuniões</th><th scope="col" class="n">Última</th><th scope="col">Próximo marco</th><th scope="col" class="n">Alertas</th></tr></thead>
        <tbody>${ps.map(p => { const M = projectMetrics(p); const nx = M.marcos.find(x => !x.concluido); const last = M.ms[M.ms.length - 1];
          return `<tr><td><a class="row-title" href="#/p/${encodeURIComponent(p.id)}">${esc(p.nome)}</a></td>
            <td>${M.health ? `<span class="badge ${M.health}">${HEALTH_LABEL[M.health]}</span>` : '<span class="muted">Sem reuniões</span>'}</td>
            <td>${M.rag?.rag ? `<span class="badge ${RAG_STATUS[M.rag.rag]}">${RAG_LABEL[M.rag.rag]}</span>` : '<span class="muted">—</span>'}</td>
            <td class="n">${nf(M.ms.length)}</td><td class="n">${last ? fmtDate(last.date, 'short') : '—'}</td>
            <td>${nx ? `${esc(nx.nome)}, ${fmtDate(nx.atual, 'short')}${nx.slip > 0 ? ` <span class="badge warn">+${nx.slip} d</span>` : ''}` : '<span class="muted">—</span>'}</td>
            <td class="n">${nf(M.alerts.length)}</td></tr>`; }).join('')}</tbody></table></div></div>`
        : `<section class="panel" aria-labelledby="pj-empty"><div class="panel-head"><h2 id="pj-empty">Como funciona</h2></div>
          <ol class="steps-list"><li><b>Declaras um projeto:</b> nome, descrição, palavras-chave e as pessoas com quem o acompanhas.</li>
            <li><b>Associas as reuniões</b> que já tens (o caderno propõe as que encaixam). As novas são associadas pelo Kilo Code.</li>
            <li><b>Reconstróis o histórico:</b> o Kilo Code lê as atas antigas e monta a linha do tempo do projeto.</li>
            <li>A partir daí, cada reunião atualiza marcos, backlog, riscos e decisões, e o caderno mostra a evolução e os alertas.</li></ol>
          <div class="actions" style="margin-top:var(--s-4)"><a class="btn primary" href="#/projetos/novo">Criar o primeiro projeto</a><a class="btn" href="#/p/exemplo">Ver um projeto de exemplo</a></div></section>`}
      ${sug.length ? `<section class="panel" aria-labelledby="pj-sug"><div class="panel-head"><h2 id="pj-sug">Isto parece um projeto</h2><p>Reuniões recorrentes que ainda não estão em nenhum projeto</p></div>
        <div class="rows">${sug.map((s, i) => `<div class="row-link"><div class="row-main"><div class="row-title">${esc(s.nome)}</div><div class="row-sub"><span>${esc(s.motivo)}</span></div></div><a class="btn" href="#/projetos/novo?sug=${i}">Seguir como projeto</a></div>`).join('')}</div></section>` : ''}
      ${ps.length ? `<p class="field-help"><a class="btn-link" href="#/p/exemplo">Ver um projeto de exemplo</a> para perceber cada gráfico.</p>` : ''}
    </div></div>`;
}
function projectForm(p, sug) {
  const v = p || sug || { nome: '', descricao: '', palavras: [], pessoas: [] };
  const freq = new Map(); meetings.filter(m => !m.exemplo).forEach(m => m.people.filter(x => !isMe(x)).forEach(x => freq.set(x, (freq.get(x) || 0) + 1)));
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([x]) => x);
  return `<form data-form="project" data-id="${esc(p?.id || '')}" class="stack" style="gap:var(--s-4)">
    <div class="form-grid">
      <div><label class="field-label" for="pj-nome">Nome do projeto</label><input class="text-input" id="pj-nome" name="nome" required value="${esc(v.nome)}" placeholder="Ex.: CodirIT…"></div>
      <div><label class="field-label" for="pj-pal">Palavras-chave</label><input class="text-input" id="pj-pal" name="palavras" value="${esc((v.palavras || []).join(', '))}" placeholder="Ex.: codir, Microsoft Lists, V2…"><p class="field-help">Separadas por vírgulas. Ajudam a reconhecer as reuniões do projeto.</p></div>
    </div>
    <div><label class="field-label" for="pj-desc">Descrição</label><input class="text-input" id="pj-desc" name="descricao" value="${esc(v.descricao || '')}" placeholder="Ex.: Automatizar o CODIR de IT em Microsoft Lists; V2 em entrega, V3 no próximo ano…"><p class="field-help">Uma frase sobre o objetivo e a fase. O Kilo Code usa-a para perceber o contexto.</p></div>
    <div><label class="field-label" for="pj-pes">Pessoas</label><input class="text-input" id="pj-pes" name="pessoas" value="${esc((v.pessoas || []).join('; '))}" placeholder="Ex.: Dupont, Arnaud…" spellcheck="false"><p class="field-help">Separadas por ponto e vírgula, como aparecem no Teams.${top.length ? ' Frequentes:' : ''}</p>
      ${top.length ? `<div class="people-pick" style="margin-top:var(--s-2)">${top.map(x => `<button type="button" class="chip" data-add-person="${esc(x)}" translate="no">${esc(displayName(x))}</button>`).join('')}</div>` : ''}</div>
    <div class="actions"><button class="btn primary" type="submit">${p ? 'Guardar alterações' : 'Criar projeto'}</button><a class="btn" href="${p ? '#/p/' + encodeURIComponent(p.id) : '#/projetos'}">Cancelar</a></div>
  </form>`;
}
function viewProjectNew(sugIdx) {
  const sug = sugIdx != null ? projectSuggestions()[sugIdx] : null;
  return `<div class="page"><nav class="crumbs" aria-label="Caminho"><a href="#/projetos">Projetos</a><span aria-hidden="true">/</span><span>Novo</span></nav>
    <div class="page-head"><div><h1 tabindex="-1">Novo projeto</h1><p class="page-sub">Depois de criares o projeto, o caderno propõe as reuniões que já tens e que encaixam nele.</p></div></div>
    <section class="panel">${projectForm(null, sug)}</section></div>`;
}
function historyPanel(p, M) {
  const pending = M.ms.filter(m => !m.c.pmo).length;
  if (!M.ms.length || p.id === 'exemplo') return '';
  if (!pending && M.temPmo) return '';
  const folder = dirHandle && dirPerm === 'granted';
  return `<section class="panel" aria-labelledby="hist-h"><div class="panel-head"><h2 id="hist-h">Reconstruir o histórico</h2><p>${plural(pending, 'reunião sem dados de projeto', 'reuniões sem dados de projeto')}</p></div>
    <p style="margin:0 0 var(--s-4);color:var(--ink-2);max-width:var(--measure)">O Kilo Code lê as atas destas reuniões, por ordem, e monta a linha do tempo do projeto: marcos e datas, backlog, riscos, decisões e satisfação. Faz-se uma vez; as reuniões novas já chegam com estes dados.</p>
    ${folder ? `<div class="actions"><button class="btn primary" type="button" data-action="history-folder" data-project="${esc(p.id)}">Pedir ao Kilo Code</button><span class="field-help">Depois faz duplo clique em <b>Atualizar caderno.bat</b> (ou “atualiza o caderno” no Kilo Code).</span></div>` : ''}
    <details style="margin-top:var(--s-4)" ${folder ? '' : 'open'}><summary class="btn-link" style="cursor:pointer">${folder ? 'Prefiro copiar e colar' : 'Copiar o pedido e colar a resposta'}</summary>
      <div class="actions" style="margin-top:var(--s-3)"><button class="btn" type="button" data-action="history-copy" data-project="${esc(p.id)}">${icon('copy')}Copiar pedido</button></div>
      <label class="sr-only" for="hist-answer">Resposta do Kilo Code</label>
      <textarea class="text-area" id="hist-answer" placeholder="Cola aqui a resposta do Kilo Code, começa por {…" style="margin-top:var(--s-3)"></textarea>
      <div class="actions" style="margin-top:var(--s-3)"><button class="btn primary" type="button" data-action="history-apply" data-project="${esc(p.id)}">Aplicar ao projeto</button></div></details>
  </section>`;
}
function assignPanel(p) {
  if (p.id === 'exemplo') return '';
  const cands = candidateMeetings(p);
  const assigned = new Set(meetings.filter(m => m.rec.projeto === p.id).map(m => m.id));
  return `<details class="panel" ${assigned.size ? '' : 'open'}><summary class="panel-head" style="cursor:pointer;margin:0"><h2>Reuniões do projeto</h2><p>${plural(assigned.size, 'associada', 'associadas')}</p></summary>
    <form data-form="assign" data-id="${esc(p.id)}" style="margin-top:var(--s-4)">
      ${cands.length ? `<p class="field-help" style="margin:0 0 var(--s-3)">Propostas pelas palavras-chave e pelas pessoas do projeto. Confirma as que pertencem.</p>
      <div class="rows">${cands.map(({ m, score }) => `<label class="row-link" style="cursor:pointer"><input type="checkbox" name="m" value="${esc(m.id)}" ${assigned.has(m.id) || (!assigned.size && score >= 2) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--brand)"><div class="row-main"><div class="row-title">${esc(m.title)}</div><div class="row-sub"><span>${fmtDate(m.date, 'short')}</span><span>${esc(LF.format(m.people.slice(0, 3).map(personLabel)))}</span>${m.rec.projeto && m.rec.projeto !== p.id ? `<span>noutro projeto</span>` : ''}</div></div></label>`).join('')}</div>
      <div class="actions" style="margin-top:var(--s-4)"><button class="btn primary" type="submit">Guardar associação</button></div>`
      : '<p class="muted" style="margin:0">Ainda não encontrei reuniões que encaixem. Ajusta as palavras-chave ou as pessoas, ou associa uma reunião na página dela.</p>'}
    </form></details>`;
}
function viewProject(id) {
  const p = projectById(id); if (!p) return `<div class="page"><h1 tabindex="-1">Projeto não encontrado</h1><p><a class="btn-link" href="#/projetos">Voltar aos projetos</a></p></div>`;
  const M = projectMetrics(p), demo = p.id === 'exemplo';
  const nx = M.marcos.find(x => !x.concluido) || null;
  const qs = projectDerivedQuestions(M);
  const satLast = M.sat[M.sat.length - 1], adoLast = M.ado[M.ado.length - 1];
  const satLabel = v => v == null ? '—' : ['Muito insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito satisfeito'][Math.round(v) + 2];
  const lastManual = [...M.snaps].reverse().find(s => s.pmo?.adocao?.ainda_manual?.length)?.pmo.adocao.ainda_manual || [];
  const lastSatEv = [...M.snaps].reverse().find(s => s.pmo?.satisfacao?.evidencia)?.pmo.satisfacao.evidencia;
  const hoursPerItem = M.delivered ? M.durTotal / 3600 / M.delivered : null;
  // Pessoal primeiro: o que mudou na última reunião, o que está combinado e o que bloqueia
  const lastM = M.ms[M.ms.length - 1];
  const openTodos = M.todos.filter(t => !isDone(t)).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const v2items = k => M.ms.slice(-3).flatMap(m => (m.c.v === 2 ? m.c[k] || [] : []).map(it => ({ it, m })));
  const bloq = v2items('bloqueios'), decs = M.ms.slice(-3).flatMap(m => (m.c.v === 2 ? m.c.decisoes || [] : []).map(it => ({ it, m })));
  const changes = lastM?.c.pmo ? pmoMeetingItems(lastM) : [];
  return `<div class="page wide">
    <nav class="crumbs" aria-label="Caminho"><a href="#/projetos">Projetos</a><span aria-hidden="true">/</span><span>${esc(p.nome)}</span>${demo ? '<span class="badge">Exemplo</span>' : ''}</nav>
    <div class="page-head" style="margin-bottom:var(--s-6)"><div><h1 tabindex="-1">${esc(p.nome)}</h1>${p.descricao ? `<p class="page-sub">${esc(p.descricao)}</p>` : ''}</div>
      <div class="actions r-actions"><button class="btn" type="button" data-action="project-report" data-project="${esc(p.id)}">${icon('copy')}Copiar relatório</button><button class="icon-btn" type="button" data-action="print" aria-label="Imprimir ou guardar em PDF" title="Imprimir ou guardar em PDF">${icon('printer')}</button></div></div>
    <div class="stack">
      ${!M.ms.length ? assignPanel(p) : ''}
      ${historyPanel(p, M)}
      ${M.ms.length ? `
      <div class="stats">
        <div class="stat"><div class="stat-v">${M.health ? HEALTH_LABEL[M.health] : '—'}</div><div class="stat-l">Saúde, por factos ditos</div><div class="stat-h">${plural(M.alerts.length, 'alerta', 'alertas')}${M.rag?.rag ? `; estado dito: ${RAG_LABEL[M.rag.rag].toLowerCase()}` : ''}</div></div>
        <div class="stat"><div class="stat-v">${nx ? fmtDate(nx.atual, 'short') : '—'}</div><div class="stat-l">${nx ? esc(nx.nome) : 'Próximo marco'}</div><div class="stat-h">${nx ? (nx.slip > 0 ? `+${plural(nx.slip, 'dia', 'dias')} desde a 1.ª data; ${plural(nx.replans, 'mudança', 'mudanças')}` : 'Sem deriva') : 'Sem marcos em aberto'}</div></div>
        <div class="stat"><div class="stat-v">${nf(M.delivered)} de ${nf(M.back.length)}</div><div class="stat-l">Backlog entregue</div><div class="stat-h">${plural(M.open.length, 'item em aberto', 'itens em aberto')}${M.pushed.length ? `; ${plural(M.pushed.length, 'adiado', 'adiados')}` : ''}</div></div>
        <div class="stat"><div class="stat-v">${M.sayDo == null ? '—' : M.sayDo + '%'}</div><div class="stat-l">Cumpridas no prazo</div><div class="stat-h">${M.sayDo == null ? 'Só conta tarefas com data de conclusão registada' : 'Das tarefas com prazo e data de conclusão'}${M.overdue.length ? `; ${M.overdue.length} em atraso` : ''}</div></div>
      </div>
      ${lastM ? `<section class="panel" aria-labelledby="dl-h"><div class="panel-head"><h2 id="dl-h">Desde a última reunião</h2><p>${esc(lastM.title)}, ${fmtDate(lastM.date, 'short')}</p></div>
        ${changes.length ? `<ul>${changes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : `<p class="muted" style="margin:0">${lastM.lead ? esc(curly(lastM.lead)) : 'Sem alterações registadas.'}</p>`}
        <p style="margin:var(--s-3) 0 0"><a class="btn-link" href="${meetingHref(lastM)}">Abrir a reunião</a></p></section>` : ''}
      <div class="cols-2">
        <section class="panel" aria-labelledby="cp-h"><div class="panel-head"><h2 id="cp-h">Compromissos em aberto</h2><p>Tarefas e pedidos combinados nas reuniões do projeto</p></div>
          ${openTodos.length ? openTodos.slice(0, 8).map(taskRow).join('') : '<p class="muted" style="margin:0">Nada em aberto.</p>'}</section>
        <section class="panel" aria-labelledby="bl-h"><div class="panel-head"><h2 id="bl-h">Bloqueios e decisões</h2><p>Das últimas 3 reuniões</p></div>
          ${bloq.length || decs.length ? `<div class="rows">${[...bloq.map(x => ['Bloqueio', x]), ...decs.map(x => ['Decisão', x])].map(([l, { it, m }]) => `<a class="row-link" href="${meetingHref(m)}"><div class="row-main"><div class="row-title">${esc(it.texto)}</div><div class="row-sub"><span>${l}</span><span>${fmtDate(m.date, 'short')}</span>${it.minuto ? `<span>${esc(it.minuto)}</span>` : ''}</div></div></a>`).join('')}</div>` : '<p class="muted" style="margin:0">Nenhum registado.</p>'}</section>
      </div>
      ${M.alerts.length ? `<section class="panel" aria-labelledby="al-h"><div class="panel-head"><h2 id="al-h">Alertas do PMO</h2><p>O que merece atenção agora</p></div>
        ${M.alerts.map(a => `<div class="status-line ${a.s}" style="margin-top:0;margin-bottom:var(--s-2)">${icon('alert')}<p><b>${esc(a.t)}.</b> ${esc(a.d)}</p></div>`).join('')}</section>` : (M.temPmo ? `<div class="status-line ok" style="margin:0">${icon('check')}<p>Sem alertas: os marcos estão estáveis, as ações em dia e nada se arrasta.</p></div>` : '')}
      ${qs.length ? `<section class="panel" aria-labelledby="pq-h"><div class="panel-head"><h2 id="pq-h">Perguntas para a próxima reunião</h2><p>Para levar e fazer, mesmo que incomodem</p></div><ol class="steps-list">${qs.map(q => `<li>${esc(curly(q))}</li>`).join('')}</ol></section>` : ''}
      <section class="panel" aria-labelledby="mta-h"><div class="panel-head"><h2 id="mta-h">Tendência dos marcos</h2><p>Cada linha é a data prevista de um marco, reunião a reunião. Plana: controlado. A subir: a escorregar.</p></div>${mtaChart(M)}</section>
      ${M.snaps.some(s => s.rag) ? `<section class="panel" aria-labelledby="rag-h"><div class="panel-head"><h2 id="rag-h">Estado reunião a reunião</h2><p>Verde, amarelo ou vermelho, só quando alguém o disse</p></div>${ragStrip(M)}</section>` : ''}
      <section class="panel" aria-labelledby="bu-h"><div class="panel-head"><h2 id="bu-h">Backlog: pedidos e entregas</h2><p>Se a linha cinzenta sobe mais depressa do que a violeta, o projeto não converge</p></div>${burnupChart(M)}</section>
      <div class="cols-2">
        <section class="panel" aria-labelledby="ri-h"><div class="panel-head"><h2 id="ri-h">Riscos em aberto</h2><p>${plural(M.riscosAbertos.length, 'risco', 'riscos')}</p></div>
          ${M.riscosAbertos.length ? `<div class="rows">${M.riscosAbertos.sort((a, b) => ['alta', 'media', 'baixa'].indexOf(a.gravidade) - ['alta', 'media', 'baixa'].indexOf(b.gravidade)).map(r => `<div class="row-link"><div class="row-main"><div class="row-title">${esc(r.codigo)} ${esc(r.titulo)}</div><div class="row-sub"><span>${r.responsavel ? esc(personLabel(r.responsavel)) : 'Sem responsável'}</span><span>${r.mitigacao ? esc(r.mitigacao) : 'Sem mitigação'}</span></div></div><span class="badge ${r.gravidade === 'alta' ? 'bad' : r.gravidade === 'media' ? 'warn' : ''}">${r.gravidade === 'media' ? 'Média' : cap(r.gravidade)}</span></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Nenhum risco em aberto.</p>'}</section>
        <section class="panel" aria-labelledby="de-h"><div class="panel-head"><h2 id="de-h">Decisões por tomar</h2><p>Há quantas reuniões se arrastam</p></div>
          ${M.decisoes.length ? `<div class="rows">${M.decisoes.sort((a, b) => b.idade - a.idade).map(d => `<div class="row-link"><div class="row-main"><div class="row-title">${esc(d.codigo)} ${esc(d.titulo)}</div><div class="row-sub"><span>Desde ${fmtDate(d.first, 'short')}</span></div></div><span class="badge ${d.idade >= 3 ? 'warn' : ''}">${plural(d.idade, 'reunião', 'reuniões')}</span></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Nada por decidir.</p>'}</section>
      </div>
      <section class="panel" aria-labelledby="bk-h"><div class="panel-head"><h2 id="bk-h">Backlog</h2><p>Por número de vezes que foi falado</p></div>
        ${M.back.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Item</th><th scope="col">Tipo</th><th scope="col">Versão</th><th scope="col">Prioridade</th><th scope="col">Estado</th><th scope="col" class="n">Falado</th><th scope="col" class="n">Desde</th></tr></thead>
          <tbody>${M.back.slice().sort((a, b) => (DELIVERED.includes(a.estado) - DELIVERED.includes(b.estado)) || b.mentions - a.mentions).map(b => `<tr><td style="white-space:normal;min-width:220px">${esc(b.codigo)} ${esc(b.titulo)}${M.reopened.includes(b) ? ' <span class="badge warn">reaberto</span>' : ''}${M.pushed.includes(b) ? ' <span class="badge">adiado</span>' : ''}</td><td>${esc(cap(b.tipo || ''))}</td><td>${esc(b.versao || '—')}</td><td>${b.prioridade === 'must-have' ? 'Must-have' : b.prioridade === 'sonho' ? 'Sonho' : b.prioridade === 'normal' ? 'Normal' : '—'}</td><td><span class="badge ${DELIVERED.includes(b.estado) ? 'ok' : b.estado === 'recusado' ? '' : b.mentions >= 3 ? 'warn' : ''}">${esc({ novo: 'Novo', analise: 'Em análise', desenvolvimento: 'Em desenvolvimento', entregue: 'Entregue', validado: 'Validado', recusado: 'Recusado' }[b.estado] || b.estado)}</span></td><td class="n">${nf(b.mentions)}×</td><td class="n">${fmtDate(b.first, 'short')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted" style="margin:0">Sem itens de backlog ainda.</p>'}</section>
      <details class="panel"><summary class="panel-head" style="cursor:pointer;margin:0"><h2>Indicadores inferidos</h2><p>Leituras a partir de frases ditas. Não contam para a saúde do projeto.</p></summary>
      ${M.inferidos.length ? M.inferidos.map(a => `<div class="status-line info" style="margin-top:var(--s-3)">${icon('info')}<p><b>${esc(a.t)}.</b> ${esc(a.d)}</p></div>`).join('') : ''}
      <div class="cols-2" style="margin-top:var(--s-5)">
        <section aria-labelledby="sat-h"><div class="panel-head"><h3 id="sat-h">Satisfação do interlocutor</h3><p>De −2 a +2, só quando foi dita</p></div>
          ${M.sat.length ? lineChart(M.sat.map(s => ({ v: s.satisfacao, date: s.date, title: s.m.title })), { min: -2, max: 2, ref: 0, fmt: v => (v > 0 ? '+' : '') + nf(v), label: 'Satisfação' }) : '<p class="muted" style="margin:0">Sem dados ainda.</p>'}
          ${lastSatEv ? `<blockquote class="quote">${esc(curly('"' + lastSatEv.replace(/^["“]|["”]$/g, '') + '"'))}</blockquote>` : ''}</section>
        <section aria-labelledby="ad-h"><div class="panel-head"><h3 id="ad-h">Adoção</h3><p>Percentagem dita do processo já na solução nova</p></div>
          ${M.ado.length ? lineChart(M.ado.map(s => ({ v: s.adocao, date: s.date, title: s.m.title })), { min: 0, max: 100, fmt: v => nf(v) + '%', label: 'Adoção' }) : '<p class="muted" style="margin:0">Sem dados ainda.</p>'}
          ${lastManual.length ? `<p class="field-help" style="margin-top:var(--s-3)">Ainda à mão: ${esc(LF.format(lastManual))}.</p>` : ''}</section>
      </div></details>
      <div class="cols-2">
        <section class="panel" aria-labelledby="ex-h"><div class="panel-head"><h2 id="ex-h">Execução</h2><p>Ações combinadas nas reuniões do projeto</p></div>
          <ul class="verdicts" style="margin-bottom:var(--s-4)"><li><span>Cumpridas no prazo${M.semData ? ` (${plural(M.semData, 'concluída', 'concluídas')} sem data não conta${M.semData === 1 ? '' : 'm'})` : ''}</span><b class="tabular">${M.sayDo == null ? '—' : M.sayDo + '%'}</b></li><li><span>Em atraso</span><b class="tabular">${nf(M.overdue.length)}</b></li><li><span>Zombie (3 ou mais reuniões)</span><b class="tabular">${nf(M.zombies.length)}</b></li></ul>
          ${(() => { const groups = []; [...new Set([...M.overdue, ...M.zombies])].sort((a, b) => (b.m.date || '').localeCompare(a.m.date || '')).forEach(t => { const g = groups.find(x => similar(x.t.text, t.text)); if (g) g.n++; else groups.push({ t, n: 1 }); });
            return groups.slice(0, 6).map(g => g.n > 1 ? taskRow(g.t).replace('<span class="task-side">', `<span class="task-side"><span class="badge warn">pedida ${g.n}×</span>`) : taskRow(g.t)).join(''); })()}</section>
        <section class="panel" aria-labelledby="cv-h"><div class="panel-head"><h2 id="cv-h">Esforço</h2><p>O tempo que as reuniões custam</p></div>
          <ul class="verdicts"><li><span>Reuniões</span><b class="tabular">${nf(M.ms.length)}</b></li><li><span>Tempo total em reunião</span><b class="tabular">${fmtDur(M.durTotal)}</b></li>
            <li><span>Uma reunião a cada</span><b class="tabular">${M.cadence == null ? '—' : plural(Math.round(M.cadence * 10) / 10, 'dia', 'dias')}</b></li>
            <li><span>Reunião por item entregue</span><b class="tabular">${hoursPerItem == null ? '—' : fmtDur(hoursPerItem * 3600)}</b></li></ul></section>
      </div>
      <section class="panel" aria-labelledby="pm-h"><div class="panel-head"><h2 id="pm-h">Reuniões do projeto</h2><p>${plural(M.ms.length, 'reunião', 'reuniões')}</p></div>
        <div class="rows">${M.ms.slice().reverse().map(m => `<a class="row-link" href="${meetingHref(m)}"><div class="row-main"><div class="row-title">${esc(m.title)}</div><div class="row-sub"><span>${fmtDate(m.date, 'short')}</span>${m.dur ? `<span>${fmtDur(m.dur)}</span>` : ''}${m.c.pmo?.estado?.razao ? `<span>${esc(m.c.pmo.estado.razao)}</span>` : ''}</div></div>${m.c.pmo?.estado?.rag ? `<span class="badge ${RAG_STATUS[m.c.pmo.estado.rag]}">${RAG_LABEL[m.c.pmo.estado.rag]}</span>` : ''}</a>`).join('')}</div></section>
      ${assignPanel(p)}` : ''}
      ${!demo ? `<details class="panel"><summary class="panel-head" style="cursor:pointer;margin:0"><h2>Editar projeto</h2></summary><div style="margin-top:var(--s-4)">${projectForm(p)}</div>
        <div class="actions" style="margin-top:var(--s-5)"><button class="btn danger" type="button" data-action="project-delete" data-project="${esc(p.id)}">Apagar o projeto</button><span class="field-help">As reuniões não são apagadas.</span></div></details>` : ''}
    </div></div>`;
}
function projectReportText(p) {
  const M = projectMetrics(p), L = [];
  const nx = M.marcos.find(x => !x.concluido);
  L.push(`${p.nome.toUpperCase()}: PONTO DE SITUAÇÃO`, `${fmtDate(TODAY)}; ${plural(M.ms.length, 'reunião analisada', 'reuniões analisadas')}`);
  L.push('', `SAÚDE (por factos ditos): ${M.health ? HEALTH_LABEL[M.health] : 'sem dados'}${M.rag?.rag ? `. Estado dito: ${RAG_LABEL[M.rag.rag]}${M.rag.razao ? '. ' + M.rag.razao : ''}` : ''}`);
  if (M.marcos.length) { L.push('', 'MARCOS'); M.marcos.forEach(x => L.push(`- ${x.nome}: ${x.concluido ? 'concluído' : fmtDate(x.atual)}${x.slip > 0 ? ` (+${plural(x.slip, 'dia', 'dias')}, ${plural(x.replans, 'mudança', 'mudanças')} de data)` : ''}`)); }
  L.push('', `BACKLOG: ${M.delivered} entregues de ${M.back.length}; ${M.open.length} em aberto${M.pushed.length ? `; ${plural(M.pushed.length, 'adiado', 'adiados')} para versão posterior` : ''}.`);
  if (M.alerts.length) { L.push('', 'ALERTAS'); M.alerts.forEach(a => L.push(`- ${a.t}. ${a.d}`)); }
  if (M.riscosAbertos.length) { L.push('', 'RISCOS EM ABERTO'); M.riscosAbertos.forEach(r => L.push(`- ${r.titulo} (${r.gravidade})${r.mitigacao ? '. Mitigação: ' + r.mitigacao : ''}`)); }
  if (M.decisoes.length) { L.push('', 'DECISÕES POR TOMAR'); M.decisoes.forEach(d => L.push(`- ${d.titulo} (há ${d.idade} reuniões)`)); }
  const qs = projectDerivedQuestions(M); if (qs.length) { L.push('', 'PRÓXIMAS PERGUNTAS'); qs.forEach(q => L.push(`- ${q}`)); }
  return L.join('\n');
}
function pmoMeetingItems(m) {
  const pmo = m.c.pmo; if (!pmo) return [];
  const est = { novo: 'novo', analise: 'em análise', desenvolvimento: 'em desenvolvimento', entregue: 'entregue', validado: 'validado', recusado: 'recusado' };
  return [
    ...pmo.marcos.map(x => `${x.codigo || ''} ${x.nome}${x.data_prevista ? `: previsto ${fmtDate(x.data_prevista, 'short')}` : ''}${x.concluido ? ' (concluído)' : ''}`),
    ...pmo.backlog.map(b => `${b.codigo || ''} ${b.titulo}${b.estado ? ': ' + (est[b.estado] || b.estado) : ''}${b.versao ? ', ' + b.versao : ''}`),
    ...pmo.riscos.map(r => `${r.codigo || ''} Risco: ${r.titulo}${[r.estado, r.gravidade].filter(Boolean).length ? ` (${[r.estado, r.gravidade].filter(Boolean).join(', ')})` : ''}`),
    ...pmo.decisoes_pendentes.map(d => `${d.codigo || ''} ${d.titulo}${d.estado === 'decidida' ? ': decidida' + (d.decisao ? ' (' + d.decisao + ')' : '') : d.estado === 'pendente' ? ': por decidir' : ''}`),
  ].map(x => x.trim());
}
function pmoMeetingSection(m) {
  const pmo = m.c.pmo; if (!pmo) return '';
  const items = pmoMeetingItems(m);
  return `<section class="r-sec" aria-labelledby="pmo-h"><h2 id="pmo-h">Acompanhamento do projeto</h2>
    ${pmo.estado?.rag && pmo.estado.explicito ? `<p><span class="badge ${RAG_STATUS[pmo.estado.rag]}">${RAG_LABEL[pmo.estado.rag]}, dito na reunião</span> ${esc(pmo.estado.razao || '')}</p>` : ''}
    ${items.length ? `<ul>${items.map(i => `<li>${esc(i.trim())}</li>`).join('')}</ul>` : ''}
    ${m.rec.projeto ? `<p><a class="btn-link" href="#/p/${encodeURIComponent(m.rec.projeto)}">Ver a evolução do projeto</a></p>` : ''}</section>`;
}
function projectSelect(m) {
  if (m.exemplo || !projects().length) return '';
  return `<div class="proj-pick"><label class="field-label" for="proj-sel" style="margin:0">Projeto</label>
    <select class="text-input" id="proj-sel" data-proj-assign="${esc(m.id)}" style="width:auto;min-height:32px;padding:0 var(--s-2)"><option value="">Nenhum</option>${projects().map(p => `<option value="${esc(p.id)}" ${m.rec.projeto === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
    ${m.rec.projeto && !m.c.pmo ? `<span class="field-help" style="margin:0">Sem dados de projeto: <a class="btn-link" href="#/p/${encodeURIComponent(m.rec.projeto)}">reconstrói o histórico</a>.</span>` : ''}</div>`;
}

/* ════════════════ Vistas ════════════════ */
function folderPanel(full) {
  if (!FS_OK) return full ? `<div class="status-line info">${icon('info')}<p>Este navegador não permite o modo pasta. Abre o caderno no Microsoft Edge ou no Google Chrome, ou usa o copiar e colar mais abaixo.</p></div>` : '';
  if (!dirHandle) return `<section class="panel" aria-labelledby="pasta-h"><div class="panel-head"><h2 id="pasta-h">Liga a pasta do caderno</h2></div>
    <p style="margin:0 0 var(--s-4);color:var(--ink-2);max-width:var(--measure)">Escolhe a pasta onde está este caderno (a do ZIP). A partir daí guardas as transcrições do Teams em <code>entrada</code>, escreves <b>/reuniao</b> no Kilo Code e as reuniões aparecem aqui para reveres e guardares.</p>
    <button class="btn primary btn-lg" type="button" data-action="connect-folder">Escolher a pasta do caderno</button></section>`;
  const conflitos = CONFLITOS.length ? `<div class="status-line warn">${icon('alert')}<p>O OneDrive criou ${plural(CONFLITOS.length, 'uma cópia em conflito', 'cópias em conflito')} do ficheiro de dados (${esc(LF.format(CONFLITOS))}). <button class="btn" type="button" data-action="merge-conflicts">Juntar ao caderno</button></p></div>` : '';
  if (dirPerm !== 'granted') return `<div class="callout">${icon('alert')}<p>O navegador precisa da tua autorização para voltar a usar a pasta <b>${esc(dirHandle.name)}</b>. <button class="btn" type="button" data-action="relink">Voltar a ligar a pasta</button></p></div>`;
  const { aguardar, quem, erros, rever } = INBOX;
  if (!aguardar.length && !quem.length && !erros.length && !rever.length) return conflitos + (full ? `<section class="panel" aria-labelledby="pasta-h"><div class="panel-head"><h2 id="pasta-h">Caixa de entrada vazia</h2><p>Pasta ${esc(dirHandle.name)}</p></div>
    <ol class="steps-list"><li>No Teams, transfere a transcrição (.vtt ou .docx) para a pasta <code>${esc(dirHandle.name)}\\${INBOX_DIR}</code>.</li><li>Este caderno prepara o pedido sozinho, em poucos segundos.</li><li>No Kilo Code, escreve <b>/reuniao</b> e envia.</li><li>Quando o Kilo Code terminar, revês o resultado e guardas.</li></ol></section>` : '');
  return conflitos + `<section class="panel" aria-labelledby="pasta-h" aria-live="polite"><div class="panel-head"><h2 id="pasta-h">Caixa de entrada</h2><p>Pasta ${esc(dirHandle.name)}\\${INBOX_DIR}</p></div>
    ${rever.length ? `<div class="rows" style="margin-bottom:var(--s-4)">${rever.map(r => `<a class="row-link" href="#/rever/${encodeURIComponent(r.base)}"><div class="row-main"><div class="row-title">${esc(r.titulo)}</div><div class="row-sub"><span>Pronta a rever</span><span>${plural(r.n, 'item', 'itens')}</span><span>${esc(r.ficheiro)}</span></div></div><span class="btn">Rever</span></a>`).join('')}</div>` : ''}
    ${quem.map(q => `<div class="step-head" style="margin:0 0 var(--s-4)"><span class="step-num">${icon('users')}</span><div style="min-width:0"><h2 style="font-size:var(--t-base)">Quem és tu em “${esc(q.ficheiro)}”?</h2>
      <div class="people-pick" style="margin-top:var(--s-2)">${q.speakers.map(sp => `<button type="button" class="chip" data-inbox-who="${esc(q.base)}" data-alias="${esc(sp)}" translate="no">${esc(displayName(sp))}</button>`).join('')}<button type="button" class="chip" data-inbox-who="${esc(q.base)}" data-alias="">Não participei</button></div></div></div>`).join('')}
    ${aguardar.length ? `<div class="status-line info" style="margin-top:0">${icon('clock')}<p><b>${plural(aguardar.length, 'transcrição pronta', 'transcrições prontas')} para o Kilo Code</b> (${esc(LF.format(aguardar.map(a => a.ficheiro)))}). No Kilo Code, escreve <b>/reuniao</b> e envia. A resposta aparece aqui para rever.</p></div>` : ''}
    ${erros.map(e => `<div class="status-line bad">${icon('alert')}<p>${esc(e.msg)}</p></div>`).join('')}
  </section>`;
}

function welcomePanel() {
  return `<section class="panel welcome" aria-labelledby="wel-h">
    <h2 id="wel-h">Bem-vindo ao teu caderno de reuniões</h2>
    <p>Diz-nos o teu nome para o caderno saber quais são as tuas falas e as tuas tarefas. Fica guardado só neste computador.</p>
    <form class="actions" data-form="owner"><label class="sr-only" for="owner-name">O teu nome</label>
      <input class="text-input" id="owner-name" name="nome" autocomplete="name" placeholder="Ex.: Ana Silva…" style="flex:1;min-width:200px" required>
      <button class="btn primary btn-lg" type="submit">Guardar</button></form>
  </section>`;
}
function homeSentence(mine, late) {
  const since = addDays(TODAY, -7), week = meetings.filter(m => (m.date || '') >= since && (m.date || '') <= TODAY);
  const hours = week.reduce((x, m) => x + (m.dur || 0), 0);
  const parts = [];
  parts.push(week.length ? `<b>${plural(week.length, 'reunião', 'reuniões')}</b> nos últimos 7 dias${hours >= 60 ? `, <b>${fmtDur(hours)}</b> em conversa` : ''}.` : 'Nenhuma reunião nos últimos 7 dias.');
  if (mine.length) parts.push(`${knowsMe() ? 'Tens' : 'Há'} <b>${plural(mine.length, 'tarefa', 'tarefas')}</b> em aberto${late.length ? `, <b>${plural(late.length, 'atrasada', 'atrasadas')}</b>` : ''}.`);
  else parts.push('Sem tarefas em aberto.');
  const w = knowsMe() ? allTodos.filter(t => !isDone(t) && waitingTodo(t)).length : 0;
  if (w) parts.push(`<b>${plural(w, 'coisa está', 'coisas estão')}</b> à espera de outras pessoas.`);
  const hot = projects().map(p => ({ p, M: projectMetrics(p) })).filter(x => x.M.health === 'bad' || x.M.health === 'warn');
  if (hot.length) parts.push(hot.length === 1 ? `O projeto <b>${esc(hot[0].p.nome)}</b> ${hot[0].M.health === 'bad' ? 'está crítico' : 'pede atenção'}.` : `<b>${plural(hot.length, 'projeto pede', 'projetos pedem')}</b> atenção.`);
  return parts.join(' ');
}
function viewHome() {
  const who = OWNER() ? `${esc(displayName(OWNER()))}, <span translate="no">${esc(TEAM())}</span>` : `<span translate="no">${esc(TEAM())}</span>`;
  const month = TODAY.slice(0, 7), inMonth = meetings.filter(m => (m.date || '').startsWith(month));
  const open = allTodos.filter(t => !isDone(t)), mine = knowsMe() ? open.filter(mineTodo) : open;
  const late = mine.filter(t => t.due && t.due < TODAY);
  const waiting = knowsMe() ? open.filter(waitingTodo) : [];
  const byDue = arr => arr.slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (b.m.date || '').localeCompare(a.m.date || ''));
  const next = byDue(mine).slice(0, 6), nextW = byDue(waiting).slice(0, 6);
  const toConfirm = meetings.filter(m => !m.exemplo).reduce((n, m) => n + m.flags, 0);
  const last = meetings[0], lastTip = meetings.find(m => m.tip);
  const ps = projects().map(p => ({ p, M: projectMetrics(p) }));
  const recent = `<section class="panel" aria-labelledby="recent-h"><div class="panel-head"><h2 id="recent-h">Reuniões recentes</h2></div>
    <div class="rows">${meetings.slice(0, 6).map(m => `<a class="row-link" href="${meetingHref(m)}"><div class="row-main"><div class="row-title">${esc(m.title)}</div><div class="row-sub"><span>${fmtDate(m.date, 'short')}</span>${m.dur ? `<span>${fmtDur(m.dur)}</span>` : ''}<span>${plural(m.people.length, 'pessoa', 'pessoas')}</span></div></div><span class="badge">${esc(m.type)}</span></a>`).join('')}</div></section>`;
  const projPanel = ps.length ? `<section class="panel" aria-labelledby="hp-h"><div class="panel-head"><h2 id="hp-h">Projetos</h2><a class="btn-link" href="#/projetos">Ver todos</a></div>
    <div class="rows">${ps.map(({ p, M }) => { const nx = M.marcos.find(x => !x.concluido); return `<a class="health-row" href="#/p/${encodeURIComponent(p.id)}"><div class="row-main" style="flex:1"><div class="row-title">${esc(p.nome)}</div><div class="row-sub">${nx ? `<span>${esc(nx.nome)}, ${fmtDate(nx.atual, 'short')}${nx.slip > 0 ? ` (+${nx.slip} d)` : ''}</span>` : ''}<span>${plural(M.alerts.length, 'alerta', 'alertas')}</span></div></div>${M.health ? `<span class="badge ${M.health}">${HEALTH_LABEL[M.health]}</span>` : ''}</a>`; }).join('')}</div></section>` : '';
  return `<div class="page wide">
    <div class="page-head" style="margin-bottom:var(--s-8)"><div><h1 tabindex="-1" class="home-h1">A tua semana</h1>
      ${last ? `<p class="home-lead">${homeSentence(mine, late)}</p>` : ''}<p class="page-sub" style="font-size:var(--t-sm);color:var(--ink-3)">${who}, ${fmtDate(TODAY, 'weekday')}</p></div></div>
    <div class="stack">
      ${!OWNER() ? welcomePanel() : ''}
      ${usingExamples() ? `<div class="callout">${icon('info')}<p>Estas são <b>reuniões de exemplo</b>, para veres como fica. Desaparecem quando a primeira reunião tua entrar no caderno.</p></div>` : ''}
      ${OWNER() ? folderPanel(false) : ''}
      ${last ? `<div class="stats">
        <div class="stat"><div class="stat-v">${nf(inMonth.length)}</div><div class="stat-l">${inMonth.length === 1 ? 'Reunião' : 'Reuniões'} este mês</div><div class="stat-h">${nf(meetings.length)} no total</div></div>
        <div class="stat"><div class="stat-v">${fmtDur(inMonth.reduce((x, m) => x + (m.dur || 0), 0))}</div><div class="stat-l">Em reuniões este mês</div><div class="stat-h">${fmtDur(meetings.reduce((x, m) => x + (m.dur || 0), 0))} no total</div></div>
        <div class="stat"><div class="stat-v">${nf(mine.length)}</div><div class="stat-l">${knowsMe() ? 'Tarefas tuas' : 'Tarefas'} em aberto${late.length ? `<span class="badge bad">${plural(late.length, 'atrasada', 'atrasadas')}</span>` : ''}</div><div class="stat-h">${nf(open.length)} em aberto no total</div></div>
        <div class="stat"><div class="stat-v">${nf(waiting.length)}</div><div class="stat-l">À espera de outros</div><div class="stat-h">${waiting.filter(t => t.due && t.due < TODAY).length ? `${plural(waiting.filter(t => t.due && t.due < TODAY).length, 'passou', 'passaram')} do prazo` : 'Tarefas e pedidos de outras pessoas'}</div></div>
      </div>
      <section class="panel" aria-labelledby="last-h">
        <div class="panel-head"><h2 id="last-h">Última reunião</h2><span class="muted" style="font-size:var(--t-xs)">${fmtDate(last.date, 'weekday')}${last.dur ? `, ${fmtDur(last.dur)}` : ''}</span></div>
        <a class="last-title" href="${meetingHref(last)}">${esc(last.title)}</a>
        ${ribbon(last)}
        ${last.lead ? `<p style="margin:var(--s-4) 0 0;color:var(--ink-2);max-width:var(--measure);font-size:var(--t-md)">${esc(curly(last.lead))}</p>` : ''}
        <p style="margin:var(--s-4) 0 0"><a class="btn-link" href="${meetingHref(last)}">Abrir a reunião</a></p>
      </section>
      ${toConfirm ? `<div class="status-line warn" style="margin:0">${icon('alert')}<p>${plural(toConfirm, 'item das tuas reuniões está', 'itens das tuas reuniões estão')} por confirmar. Aparecem marcados “A confirmar” nas reuniões e nas tarefas.</p></div>` : ''}
      <div class="cols-2">
        <section class="panel" aria-labelledby="next-h"><div class="panel-head"><h2 id="next-h">${knowsMe() ? 'As tuas tarefas' : 'Tarefas em aberto'}</h2><a class="btn-link" href="#/tarefas" data-f-go="who:mine">Ver todas</a></div>
          ${next.length ? `<div>${next.map(taskRow).join('')}</div>` : '<p class="muted">Nada pendente.</p>'}</section>
        ${knowsMe() ? `<section class="panel" aria-labelledby="wait-h"><div class="panel-head"><h2 id="wait-h">À espera de outros</h2><a class="btn-link" href="#/tarefas" data-f-go="who:others">Ver todos</a></div>
          ${nextW.length ? `<div>${nextW.map(taskRow).join('')}</div>` : '<p class="muted">Ninguém te deve nada.</p>'}</section>` : (projPanel || recent)}
      </div>
      ${knowsMe() ? `<div class="cols-2">${recent}${projPanel}</div>` : (projPanel ? recent : '')}
      ${coachingOn() && lastTip ? `<div class="tip"><strong>Foco de comunicação:</strong> ${esc(curly(lastTip.tip))} <a class="btn-link" href="#/evolucao">Ver a tua evolução</a></div>` : ''}` : ''}
    </div>
  </div>`;
}

function renderSection(s, idx) {
  const h = `<h2 id="sec-${idx}">${esc(s.titulo)}</h2>`;
  let body = '';
  if (s.tipo === 'decisoes') body = s.itens.map(i => `<div class="decision">${icon('check')}<span>${esc(curly(i))}</span></div>`).join('');
  else if (s.tipo === 'riscos') body = s.itens.map(i => `<div class="risk">${icon('alert')}<span>${esc(curly(i))}</span></div>`).join('');
  else if (s.tipo === 'lista') body = `<ul>${s.itens.map(i => `<li>${esc(curly(i))}</li>`).join('')}</ul>`;
  else if (s.tipo === 'texto') body = s.texto.split(/\n+/).map(p => `<p>${esc(curly(p))}</p>`).join('');
  else if (s.tipo === 'tabela') body = `<div class="tbl-wrap"><table><thead><tr>${s.colunas.map((c, i) => `<th scope="col"${i && /valor|n[uú]mero|%|€/i.test(c) ? ' class="num"' : ''}>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.linhas.map(r => `<tr>${r.map((c, i) => `<td${i && /valor|n[uú]mero|%|€/i.test(s.colunas[i] || '') ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  else if (s.tipo === 'citacoes') body = s.itens.map(i => `<blockquote>${esc(curly('"' + i.texto.replace(/^["“]|["”]$/g, '') + '"'))}${i.quem ? `<br><small>${esc(displayName(i.quem))}</small>` : ''}</blockquote>`).join('');
  else if (s.tipo === 'pessoas') body = s.itens.map(i => `<div class="person-row"><strong translate="no">${esc(personLabel(i.quem))}</strong>: ${esc(curly(i.texto))}${i.citacao ? ` <em>${esc(curly('"' + i.citacao.replace(/^["“]|["”]$/g, '') + '"'))}</em>` : ''}</div>`).join('');
  return `<section class="r-sec" aria-labelledby="sec-${idx}">${h}${body}</section>`;
}
/* ════════════════ Rever antes de guardar ════════════════
   Mesmo ecrã para o copiar e colar e para a caixa de entrada. Cada item mostra a citação e o minuto; pode ser
   reclassificado, editado ou deixado de fora. Os itens a confirmar ficam marcados até alguém os confirmar. */
let REVIEW = null; // rascunho aberto a partir da caixa de entrada
const quoteHTML = (it, cls = 'ev', withTime = true) => it.citacao ? `<p class="${cls}">${withTime && it.minuto ? `<span class="ev-t">${esc(it.minuto)}</span>` : ''}${it.dito_por ? `<span translate="no">${esc(personLabel(it.dito_por))}</span>: ` : ''}<q>${esc(it.citacao)}</q></p>` : '';
const evBadge = it => it.ev === 'ok' ? '' : it.ev === 'nao' ? '<span class="badge bad">Citação não encontrada</span>' : '';
function reviewForm(d, ctx) {
  const p = d.p, rows = [];
  const order = ['decisoes', 'tarefas', 'pedidos', 'bloqueios', 'perguntas', 'propostas', 'retomar'];
  for (const k of order) (p[k] || []).forEach((it, i) => rows.push({ k, i, it }));
  const kindSel = (k, id) => `<select class="text-input rv-kind" name="kind" aria-label="Tipo" id="${id}">${ITEM_KINDS.map(([kk, one]) => `<option value="${kk}" ${kk === k ? 'selected' : ''}>${one}</option>`).join('')}</select>`;
  const flags = rows.filter(r => r.it.confirmar).length;
  const row = ({ k, i, it }, n) => {
    const person = it.responsavel ?? it.para ?? it.quem ?? '';
    return `<div class="rv-item ${it.confirmar ? 'flag' : ''}" data-from="${k}" data-i="${i}">
      <label class="rv-keep"><input type="checkbox" name="keep" checked><span class="sr-only">Guardar este item</span></label>
      <div class="rv-main">
        <div class="rv-top">${kindSel(k, `rv-k-${n}`)}<label class="sr-only" for="rv-t-${n}">Texto</label><input class="text-input rv-text" id="rv-t-${n}" name="texto" value="${esc(itemText(it))}"></div>
        <div class="rv-fields">
          <label><span>${k === 'pedidos' ? 'A quem' : k === 'tarefas' ? 'Responsável' : 'Quem'}</span><input class="text-input" name="pessoa" value="${esc(person)}" placeholder="Ninguém disse" translate="no"></label>
          <label class="rv-due"><span>Prazo${it.prazo_dito ? ` (dito: “${esc(it.prazo_dito)}”)` : ''}</span><input class="text-input" type="date" name="prazo" value="${esc(it.prazo || '')}"></label>
        </div>
        ${quoteHTML(it)}
        ${it.confirmar ? `<p class="rv-flag">${icon('alert')}<span><b>A confirmar:</b> ${esc(it.confirmar)}</span> <label class="rv-ok"><input type="checkbox" name="ok"> Está certo</label></p>` : ''}
      </div></div>`;
  };
  const conclRows = d.concl.map((c, i) => `<label class="rv-item rv-concl ${c.x.ev === 'ok' ? '' : 'flag'}"><input type="checkbox" name="concl" value="${i}" ${c.x.ev === 'ok' ? 'checked' : ''}><div class="rv-main"><b>${esc(c.t.text)}</b><span class="muted"> (${esc(c.t.m.title)}, ${fmtDate(c.t.m.date, 'short')})</span>${quoteHTML(c.x)}${c.x.ev === 'ok' ? '' : `<p class="rv-flag">${icon('alert')}<span>${esc(c.x.confirmar || 'Sem citação de que está feita.')}</span></p>`}</div></label>`).join('');
  return `<form class="review" data-form="review" data-ctx="${esc(ctx)}">
    <div class="form-grid">
      <div><label class="field-label" for="rv-titulo">Título</label><input class="text-input" id="rv-titulo" name="titulo" value="${esc(p.titulo || '')}"></div>
      <div><label class="field-label" for="rv-date">Data da reunião</label><input class="text-input" type="date" id="rv-date" name="date" value="${esc(d.job.date || '')}"></div>
    </div>
    ${p.objetivo || p.resumo ? `<div class="rv-sum">${p.objetivo ? `<p><b>Objetivo:</b> ${esc(p.objetivo)}</p>` : ''}${p.resumo ? `<p>${esc(p.resumo)}</p>` : ''}</div>` : ''}
    <div class="rv-head"><h3>${plural(rows.length, 'item encontrado', 'itens encontrados')}</h3>${flags ? `<span class="badge warn">${plural(flags, 'a confirmar', 'a confirmar')}</span>` : ''}</div>
    <p class="field-help" style="margin-top:0">Desmarca o que não queres guardar. Podes mudar o tipo, o texto, a pessoa e o prazo. Só fica uma tarefa quando alguém a assumiu.</p>
    <div class="rv-list">${rows.length ? rows.map(row).join('') : '<p class="muted">A resposta não tem decisões, tarefas nem pedidos.</p>'}</div>
    ${d.concl.length ? `<div class="rv-head"><h3>Tarefas anteriores dadas como feitas</h3></div><p class="field-help" style="margin-top:0">Só são fechadas as que deixares marcadas.</p><div class="rv-list">${conclRows}</div>` : ''}
    <div class="actions" style="margin-top:var(--s-6)"><button class="btn primary btn-lg" type="submit">${icon('save')}Guardar reunião</button>
      ${ctx.startsWith('inbox:') ? '<button class="btn" type="button" data-action="review-reject">Pedir outra resposta ao Kilo Code</button>' : ''}</div>
  </form>`;
}
function collectReview(form) {
  return {
    titulo: form.titulo.value.trim(), date: form.date.value,
    items: [...form.querySelectorAll('.rv-item[data-from]')].map(el => ({ from: el.dataset.from, i: +el.dataset.i, keep: el.querySelector('[name=keep]').checked, kind: el.querySelector('[name=kind]').value, texto: el.querySelector('[name=texto]').value, pessoa: el.querySelector('[name=pessoa]').value, prazo: el.querySelector('[name=prazo]').value, ok: !!el.querySelector('[name=ok]')?.checked })),
    concl: [...form.querySelectorAll('[name=concl]:checked')].map(x => +x.value),
  };
}
async function viewReview(base) {
  view.innerHTML = `<div class="page"><h1 tabindex="-1">A abrir a resposta…</h1></div>`;
  try {
    if (!dirHandle || dirPerm !== 'granted') throw new Error('Liga a pasta do caderno para rever as respostas do Kilo Code.');
    REVIEW = await loadInboxDraft(base);
  } catch (e) { view.innerHTML = `<div class="page"><h1 tabindex="-1">Não foi possível abrir</h1><p>${esc(e.message)}</p><p><a class="btn-link" href="#/">Voltar ao início</a></p></div>`; return; }
  if (current?.view !== 'rever') return;
  view.innerHTML = `<div class="page">
    <nav class="crumbs" aria-label="Caminho"><a href="#/">Início</a><span aria-hidden="true">/</span><span>Rever</span></nav>
    <div class="page-head"><div><h1 tabindex="-1">Rever antes de guardar</h1><p class="page-sub">${esc(REVIEW.job.ficheiro || base)}. Confirma o que o Kilo Code encontrou antes de entrar no caderno.</p></div></div>
    ${reviewForm(REVIEW, 'inbox:' + base)}</div>`;
  $('h1', view)?.focus({ preventScroll: true });
}

/* ════════════════ Nota rápida (reunião sem transcrição) ════════════════
   Tudo local, sem IA. Cada linha com prefixo vira um item; o resto fica como notas. */
const NOTE_PREFIX = [
  [/^(?:t|tarefa)\s*:\s*/i, 'tarefas'], [/^(?:e|espera|à espera|a espera)\s*:\s*/i, 'pedidos'], [/^(?:d|decis[aã]o)\s*:\s*/i, 'decisoes'],
  [/^(?:\?\s*:?|(?:p|pergunta)\s*:)\s*/i, 'perguntas'], [/^(?:b|bloqueio)\s*:\s*/i, 'bloqueios'], [/^(?:r|retomar)\s*:\s*/i, 'retomar'], [/^(?:pr|proposta)\s*:\s*/i, 'propostas'],
];
function noteDue(text, base) {
  const m = text.match(/\s+(?:até|ate)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*\.?$/i);
  if (!m) return { text, prazo: null, prazo_dito: '' };
  let iso = m[1];
  if (!isISO(iso)) {
    const [d, mo, y] = iso.split('/').map(Number);
    let year = y ? (y < 100 ? 2000 + y : y) : +String(base || TODAY).slice(0, 4);
    iso = `${year}-${pad(mo)}-${pad(d)}`;
    if (!y && iso < (base || TODAY)) iso = `${year + 1}-${pad(mo)}-${pad(d)}`;
  }
  return { text: text.slice(0, m.index).trim(), prazo: isISO(iso) ? iso : null, prazo_dito: m[0].trim() };
}
function parseQuickNote(text, date) {
  const c = { v: 2, titulo: '', objetivo: '', resumo: '', contexto: '', temas: [], etiquetas: [], tarefas_concluidas: [], radar: { correu_bem: [], a_melhorar: [], experimenta: '' }, pmo: null };
  ITEM_KINDS.forEach(([k]) => { c[k] = []; });
  const livre = [];
  for (const raw of String(text || '').split('\n')) {
    const l = raw.trim().replace(/^[-•*]\s+/, ''); if (!l) continue;
    const hit = NOTE_PREFIX.find(([re]) => re.test(l));
    if (!hit) { livre.push(l); continue; }
    const k = hit[1], body = l.replace(hit[0], '').trim(); if (!body) continue;
    const base = { minuto: '', citacao: '', ev: 'nota', confirmar: '' };
    if (k === 'tarefas') { const d = noteDue(body, date); c.tarefas.push({ ...base, acao: d.text, responsavel: 'Eu', prazo: d.prazo, prazo_dito: d.prazo_dito, feito: false }); }
    else if (k === 'pedidos') {
      const d = noteDue(body, date), sp = d.text.match(/^(.+?)\s+(?:—|–|-)\s+(.+)$/) || d.text.match(/^([^:]{2,40}):\s*(.+)$/);
      const it = { ...base, acao: sp ? sp[2].trim() : d.text, para: sp ? sp[1].trim() : '', quem: 'Eu', prazo: d.prazo, prazo_dito: d.prazo_dito, feito: false };
      if (!it.para) it.confirmar = 'Diz de quem estás à espera: “E: Nome — o quê”.';
      c.pedidos.push(it);
    } else c[k].push({ ...base, texto: body, quem: '' });
  }
  c.notas_livres = livre.join('\n');
  return c;
}
let NOTE = null;
function viewNote() {
  if (!NOTE) NOTE = { titulo: '', date: TODAY, pessoas: '', texto: '' };
  return `<div class="page">
    <nav class="crumbs" aria-label="Caminho"><a href="#/nova">Nova reunião</a><span aria-hidden="true">/</span><span>Nota rápida</span></nav>
    <div class="page-head"><div><h1 tabindex="-1">Nota rápida</h1><p class="page-sub">Para reuniões sem transcrição: presenciais, chamadas, corredor. Fica tudo neste caderno, sem passar pelo Kilo Code.</p></div></div>
    <form class="stack note-form" data-form="note" style="gap:var(--s-5)">
      <div class="form-grid">
        <div><label class="field-label" for="n-titulo">Título</label><input class="text-input" id="n-titulo" name="titulo" value="${esc(NOTE.titulo)}" placeholder="Ex.: Revisão de SLA com o fornecedor…" required></div>
        <div><label class="field-label" for="n-date">Data</label><input class="text-input" type="date" id="n-date" name="date" value="${esc(NOTE.date)}"></div>
      </div>
      <div><label class="field-label" for="n-pessoas">Quem estava</label><input class="text-input" id="n-pessoas" name="pessoas" value="${esc(NOTE.pessoas)}" placeholder="Ex.: Ana Costa; Rui Lopes" translate="no"><p class="field-help">Separa os nomes com ponto e vírgula.</p></div>
      <div><label class="field-label" for="n-texto">Notas</label>
        <textarea class="text-area note-text" id="n-texto" name="texto" spellcheck="true" placeholder="Escreve à vontade. Começa a linha por:\nD: decisão\nT: tarefa tua (até 12/11)\nE: Nome — o que estás à espera dessa pessoa\n?: pergunta em aberto\nB: bloqueio\nR: para retomar">${esc(NOTE.texto)}</textarea>
        <p class="field-help"><code>D:</code> decisão, <code>T:</code> tarefa tua, <code>E: Nome — …</code> à espera de alguém, <code>?</code> pergunta, <code>B:</code> bloqueio, <code>R:</code> retomar. Acaba com “até 12/11” para dar um prazo. O resto fica como notas.</p></div>
      <div id="note-preview" aria-live="polite">${notePreview()}</div>
      <div class="actions"><button class="btn primary btn-lg" type="submit">${icon('save')}Guardar nota</button><button class="btn" type="button" data-action="note-reset">Limpar</button></div>
    </form></div>`;
}
function notePreview() {
  const c = parseQuickNote(NOTE.texto, NOTE.date);
  const rows = ITEM_KINDS.flatMap(([k, one]) => c[k].map(it => `<li><span class="item-kind">${esc(one)}</span>${esc(itemText(it))}${it.para ? ` <span class="badge" translate="no">${esc(it.para)}</span>` : ''}${it.prazo ? ` <span class="badge">${fmtDate(it.prazo, 'short')}</span>` : ''}${it.confirmar ? ` <span class="badge warn" title="${esc(it.confirmar)}">A confirmar</span>` : ''}</li>`));
  return rows.length ? `<div class="rv-sum"><p><b>Vai ficar assim:</b></p><ul class="note-preview">${rows.join('')}</ul></div>` : '';
}
async function saveNote(f) {
  NOTE = { titulo: f.titulo.value.trim(), date: f.date.value || TODAY, pessoas: f.pessoas.value, texto: f.texto.value };
  if (!NOTE.titulo) { toast('Dá um título à nota.'); return; }
  const c = parseQuickNote(NOTE.texto, NOTE.date); c.titulo = NOTE.titulo;
  for (const [k] of ITEM_KINDS) c[k].forEach(it => { it.id = uid(); });
  const pessoas = NOTE.pessoas.split(';').map(x => x.trim()).filter(Boolean);
  if (OWNER() && !pessoas.some(isMe)) pessoas.unshift(OWNER());
  const rec = recordFromJob({ date: NOTE.date, fonte: 'nota', aproximado: false, alias: OWNER() || null, ficheiro: null, origem: `nota-${uid()}`, pessoas, turns: [] }, c);
  rec.revisto_em = stamp();
  STATE.reunioes.push(rec); NOTE = null;
  await persist('Nota guardada.'); rebuild(); renderList(); renderNav(); go(meetingHref({ id: rec.id }));
}

/* ════════════════ Reunião: resumo estruturado ════════════════ */
const timeBtnFor = (m, minuto) => { const sec = parseClock(minuto); return sec == null || !m.turns.length ? '' : `<button type="button" class="time-btn" data-seek="${sec}" title="Ver na transcrição">${esc(minuto)}</button>`; };
const flagHTML = (m, k, i, it) => it.confirmar ? `<span class="badge warn" title="${esc(it.confirmar)}">A confirmar</span>${m.exemplo ? '' : `<button type="button" class="btn-link confirm-btn" data-action="confirm-item" data-k="${k}" data-i="${i}">Confirmar</button>`}` : '';
function itemRow(m, k, i, it, label) {
  if (isTaskKind(k)) {
    const t = m.todos.find(x => x.t === it); if (!t) return '';
    return `<div class="todo-item ${it.confirmar ? 'flagged' : ''}"><label><input type="checkbox" data-key="${esc(t.key)}" ${isDone(t) ? 'checked' : ''}><span>${esc(t.text)}${it.confirmar ? `<small class="flag-why">${esc(it.confirmar)}</small>` : ''}</span></label><span class="todo-side">${k === 'pedidos' ? `<span class="badge" translate="no" title="À espera de">${esc(t.owner ? personLabel(t.owner) : 'A quem?')}</span>` : ownerBadge(t)}${dueBadge(t, isDone(t))}${flagHTML(m, k, i, it)}${timeBtnFor(m, it.minuto)}</span>${quoteHTML(it, 'ev', !m.turns.length)}</div>`;
  }
  return `<div class="item-row ${it.confirmar ? 'flagged' : ''}"><div class="item-main">${label ? `<span class="item-kind">${esc(label)}</span>` : ''}<span>${esc(curly(it.texto))}</span>${it.confirmar ? `<small class="flag-why">${esc(it.confirmar)}</small>` : ''}${quoteHTML(it, 'ev', !m.turns.length)}</div><span class="todo-side">${flagHTML(m, k, i, it)}${timeBtnFor(m, it.minuto)}</span></div>`;
}
function structuredBody(m) {
  const c = m.c;
  const list = k => (c[k] || []).map((it, i) => ({ k, i, it }));
  const mineT = list('tarefas').filter(x => isMe(x.it.responsavel));
  const othersT = list('tarefas').filter(x => !isMe(x.it.responsavel));
  const waiting = [...othersT, ...list('pedidos')];
  const retomar = [...list('perguntas').map(x => ({ ...x, l: 'Pergunta' })), ...list('propostas').map(x => ({ ...x, l: 'Proposta' })), ...list('retomar').map(x => ({ ...x, l: '' }))];
  const sec = (id, title, arr, empty, sub) => `<section class="r-sec" aria-labelledby="${id}"><h2 id="${id}">${title}${arr.length ? ` <span class="count">${nf(arr.length)}</span>` : ''}</h2>${sub ? `<p class="sec-sub">${sub}</p>` : ''}${arr.length ? arr.map(x => itemRow(m, x.k, x.i, x.it, x.l)).join('') : `<p class="muted">${empty}</p>`}</section>`;
  return `
    ${sec('dec-h', 'Decisões', list('decisoes'), 'Nenhuma decisão explícita.')}
    ${sec('mt-h', 'As minhas tarefas', mineT, 'Nada assumido por ti.')}
    ${sec('wt-h', 'À espera de outros', waiting, 'Nada à espera de outras pessoas.', 'Tarefas que outras pessoas assumiram e pedidos que lhes fizeste.')}
    ${list('bloqueios').length ? sec('bl-h', 'Bloqueios', list('bloqueios'), '') : ''}
    ${retomar.length ? sec('rt-h', 'Para retomar', retomar, '', 'Perguntas em aberto, propostas sem decisão e assuntos por fechar.') : ''}
    ${(c.notas_ia || []).length ? `<section class="r-sec" aria-labelledby="ni-h"><h2 id="ni-h">Outras notas</h2>${c.notas_ia.map(n => `<h3>${esc(n.titulo)}</h3>${n.texto.split(/\n+/).map(x => `<p>${esc(curly(x))}</p>`).join('')}`).join('')}</section>` : ''}
    ${c.notas_livres ? `<section class="r-sec" aria-labelledby="nl-h"><h2 id="nl-h">Notas</h2>${c.notas_livres.split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('')}</section>` : ''}`;
}

function viewMeeting(m) {
  const c = m.c, idx = meetings.indexOf(m), newer = meetings[idx - 1], older = meetings[idx + 1];
  const rel = relatedOf(m);
  const col = colorsOf(m), order = m.data?.order || {};
  const t0 = m.data?.t0 || 0;
  const timeBtn = (label, sec) => sec == null ? '' : `<button type="button" class="time-btn" data-seek="${sec}" title="Ver na transcrição">${esc(label)}</button>`;
  const tasks = m.todos.map(t => {
    const sec = parseClock(t.t.minuto);
    return `<div class="todo-item"><label><input type="checkbox" data-key="${esc(t.key)}" ${isDone(t) ? 'checked' : ''}><span>${esc(t.text)}</span></label><span class="todo-side">${ownerBadge(t)}${dueBadge(t, isDone(t))}${t.t.minuto && sec != null ? timeBtn(t.t.minuto, sec) : ''}</span></div>`;
  }).join('');
  const radar = coachingOn() && ((c.radar && (c.radar.correu_bem.length || c.radar.a_melhorar.length || c.radar.experimenta)) || meOf(m));
  const v2 = c.v === 2;
  view.innerHTML = `<article class="page" aria-labelledby="r-title">
    <nav class="crumbs" aria-label="Caminho"><a href="${withState('#/')}">Início</a><span aria-hidden="true">/</span><span>${esc(m.type)}</span></nav>
    <div class="r-title-row"><h1 id="r-title" tabindex="-1">${esc(m.title)}</h1>${m.exemplo ? '<span class="badge">Exemplo</span>' : ''}
      <div class="r-actions actions">
        <button class="btn" type="button" data-action="copy-ata">${icon('copy')}Copiar ata</button>
        <button class="icon-btn" type="button" data-action="print" aria-label="Imprimir ou guardar em PDF" title="Imprimir ou guardar em PDF">${icon('printer')}</button>
        ${m.exemplo ? '' : `<button class="icon-btn" type="button" data-action="delete" aria-label="Apagar esta reunião" title="Apagar esta reunião">${icon('trash')}</button>`}
      </div></div>
    <div class="r-meta">
      <span>${icon('calendar')}${fmtDate(m.date)}</span>
      ${m.dur ? `<span>${icon('clock')}${fmtDur(m.dur)}</span>` : ''}
      ${m.people.length ? `<span translate="no">${icon('users')}${esc(LF.format(m.people.map(personLabel)))}</span>` : ''}
    </div>
    ${m.tags.length ? `<div class="tags">${m.tags.map(t => `<button class="tag-btn" type="button" data-search="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
    ${projectSelect(m)}
    ${ribbon(m)}
    <div class="r-body" id="r-body">
      ${v2 ? !(c.objetivo || c.resumo || m.flags) ? '' : `<section class="r-sec" aria-labelledby="obj-h"><h2 id="obj-h">Objetivo</h2>${c.objetivo ? `<p class="lead">${esc(curly(c.objetivo))}</p>` : ''}${c.resumo ? `<p>${esc(curly(c.resumo))}</p>` : ''}${m.flags ? `<div class="status-line warn">${icon('alert')}<p>${plural(m.flags, 'item está', 'itens estão')} por confirmar. Vê os marcados abaixo.</p></div>` : ''}</section>`
        : c.resumo ? `<section class="r-sec" aria-labelledby="res-h"><h2 id="res-h">Resumo Executivo</h2><p class="lead">${esc(curly(c.resumo))}</p></section>` : ''}
      ${c.contexto || rel.length ? `<section class="r-sec" aria-labelledby="ctx-h"><h2 id="ctx-h">Contexto</h2>${c.contexto ? `<p>${esc(curly(c.contexto))}</p>` : ''}
        ${rel.length ? `<div class="related rows">${rel.map(x => `<a class="row-link" href="${meetingHref(x)}"><div class="row-main"><div class="row-title">${esc(x.title)}</div><div class="row-sub"><span>${fmtDate(x.date, 'short')}</span><span>${esc(x.type)}</span></div></div></a>`).join('')}</div>` : ''}</section>` : ''}
      ${(c.temas || []).length ? `<section class="r-sec" aria-labelledby="tem-h"><h2 id="tem-h">${v2 ? 'Temas' : 'Temas Discutidos'}</h2><div class="temas">${c.temas.map(t => { const s = parseClock(t.inicio); return `<div class="tema">${s != null ? timeBtn(t.inicio + (t.fim ? '–' + t.fim : ''), s) : '<span></span>'}<b>${esc(t.titulo)}</b><p>${esc(curly(t.resumo))}</p></div>`; }).join('')}</div></section>` : ''}
      ${v2 ? structuredBody(m) : `${(c.seccoes || []).filter(s => s.titulo !== 'Plano de Ação').map(renderSection).join('')}
      ${m.todos.length ? `<section class="r-sec" aria-labelledby="pa-h"><h2 id="pa-h">Plano de Ação</h2>${tasks}</section>` : ''}`}
      ${pmoMeetingSection(m)}
      ${coachingOn() ? participation(m) : ''}
      ${radar ? `<section class="r-sec radar" aria-labelledby="rad-h"><h2 id="rad-h">Radar de Comunicação</h2>${myNumbers(m)}
        ${c.radar?.correu_bem?.length ? `<h3>${icon('check')}<span>O que correu bem</span></h3><ul>${c.radar.correu_bem.map(i => `<li>${esc(curly(i))}</li>`).join('')}</ul>` : ''}
        ${c.radar?.a_melhorar?.length ? `<h3>${icon('up')}<span>A melhorar</span></h3><ul>${c.radar.a_melhorar.map(i => `<li>${esc(curly(i))}</li>`).join('')}</ul>` : ''}
        ${c.radar?.experimenta ? `<div class="tip"><strong>Experimenta na próxima:</strong> ${esc(curly(c.radar.experimenta))}</div>` : ''}</section>` : ''}
      ${m.turns.length ? `<section class="r-sec"><details class="transcript" id="transcript"><summary>${icon('chevron')}Transcrição completa <small>${plural(m.turns.length, 'intervenção', 'intervenções')}</small></summary>
        <div class="turns">${m.turns.map((t, i) => `<div class="turn" id="turn-${i}"><button type="button" class="time-btn" data-seek="${Math.round(t.start - t0)}" tabindex="-1">${clock(t.start - t0)}</button><div><div class="turn-who"><span class="key" style="--c:var(--sp${col[order[t.speaker]] ?? 6})"></span><span translate="no">${esc(personLabel(t.speaker))}</span></div><p>${esc(t.text)}</p></div></div>`).join('')}</div></details></section>` : ''}
    </div>
    <section class="notes r-sec" aria-labelledby="notes-h"><h2 id="notes-h">${m.rec.fonte === 'nota' ? 'Notas adicionais' : 'As minhas notas'}</h2>
      <label class="sr-only" for="note">Notas pessoais sobre esta reunião</label>
      <textarea id="note" name="notas" placeholder="Notas pessoais, follow-ups, contexto…">${esc(m.rec.notas || '')}</textarea>
      <div class="note-status" id="note-status" aria-live="polite">${m.exemplo ? 'As notas das reuniões de exemplo não são guardadas.' : 'Guardadas com a reunião.'}</div></section>
    <nav class="pager" aria-label="Outras reuniões">
      ${older ? `<a href="${withState(meetingHref(older))}"><small>Anterior, ${fmtDate(older.date, 'short')}</small><span>${esc(older.title)}</span></a>` : '<span></span>'}
      ${newer ? `<a class="next" href="${withState(meetingHref(newer))}"><small>Seguinte, ${fmtDate(newer.date, 'short')}</small><span>${esc(newer.title)}</span></a>` : ''}
    </nav>
  </article>`;
  highlightIn($('#r-body'), words(query));
}
function seek(sec) {
  const m = byId.get(current?.id); if (!m) return;
  const t0 = m.data?.t0 || 0;
  let i = m.turns.findIndex(t => t.end - t0 >= sec); if (i < 0) i = m.turns.length - 1;
  const d = $('#transcript'); if (!d) return; d.open = true;
  const el = $('#turn-' + i); if (!el) return;
  el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600);
}
function ataText(m) {
  const c = m.c, L = [];
  L.push(m.title.toUpperCase(), `${fmtDate(m.date)}${m.dur ? ', ' + fmtDur(m.dur) : ''}`);
  if (m.people.length) L.push(`Participantes: ${LF.format(m.people.map(personLabel))}`);
  if (c.v === 2) {
    const flag = it => it.confirmar ? ' (a confirmar)' : '';
    const who = n => n ? (isMe(n) && OWNER() ? displayName(OWNER()) : displayName(n)) : '';
    const blk = (title, arr, f) => { if (arr.length) { L.push('', title); arr.forEach(it => L.push(`- ${f(it)}${flag(it)}`)); } };
    if (c.objetivo) L.push('', 'OBJETIVO', c.objetivo);
    if (c.resumo) L.push('', 'RESUMO', c.resumo);
    blk('TEMAS', c.temas || [], t => `${t.titulo}${t.resumo ? ': ' + t.resumo : ''}`);
    blk('DECISÕES', c.decisoes || [], it => it.texto);
    const due = it => it.prazo ? `, até ${fmtDate(it.prazo)}` : it.prazo_dito ? `, ${it.prazo_dito}` : '';
    blk('TAREFAS', c.tarefas || [], it => `${it.acao} (${who(it.responsavel) || 'sem responsável'}${due(it)})`);
    blk('PEDIDOS', c.pedidos || [], it => `${it.acao} (pedido a ${who(it.para) || '?'}${due(it)})`);
    blk('BLOQUEIOS', c.bloqueios || [], it => it.texto);
    blk('PARA RETOMAR', [...(c.perguntas || []), ...(c.propostas || []), ...(c.retomar || [])], it => it.texto);
    if (c.notas_livres) L.push('', 'NOTAS', c.notas_livres);
    return L.join('\n');
  }
  if (c.resumo) L.push('', 'RESUMO', c.resumo);
  for (const s of c.seccoes || []) {
    L.push('', s.titulo.toUpperCase());
    if (s.tipo === 'texto') L.push(s.texto);
    else if (s.tipo === 'tabela') { L.push(s.colunas.join(' | ')); s.linhas.forEach(r => L.push(r.join(' | '))); }
    else if (s.tipo === 'citacoes' || s.tipo === 'pessoas') s.itens.forEach(i => L.push(`- ${i.quem ? displayName(i.quem) + ': ' : ''}${i.texto}${i.citacao ? ` ("${i.citacao}")` : ''}`));
    else s.itens.forEach(i => L.push(`- ${i}`));
  }
  if (m.todos.length) { L.push('', 'PLANO DE AÇÃO'); m.todos.forEach(t => L.push(`- ${t.text} (${t.owner ? (mineTodo(t) && OWNER() ? displayName(OWNER()) : displayName(t.owner)) : 'sem responsável'}${t.due ? ', até ' + fmtDate(t.due) : ''})`)); }
  return L.join('\n');
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove();
    toast(ok ? okMsg : 'Não foi possível copiar automaticamente. Seleciona o texto e usa Ctrl+C.'); return ok;
  }
}

function viewTasks() {
  const f = prefs.get('filtro-tarefas', { who: 'mine', state: 'open' });
  if (!knowsMe()) f.who = 'all';
  if (!['mine', 'others', 'all'].includes(f.who)) f.who = 'mine';
  const list = allTodos.filter(t => (f.who === 'all' || (f.who === 'mine' ? mineTodo(t) : waitingTodo(t))) && (f.state === 'all' || (f.state === 'open' ? !isDone(t) : isDone(t))))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (b.m.date || '').localeCompare(a.m.date || ''));
  const week = addDays(TODAY, 7);
  const groups = [
    ['Em atraso', list.filter(t => !isDone(t) && t.due && t.due < TODAY), 'late'],
    ['Próximos 7 dias', list.filter(t => !isDone(t) && t.due && t.due >= TODAY && t.due <= week), ''],
    ['Mais tarde', list.filter(t => !isDone(t) && t.due && t.due > week), ''],
    ['Sem prazo', list.filter(t => !isDone(t) && !t.due), ''],
    ['Concluídas', list.filter(isDone), ''],
  ].filter(g => g[1].length);
  return `<div class="page">
    <div class="page-head"><div><h1 tabindex="-1">Tarefas</h1><p class="page-sub">${f.who === 'others' ? 'O que está à espera de outras pessoas: tarefas que assumiram e pedidos que lhes fizeste.' : 'O que assumiste nas reuniões, por prazo.'}</p></div></div>
    <div class="toolbar">
      ${knowsMe() ? `<div class="seg" role="group" aria-label="Responsável"><button type="button" data-f="who:mine" aria-pressed="${f.who === 'mine'}">As minhas</button><button type="button" data-f="who:others" aria-pressed="${f.who === 'others'}">À espera de outros</button><button type="button" data-f="who:all" aria-pressed="${f.who === 'all'}">Todas</button></div>` : ''}
      <div class="seg" role="group" aria-label="Estado"><button type="button" data-f="state:open" aria-pressed="${f.state === 'open'}">Em aberto</button><button type="button" data-f="state:done" aria-pressed="${f.state === 'done'}">Concluídas</button><button type="button" data-f="state:all" aria-pressed="${f.state === 'all'}">Todas</button></div>
    </div>
    ${groups.length ? groups.map(([l, arr, cls]) => `<section class="task-group"><h2 class="${cls}">${l} <span class="count">${nf(arr.length)}</span></h2><div class="panel" style="padding-block:var(--s-3)">${arr.map(taskRow).join('')}</div></section>`).join('')
      : `<div class="empty">${icon('tasks')}<h2>Nada por aqui</h2><p>Não há tarefas com estes filtros.</p></div>`}
  </div>`;
}
function viewPeople() {
  const map = new Map();
  const get = name => { let key = [...map.keys()].find(k => samePerson(k, name)); if (!key) { key = name; map.set(key, { nome: name, reunioes: [], tempo: 0, pcts: [], eu: false }); } return map.get(key); };
  meetings.forEach(m => {
    if (m.data) m.data.oradores.forEach(o => { const p = get(o.nome); p.reunioes.push(m); p.tempo += o.tempo_s; p.pcts.push(o.pct); p.eu = p.eu || o.eu || isMe(o.nome); });
    else m.people.forEach(n => { const p = get(n); p.reunioes.push(m); p.eu = p.eu || isMe(n); });
  });
  const people = [...map.values()].sort((a, b) => b.eu - a.eu || b.reunioes.length - a.reunioes.length || b.tempo - a.tempo);
  const openBy = p => allTodos.filter(t => !isDone(t) && t.owner && !isMe(t.owner) && samePerson(t.owner, p.nome)).length;
  const hue = s => { let h = 0; for (const ch of norm(s)) h = (h * 31 + ch.charCodeAt(0)) % 6; return h + 1; };
  return `<div class="page wide">
    <div class="page-head"><div><h1 tabindex="-1">Pessoas</h1><p class="page-sub">${plural(people.length, 'pessoa', 'pessoas')} em ${plural(meetings.length, 'reunião', 'reuniões')}. Escolhe uma pessoa para ver as reuniões e o que está à espera dela.</p></div></div>
    ${people.length ? `<div class="panel" style="padding:0"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th scope="col">Pessoa</th><th scope="col" class="n">Reuniões</th><th scope="col" class="n">À espera desta pessoa</th><th scope="col" class="n">Última reunião</th></tr></thead>
      <tbody>${people.map(p => { const avg = p.pcts.length ? p.pcts.reduce((a, b) => a + b, 0) / p.pcts.length : null; const last = p.reunioes.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
        return `<tr><td><button type="button" class="person-btn" data-search="${esc(p.nome)}"><span class="avatar" style="--c:var(--sp${p.eu ? 0 : hue(p.nome)})" aria-hidden="true">${esc(initials(personLabel(p.nome)))}</span><span translate="no">${esc(personLabel(p.nome))}</span>${p.eu ? '<span class="badge me">tu</span>' : ''}</button></td>
          <td class="n">${nf(p.reunioes.length)}</td><td class="n">${p.eu ? '—' : nf(openBy(p))}</td><td class="n">${last ? fmtDate(last.date, 'short') : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`
      : `<div class="empty">${icon('users')}<h2>Sem pessoas ainda</h2></div>`}
  </div>`;
}
function viewEvolution() {
  const pts = meetings.filter(meOf).slice().reverse().map(m => ({ m, me: meOf(m), n: m.data.oradores.length }));
  if (!pts.length) return `<div class="page"><h1 tabindex="-1">Evolução</h1>
    <div class="empty">${icon('mic')}<h2>Ainda sem dados sobre ti</h2><p>Ao adicionar uma reunião, escolhe quem és na lista de participantes. A partir daí, cada reunião alimenta esta vista.</p></div></div>`;
  const nRecent = Math.min(3, Math.max(1, Math.floor(pts.length / 2))), recent = pts.slice(-nRecent), prev = pts.slice(0, -nRecent);
  const avg = (arr, k) => arr.reduce((s, p) => s + p.me[k], 0) / arr.length;
  const latest = pts[pts.length - 1], fairLast = 100 / Math.max(2, latest.n);
  const cards = METRICS.map(mt => {
    const series = pts.map(p => ({ v: p.me[mt.k], date: p.m.date, title: p.m.title }));
    const last = series[series.length - 1].v;
    let trend = '';
    if (prev.length) {
      const a = avg(recent, mt.k), b = avg(prev, mt.k), diff = a - b, rel = b ? Math.abs(diff / b) : (diff ? 1 : 0);
      if (rel < .05) trend = '<span class="trend flat">Estável</span>';
      else {
        let good;
        if (mt.better === 'low') good = diff < 0; else if (mt.better === 'high') good = diff > 0;
        else { const mid = mt.k === 'pct' ? fairLast : (mt.band[0] + mt.band[1]) / 2; good = Math.abs(a - mid) < Math.abs(b - mid); }
        trend = `<span class="trend ${good ? 'up' : 'down'}">${diff > 0 ? 'Subiu' : 'Desceu'} ${nf(rel * 100)}%, ${good ? 'a melhorar' : 'a piorar'}</span>`;
      }
    }
    const s = status(mt.k, last, { n: latest.n });
    return `<section class="panel chart-panel" aria-label="${esc(mt.l)}">
      <div class="panel-head" style="margin-bottom:var(--s-2)"><h2>${mt.l}</h2><span class="badge ${s}">${STATUS_LABEL[s]}</span></div>
      <div class="big">${mt.fmt(last)}</div>${trend}
      <p class="stat-h" style="margin:var(--s-1) 0 0">${esc(mt.k === 'pct' ? `Partilha justa na última reunião: ${pctf(fairLast)}` : mt.help)}</p>
      ${lineChart(series, { band: mt.band, ref: mt.k === 'pct' ? fairLast : null, fmt: mt.fmt, label: mt.l })}
    </section>`;
  }).join('');
  const agg = {}; pts.forEach(p => Object.entries(p.me.bordoes || {}).forEach(([w, c]) => { agg[w] = (agg[w] || 0) + c; }));
  const topB = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8), maxB = topB[0]?.[1] || 1;
  const tips = meetings.filter(m => m.tip).slice(0, 5);
  return `<div class="page wide">
    <div class="page-head"><div><h1 tabindex="-1">Evolução</h1><p class="page-sub">A tua comunicação em ${plural(pts.length, 'reunião analisada', 'reuniões analisadas')}. A faixa verde é a zona recomendada.</p></div></div>
    <div class="stack">
      <div class="cols-2">
        <section class="panel" aria-labelledby="ev-sum"><div class="panel-head"><h2 id="ev-sum">${recent.length === 1 ? 'Na última reunião' : `Média das últimas ${recent.length}`}</h2></div><ul class="verdicts">
          ${METRICS.map(mt => { const v = avg(recent, mt.k), s = status(mt.k, v, { n: latest.n }); return `<li><span>${mt.l}: <b class="tabular">${mt.fmt(v)}</b></span><span class="badge ${s}">${STATUS_LABEL[s]}</span></li>`; }).join('')}</ul></section>
        <section class="panel" aria-labelledby="ev-bord"><div class="panel-head"><h2 id="ev-bord">Os teus bordões mais frequentes</h2><p>${plural(pts.length, 'reunião', 'reuniões')}</p></div>
          ${topB.length ? topB.map(([w, c]) => `<div class="hbar"><span>“${esc(w)}”</span><span class="hbar-track" aria-hidden="true"><i style="--p:${(c / maxB).toFixed(3)}"></i></span><span class="tabular" style="text-align:right">${nf(c)}</span></div>`).join('') : '<p class="muted">Nenhum bordão detetado.</p>'}</section>
      </div>
      <div class="cols-3">${cards}</div>
      ${tips.length ? `<section class="panel" aria-labelledby="ev-tips"><div class="panel-head"><h2 id="ev-tips">Dicas recentes do Radar</h2></div><div class="rows">${tips.map(m => `<a class="row-link" href="${meetingHref(m)}"><div class="row-main"><div class="row-title">${esc(curly(m.tip))}</div><div class="row-sub"><span>${esc(m.title)}</span><span>${fmtDate(m.date, 'short')}</span></div></div></a>`).join('')}</div></section>` : ''}
    </div>
  </div>`;
}

/* ── Nova reunião: assistente em 4 passos ── */
let W = null; // estado do assistente
function resetWizard() { W = { ficheiro: null, turns: [], cues: [], aproximado: false, fonte: '', alias: null, date: TODAY, data: null, prompt: '', copied: false, resposta: '', parsed: null, draft: null, erro: '', related: [], pendentes: [] }; }
function wizardAnalyse() {
  W.turns = mergeTurns(W.cues);
  W.data = analyse(W.turns, W.alias);
  const pseudo = { people: W.data ? W.data.oradores.map(o => o.nome) : [], tags: [], date: W.date };
  W.related = usingExamples() ? [] : relatedOf(Object.assign(pseudo, { id: '__nova__' }), 3);
  W.pendentes = pendingFor(W.date);
  W.prompt = buildPrompt(W);
}
function wizardParse() {
  W.parsed = null; W.draft = null; W.erro = '';
  if (!W.resposta.trim()) return;
  try { W.parsed = normalizeAI(extractJSON(W.resposta)); W.draft = makeDraft(W, structuredClone(W.parsed), Object.fromEntries(W.pendentes.map(x => [x.code, x.t.key]))); }
  catch (err) { W.erro = err.message; }
}
function viewNew() {
  if (!W) resetWizard();
  const has = W.turns.length > 0, ready = has && W.alias !== null, valid = !!W.draft;
  const speakers = W.data ? W.data.oradores : [];
  const step = (n, title, sub, body, enabled, done) => `<section class="step ${done ? 'done' : ''}" aria-disabled="${!enabled}" aria-labelledby="st-${n}"><div class="step-head"><span class="step-num">${done ? icon('check') : n}</span><div><h2 id="st-${n}">${title}</h2><p>${sub}</p></div></div>${body}</section>`;
  return `<div class="page">
    <div class="page-head"><div><h1 tabindex="-1">Nova reunião</h1><p class="page-sub">Com a pasta ligada, basta guardar a transcrição em <code>entrada</code> e escrever <b>/reuniao</b> no Kilo Code. Antes de entrar no caderno, revês o resultado.</p></div></div>
    <div class="stack" style="margin-bottom:var(--s-10)">
      <div class="callout">${icon('doc')}<p><b>Reunião sem transcrição?</b> Escreve uma <a class="btn-link" href="#/nota">nota rápida</a>: decisões, tarefas e o que fica à espera de outros, sem precisar do Kilo Code.</p></div>
      ${folderPanel(true)}</div>
    <h2 style="font-size:var(--t-lg);margin:0 0 var(--s-2)">Sem a pasta: copiar e colar</h2>
    <p class="page-sub" style="margin:0 0 var(--s-5)">Plano B, se o modo pasta não estiver disponível. Três passos.</p>
    ${step(1, 'Escolhe a transcrição', 'O ficheiro que descarregaste do Teams (.vtt ou .docx). Também serve texto copiado.', `
      <div class="drop" id="drop" role="button" tabindex="0" aria-describedby="drop-help">${icon('upload')}<b>${W.ficheiro ? esc(W.ficheiro) : 'Arrasta o ficheiro para aqui ou clica para escolher'}</b><span id="drop-help" class="field-help">${has ? `${plural(W.turns.length, 'intervenção', 'intervenções')}, ${plural(speakers.length, 'pessoa', 'pessoas')}${W.data ? ', ' + fmtDur(W.data.duracao_s) : ''}${W.aproximado ? '. Tempos aproximados.' : ''}` : '.vtt, .docx ou .txt'}</span></div>
      <details style="margin-top:var(--s-3)"><summary class="btn-link" style="cursor:pointer">Prefiro colar o texto da transcrição</summary>
        <label class="sr-only" for="paste-transcript">Texto da transcrição</label>
        <textarea class="text-area" id="paste-transcript" placeholder="Cola aqui o texto da transcrição…" style="margin-top:var(--s-2)"></textarea>
        <div class="actions" style="margin-top:var(--s-2)"><button class="btn" type="button" data-action="use-paste">Usar este texto</button></div></details>
      ${has ? `<div class="form-grid" style="margin-top:var(--s-5)">
        <div><label class="field-label" for="w-date">Data da reunião</label><input class="text-input" type="date" id="w-date" value="${esc(W.date)}"><p class="field-help">Serve para converter prazos como “sexta-feira”.</p></div>
        <div><span class="field-label" id="who-l">Quem és tu na reunião?</span>
          <div class="people-pick" role="radiogroup" aria-labelledby="who-l">${speakers.map(o => `<button type="button" class="chip" role="radio" aria-checked="${W.alias === o.nome}" aria-pressed="${W.alias === o.nome}" data-alias="${esc(o.nome)}" translate="no">${esc(displayName(o.nome))}</button>`).join('')}<button type="button" class="chip" role="radio" aria-checked="${W.alias === ''}" aria-pressed="${W.alias === ''}" data-alias="">Não participei</button></div>
          <p class="field-help">Serve para separar as tuas tarefas do que fica à espera de outros. Fica memorizado.</p></div>
      </div>` : ''}`, true, ready)}
    ${step(2, 'Pede o resumo ao Kilo Code', 'Copia o pedido, abre o Kilo Code, cola com Ctrl+V e envia. Espera até a resposta terminar.', `
      <div class="actions"><button class="btn primary btn-lg" type="button" data-action="copy-prompt">${icon('copy')}${W.copied ? 'Copiar de novo' : 'Copiar pedido'}</button><span class="field-help">${ready ? `Pedido com ${nf(W.prompt.length)} caracteres${W.related.length ? `, inclui ${plural(W.related.length, 'reunião anterior', 'reuniões anteriores')} como contexto` : ''}${W.pendentes.length ? ` e ${plural(W.pendentes.length, 'tarefa em aberto', 'tarefas em aberto')}` : ''}.` : 'Primeiro escolhe a transcrição e quem és.'}</span></div>
      <details style="margin-top:var(--s-3)"><summary class="btn-link" style="cursor:pointer">Ver o pedido</summary><label class="sr-only" for="prompt-box">Pedido para o Kilo Code</label><textarea class="text-area prompt-preview" id="prompt-box" readonly style="margin-top:var(--s-2)">${esc(W.prompt)}</textarea></details>`, ready, W.copied)}
    ${step(3, 'Cola a resposta e revê', 'Seleciona toda a resposta no Kilo Code, copia (Ctrl+C) e cola aqui (Ctrl+V). Depois confirma o que entra no caderno.', `
      <label class="sr-only" for="answer">Resposta do Kilo Code</label>
      <textarea class="text-area" id="answer" placeholder="Cola aqui a resposta, começa por {…">${esc(W.resposta)}</textarea>
      <div id="answer-status">${answerStatus()}</div>
      <div id="review-box">${valid ? reviewForm(W.draft, 'wizard') : ''}</div>
      <div class="actions" style="margin-top:var(--s-4)"><button class="btn" type="button" data-action="reset-wizard">Começar de novo</button></div>`, ready, valid)}
  </div>`;
}
function answerStatus() {
  if (!W.resposta.trim()) return '';
  if (W.erro) return `<div class="status-line bad">${icon('alert')}<p>${esc(W.erro)}</p></div>`;
  const p = W.draft?.p; if (!p) return '';
  const n = ITEM_KINDS.reduce((x, [k]) => x + p[k].length, 0), f = ITEM_KINDS.reduce((x, [k]) => x + p[k].filter(i => i.confirmar).length, 0);
  return `<div class="status-line ok">${icon('check')}<p>Resposta válida: <b>${esc(p.titulo || 'sem título')}</b>, ${plural(n, 'item', 'itens')}${f ? `, ${plural(f, 'a confirmar', 'a confirmar')}` : ''}. Revê abaixo e guarda.</p></div>`;
}
async function loadTranscriptFile(file) {
  try {
    const r = await readTranscript(file);
    if (!r.cues.length) throw new Error('Não encontrei falas neste ficheiro. É uma transcrição do Teams?');
    acceptCues(r, file.name);
  } catch (e) { toast(e.message); }
}
function acceptCues(r, name) {
  W.cues = r.cues; W.aproximado = r.aproximado; W.fonte = r.fonte; W.ficheiro = name;
  const dm = (name || '').match(/(\d{4})[-_.](\d{2})[-_.](\d{2})/); if (dm) W.date = `${dm[1]}-${dm[2]}-${dm[3]}`;
  const names = [...new Set(r.cues.map(c => c.speaker))];
  const known = names.find(n => isMe(n));
  W.alias = known ?? (names.length === 1 ? names[0] : null);
  W.copied = false; W.parsed = null; W.draft = null; W.resposta = ''; W.erro = '';
  wizardAnalyse(); rerenderWizard();
}
function rerenderWizard() { const y = main.scrollTop; view.innerHTML = viewNew(); main.scrollTop = y; }
async function saveMeeting(rv) {
  if (!W.draft) return;
  W.origem = W.origem || `copiar-${uid()}`;
  const rec = finishDraft(W.draft, rv);
  rememberAlias(W.alias);
  STATE.reunioes.push(rec);
  await persist('Reunião guardada.');
  resetWizard(); rebuild(); renderList(); renderNav(); go('#/r/' + encodeURIComponent(rec.id));
}

function viewSettings() {
  const folderStatus = !FS_OK ? 'Este navegador não permite o modo pasta. Usa o Microsoft Edge ou o Google Chrome.'
    : dirHandle ? (dirPerm === 'granted' ? `Ligado à pasta <b>${esc(dirHandle.name)}</b>. As reuniões são gravadas em <code>${DATA_FILE}</code> e as transcrições entram por <code>${INBOX_DIR}</code>.` : `Ligado à pasta <b>${esc(dirHandle.name)}</b>, mas o navegador pede autorização.`) + (writeFailed ? ' A última gravação na pasta falhou: os dados estão só neste navegador.' : '')
    : 'Não ligado. As reuniões ficam só neste navegador.';
  return `<div class="page">
    <div class="page-head"><div><h1 tabindex="-1">Definições</h1><p class="page-sub">O teu nome, onde ficam guardados os dados e cópias de segurança.</p></div></div>
    <div class="stack">
      <section class="panel" aria-labelledby="set-me"><div class="panel-head"><h2 id="set-me">Sobre ti</h2></div>
        <form data-form="settings" class="stack" style="gap:var(--s-4)">
          <div class="form-grid">
            <div><label class="field-label" for="s-nome">O teu nome</label><input class="text-input" id="s-nome" name="nome" autocomplete="name" value="${esc(OWNER())}" placeholder="Ex.: Ana Silva…"></div>
            <div><label class="field-label" for="s-equipa">Equipa</label><input class="text-input" id="s-equipa" name="equipa" value="${esc(TEAM())}"></div>
          </div>
          <div><label class="field-label" for="s-alias">Como apareces nas transcrições do Teams</label><input class="text-input" id="s-alias" name="aliases" value="${esc((STATE.aliases || []).join('; '))}" placeholder="Ex.: Silva, Ana…" spellcheck="false"><p class="field-help">Separa vários nomes com ponto e vírgula. É preenchido sozinho quando escolhes quem és numa reunião.</p></div>
          <div class="actions"><button class="btn primary" type="submit">Guardar</button></div>
        </form></section>
      <section class="panel" aria-labelledby="set-file"><div class="panel-head"><h2 id="set-file">Pasta do caderno</h2></div>
        <p style="margin:0 0 var(--s-4);color:var(--ink-2);max-width:var(--measure)">A pasta onde está este caderno, de preferência no OneDrive. Guarda as reuniões num ficheiro teu e é por onde o Kilo Code entrega os resumos.</p>
        <div class="status-line info">${icon('info')}<p>${folderStatus}</p></div>
        ${FS_OK ? `<div class="actions" style="margin-top:var(--s-4)">
          ${dirHandle && dirPerm !== 'granted' ? `<button class="btn primary" type="button" data-action="relink">Voltar a ligar a pasta</button>` : ''}
          <button class="btn ${dirHandle ? '' : 'primary'}" type="button" data-action="connect-folder">${dirHandle ? 'Escolher outra pasta' : 'Escolher a pasta do caderno'}</button>
          ${dirHandle ? `<button class="btn" type="button" data-action="unlink">Desligar</button>` : ''}</div>` : ''}
        ${CONFLITOS.length ? `<div class="status-line warn">${icon('alert')}<p>Há ${plural(CONFLITOS.length, 'cópia em conflito', 'cópias em conflito')} do OneDrive na pasta. <button class="btn" type="button" data-action="merge-conflicts">Juntar ao caderno</button></p></div>` : ''}
        <p class="field-help" style="margin-top:var(--s-4)">Se usares o caderno em mais de um PC ou janela, as alterações são juntadas registo a registo: nada do que foi gravado noutro lado se perde.</p>
      </section>
      <section class="panel" aria-labelledby="set-coach"><div class="panel-head"><h2 id="set-coach">Coaching de comunicação</h2></div>
        <label class="switch-row"><input type="checkbox" id="s-coaching" ${coachingOn() ? 'checked' : ''}><span><b>Mostrar o coaching de comunicação</b><br><span class="muted">Opcional. Junta à reunião o Radar sobre como tu falaste (ritmo, bordões, perguntas) e a vista Evolução. Nunca avalia as outras pessoas nem entra na saúde dos projetos.</span></span></label></section>
      <section class="panel" aria-labelledby="set-copy"><div class="panel-head"><h2 id="set-copy">Cópias de segurança</h2></div>
        <div class="actions"><button class="btn" type="button" data-action="export">Descarregar cópia</button><button class="btn" type="button" data-action="import">Importar cópia</button></div>
        <p class="field-help">A importação junta as reuniões da cópia às que já tens, sem duplicar.</p></section>
      <section class="panel" aria-labelledby="set-del"><div class="panel-head"><h2 id="set-del">Apagar tudo</h2></div>
        <p style="margin:0 0 var(--s-3);color:var(--ink-2)">Apaga todas as reuniões deste navegador. O ficheiro de dados, se existir, fica intacto até guardares algo novo.</p>
        <button class="btn danger" type="button" data-action="wipe">Apagar todas as reuniões</button></section>
    </div>
  </div>`;
}
function viewHelp() {
  return `<article class="page help">
    <h1 tabindex="-1">Como usar</h1>
    <p class="page-sub">O teu caderno de reuniões: o que se decidiu, o que tens de fazer e o que está à espera de outras pessoas.</p>
    <h2>Como funciona</h2>
    <p>O caderno e o Kilo Code não falam diretamente: trocam ficheiros na pasta <code>entrada</code>. O caderno prepara um pedido por transcrição, o Kilo Code escreve a resposta e tu revês o resultado antes de guardar.</p>
    <h2>Preparar (uma vez)</h2>
    <ol><li>Copia a pasta <b>Caderno de Reuniões</b> do ZIP para o teu OneDrive.</li>
      <li>Abre <b>Caderno de Reuniões.html</b> com o Microsoft Edge ou o Google Chrome e escreve o teu nome.</li>
      <li>Clica em <b>Escolher a pasta do caderno</b> e escolhe essa pasta. Confirma <b>Permitir</b>.</li>
      <li>Escolhe como vais usar o Kilo Code: <b>duplo clique em “Atualizar caderno.bat”</b> (o mais simples, usa o Kilo Code do terminal) ou, no VS Code, <b>File</b>, <b>Open Folder…</b>, a mesma pasta, e o painel do Kilo Code.</li></ol>
    <h2>Em cada reunião com transcrição</h2>
    <ol><li>No Teams: reunião, <b>Gravações e transcrições</b>, <b>Transferir</b> (.vtt ou .docx). Guarda em <code>Caderno de Reuniões\entrada</code>.</li>
      <li>Duplo clique em <b>Atualizar caderno.bat</b>. No VS Code, escreve “atualiza o caderno” no Kilo Code.</li>
      <li>Abre o caderno: a reunião aparece no Início como <b>pronta a rever</b>. Confirma, corrige ou tira o que não estiver certo e clica em <b>Guardar reunião</b>.</li></ol>
    <h2>Reuniões sem transcrição</h2>
    <p>Em <a class="btn-link" href="#/nota">Nota rápida</a>, escreve as notas. Começa as linhas por <code>D:</code> (decisão), <code>T:</code> (tarefa tua), <code>E: Nome — …</code> (à espera de alguém), <code>?</code> (pergunta), <code>B:</code> (bloqueio) ou <code>R:</code> (retomar). Acaba com “até 12/11” para dar um prazo.</p>
    <h2>Como o caderno separa as coisas</h2>
    <ul><li><b>Tarefa</b>: alguém assumiu fazer algo. Se fores tu, aparece em <b>As minhas tarefas</b>; se for outra pessoa, em <b>À espera de outros</b>.</li>
      <li><b>Pedido</b>: pediste algo a alguém, mas a pessoa não o assumiu. Fica também em <b>À espera de outros</b>.</li>
      <li><b>Decisão</b>: só o que ficou decidido. Uma ideia sem acordo é uma <b>proposta</b> e fica em <b>Para retomar</b>, com as perguntas em aberto.</li>
      <li>Cada item guarda a frase da transcrição e o minuto. Clica no minuto para ler o contexto na transcrição.</li>
      <li><b>A confirmar</b>: o Kilo Code não tinha a certeza (quem, quando, ou a frase não aparece na transcrição). Confirma quando souberes.</li></ul>
    <h2>Projetos</h2>
    <p>Em <a class="btn-link" href="#/projetos">Projetos</a> juntas as reuniões de um mesmo assunto: o que mudou desde a última reunião, os compromissos em aberto, os bloqueios e as decisões. A saúde do projeto usa só factos ditos nas reuniões. Para ver um exemplo, abre o <a class="btn-link" href="#/p/exemplo">projeto de exemplo</a>.</p>
    <h2>Plano B: copiar e colar</h2>
    <p>Se o modo pasta não estiver disponível, em <a class="btn-link" href="#/nova">Nova reunião</a> usa os três passos de copiar e colar.</p>
    <h2>No dia a dia</h2>
    <ul><li><b>Tarefas</b> tem duas listas: <b>As minhas</b> e <b>À espera de outros</b>. Marca-as quando estiverem feitas: o caderno regista a data.</li>
      <li>Na reunião, <b>Copiar ata</b> copia a ata pronta para colar num email ou no Teams.</li>
      <li>Pesquisa com a caixa da barra lateral ou com <kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">K</kbd>: encontra reuniões, tarefas e decisões.</li>
      <li>O coaching de comunicação é opcional: liga-o em <a class="btn-link" href="#/definicoes">Definições</a>.</li></ul>
    <h2>Se algo não correr bem</h2>
    <ul><li><b>O Kilo Code não mostra /reuniao:</b> abre a pasta do caderno no VS Code e escreve <code>/reload</code>.</li>
      <li><b>Resposta não válida ou fraca:</b> no ecrã de revisão, clica em <b>Pedir outra resposta</b> e escreve outra vez <b>/reuniao</b>.</li>
      <li><b>“Não gravado na pasta”:</b> clica no aviso e escolhe <b>Permitir</b>. Até lá, os dados ficam neste navegador.</li></ul>
    <h2>Onde ficam os dados</h2>
    <ul><li>Na tua pasta: <code>caderno-dados.json</code>. O caderno não usa a internet.</li>
      <li>Se usares mais de um PC ou janela, as alterações são juntadas, sem se apagarem umas às outras.</li>
      <li>Cópias de segurança em <a class="btn-link" href="#/definicoes">Definições</a>.</li></ul>
  </article>`;
}

/* ── Realce da pesquisa ── */
function highlightIn(root, w) {
  const re = termRe(w); if (!re || !root) return;
  const nodes = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('script,style,textarea,mark,svg,details:not([open])') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  while (walker.nextNode()) { re.lastIndex = 0; if (re.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode); }
  nodes.forEach(n => { const span = document.createElement('span'); span.innerHTML = markStr(n.nodeValue, re); n.replaceWith(...span.childNodes); });
  const first = root.querySelector('mark'); if (first) requestAnimationFrame(() => first.scrollIntoView({ block: 'center' }));
}

/* ════════════════ Router ════════════════ */
function render() { route(); }
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '').split('?')[0]);
  const [, v = '', arg = ''] = h.match(/^\/?([^/]*)\/?(.*)$/) || [];
  current = { view: v, id: null };
  let title = 'Caderno de reuniões';
  const demoM = v === 'r' && !byId.has(arg) && DEMO?.meetings.find(x => x.id === arg);
  if (v === 'r' && (byId.has(arg) || demoM)) { current.id = arg; const m = byId.get(arg) || demoM; viewMeeting(m); title = m.title; }
  else if (v === 'projetos' && arg === 'novo') { current.view = 'projetos'; const sg = new URLSearchParams(location.hash.split('?')[1] || '').get('sug'); view.innerHTML = viewProjectNew(sg == null ? null : +sg); title = 'Novo projeto'; }
  else if (v === 'projetos') { view.innerHTML = viewProjects(); title = 'Projetos'; }
  else if (v === 'p') { current.view = 'p'; current.project = arg; view.innerHTML = viewProject(arg); title = projectById(arg)?.nome || 'Projeto'; }
  else if (v === 'nova') { current.view = 'nova'; view.innerHTML = viewNew(); title = 'Nova reunião'; }
  else if (v === 'nota') { current.view = 'nota'; view.innerHTML = viewNote(); title = 'Nota rápida'; }
  else if (v === 'rever' && arg) { current.view = 'rever'; title = 'Rever antes de guardar'; viewReview(arg); }
  else if (v === 'tarefas') { view.innerHTML = viewTasks(); title = 'Tarefas'; }
  else if (v === 'pessoas') { view.innerHTML = viewPeople(); title = 'Pessoas'; }
  else if (v === 'evolucao') { view.innerHTML = coachingOn() ? viewEvolution() : `<div class="page"><h1 tabindex="-1">Evolução</h1><div class="empty">${icon('mic')}<h2>O coaching está desligado</h2><p>A vista Evolução mostra como tu falas nas reuniões. Liga-a em <a class="btn-link" href="#/definicoes">Definições</a>, se quiseres.</p></div></div>`; title = 'Evolução'; }
  else if (v === 'ajuda') { view.innerHTML = viewHelp(); title = 'Como usar'; }
  else if (v === 'definicoes') { view.innerHTML = viewSettings(); title = 'Definições'; }
  else { current.view = ''; view.innerHTML = viewHome(); }
  document.title = `${title} · ${TEAM()}`;
  $('#topbar-title').textContent = title;
  if (!(v === 'r' && words(query).length)) main.scrollTop = 0;
  $('h1', view)?.focus({ preventScroll: true });
  closeNav(); markNav();
  const curItem = $('#list .m-item[aria-current="page"]'), L = $('#list');
  L.style.paddingBottom = '';
  if (curItem) {
    curItem.scrollIntoView({ block: 'nearest' });
    // Se a lista desceu, alinha o grupo do mês ao topo para nenhuma reunião ficar meio tapada pela etiqueta
    const g = curItem.closest('[role="group"]');
    // espera um frame: as alturas dos itens só se acertam depois de pintados (content-visibility)
    if (g) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (L.scrollTop <= 0 || g.offsetHeight > L.clientHeight) return;
      for (let i = 0; i < 3; i++) {
        const d = g.getBoundingClientRect().top - L.getBoundingClientRect().top;
        if (d < 1) break;
        const falta = L.scrollTop + d - (L.scrollHeight - L.clientHeight);
        if (falta > 0) L.style.paddingBottom = `${parseFloat(getComputedStyle(L).paddingBottom) + falta}px`;
        L.scrollTop += d;
      }
    }));
  }
}
const go = hash => { const target = hash.startsWith('#/r/') ? withState(hash) : hash; if (location.hash === target) route(); else location.hash = target; };

/* ════════════════ Eventos ════════════════ */
const search = $('#search');
let searchT;
search.addEventListener('input', () => {
  query = search.value; renderList(); writeUrlState();
  clearTimeout(searchT);
  searchT = setTimeout(() => {
    if (current?.id) { const m = byId.get(current.id); if (filtered().includes(m)) { viewMeeting(m); return; } }
    const first = filtered()[0]; if (first && words(query).length) go(meetingHref(first));
  }, 180);
});
search.addEventListener('keydown', e => {
  if (e.key === 'Escape') { search.value = ''; search.dispatchEvent(new Event('input')); search.blur(); }
  if (e.key === 'Enter') { const f = $('#list .m-item'); if (f) { e.preventDefault(); f.click(); } }
});
$('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; typeFilter = typeFilter === b.dataset.type ? null : b.dataset.type; renderList(); writeUrlState(); });

document.addEventListener('click', async e => {
  const fg = e.target.closest('[data-f-go]'); if (fg) { const [k, v] = fg.dataset.fGo.split(':'); const f = prefs.get('filtro-tarefas', { who: 'mine', state: 'open' }); f[k] = v; f.state = 'open'; prefs.set('filtro-tarefas', f); }
  const t = e.target.closest('[data-search],[data-action],[data-f],.ribbon-key,[data-seek],[data-alias],[data-inbox-who],[data-add-person]'); if (!t) return;
  if (t.dataset.addPerson != null) { const inp = $('#pj-pes'); const cur = inp.value.split(';').map(x => x.trim()).filter(Boolean); if (!cur.some(x => samePerson(x, t.dataset.addPerson))) inp.value = [...cur, t.dataset.addPerson].join('; '); return; }
  if (t.classList.contains('ribbon-key')) {
    const rb = t.closest('[data-ribbon]'), on = t.getAttribute('aria-pressed') !== 'true';
    $$('.ribbon-key', rb).forEach(k => k.setAttribute('aria-pressed', 'false'));
    if (on) { t.setAttribute('aria-pressed', 'true'); rb.dataset.focus = t.dataset.focus; } else delete rb.dataset.focus;
    return;
  }
  if (t.dataset.seek != null) { seek(+t.dataset.seek); return; }
  if (t.dataset.inboxWho != null) { setInboxWho(t.dataset.inboxWho, t.dataset.alias || null); return; }
  if (t.dataset.alias != null) { W.alias = t.dataset.alias; W.copied = false; wizardAnalyse(); wizardParse(); rerenderWizard(); return; }
  if (t.dataset.search != null) { search.value = t.dataset.search; query = t.dataset.search; renderList(); writeUrlState(); const f = filtered()[0]; if (f) go(meetingHref(f)); return; }
  if (t.dataset.f) { const [k, v] = t.dataset.f.split(':'); const f = prefs.get('filtro-tarefas', { who: 'mine', state: 'open' }); f[k] = v; prefs.set('filtro-tarefas', f); const y = main.scrollTop; view.innerHTML = viewTasks(); main.scrollTop = y; return; }
  const a = t.dataset.action, m = byId.get(current?.id);
  if (a === 'print') window.print();
  else if (a === 'cmdk') openCmdk();
  else if (a === 'copy-ata' && m) copyText(ataText(m), 'Ata copiada. Cola-a num email ou no Teams.');
  else if (a === 'delete' && m && !m.exemplo) {
    if (!confirm(`Apagar a reunião “${m.title}”? Não é possível desfazer.`)) return;
    STATE.apagados[m.id] = stamp(); STATE.reunioes = STATE.reunioes.filter(r => r.id !== m.id); await persist('Reunião apagada.'); rebuild(); renderList(); renderNav(); go('#/');
  }
  else if (a === 'confirm-item' && m && !m.exemplo) {
    const it = m.c[t.dataset.k]?.[+t.dataset.i]; if (!it) return;
    it.confirmar = ''; it.confirmado_em = stamp(); touch(it, m.rec);
    await persist('Confirmado.'); rebuild(); const y = main.scrollTop; route(); main.scrollTop = y;
  }
  else if (a === 'review-reject' && REVIEW) { if (confirm('Pôr esta resposta de lado e pedir outra ao Kilo Code?')) rejectInboxDraft(REVIEW); }
  else if (a === 'merge-conflicts') mergeConflicts();
  else if (a === 'note-reset') { NOTE = null; route(); }
  else if (a === 'copy-prompt') { if (await copyText(W.prompt, 'Pedido copiado. Cola-o no Kilo Code.')) { W.copied = true; rerenderWizard(); } else { const d = $('#prompt-box')?.closest('details'); if (d) { d.open = true; $('#prompt-box').select(); } } }
  else if (a === 'use-paste') { const txt = $('#paste-transcript').value; const r = TS.test(txt) ? { cues: parseVTT(txt), aproximado: false, fonte: 'vtt' } : { ...parsePlain(txt), fonte: 'texto' }; if (!r.cues.length) toast('Não reconheci falas neste texto. Cada fala deve começar pelo nome, ex.: “Ana Silva: …”.'); else acceptCues(r, 'Texto colado'); }
  else if (a === 'reset-wizard') { resetWizard(); rerenderWizard(); }
  else if (a === 'project-report') { const pp = projectById(t.dataset.project); if (pp) copyText(projectReportText(pp), 'Relatório copiado. Cola-o num email ou no Teams.'); }
  else if (a === 'history-copy') { const pp = projectById(t.dataset.project); if (pp) copyText(buildHistoryPrompt(pp), 'Pedido copiado. Cola-o no Kilo Code.'); }
  else if (a === 'history-apply') { const pp = projectById(t.dataset.project); try { const n = applyHistory(pp, $('#hist-answer').value); await persist(`Histórico aplicado a ${plural(n, 'reunião', 'reuniões')}.`); rebuild(); route(); } catch (err) { toast(err.message); } }
  else if (a === 'history-folder') { const pp = projectById(t.dataset.project); try { const inbox = await dirHandle.getDirectoryHandle(INBOX_DIR, { create: true }); const b = `${slug(pp.nome)}.historico`; await writeFile(inbox, `${b}.pedido.md`, buildHistoryPrompt(pp, `entrada/${b}.resposta.json`)); STATE.historicos = { ...(STATE.historicos || {}), [b]: pp.id }; await persist('Pedido de histórico pronto. Agora corre o Atualizar caderno.'); scanInbox(); } catch (err) { toast('Não foi possível escrever na pasta: ' + err.message); } }
  else if (a === 'project-delete') { const pp = projectById(t.dataset.project); if (!pp || !confirm(`Apagar o projeto “${pp.nome}”? As reuniões ficam no caderno.`)) return; STATE.apagados[pp.id] = stamp(); STATE.projetos = projects().filter(x => x.id !== pp.id); STATE.reunioes.forEach(r => { if (r.projeto === pp.id) { delete r.projeto; touch(r); } }); await persist('Projeto apagado.'); rebuild(); renderNav(); go('#/projetos'); }
  else if (a === 'connect-folder') connectFolder();
  else if (a === 'relink') relinkFolder();
  else if (a === 'unlink') unlinkFolder();
  else if (a === 'export') exportData();
  else if (a === 'import') $('#import-in').click();
  else if (a === 'wipe') { if (!confirm('Apagar todas as reuniões? Também saem do ficheiro da pasta. Descarrega antes uma cópia se quiseres guardá-las.')) return; const t0 = stamp(); STATE.reunioes.forEach(r => { STATE.apagados[r.id] = t0; }); STATE.reunioes = []; await persist('Reuniões apagadas.'); rebuild(); renderList(); renderNav(); go('#/'); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  if (f.dataset.form === 'review') {
    const rv = collectReview(f), btn = f.querySelector('[type=submit]'); if (btn) btn.disabled = true;
    try { if (f.dataset.ctx === 'wizard') await saveMeeting(rv); else if (REVIEW) await saveInboxDraft(REVIEW, rv); }
    catch (err) { toast('Não foi possível guardar: ' + err.message); if (btn) btn.disabled = false; }
    return;
  }
  if (f.dataset.form === 'note') { await saveNote(f); return; }
  if (f.dataset.form === 'project') {
    const list = (v, sep) => v.split(sep).map(x => x.trim()).filter(Boolean);
    const data = { nome: f.nome.value.trim(), descricao: f.descricao.value.trim(), palavras: list(f.palavras.value, ','), pessoas: list(f.pessoas.value, ';') };
    if (!data.nome) return;
    let p = f.dataset.id && projectById(f.dataset.id);
    if (p) { Object.assign(p, data); touch(p); } else { p = { id: `${slug(data.nome) || 'projeto'}-${uid().slice(-4)}`, criado: stamp(), alterado_em: stamp(), ...data }; STATE.projetos = [...projects(), p]; }
    await persist(f.dataset.id ? 'Projeto atualizado.' : 'Projeto criado. Confirma as reuniões que lhe pertencem.'); renderNav(); go('#/p/' + encodeURIComponent(p.id)); route(); return;
  }
  if (f.dataset.form === 'assign') {
    const ids = new Set([...f.querySelectorAll('input[name=m]:checked')].map(x => x.value)), pid = f.dataset.id;
    STATE.reunioes.forEach(r => { if (ids.has(r.id) && r.projeto !== pid) { r.projeto = pid; touch(r); } else if (!ids.has(r.id) && r.projeto === pid) { delete r.projeto; touch(r); } });
    await persist(`${plural(ids.size, 'reunião associada', 'reuniões associadas')} ao projeto.`); rebuild(); route(); return;
  }
  if (f.dataset.form === 'owner') { STATE.dono = f.nome.value.trim(); await persist('Nome guardado.'); renderBrand(); rebuild(); render(); }
  if (f.dataset.form === 'settings') {
    STATE.dono = f.nome.value.trim(); STATE.equipa = f.equipa.value.trim() || 'CIO Office Portugal';
    STATE.aliases = f.aliases.value.split(';').map(s => s.trim()).filter(Boolean);
    await persist('Definições guardadas.'); renderBrand(); rebuild(); renderList(); renderNav();
  }
});
view.addEventListener('change', async e => {
  if (e.target.matches('[data-proj-assign]')) { const r = STATE.reunioes.find(x => x.id === e.target.dataset.projAssign); if (!r) return; touch(r); const pid = e.target.value; if (pid) { r.projeto = pid; const pp = projectById(pid); if (r.conteudo?.pmo && pp) { r.conteudo.pmo.projeto = pp.nome; assignCodes(pp, r.conteudo.pmo, meetings, r.id); } } else delete r.projeto; await persist(pid ? 'Reunião associada ao projeto.' : 'Reunião retirada do projeto.'); rebuild(); renderNav(); route(); return; }
  if (e.target.id === 's-coaching') { STATE.coaching = e.target.checked; await persist(STATE.coaching ? 'Coaching ligado.' : 'Coaching desligado.'); renderNav(); return; }
  if (e.target.closest('form[data-form=review]')) { const it = e.target.closest('.rv-item'); if (it && e.target.name === 'keep') it.classList.toggle('off', !e.target.checked); return; }
  if (e.target.id === 'w-date') { if (isISO(e.target.value)) { W.date = e.target.value; W.copied = false; wizardAnalyse(); wizardParse(); rerenderWizard(); } return; }
  if (e.target.id === 'n-date' && NOTE) { NOTE.date = e.target.value; $('#note-preview').innerHTML = notePreview(); return; }
  const cb = e.target.closest('input[type=checkbox][data-key]'); if (!cb) return;
  const t = allTodos.find(x => x.key === cb.dataset.key); if (!t) return;
  await setDone(t, cb.checked);
  cb.closest('.task')?.classList.toggle('done', cb.checked);
  if (cb.checked) cb.closest('.todo-item, .task')?.querySelectorAll('.badge.bad').forEach(b => b.classList.remove('bad'));
});
let noteT, answerT;
view.addEventListener('input', e => {
  if (e.target.id === 'note') {
    const m = byId.get(current?.id); if (!m) return;
    const val = e.target.value; $('#note-status').textContent = m.exemplo ? 'As notas das reuniões de exemplo não são guardadas.' : 'A guardar…';
    clearTimeout(noteT); if (m.exemplo) return;
    noteT = setTimeout(async () => { m.rec.notas = val; touch(m.rec); await persist(); const st = $('#note-status'); if (st) st.textContent = 'Guardadas com a reunião.'; m.search = norm(m.search + ' ' + val); }, 500);
  }
  if (e.target.id === 'answer') {
    W.resposta = e.target.value;
    clearTimeout(answerT);
    answerT = setTimeout(() => {
      wizardParse();
      $('#answer-status').innerHTML = answerStatus();
      const box = $('#review-box'); if (box) box.innerHTML = W.draft ? reviewForm(W.draft, 'wizard') : '';
      const st = box?.closest('.step'); if (st) st.classList.toggle('done', !!W.draft);
    }, 250);
  }
  if (NOTE && ['n-titulo', 'n-pessoas', 'n-texto'].includes(e.target.id)) {
    NOTE[{ 'n-titulo': 'titulo', 'n-pessoas': 'pessoas', 'n-texto': 'texto' }[e.target.id]] = e.target.value;
    if (e.target.id === 'n-texto') $('#note-preview').innerHTML = notePreview();
  }
});
/* Ficheiros: escolher ou arrastar */
const fileIn = $('#file-in');
view.addEventListener('click', e => { if (e.target.closest('#drop')) fileIn.click(); });
view.addEventListener('keydown', e => { if (e.target.id === 'drop' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fileIn.click(); } });
fileIn.addEventListener('change', () => { const f = fileIn.files[0]; if (f) loadTranscriptFile(f); fileIn.value = ''; });
view.addEventListener('dragover', e => { const d = e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
view.addEventListener('dragleave', e => { const d = e.target.closest('#drop'); if (d) d.classList.remove('over'); });
view.addEventListener('drop', e => { const d = e.target.closest('#drop'); if (!d) return; e.preventDefault(); d.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) loadTranscriptFile(f); });
$('#import-in').addEventListener('change', e => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ''; });
window.addEventListener('hashchange', route);

/* Tema */
const THEMES = ['system', 'light', 'dark'], THEME_LABEL = { system: 'Tema automático', light: 'Tema claro', dark: 'Tema escuro' }, THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' };
let theme = prefs.get('tema', 'system');
const applyTheme = () => {
  if (theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  const b = $('#theme-btn'); b.innerHTML = icon(THEME_ICON[theme]); b.setAttribute('aria-label', `${THEME_LABEL[theme]}. Mudar tema`); b.title = THEME_LABEL[theme];
};
const cycleTheme = () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; prefs.set('tema', theme); applyTheme(); };
$('#theme-btn').addEventListener('click', cycleTheme);

/* Menu em ecrãs pequenos */
const closeNav = () => { document.body.classList.remove('nav-open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); };
$('#menu-btn').addEventListener('click', () => { const o = document.body.classList.toggle('nav-open'); $('#menu-btn').setAttribute('aria-expanded', String(o)); });
$('#scrim').addEventListener('click', closeNav);

/* Paleta de comandos */
const MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
$('#cmdk-kbd').textContent = `${MOD} K`;
const cmdk = $('#cmdk'), cq = $('#cmdk-q'), clist = $('#cmdk-list');
let citems = [], csel = 0;
function cmdkRender() {
  const w = words(cq.value), re = termRe(w);
  const nav = [['#/nova', 'plus', 'Nova reunião'], ['#/', 'home', 'Início'], ['#/tarefas', 'tasks', 'Tarefas'], ['#/projetos', 'folder', 'Projetos'], ['#/nota', 'doc', 'Nota rápida'], ['#/pessoas', 'users', 'Pessoas'], ...(coachingOn() ? [['#/evolucao', 'chart', 'Evolução']] : []), ['#/ajuda', 'help', 'Como usar'], ['#/definicoes', 'gear', 'Definições']]
    .filter(([, , l]) => w.every(x => norm(l).includes(x))).map(([h, ic, l]) => ({ ic, title: l, run: () => go(h) }));
  const actions = [{ ic: THEME_ICON[theme], title: 'Mudar tema', key: 'tema escuro claro', run: cycleTheme }]
    .concat(current?.id ? [{ ic: 'copy', title: 'Copiar ata desta reunião', key: 'copiar ata email', run: () => copyText(ataText(byId.get(current.id)), 'Ata copiada.') }, { ic: 'printer', title: 'Imprimir ou guardar em PDF', key: 'imprimir pdf', run: () => setTimeout(() => window.print(), 50) }] : [])
    .filter(a => w.every(x => norm(a.title + ' ' + a.key).includes(x)));
  const ms = meetings.filter(m => w.every(x => m.search.includes(x))).slice(0, w.length ? 12 : 6)
    .map(m => ({ ic: 'doc', html: markStr(m.title, re), snip: w.length ? snippet(m, w, 80) : `${fmtDate(m.date, 'short')}, ${esc(m.type)}`, run: () => go(meetingHref(m)) }));
  const ts = w.length ? allTodos.filter(t => w.every(x => norm(t.text + ' ' + t.owner).includes(x))).slice(0, 5)
    .map(t => ({ ic: 'tasks', html: markStr(t.text, re), snip: `${t.kind === 'pedido' ? 'Pedido a ' : ''}${esc(t.owner ? personLabel(t.owner) : 'Sem responsável')}${isDone(t) ? ', feita' : ''}, ${esc(t.m.title)}`, run: () => go(meetingHref(t.m)) })) : [];
  // Decisões: recuperar o que ficou decidido e saltar para o minuto em que foi dito
  const decs = w.length ? meetings.flatMap(m => (m.c.v === 2 ? (m.c.decisoes || []).map(it => ({ m, texto: it.texto, minuto: it.minuto, cit: it.citacao })) : (m.c.seccoes || []).filter(s => s.tipo === 'decisoes').flatMap(s => s.itens.map(t => ({ m, texto: t })))))
    .filter(d => w.every(x => norm(d.texto + ' ' + (d.cit || '') + ' ' + d.m.title).includes(x))).slice(0, 6)
    .map(d => ({ ic: 'check', html: markStr(d.texto, re), snip: `${esc(d.m.title)}, ${fmtDate(d.m.date, 'short')}${d.minuto ? ', ' + esc(d.minuto) : ''}`, run: () => { go(meetingHref(d.m)); const sec = parseClock(d.minuto); if (sec != null) setTimeout(() => seek(sec), 120); } })) : [];
  const pj = projects().filter(p => w.every(x => norm(p.nome + ' ' + (p.palavras || []).join(' ')).includes(x))).slice(0, 5).map(p => ({ ic: 'folder', html: markStr(p.nome, re), snip: p.descricao ? esc(p.descricao) : 'Projeto', run: () => go('#/p/' + encodeURIComponent(p.id)) }));
  const groups = [['Decisões', decs], ['Reuniões', ms], ['Tarefas', ts], ['Projetos', pj], ['Navegar', nav], ['Ações', actions]].filter(g => g[1].length);
  citems = groups.flatMap(g => g[1]); csel = Math.min(csel, Math.max(0, citems.length - 1));
  let k = 0;
  clist.innerHTML = citems.length ? groups.map(([l, arr]) => `<li role="presentation" class="cmdk-group">${l}</li>` + arr.map(it => { const i = k++; return `<li role="option" id="cmdk-${i}" class="cmdk-item" data-i="${i}" aria-selected="${i === csel}">${icon(it.ic)}<span class="cmdk-main"><span class="cmdk-title">${it.html || esc(it.title)}</span>${it.snip ? `<span class="cmdk-snip">${it.snip}</span>` : ''}</span></li>`; }).join('')).join('')
    : `<li class="list-empty" role="presentation">Sem resultados para “${esc(cq.value)}”.</li>`;
  cq.setAttribute('aria-activedescendant', citems.length ? 'cmdk-' + csel : '');
}
function cmdkMove(d) { if (!citems.length) return; csel = (csel + d + citems.length) % citems.length; $$('.cmdk-item', clist).forEach(li => li.setAttribute('aria-selected', String(+li.dataset.i === csel))); $(`#cmdk-${csel}`)?.scrollIntoView({ block: 'nearest' }); cq.setAttribute('aria-activedescendant', 'cmdk-' + csel); }
function cmdkRun(i) { const it = citems[i]; if (!it) return; cmdk.close(); it.run(); }
function openCmdk() { if (cmdk.open) return; cq.value = ''; csel = 0; cmdkRender(); cmdk.showModal(); cq.focus(); }
cq.addEventListener('input', () => { csel = 0; cmdkRender(); });
cq.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); cmdkMove(1); }
  if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); cmdkMove(-1); }
  if (e.key === 'Enter') { e.preventDefault(); cmdkRun(csel); }
});
clist.addEventListener('click', e => { const li = e.target.closest('.cmdk-item'); if (li) cmdkRun(+li.dataset.i); });
clist.addEventListener('pointermove', e => { const li = e.target.closest('.cmdk-item'); if (li && +li.dataset.i !== csel) { csel = +li.dataset.i; cmdkMove(0); } });
cmdk.addEventListener('click', e => { if (e.target === cmdk) cmdk.close(); });
$('#cmdk-open').addEventListener('click', openCmdk);

document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.open ? cmdk.close() : openCmdk(); return; }
  if (typing || cmdk.open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); if (window.matchMedia('(max-width: 60rem)').matches) document.body.classList.add('nav-open'); search.focus(); search.select(); }
  if (e.key === 'j' || e.key === 'k') {
    const list = filtered(); if (!list.length) return;
    const i = list.findIndex(m => m.id === current?.id);
    const n = i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + (e.key === 'j' ? 1 : -1)));
    go(meetingHref(list[n]));
  }
});
window.addEventListener('beforeunload', e => { if ((current?.view === 'nova' && W && (W.copied || W.draft)) || (current?.view === 'nota' && NOTE?.texto?.trim())) { e.preventDefault(); e.returnValue = ''; } });

/* ════════════════ Arranque ════════════════ */
(async () => {
  await loadState();
  if (EXEMPLO_PROJETO) DEMO = { p: { ...EXEMPLO_PROJETO.projeto, id: 'exemplo' }, meetings: EXEMPLO_PROJETO.reunioes.map(r => toMeeting({ ...r, projeto: 'exemplo', exemplo: true })) };
  readUrlState(); applyTheme(); renderBrand(); rebuild(); renderNav(); renderList(); renderSaveState(); route();
  if (dirHandle && dirPerm === 'granted') writeFile(dirHandle, INSTR_FILE, genericInstructions()).catch(() => {});
  scanInbox();
})();
})();
