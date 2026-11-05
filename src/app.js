
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

/* ════════════════ Estado e armazenamento ════════════════ */
const DEFAULT_STATE = { versao: 1, guardado_em: null, dono: '', aliases: [], equipa: 'CIO Office Portugal', reunioes: [] };
let STATE = structuredClone(DEFAULT_STATE);
let EXEMPLOS = []; try { EXEMPLOS = JSON.parse($('#exemplos').textContent) || []; } catch (e) {}
let fileHandle = null, filePerm = 'none';
const idb = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('caderno-cio-office', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const op = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
  return { get: k => op('readonly', s => s.get(k)), set: (k, v) => op('readwrite', s => s.put(v, k)), del: k => op('readwrite', s => s.delete(k)) };
})();
async function loadState() {
  let s = null;
  try { s = await idb.get('estado'); } catch (e) { console.warn('IndexedDB indisponível', e); }
  if (!s) { try { s = JSON.parse(localStorage.getItem('caderno:estado') || 'null'); } catch (e) {} }
  STATE = Object.assign(structuredClone(DEFAULT_STATE), s || {});
  try { fileHandle = (await idb.get('ficheiro')) || null; } catch (e) {}
  if (fileHandle) { try { filePerm = await fileHandle.queryPermission({ mode: 'readwrite' }); } catch (e) { filePerm = 'prompt'; } }
  if (fileHandle && filePerm === 'granted') await syncFromFile();
}
async function syncFromFile() {
  try {
    const f = await fileHandle.getFile(); const txt = await f.text(); if (!txt.trim()) return;
    const d = JSON.parse(txt);
    if (d && Array.isArray(d.reunioes) && (!STATE.guardado_em || (d.guardado_em || '') > STATE.guardado_em)) { STATE = Object.assign(structuredClone(DEFAULT_STATE), d); await saveLocal(); }
  } catch (e) { console.warn('Não foi possível ler o ficheiro de dados', e); }
}
async function saveLocal() {
  try { await idb.set('estado', STATE); } catch (e) { try { localStorage.setItem('caderno:estado', JSON.stringify(STATE)); } catch (e2) { toast('Não foi possível guardar neste navegador. Exporta uma cópia nas Definições.'); } }
}
async function persist(msg) {
  STATE.guardado_em = new Date().toISOString();
  await saveLocal();
  if (fileHandle && filePerm === 'granted') {
    try { const w = await fileHandle.createWritable(); await w.write(JSON.stringify(STATE)); await w.close(); }
    catch (e) { filePerm = 'prompt'; }
  }
  renderSaveState(); if (msg) toast(msg);
}
function renderSaveState() {
  const el = $('#save-state');
  const when = STATE.guardado_em ? DTF.time.format(new Date(STATE.guardado_em)) : null;
  if (fileHandle && filePerm !== 'granted') { el.innerHTML = '<a href="#/definicoes">Volta a ligar o ficheiro de dados</a>'; el.className = 'save-state warn'; return; }
  el.className = 'save-state';
  el.textContent = fileHandle ? `Guardado no ficheiro${when ? ' às ' + when : ''}` : (when ? `Guardado neste PC às ${when}` : 'Offline. Tudo fica neste computador.');
}
const FS_OK = 'showSaveFilePicker' in window;
async function linkNewFile() {
  try {
    const h = await window.showSaveFilePicker({ suggestedName: 'caderno-reunioes-dados.json', types: [{ description: 'Dados do caderno', accept: { 'application/json': ['.json'] } }] });
    fileHandle = h; filePerm = 'granted'; await idb.set('ficheiro', h); await persist('Ficheiro de dados ligado. A partir de agora tudo fica guardado nele.'); render();
  } catch (e) { if (e.name !== 'AbortError') toast('Não foi possível ligar o ficheiro: ' + e.message); }
}
async function openExistingFile() {
  try {
    const [h] = await window.showOpenFilePicker({ types: [{ description: 'Dados do caderno', accept: { 'application/json': ['.json'] } }] });
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') return;
    const d = JSON.parse(await (await h.getFile()).text());
    if (!d || !Array.isArray(d.reunioes)) throw new Error('Este ficheiro não é um ficheiro de dados do caderno.');
    fileHandle = h; filePerm = 'granted'; await idb.set('ficheiro', h);
    STATE = Object.assign(structuredClone(DEFAULT_STATE), d); await saveLocal(); rebuild(); renderSaveState(); toast('Ficheiro de dados aberto.'); go('#/');
  } catch (e) { if (e.name !== 'AbortError') toast(e.message); }
}
async function relinkFile() {
  try { filePerm = await fileHandle.requestPermission({ mode: 'readwrite' }); if (filePerm === 'granted') { await syncFromFile(); rebuild(); await persist('Ficheiro de dados ligado.'); render(); } }
  catch (e) { toast('Não foi possível voltar a ligar: ' + e.message); }
}
async function unlinkFile() { fileHandle = null; filePerm = 'none'; try { await idb.del('ficheiro'); } catch (e) {} renderSaveState(); render(); toast('O caderno deixou de gravar no ficheiro. Os dados continuam neste PC.'); }
function exportData() {
  const blob = new Blob([JSON.stringify(STATE, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `caderno-reunioes-copia-${TODAY}.json`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Cópia de segurança descarregada.');
}
async function importData(file) {
  try {
    const d = JSON.parse(await file.text());
    if (!d || !Array.isArray(d.reunioes)) throw new Error('Este ficheiro não é uma cópia do caderno.');
    const ids = new Set(STATE.reunioes.map(r => r.id)); let n = 0;
    d.reunioes.forEach(r => { if (!ids.has(r.id)) { STATE.reunioes.push(r); n++; } });
    if (!STATE.dono && d.dono) STATE.dono = d.dono;
    STATE.aliases = [...new Set([...(STATE.aliases || []), ...(d.aliases || [])])];
    await persist(`${plural(n, 'reunião importada', 'reuniões importadas')}.`); rebuild(); render();
  } catch (e) { toast(e.message); }
}

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
    rec: r, id: r.id, title: c.titulo || r.titulo || 'Reunião sem título', date: r.data, type: r.tipo || 'Ata',
    tags: c.etiquetas || [], data, turns, exemplo: !!r.exemplo, aproximado: !!r.aproximado,
    people: data ? data.oradores.map(o => o.nome) : (r.oradores || []), dur: data?.duracao_s || 0,
    lead: c.resumo || '', tip: cap(c.radar?.experimenta || ''), c,
  };
  m.todos = (c.tarefas || []).map((t, i) => ({ key: r.id + '#' + i, i, text: t.acao, owner: t.responsavel, due: t.prazo, t, m }));
  const secText = (c.seccoes || []).map(s => [s.titulo, s.texto, ...(s.itens || []).map(x => typeof x === 'string' ? x : [x.quem, x.texto, x.citacao].join(' ')), ...(s.linhas || []).flat()].join(' ')).join(' ');
  m.text = [m.lead, c.contexto, (c.temas || []).map(t => t.titulo + ' ' + t.resumo).join(' '), secText, m.todos.map(t => t.text + ' ' + t.owner).join(' '), (c.radar?.correu_bem || []).join(' '), (c.radar?.a_melhorar || []).join(' '), c.radar?.experimenta, turns.map(t => t.speaker + ' ' + t.text).join(' ')].filter(Boolean).join(' ').replace(/\s+/g, ' ');
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
const mineTodo = t => isMe(t.owner);
const knowsMe = () => !!OWNER() || (STATE.aliases || []).length > 0 || usingExamples();
async function setDone(t, v) {
  t.t.feito = v; if (!v) delete t.t.fechada_em;
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
const MODELOS = {
  ata: { nome: 'Ata', titulo: 'Ata de reunião', foco: 'Decisões, tarefas e prazos: quem faz o quê e quando.',
    seccoes: [['decisoes', 'Decisões Tomadas'], ['riscos', 'Pontos em Aberto']] },
  destaques: { nome: 'Destaques', titulo: 'Destaques', foco: 'As ideias principais, os conceitos duradouros e um resumo narrativo.',
    seccoes: [['lista', 'Destaques'], ['lista', 'Conceitos a Reter'], ['citacoes', 'Citações-chave'], ['lista', 'Próximos Passos']] },
  dados: { nome: 'Dados', titulo: 'Dados quantitativos', foco: 'Números, orçamentos e métricas, organizados numa tabela.',
    seccoes: [['tabela', 'Métricas e Valores'], ['lista', 'Tendências e Anomalias'], ['lista', 'Perguntas por Responder']] },
  intencao: { nome: 'Intenção', titulo: 'Análise de intenção', foco: 'O tom da reunião, as intenções de cada pessoa, os bloqueios e como resolvê-los.',
    seccoes: [['texto', 'Clima e Tom da Reunião'], ['pessoas', 'Intenções por Participante'], ['decisoes', 'Decisões Tomadas'], ['riscos', 'Pontos de Bloqueio'], ['lista', 'Sugestões de Resolução']] },
  conceitos: { nome: 'Conceitos', titulo: 'Insights de conceito', foco: 'Ideias, modelos mentais, analogias e divergências.',
    seccoes: [['lista', 'Ideias Principais'], ['lista', 'Frameworks e Analogias'], ['lista', 'Tensões e Divergências'], ['lista', 'Ideias a Explorar']] },
};
const SEC_DESC = {
  decisoes: '"itens": ["decisão, com o contexto mínimo"]',
  riscos: '"itens": ["risco, bloqueio ou questão sem resposta"]',
  lista: '"itens": ["ponto"]',
  texto: '"texto": "parágrafo(s); separa parágrafos com \\n"',
  tabela: '"colunas": ["Métrica / Item", "Valor / Número", "Contexto"], "linhas": [["...", "...", "..."]]',
  citacoes: '"itens": [{"quem": "Nome", "texto": "citação exata"}]',
  pessoas: '"itens": [{"quem": "Nome", "texto": "intenção inferida", "citacao": "frase da transcrição que a sustenta"}]',
};
function buildPrompt(w) {
  const M = MODELOS[w.modelo], d = w.data, me = d?.oradores.find(o => o.eu);
  const n = d?.oradores.length || 0, fair = n ? 100 / Math.max(2, n) : 0;
  const metricas = d ? d.oradores.map(o => `- ${o.nome}${o.eu ? ' (DONO DO CADERNO)' : ''}: ${pctf(o.pct)} do tempo de fala, ${o.intervencoes} intervenções, ${w.aproximado ? '' : o.ppm + ' palavras/min, '}${o.perguntas} perguntas, maior intervenção ${fmtDur(o.maior_s)}${o.eu ? `, bordões ${nf(o.bordoes_100, 1)}/100 palavras (${topTerms(o.bordoes) || 'nenhum'}), hesitações ${nf(o.hesitacoes_100, 1)}/100 (${topTerms(o.hesitacoes, 2) || 'nenhuma'}), interrupções feitas ${o.interrompeu}` : ''}`).join('\n') : '(sem métricas)';
  const ctx = w.related.length ? w.related.map(x => `- ${fmtDate(x.date)}: "${x.title}". ${x.lead}${x.c.seccoes?.filter(s => s.tipo === 'decisoes').flatMap(s => s.itens).slice(0, 3).map(i => ` Decisão: ${i}`).join('') || ''}`).join('\n') : '(nenhuma)';
  const pend = w.pendentes.length ? w.pendentes.map(p => `- ${p.code}: ${p.t.text} (responsável: ${p.t.owner || '?'}${p.t.due ? ', prazo ' + p.t.due : ''}; da reunião "${p.t.m.title}")`).join('\n') : '(nenhuma)';
  const lines = w.turns.map(t => `[${clock(t.start - (d?.t0 || 0))}] ${t.speaker}: ${t.text}`).join('\n');
  const secs = M.seccoes.map(([tipo, titulo]) => `    {"tipo": "${tipo}", "titulo": "${titulo}", ${SEC_DESC[tipo]}}`).join(',\n');
  return `És um Secretário Executivo de Elite e coach de comunicação da equipa ${TEAM()} (Natixis).
Analisa a transcrição de reunião no fim deste pedido e responde APENAS com um objeto JSON válido: sem texto antes ou depois, sem blocos de código, sem comentários. Escreve em português europeu.

MODELO PEDIDO: ${M.titulo}. Foco: ${M.foco}
DATA DA REUNIÃO: ${w.date} (usa-a para converter prazos relativos como "sexta-feira" em datas AAAA-MM-DD).
DONO DO CADERNO: ${OWNER() || 'não indicado'}${me ? ` (na transcrição aparece como "${me.nome}")` : ''}. O Radar de Comunicação é sobre esta pessoa. Nas tarefas desta pessoa usa "responsavel": "Eu".

MÉTRICAS JÁ CALCULADAS (exatas; não as recalcules, usa-as no Radar; partilha justa de tempo de fala: ${pctf(fair)}):
${metricas}

REUNIÕES ANTERIORES COM AS MESMAS PESSOAS (para o campo "contexto"):
${ctx}

TAREFAS EM ABERTO DE REUNIÕES ANTERIORES (se a transcrição mostrar que alguma foi feita, põe o código em "tarefas_concluidas"):
${pend}

REGRAS
- Ignora ruído, cumprimentos e conversa de circunstância ("estão a ouvir-me?"). Corrige pelo contexto os erros de reconhecimento de voz do Teams.
- Mantém exatos nomes, números, valores, datas e prazos. Nunca inventes: se algo não for claro, escreve "(a confirmar)".
- Frases curtas e diretas. Sem emojis. Não uses "·" para juntar informação.
- "resumo": 2 a 3 frases: porquê a reunião, o que se concluiu, o que vem a seguir.
- "contexto": 1 a 3 frases que ligam esta reunião às anteriores (decisões que vêm de trás, o que mudou). Vazio se não houver ligação.
- "temas": os assuntos discutidos, por ordem, com "inicio" e "fim" no formato mm:ss tirados dos tempos [mm:ss] da transcrição, e um resumo de 1 a 2 frases cada.
- "tarefas": todas as ações combinadas. "acao" começa por um verbo. "responsavel" é o nome da pessoa ("Eu" para o dono do caderno). "prazo" em AAAA-MM-DD ou null. "minuto" é o mm:ss em que foi combinada.
- "seccoes": exatamente as secções indicadas abaixo, por esta ordem. Se uma não tiver conteúdo, deixa "itens" vazio.
- Radar: honesto e específico, baseado no que a pessoa disse e nas métricas. Em "a_melhorar" diz o que aconteceu, cita a frase e dá a frase alternativa que podia ter dito. "experimenta": uma única ação prática para a próxima reunião.

FORMATO DA RESPOSTA (JSON):
{
  "titulo": "título curto e específico da reunião",
  "etiquetas": ["3 a 8 palavras-chave: projetos, clientes, temas"],
  "resumo": "...",
  "contexto": "...",
  "temas": [{"titulo": "...", "inicio": "mm:ss", "fim": "mm:ss", "resumo": "..."}],
  "seccoes": [
${secs}
  ],
  "tarefas": [{"acao": "...", "responsavel": "Nome", "prazo": "AAAA-MM-DD", "minuto": "mm:ss"}],
  "tarefas_concluidas": ["T1"],
  "radar": {"correu_bem": ["..."], "a_melhorar": ["..."], "experimenta": "..."}
}

TRANSCRIÇÃO (${w.turns.length} intervenções${d ? ', ' + fmtDur(d.duracao_s) : ''}):
${lines}`;
}
function extractJSON(text) {
  let t = String(text || '').trim().replace(/^﻿/, '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Não encontrei a resposta do Kilo Code. Copia a resposta inteira, do primeiro { ao último }.');
  t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch (e) {
    const fixed = t.replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch (e2) { throw new Error('A resposta está incompleta ou cortada. No Kilo Code escreve: "Repete só o JSON, completo." e cola a nova resposta.'); }
  }
}
function normalizeAI(o, modelo) {
  const str = v => typeof v === 'string' ? v.trim() : (v == null ? '' : String(v));
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const date = v => isISO(str(v)) ? str(v) : null;
  const TIPOS = ['decisoes', 'riscos', 'lista', 'texto', 'tabela', 'citacoes', 'pessoas'];
  const sec = s => {
    if (!s || typeof s !== 'object') return null;
    const tipo = TIPOS.includes(s.tipo) ? s.tipo : (s.linhas ? 'tabela' : s.texto ? 'texto' : 'lista');
    const out = { tipo, titulo: str(s.titulo) || 'Notas' };
    if (tipo === 'texto') out.texto = str(s.texto);
    else if (tipo === 'tabela') { out.colunas = arr(s.colunas).map(str); out.linhas = arr(s.linhas).map(r => arr(r).map(str)); }
    else if (tipo === 'citacoes' || tipo === 'pessoas') out.itens = arr(s.itens).map(i => typeof i === 'string' ? { quem: '', texto: i } : { quem: str(i.quem), texto: str(i.texto), citacao: str(i.citacao) }).filter(i => i.texto);
    else out.itens = arr(s.itens).map(i => typeof i === 'string' ? i : str(i.texto || i.item || JSON.stringify(i))).map(str).filter(Boolean);
    const empty = (out.itens && !out.itens.length) || (tipo === 'texto' && !out.texto) || (tipo === 'tabela' && !out.linhas.length);
    return empty ? null : out;
  };
  const c = {
    titulo: str(o.titulo), etiquetas: arr(o.etiquetas).map(str).filter(Boolean).slice(0, 10),
    resumo: str(o.resumo), contexto: str(o.contexto),
    temas: arr(o.temas).map(t => ({ titulo: str(t?.titulo), inicio: str(t?.inicio), fim: str(t?.fim), resumo: str(t?.resumo) })).filter(t => t.titulo),
    seccoes: arr(o.seccoes).map(sec).filter(Boolean),
    tarefas: arr(o.tarefas).map(t => ({ acao: str(t?.acao || t?.tarefa), responsavel: str(t?.responsavel), prazo: date(t?.prazo), minuto: str(t?.minuto), feito: false })).filter(t => t.acao),
    tarefas_concluidas: arr(o.tarefas_concluidas).map(str).filter(Boolean),
    radar: { correu_bem: arr(o.radar?.correu_bem).map(str).filter(Boolean), a_melhorar: arr(o.radar?.a_melhorar).map(str).filter(Boolean), experimenta: str(o.radar?.experimenta) },
  };
  if (!c.resumo && !c.seccoes.length && !c.tarefas.length) throw new Error('A resposta não tem resumo, secções nem tarefas. Confirma que copiaste a resposta do Kilo Code a este pedido.');
  return c;
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
  const items = [['', 'home', 'Início', ''], ['tarefas', 'tasks', 'Tarefas', mine.length ? `<span class="count ${late ? 'late' : ''}">${nf(mine.length)}<span class="sr-only"> em aberto${late ? `, ${late} em atraso` : ''}</span></span>` : ''], ['pessoas', 'users', 'Pessoas', ''], ['evolucao', 'chart', 'Evolução', ''], ['ajuda', 'help', 'Como usar', ''], ['definicoes', 'gear', 'Definições', '']];
  $('#nav').innerHTML = items.map(([h, ic, l, extra]) => `<a href="#/${h}" data-view="${h}">${icon(ic)}<span>${l}</span>${extra}</a>`).join('');
  markNav();
}
function markNav() {
  const v = current?.view ?? '';
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

/* ════════════════ Componentes ════════════════ */
function ribbon(m) {
  const d = m.data; if (!d?.timeline?.length) return '';
  const col = colorsOf(m), total = d.duracao_s || 1;
  const rects = d.timeline.map((t, i) => `<rect data-s="${col[t[2]]}" data-turn="${i}" x="${(t[0] / total * 1000).toFixed(1)}" width="${Math.max(1.5, (t[1] - t[0]) / total * 1000).toFixed(1)}" y="0" height="32" style="--c:var(--sp${col[t[2]]})"><title>${esc(displayName(d.oradores[t[2]].nome))}, ${clock(t[0])}, ${fmtDur(t[1] - t[0])}</title></rect>`).join('');
  const label = `Quem falou, quando: ${LF.format(d.oradores.map(o => `${displayName(o.nome)} ${pctf(o.pct)}`))}`;
  return `<figure class="ribbon" style="margin-inline:0" data-ribbon>
    <figcaption class="sr-only">${esc(label)}</figcaption>
    <div class="ribbon-track"><svg viewBox="0 0 1000 32" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">${rects}</svg></div>
    <div class="ribbon-axis" aria-hidden="true"><span>0</span><span>${clock(total / 2)}</span><span>${clock(total)}</span></div>
    <div class="ribbon-keys">${d.oradores.map((o, i) => `<button type="button" class="ribbon-key" data-focus="${col[i]}" aria-pressed="false"><span class="key" style="--c:var(--sp${col[i]})"></span><span translate="no">${esc(nameOf(o.nome))}</span><b>${pctf(o.pct)}</b></button>`).join('')}</div>
    ${m.aproximado ? '<p class="field-help">Tempos aproximados: a transcrição não tinha a hora de fim de cada fala.</p>' : ''}
  </figure>`;
}
function participation(m) {
  const d = m.data; if (!d) return '';
  const col = colorsOf(m), top = d.oradores[0], eq = d.equilibrio ?? 0;
  const eqLabel = eq >= 80 ? ['ok', 'Equilibrada'] : eq >= 55 ? ['warn', 'Moderada'] : ['bad', `Dominada por ${firstName(top?.nome || '')}`];
  const lanes = d.oradores.map((o, i) => {
    const rects = d.timeline.filter(t => t[2] === i).map(t => `<rect x="${(t[0] / d.duracao_s * 1000).toFixed(1)}" width="${Math.max(2, (t[1] - t[0]) / d.duracao_s * 1000).toFixed(1)}" y="0" height="14"/>`).join('');
    return `<span class="lane-name" translate="no">${esc(personLabel(o.nome))}</span><div class="lane" style="--c:var(--sp${col[i]})"><svg viewBox="0 0 1000 14" preserveAspectRatio="none" aria-hidden="true">${rects}</svg></div>`;
  }).join('');
  return `<section class="r-sec" aria-labelledby="part-h">
    <h2 id="part-h">Participação</h2>
    <div class="equity"><span>Conversa <span class="badge ${eqLabel[0]}">${esc(eqLabel[1])}, ${eq} em 100</span></span><span>Duração <b>${fmtDur(d.duracao_s)}</b></span><span>Tempo falado <b>${fmtDur(d.falado_s)}</b></span></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th scope="col">Pessoa</th><th scope="col" class="n">Tempo</th><th scope="col" class="n">Fala</th><th scope="col" class="n">Palavras</th><th scope="col" class="n">Intervenções</th>${m.aproximado ? '' : '<th scope="col" class="n">Ritmo</th>'}<th scope="col" class="n">Perguntas</th><th scope="col" class="n">Maior</th><th scope="col" class="n" title="Feitas e sofridas (estimativa)">Interrupções</th></tr></thead>
      <tbody>${d.oradores.map((o, i) => `<tr>
        <td><span class="who"><span class="key" style="--c:var(--sp${col[i]})"></span><span translate="no">${esc(personLabel(o.nome))}</span>${(o.eu || isMe(o.nome)) ? '<span class="badge me">tu</span>' : ''}</span></td>
        <td class="n">${fmtDur(o.tempo_s)}</td>
        <td class="n">${pctf(o.pct)}<span class="mini" aria-hidden="true"><i style="--p:${(o.pct / 100).toFixed(3)};--c:var(--sp${col[i]})"></i></span></td>
        <td class="n">${nf(o.palavras)}</td><td class="n">${nf(o.intervencoes)}</td>${m.aproximado ? '' : `<td class="n">${nf(o.ppm)} ppm</td>`}
        <td class="n">${nf(o.perguntas)}</td><td class="n">${fmtDur(o.maior_s)}</td><td class="n">${nf(o.interrompeu)} e ${nf(o.interrompido)}</td></tr>`).join('')}</tbody></table></div>
    <div class="lanes" aria-hidden="true">${lanes}</div>
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
  if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
  const span = hi - lo; hi += span * .1; lo = Math.max(0, lo - span * .1);
  const x = i => P.l + (pts.length === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (pts.length - 1));
  const y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  let band = '';
  if (opt.band) { const b0 = opt.band[0] ?? lo, b1 = opt.band[1] ?? hi; band = `<rect class="band" x="${P.l}" width="${W - P.l - P.r}" y="${y(Math.min(hi, b1)).toFixed(1)}" height="${Math.max(0, y(Math.max(lo, b0)) - y(Math.min(hi, b1))).toFixed(1)}" rx="3"/>`; }
  const ref = opt.ref != null ? `<line class="ref" x1="${P.l}" x2="${W - P.r}" y1="${y(opt.ref).toFixed(1)}" y2="${y(opt.ref).toFixed(1)}"/>` : '';
  const f = v => nf(v, v < 10 ? 1 : 0);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || '')}: ${esc(pts.map(p => `${fmtDate(p.date, 'short')}, ${opt.fmt(p.v)}`).join('; '))}">
    ${band}${ref}
    <text class="ax" x="${P.l - 6}" y="${y(hi) + 4}" text-anchor="end">${f(hi)}</text><text class="ax" x="${P.l - 6}" y="${y(lo) + 4}" text-anchor="end">${f(lo)}</text>
    <path class="line" d="${path}"/>
    ${pts.map((p, i) => `<circle class="${i === pts.length - 1 ? 'last' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5"><title>${esc(p.title)}, ${fmtDate(p.date, 'short')}: ${opt.fmt(p.v)}</title></circle>`).join('')}
    <text class="ax" x="${x(0)}" y="${H - 6}" text-anchor="${pts.length === 1 ? 'middle' : 'start'}">${fmtDate(pts[0].date, 'short')}</text>
    ${pts.length > 1 ? `<text class="ax" x="${x(pts.length - 1)}" y="${H - 6}" text-anchor="end">${fmtDate(pts[pts.length - 1].date, 'short')}</text>` : ''}
  </svg>`;
}
const ownerBadge = t => t.owner ? `<span class="badge ${mineTodo(t) ? 'me' : ''}" translate="no">${esc(mineTodo(t) ? 'Eu' : personLabel(t.owner))}</span>` : '';
const dueBadge = (t, done) => t.due ? `<span class="badge ${!done && t.due < TODAY ? 'bad' : ''}"><span class="sr-only">${!done && t.due < TODAY ? 'Em atraso, prazo ' : 'Prazo '}</span>${fmtDate(t.due, 'short')}</span>` : '';
const closedNote = t => { const by = t.t.fechada_em && byId.get(t.t.fechada_em); return by ? `<a class="task-closed" href="${meetingHref(by)}">Concluída na reunião de ${fmtDate(by.date, 'short')}</a>` : ''; };
const taskRow = t => {
  const done = isDone(t);
  return `<div class="task ${done ? 'done' : ''}">
    <label><input type="checkbox" data-key="${esc(t.key)}" ${done ? 'checked' : ''}><span><span class="task-text">${esc(t.text)}</span></span></label>
    <span class="task-side">${ownerBadge(t)}${dueBadge(t, done)}</span>
    <a class="task-from" href="${meetingHref(t.m)}">${esc(t.m.title)}, ${fmtDate(t.m.date, 'short')}</a>${closedNote(t)}
  </div>`;
};

/* ════════════════ Vistas ════════════════ */
function welcomePanel() {
  return `<section class="panel welcome" aria-labelledby="wel-h">
    <h2 id="wel-h">Bem-vindo ao teu caderno de reuniões</h2>
    <p>Diz-nos o teu nome para o caderno saber quais são as tuas falas e as tuas tarefas. Fica guardado só neste computador.</p>
    <form class="actions" data-form="owner"><label class="sr-only" for="owner-name">O teu nome</label>
      <input class="text-input" id="owner-name" name="nome" autocomplete="name" placeholder="Ex.: Ana Silva…" style="flex:1;min-width:200px" required>
      <button class="btn primary btn-lg" type="submit">Guardar</button></form>
  </section>`;
}
function viewHome() {
  const sub = OWNER() ? `${esc(displayName(OWNER()))}, <span translate="no">${esc(TEAM())}</span>` : `<span translate="no">${esc(TEAM())}</span>`;
  const month = TODAY.slice(0, 7), inMonth = meetings.filter(m => (m.date || '').startsWith(month));
  const open = allTodos.filter(t => !isDone(t)), mine = knowsMe() ? open.filter(mineTodo) : open;
  const late = mine.filter(t => t.due && t.due < TODAY);
  const withMe = meetings.filter(meOf).slice(0, 5);
  const avgPct = withMe.length ? withMe.reduce((s, m) => s + meOf(m).pct, 0) / withMe.length : null;
  const avgFair = withMe.length ? withMe.reduce((s, m) => s + 100 / Math.max(2, m.data.oradores.length), 0) / withMe.length : null;
  const next = mine.slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 6);
  const last = meetings[0], lastTip = meetings.find(m => m.tip);
  return `<div class="page wide">
    <div class="page-head"><div><h1 tabindex="-1">Caderno de reuniões</h1><p class="page-sub">${sub}</p></div>
      <div class="actions"><a class="btn primary btn-lg" href="#/nova">${icon('plus')}Nova reunião</a></div></div>
    <div class="stack">
      ${!OWNER() ? welcomePanel() : ''}
      ${usingExamples() ? `<div class="callout">${icon('info')}<p>Estas são <b>reuniões de exemplo</b>, para veres como fica. Desaparecem quando guardares a primeira reunião tua em <a class="btn-link" href="#/nova">Nova reunião</a>.</p></div>` : ''}
      ${fileHandle && filePerm !== 'granted' ? `<div class="callout">${icon('alert')}<p>O caderno está ligado a um ficheiro de dados, mas o navegador pede autorização outra vez. <button class="btn" type="button" data-action="relink">Voltar a ligar</button></p></div>` : ''}
      ${last ? `<div class="stats">
        <div class="stat"><div class="stat-v">${nf(inMonth.length)}</div><div class="stat-l">${inMonth.length === 1 ? 'Reunião' : 'Reuniões'} este mês</div><div class="stat-h">${nf(meetings.length)} no total</div></div>
        <div class="stat"><div class="stat-v">${fmtDur(inMonth.reduce((s, m) => s + (m.dur || 0), 0))}</div><div class="stat-l">Em reuniões este mês</div><div class="stat-h">${fmtDur(meetings.reduce((s, m) => s + (m.dur || 0), 0))} no total</div></div>
        <div class="stat"><div class="stat-v">${nf(mine.length)}</div><div class="stat-l">${knowsMe() ? 'Tarefas tuas' : 'Tarefas'} em aberto${late.length ? `<span class="badge bad">${plural(late.length, 'atrasada', 'atrasadas')}</span>` : ''}</div><div class="stat-h">${nf(open.length)} da equipa</div></div>
        <div class="stat"><div class="stat-v">${avgPct == null ? '—' : pctf(avgPct)}</div><div class="stat-l">O teu tempo de fala</div><div class="stat-h">${avgPct == null ? 'Escolhe quem és ao adicionar uma reunião' : `Média de ${plural(withMe.length, 'reunião', 'reuniões')}; justo ${pctf(avgFair)}`}</div></div>
      </div>
      <section class="panel" aria-labelledby="last-h">
        <div class="panel-head"><h2 id="last-h">Última reunião</h2><a class="btn-link" href="${meetingHref(last)}">Abrir a reunião</a></div>
        <div class="row-title" style="font-size:var(--t-lg)">${esc(last.title)}</div>
        <div class="row-sub" style="margin-top:var(--s-1)"><span>${fmtDate(last.date, 'weekday')}</span>${last.dur ? `<span>${fmtDur(last.dur)}</span>` : ''}<span>${esc(last.type)}</span></div>
        ${ribbon(last)}
        ${last.lead ? `<p style="margin:var(--s-3) 0 0;color:var(--ink-2);max-width:var(--measure)">${esc(curly(last.lead))}</p>` : ''}
      </section>
      <div class="cols-2">
        <section class="panel" aria-labelledby="next-h"><div class="panel-head"><h2 id="next-h">${knowsMe() ? 'As tuas tarefas' : 'Tarefas em aberto'}</h2><a class="btn-link" href="#/tarefas">Ver todas</a></div>
          ${next.length ? `<div>${next.map(taskRow).join('')}</div>` : '<p class="muted">Nada pendente.</p>'}</section>
        <section class="panel" aria-labelledby="recent-h"><div class="panel-head"><h2 id="recent-h">Reuniões recentes</h2></div>
          <div class="rows">${meetings.slice(0, 6).map(m => `<a class="row-link" href="${meetingHref(m)}"><div class="row-main"><div class="row-title">${esc(m.title)}</div><div class="row-sub"><span>${fmtDate(m.date, 'short')}</span>${m.dur ? `<span>${fmtDur(m.dur)}</span>` : ''}<span>${plural(m.people.length, 'pessoa', 'pessoas')}</span></div></div><span class="badge">${esc(m.type)}</span></a>`).join('')}</div></section>
      </div>
      ${lastTip ? `<div class="tip"><strong>Foco de comunicação:</strong> ${esc(curly(lastTip.tip))} <a class="btn-link" href="#/evolucao">Ver a tua evolução</a></div>` : ''}` : ''}
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
  const radar = (c.radar && (c.radar.correu_bem.length || c.radar.a_melhorar.length || c.radar.experimenta)) || meOf(m);
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
    ${ribbon(m)}
    <div class="r-body" id="r-body">
      ${c.resumo ? `<section class="r-sec" aria-labelledby="res-h"><h2 id="res-h">Resumo Executivo</h2><p class="lead">${esc(curly(c.resumo))}</p></section>` : ''}
      ${c.contexto || rel.length ? `<section class="r-sec" aria-labelledby="ctx-h"><h2 id="ctx-h">Contexto</h2>${c.contexto ? `<p>${esc(curly(c.contexto))}</p>` : ''}
        ${rel.length ? `<div class="related rows">${rel.map(x => `<a class="row-link" href="${meetingHref(x)}"><div class="row-main"><div class="row-title">${esc(x.title)}</div><div class="row-sub"><span>${fmtDate(x.date, 'short')}</span><span>${esc(x.type)}</span></div></div></a>`).join('')}</div>` : ''}</section>` : ''}
      ${(c.temas || []).length ? `<section class="r-sec" aria-labelledby="tem-h"><h2 id="tem-h">Temas Discutidos</h2><div class="temas">${c.temas.map(t => { const s = parseClock(t.inicio); return `<div class="tema">${s != null ? timeBtn(t.inicio + (t.fim ? '–' + t.fim : ''), s) : '<span></span>'}<b>${esc(t.titulo)}</b><p>${esc(curly(t.resumo))}</p></div>`; }).join('')}</div></section>` : ''}
      ${(c.seccoes || []).filter(s => s.titulo !== 'Plano de Ação').map(renderSection).join('')}
      ${m.todos.length ? `<section class="r-sec" aria-labelledby="pa-h"><h2 id="pa-h">Plano de Ação</h2>${tasks}</section>` : ''}
      ${participation(m)}
      ${radar ? `<section class="r-sec radar" aria-labelledby="rad-h"><h2 id="rad-h">Radar de Comunicação</h2>${myNumbers(m)}
        ${c.radar?.correu_bem?.length ? `<h3>${icon('check')}<span>O que correu bem</span></h3><ul>${c.radar.correu_bem.map(i => `<li>${esc(curly(i))}</li>`).join('')}</ul>` : ''}
        ${c.radar?.a_melhorar?.length ? `<h3>${icon('up')}<span>A melhorar</span></h3><ul>${c.radar.a_melhorar.map(i => `<li>${esc(curly(i))}</li>`).join('')}</ul>` : ''}
        ${c.radar?.experimenta ? `<div class="tip"><strong>Experimenta na próxima:</strong> ${esc(curly(c.radar.experimenta))}</div>` : ''}</section>` : ''}
      ${m.turns.length ? `<section class="r-sec"><details class="transcript" id="transcript"><summary>${icon('chevron')}Transcrição completa <small>${plural(m.turns.length, 'intervenção', 'intervenções')}</small></summary>
        <div class="turns">${m.turns.map((t, i) => `<div class="turn" id="turn-${i}"><button type="button" class="time-btn" data-seek="${Math.round(t.start - t0)}" tabindex="-1">${clock(t.start - t0)}</button><div><div class="turn-who"><span class="key" style="--c:var(--sp${col[order[t.speaker]] ?? 6})"></span><span translate="no">${esc(personLabel(t.speaker))}</span></div><p>${esc(t.text)}</p></div></div>`).join('')}</div></details></section>` : ''}
    </div>
    <section class="notes r-sec" aria-labelledby="notes-h"><h2 id="notes-h">As minhas notas</h2>
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
  const list = allTodos.filter(t => (f.who === 'all' || mineTodo(t)) && (f.state === 'all' || (f.state === 'open' ? !isDone(t) : isDone(t))))
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
    <div class="page-head"><div><h1 tabindex="-1">Tarefas</h1><p class="page-sub">Todas as ações combinadas nas reuniões, por prazo.</p></div></div>
    <div class="toolbar">
      ${knowsMe() ? `<div class="seg" role="group" aria-label="Responsável"><button type="button" data-f="who:mine" aria-pressed="${f.who === 'mine'}">Minhas</button><button type="button" data-f="who:all" aria-pressed="${f.who === 'all'}">Da equipa</button></div>` : ''}
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
  const openBy = p => allTodos.filter(t => !isDone(t) && t.owner && (p.eu ? mineTodo(t) : samePerson(t.owner, p.nome))).length;
  const hue = s => { let h = 0; for (const ch of norm(s)) h = (h * 31 + ch.charCodeAt(0)) % 6; return h + 1; };
  return `<div class="page wide">
    <div class="page-head"><div><h1 tabindex="-1">Pessoas</h1><p class="page-sub">${plural(people.length, 'pessoa', 'pessoas')} em ${plural(meetings.length, 'reunião', 'reuniões')}. Escolhe uma pessoa para ver as reuniões dela.</p></div></div>
    ${people.length ? `<div class="panel" style="padding:0"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th scope="col">Pessoa</th><th scope="col" class="n">Reuniões</th><th scope="col" class="n">Fala média</th><th scope="col" class="n">Tempo a falar</th><th scope="col" class="n">Tarefas em aberto</th><th scope="col" class="n">Última reunião</th></tr></thead>
      <tbody>${people.map(p => { const avg = p.pcts.length ? p.pcts.reduce((a, b) => a + b, 0) / p.pcts.length : null; const last = p.reunioes.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
        return `<tr><td><button type="button" class="person-btn" data-search="${esc(p.nome)}"><span class="avatar" style="--c:var(--sp${p.eu ? 0 : hue(p.nome)})" aria-hidden="true">${esc(initials(personLabel(p.nome)))}</span><span translate="no">${esc(personLabel(p.nome))}</span>${p.eu ? '<span class="badge me">tu</span>' : ''}</button></td>
          <td class="n">${nf(p.reunioes.length)}</td><td class="n">${avg == null ? '—' : pctf(avg)}</td><td class="n">${p.tempo ? fmtDur(p.tempo) : '—'}</td><td class="n">${nf(openBy(p))}</td><td class="n">${last ? fmtDate(last.date, 'short') : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`
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
function resetWizard() { W = { ficheiro: null, turns: [], cues: [], aproximado: false, fonte: '', alias: null, date: TODAY, modelo: prefs.get('modelo', 'ata'), data: null, prompt: '', copied: false, resposta: '', parsed: null, erro: '', related: [], pendentes: [] }; }
function wizardAnalyse() {
  W.turns = mergeTurns(W.cues);
  W.data = analyse(W.turns, W.alias);
  const pseudo = { people: W.data ? W.data.oradores.map(o => o.nome) : [], tags: [], date: W.date };
  W.related = usingExamples() ? [] : relatedOf(Object.assign(pseudo, { id: '__nova__' }), 3);
  const since = addDays(W.date, -90);
  W.pendentes = allTodos.filter(t => !isDone(t) && !t.m.exemplo && (t.m.date || '') >= since && (t.m.date || '') <= W.date).slice(0, 25).map((t, i) => ({ code: 'T' + (i + 1), t }));
  W.prompt = buildPrompt(W);
}
function viewNew() {
  if (!W) resetWizard();
  const has = W.turns.length > 0, ready = has && W.alias !== null, valid = !!W.parsed;
  const speakers = W.data ? W.data.oradores : [];
  const step = (n, title, sub, body, enabled, done) => `<section class="step ${done ? 'done' : ''}" aria-disabled="${!enabled}" aria-labelledby="st-${n}"><div class="step-head"><span class="step-num">${done ? icon('check') : n}</span><div><h2 id="st-${n}">${title}</h2><p>${sub}</p></div></div>${body}</section>`;
  return `<div class="page">
    <div class="page-head"><div><h1 tabindex="-1">Nova reunião</h1><p class="page-sub">Quatro passos, cerca de dois minutos. Nada sai deste computador além do que colares no Kilo Code.</p></div></div>
    ${step(1, 'Escolhe a transcrição', 'O ficheiro que descarregaste do Teams (.vtt ou .docx). Também serve texto copiado.', `
      <div class="drop" id="drop" role="button" tabindex="0" aria-describedby="drop-help">${icon('upload')}<b>${W.ficheiro ? esc(W.ficheiro) : 'Arrasta o ficheiro para aqui ou clica para escolher'}</b><span id="drop-help" class="field-help">${has ? `${plural(W.turns.length, 'intervenção', 'intervenções')}, ${plural(speakers.length, 'pessoa', 'pessoas')}${W.data ? ', ' + fmtDur(W.data.duracao_s) : ''}${W.aproximado ? ' (tempos aproximados)' : ''}` : '.vtt, .docx ou .txt'}</span></div>
      <details style="margin-top:var(--s-3)"><summary class="btn-link" style="cursor:pointer">Prefiro colar o texto da transcrição</summary>
        <label class="sr-only" for="paste-transcript">Texto da transcrição</label>
        <textarea class="text-area" id="paste-transcript" placeholder="Cola aqui o texto da transcrição…" style="margin-top:var(--s-2)"></textarea>
        <div class="actions" style="margin-top:var(--s-2)"><button class="btn" type="button" data-action="use-paste">Usar este texto</button></div></details>
      ${has ? `<div class="form-grid" style="margin-top:var(--s-5)">
        <div><label class="field-label" for="w-date">Data da reunião</label><input class="text-input" type="date" id="w-date" value="${esc(W.date)}"></div>
        <div><span class="field-label" id="who-l">Quem és tu na reunião?</span>
          <div class="people-pick" role="radiogroup" aria-labelledby="who-l">${speakers.map(o => `<button type="button" class="chip" role="radio" aria-checked="${W.alias === o.nome}" aria-pressed="${W.alias === o.nome}" data-alias="${esc(o.nome)}" translate="no">${esc(displayName(o.nome))}</button>`).join('')}<button type="button" class="chip" role="radio" aria-checked="${W.alias === ''}" aria-pressed="${W.alias === ''}" data-alias="">Não participei</button></div>
          <p class="field-help">Serve para o Radar de Comunicação. Fica memorizado para as próximas.</p></div>
      </div>` : ''}`, true, ready)}
    ${step(2, 'Escolhe o tipo de resumo', 'Podes mudar de ideias e voltar a gerar.', `<div class="choices" role="radiogroup" aria-label="Tipo de resumo">${Object.entries(MODELOS).map(([k, M]) => `<label class="choice"><input type="radio" name="modelo" value="${k}" ${W.modelo === k ? 'checked' : ''}><b>${M.titulo}</b><span>${M.foco}</span></label>`).join('')}</div>`, ready, ready && W.copied)}
    ${step(3, 'Pede o resumo ao Kilo Code', 'Copia o pedido, abre o Kilo Code, cola com Ctrl+V e envia. Espera até a resposta terminar.', `
      <div class="actions"><button class="btn primary btn-lg" type="button" data-action="copy-prompt">${icon('copy')}${W.copied ? 'Copiar de novo' : 'Copiar pedido'}</button><span class="field-help">${ready ? `Pedido com ${nf(W.prompt.length)} caracteres${W.related.length ? `, inclui ${plural(W.related.length, 'reunião anterior', 'reuniões anteriores')} como contexto` : ''}${W.pendentes.length ? ` e ${plural(W.pendentes.length, 'tarefa pendente', 'tarefas pendentes')}` : ''}.` : ''}</span></div>
      <details style="margin-top:var(--s-3)"><summary class="btn-link" style="cursor:pointer">Ver o pedido</summary><label class="sr-only" for="prompt-box">Pedido para o Kilo Code</label><textarea class="text-area prompt-preview" id="prompt-box" readonly style="margin-top:var(--s-2)">${esc(W.prompt)}</textarea></details>`, ready, W.copied)}
    ${step(4, 'Cola a resposta do Kilo Code', 'Seleciona toda a resposta no Kilo Code, copia (Ctrl+C) e cola aqui (Ctrl+V).', `
      <label class="sr-only" for="answer">Resposta do Kilo Code</label>
      <textarea class="text-area" id="answer" placeholder="Cola aqui a resposta, começa por {…">${esc(W.resposta)}</textarea>
      <div id="answer-status">${answerStatus()}</div>
      <div class="actions" style="margin-top:var(--s-4)"><button class="btn primary btn-lg" type="button" data-action="save-meeting" ${valid ? '' : 'disabled'}>${icon('save')}Guardar reunião</button><button class="btn" type="button" data-action="reset-wizard">Começar de novo</button></div>`, ready, valid)}
  </div>`;
}
function answerStatus() {
  if (!W.resposta.trim()) return '';
  if (W.erro) return `<div class="status-line bad">${icon('alert')}<p>${esc(W.erro)}</p></div>`;
  const p = W.parsed;
  return `<div class="status-line ok">${icon('check')}<p>Resposta válida: <b>${esc(p.titulo || 'sem título')}</b>, ${plural(p.seccoes.length, 'secção', 'secções')}, ${plural(p.tarefas.length, 'tarefa', 'tarefas')}${p.tarefas_concluidas.length ? `, ${plural(p.tarefas_concluidas.length, 'tarefa anterior concluída', 'tarefas anteriores concluídas')}` : ''}.</p></div>`;
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
  W.copied = false; W.parsed = null; W.resposta = ''; W.erro = '';
  wizardAnalyse(); rerenderWizard();
}
function rerenderWizard() { const y = main.scrollTop; view.innerHTML = viewNew(); main.scrollTop = y; }
async function saveMeeting() {
  if (!W.parsed) return;
  const p = W.parsed, names = W.data ? W.data.oradores.map(o => o.nome) : [...new Set(W.turns.map(t => t.speaker))];
  const order = Object.fromEntries(names.map((n, i) => [n, i]));
  const id = `${W.date}-${slug(p.titulo || 'reuniao')}-${uid().slice(-4)}`;
  const rec = {
    id, criado_em: new Date().toISOString(), data: W.date, tipo: MODELOS[W.modelo].nome, fonte: W.fonte, aproximado: W.aproximado, eu: W.alias || null,
    oradores: names, falas: W.turns.map(t => [+t.start.toFixed(2), +t.end.toFixed(2), order[t.speaker], t.text, +t.spoken.toFixed(2)]),
    conteudo: p, notas: '',
  };
  if (W.alias && !(STATE.aliases || []).some(a => samePerson(a, W.alias))) STATE.aliases = [...(STATE.aliases || []), W.alias];
  STATE.reunioes.push(rec);
  for (const code of p.tarefas_concluidas) { const pe = W.pendentes.find(x => x.code === code); if (pe) { pe.t.t.feito = true; pe.t.t.fechada_em = id; } }
  await persist('Reunião guardada.');
  resetWizard(); rebuild(); renderList(); renderNav(); go('#/r/' + encodeURIComponent(id));
}

function viewSettings() {
  const fileStatus = !FS_OK ? 'Este navegador não permite ligar um ficheiro. Usa o Microsoft Edge ou o Google Chrome, ou faz cópias de segurança regulares.'
    : fileHandle ? (filePerm === 'granted' ? `Ligado ao ficheiro <b>${esc(fileHandle.name)}</b>. Cada alteração é gravada nele.` : `Ligado a <b>${esc(fileHandle.name)}</b>, mas o navegador pede autorização.`)
    : 'Não ligado. Os dados ficam só na memória deste navegador.';
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
      <section class="panel" aria-labelledby="set-file"><div class="panel-head"><h2 id="set-file">Ficheiro de dados (recomendado)</h2></div>
        <p style="margin:0 0 var(--s-4);color:var(--ink-2);max-width:var(--measure)">Guarda as reuniões num ficheiro teu, por exemplo no OneDrive ou numa pasta de rede. Assim não se perdem se o navegador for limpo, e podes abrir o caderno noutro PC.</p>
        <div class="status-line info">${icon('info')}<p>${fileStatus}</p></div>
        ${FS_OK ? `<div class="actions" style="margin-top:var(--s-4)">
          ${fileHandle && filePerm !== 'granted' ? `<button class="btn primary" type="button" data-action="relink">Voltar a ligar</button>` : ''}
          <button class="btn ${fileHandle ? '' : 'primary'}" type="button" data-action="link-new">Criar ficheiro de dados</button>
          <button class="btn" type="button" data-action="open-file">Abrir um ficheiro de dados existente</button>
          ${fileHandle ? `<button class="btn" type="button" data-action="unlink">Desligar</button>` : ''}</div>` : ''}
      </section>
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
    <p class="page-sub">Guia rápido para a equipa ${esc(TEAM())}.</p>
    <h2>1. Descarregar a transcrição do Teams</h2>
    <ol><li>No Teams, abre a reunião no calendário (ou o chat da reunião) e escolhe <b>Gravações e transcrições</b>.</li>
      <li>Na transcrição, escolhe <b>Transferir</b> e o formato <b>.vtt</b> (o .docx também serve).</li>
      <li>Guarda o ficheiro numa pasta tua. Ajuda pôr a data no nome, por exemplo <code>2026-11-05 comité IT.vtt</code>.</li></ol>
    <h2>2. Adicionar a reunião ao caderno</h2>
    <ol><li>Clica em <b>Nova reunião</b>.</li>
      <li>Arrasta o ficheiro para a caixa (ou clica para o escolher). Confirma a data e escolhe <b>quem és tu</b> na lista de pessoas.</li>
      <li>Escolhe o tipo de resumo: <b>Ata</b> para decisões e tarefas, <b>Dados</b> para números, <b>Intenção</b> para negociações, <b>Destaques</b> ou <b>Conceitos</b> para ideias.</li>
      <li>Clica em <b>Copiar pedido</b>.</li></ol>
    <h2>3. Pedir o resumo ao Kilo Code</h2>
    <ol><li>Abre o Kilo Code no VS Code e começa uma conversa nova.</li>
      <li>Cola o pedido (<kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">V</kbd>) e envia.</li>
      <li>Espera até a resposta terminar. Começa por <code>{</code> e acaba em <code>}</code>.</li>
      <li>Copia a resposta inteira. Se o Kilo Code a mostrar num bloco de código, usa o botão de copiar desse bloco.</li></ol>
    <h2>4. Guardar</h2>
    <ol><li>Volta ao caderno e cola a resposta no passo 4.</li>
      <li>Se aparecer <b>Resposta válida</b>, clica em <b>Guardar reunião</b>. Pronto.</li>
      <li>Se aparecer um erro, segue a indicação. O mais comum é a resposta ter sido cortada: pede ao Kilo Code “Repete só o JSON, completo.” e cola outra vez.</li></ol>
    <h2>No dia a dia</h2>
    <ul><li><b>Tarefas</b> junta as ações de todas as reuniões. Marca-as quando estiverem feitas.</li>
      <li>Na reunião, <b>Copiar ata</b> copia a ata pronta para colar num email ou no Teams.</li>
      <li>Os botões com minutos (ex.: <code>12:30</code>) abrem a transcrição nesse momento.</li>
      <li>Pesquisa com a caixa da barra lateral ou com <kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">K</kbd>.</li></ul>
    <h2>Onde ficam os dados</h2>
    <ul><li>Tudo fica neste computador. O caderno não usa a internet.</li>
      <li>Recomendado: em <a class="btn-link" href="#/definicoes">Definições</a>, cria um <b>ficheiro de dados</b> no OneDrive. Assim não perdes nada se o navegador for limpo.</li>
      <li>O único sítio para onde o conteúdo vai é o Kilo Code, quando colas o pedido.</li></ul>
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
  if (v === 'r' && byId.has(arg)) { current.id = arg; const m = byId.get(arg); viewMeeting(m); title = m.title; }
  else if (v === 'nova') { current.view = 'nova'; view.innerHTML = viewNew(); title = 'Nova reunião'; }
  else if (v === 'tarefas') { view.innerHTML = viewTasks(); title = 'Tarefas'; }
  else if (v === 'pessoas') { view.innerHTML = viewPeople(); title = 'Pessoas'; }
  else if (v === 'evolucao') { view.innerHTML = viewEvolution(); title = 'Evolução'; }
  else if (v === 'ajuda') { view.innerHTML = viewHelp(); title = 'Como usar'; }
  else if (v === 'definicoes') { view.innerHTML = viewSettings(); title = 'Definições'; }
  else { current.view = ''; view.innerHTML = viewHome(); }
  document.title = `${title} · ${TEAM()}`;
  $('#topbar-title').textContent = title;
  if (!(v === 'r' && words(query).length)) main.scrollTop = 0;
  $('h1', view)?.focus({ preventScroll: true });
  closeNav(); markNav();
  $('#list .m-item[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
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
  const t = e.target.closest('[data-search],[data-action],[data-f],.ribbon-key,[data-seek],[data-alias]'); if (!t) return;
  if (t.classList.contains('ribbon-key')) {
    const rb = t.closest('[data-ribbon]'), on = t.getAttribute('aria-pressed') !== 'true';
    $$('.ribbon-key', rb).forEach(k => k.setAttribute('aria-pressed', 'false'));
    if (on) { t.setAttribute('aria-pressed', 'true'); rb.dataset.focus = t.dataset.focus; } else delete rb.dataset.focus;
    return;
  }
  if (t.dataset.seek != null) { seek(+t.dataset.seek); return; }
  if (t.dataset.alias != null) { W.alias = t.dataset.alias; wizardAnalyse(); rerenderWizard(); return; }
  if (t.dataset.search != null) { search.value = t.dataset.search; query = t.dataset.search; renderList(); writeUrlState(); const f = filtered()[0]; if (f) go(meetingHref(f)); return; }
  if (t.dataset.f) { const [k, v] = t.dataset.f.split(':'); const f = prefs.get('filtro-tarefas', { who: 'mine', state: 'open' }); f[k] = v; prefs.set('filtro-tarefas', f); const y = main.scrollTop; view.innerHTML = viewTasks(); main.scrollTop = y; return; }
  const a = t.dataset.action, m = byId.get(current?.id);
  if (a === 'print') window.print();
  else if (a === 'cmdk') openCmdk();
  else if (a === 'copy-ata' && m) copyText(ataText(m), 'Ata copiada. Cola-a num email ou no Teams.');
  else if (a === 'delete' && m && !m.exemplo) {
    if (!confirm(`Apagar a reunião “${m.title}”? Não é possível desfazer.`)) return;
    STATE.reunioes = STATE.reunioes.filter(r => r.id !== m.id); await persist('Reunião apagada.'); rebuild(); renderList(); renderNav(); go('#/');
  }
  else if (a === 'copy-prompt') { if (await copyText(W.prompt, 'Pedido copiado. Cola-o no Kilo Code.')) { W.copied = true; prefs.set('modelo', W.modelo); rerenderWizard(); } else { const d = $('#prompt-box')?.closest('details'); if (d) { d.open = true; $('#prompt-box').select(); } } }
  else if (a === 'use-paste') { const txt = $('#paste-transcript').value; const r = TS.test(txt) ? { cues: parseVTT(txt), aproximado: false, fonte: 'vtt' } : { ...parsePlain(txt), fonte: 'texto' }; if (!r.cues.length) toast('Não reconheci falas neste texto. Cada fala deve começar pelo nome, ex.: “Ana Silva: …”.'); else acceptCues(r, 'Texto colado'); }
  else if (a === 'save-meeting') saveMeeting();
  else if (a === 'reset-wizard') { resetWizard(); rerenderWizard(); }
  else if (a === 'link-new') linkNewFile();
  else if (a === 'open-file') openExistingFile();
  else if (a === 'relink') relinkFile();
  else if (a === 'unlink') unlinkFile();
  else if (a === 'export') exportData();
  else if (a === 'import') $('#import-in').click();
  else if (a === 'wipe') { if (!confirm('Apagar todas as reuniões deste navegador? Descarrega antes uma cópia se quiseres guardá-las.')) return; STATE.reunioes = []; await persist('Reuniões apagadas.'); rebuild(); renderList(); renderNav(); go('#/'); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  if (f.dataset.form === 'owner') { STATE.dono = f.nome.value.trim(); await persist('Nome guardado.'); renderBrand(); rebuild(); render(); }
  if (f.dataset.form === 'settings') {
    STATE.dono = f.nome.value.trim(); STATE.equipa = f.equipa.value.trim() || 'CIO Office Portugal';
    STATE.aliases = f.aliases.value.split(';').map(s => s.trim()).filter(Boolean);
    await persist('Definições guardadas.'); renderBrand(); rebuild(); renderList(); renderNav();
  }
});
view.addEventListener('change', async e => {
  if (e.target.matches('input[name="modelo"]')) { W.modelo = e.target.value; W.copied = false; wizardAnalyse(); rerenderWizard(); return; }
  if (e.target.id === 'w-date') { if (isISO(e.target.value)) { W.date = e.target.value; W.copied = false; wizardAnalyse(); rerenderWizard(); } return; }
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
    noteT = setTimeout(async () => { m.rec.notas = val; await persist(); $('#note-status').textContent = 'Guardadas com a reunião.'; m.search = norm(m.search + ' ' + val); }, 500);
  }
  if (e.target.id === 'answer') {
    W.resposta = e.target.value;
    clearTimeout(answerT);
    answerT = setTimeout(() => {
      W.parsed = null; W.erro = '';
      if (W.resposta.trim()) { try { W.parsed = normalizeAI(extractJSON(W.resposta), W.modelo); } catch (err) { W.erro = err.message; } }
      $('#answer-status').innerHTML = answerStatus();
      const btn = $('[data-action="save-meeting"]'); if (btn) btn.disabled = !W.parsed;
      const st = btn?.closest('.step'); if (st) st.classList.toggle('done', !!W.parsed);
    }, 250);
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
  const nav = [['#/nova', 'plus', 'Nova reunião'], ['#/', 'home', 'Início'], ['#/tarefas', 'tasks', 'Tarefas'], ['#/pessoas', 'users', 'Pessoas'], ['#/evolucao', 'chart', 'Evolução'], ['#/ajuda', 'help', 'Como usar'], ['#/definicoes', 'gear', 'Definições']]
    .filter(([, , l]) => w.every(x => norm(l).includes(x))).map(([h, ic, l]) => ({ ic, title: l, run: () => go(h) }));
  const actions = [{ ic: THEME_ICON[theme], title: 'Mudar tema', key: 'tema escuro claro', run: cycleTheme }]
    .concat(current?.id ? [{ ic: 'copy', title: 'Copiar ata desta reunião', key: 'copiar ata email', run: () => copyText(ataText(byId.get(current.id)), 'Ata copiada.') }, { ic: 'printer', title: 'Imprimir ou guardar em PDF', key: 'imprimir pdf', run: () => setTimeout(() => window.print(), 50) }] : [])
    .filter(a => w.every(x => norm(a.title + ' ' + a.key).includes(x)));
  const ms = meetings.filter(m => w.every(x => m.search.includes(x))).slice(0, w.length ? 12 : 6)
    .map(m => ({ ic: 'doc', html: markStr(m.title, re), snip: w.length ? snippet(m, w, 80) : `${fmtDate(m.date, 'short')}, ${esc(m.type)}`, run: () => go(meetingHref(m)) }));
  const ts = w.length ? allTodos.filter(t => w.every(x => norm(t.text + ' ' + t.owner).includes(x))).slice(0, 5)
    .map(t => ({ ic: 'tasks', html: markStr(t.text, re), snip: `${esc(displayName(t.owner || 'Sem responsável'))}, ${esc(t.m.title)}`, run: () => go(meetingHref(t.m)) })) : [];
  const groups = [['Reuniões', ms], ['Tarefas', ts], ['Navegar', nav], ['Ações', actions]].filter(g => g[1].length);
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
$('#cmdk-open-m').addEventListener('click', openCmdk);
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
window.addEventListener('beforeunload', e => { if (current?.view === 'nova' && W && W.copied && !W.parsed) { e.preventDefault(); e.returnValue = ''; } });

/* ════════════════ Arranque ════════════════ */
(async () => {
  await loadState();
  readUrlState(); applyTheme(); renderBrand(); rebuild(); renderNav(); renderList(); renderSaveState(); route();
})();
})();
