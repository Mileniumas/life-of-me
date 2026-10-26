/* Life of Me — a private diary. Everything stays on this device. */
(() => {
'use strict';

/* ───────── Helpers ───────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (d, o) => new Intl.DateTimeFormat('en-GB', o).format(d);
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

const MARK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4.5v11.2c0 1 .8 1.8 1.8 1.8H17" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.2" cy="6.6" r="2.2" fill="currentColor"/></svg>';
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  del: '<svg viewBox="0 0 24 24"><path d="M9 6h11v12H9l-6-6 6-6Z"/><path d="m12 10 4 4M16 10l-4 4"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
};

const MOODS = [
  { id: 'radiant', label: 'Radiant' },
  { id: 'good', label: 'Good' },
  { id: 'calm', label: 'Calm' },
  { id: 'low', label: 'Low' },
  { id: 'rough', label: 'Rough' },
];
const moodOf = (id) => MOODS.find((m) => m.id === id);

const SEASON_ICON = {
  spring: '<svg viewBox="0 0 24 24" class="si"><g>' + [0, 72, 144, 216, 288].map((r) => `<path transform="rotate(${r} 12 12)" d="M12 10c-2.2-1.6-2.4-4.6-0-6.6 2.4 2 2.2 5 0 6.6Z"/>`).join('') + '</g><circle cx="12" cy="12" r="1.6"/></svg>',
  summer: '<svg viewBox="0 0 24 24" class="si"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"/></svg>',
  autumn: '<svg viewBox="0 0 24 24" class="si"><path d="M5 19C5 10.5 10 5 19 5c0 9-5.5 14-14 14Z"/><path d="M5 19l8.5-8.5M10 14.2h3.2M12.6 11.6V8.4"/></svg>',
  winter: '<svg viewBox="0 0 24 24" class="si"><path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2M3.6 10.3l3-1.1-.5-3.2M20.4 13.7l-3 1.1.5 3.2M6.1 18l.5-3.2-3-1.1M17.9 6l-.5 3.2 3 1.1"/></svg>',
};
const SEASONS = [
  { id: 'spring', label: 'Spring' }, { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' }, { id: 'winter', label: 'Winter' },
];
const seasonOf = (id) => SEASONS.find((x) => x.id === id);
const seasonForMonth = (m) => (m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'); // m: 0-11, meteorological seasons
const seasonForKey = (k) => seasonForMonth(+k.slice(5, 7) - 1);
const londonMonth = () => { try { return +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', month: 'numeric' }).format(new Date()) - 1; } catch (e) { return new Date().getMonth(); } };
const currentSeason = () => seasonForMonth(londonMonth());
const entrySeason = (e) => (seasonOf(e.season) ? e.season : seasonForKey(e.date));

const THEMES = [
  { id: 'aurora', label: 'Aurora', light: '#EEF0FF', dark: '#0A0A1F' },
  { id: 'sunset', label: 'Sunset', light: '#FFF0EA', dark: '#1A0A12' },
  { id: 'ocean', label: 'Ocean', light: '#E8F7FB', dark: '#03131C' },
  { id: 'mint', label: 'Mint', light: '#EEFAEE', dark: '#06140E' },
  { id: 'midnight', label: 'Neon', light: '#F2EDFF', dark: '#06050E' },
];

// Every month gets its own vivid colour.
const MONTH_COLORS = [
  ['#3D7BFF', '#5EE7FF'], ['#FF3D8B', '#FF8AB6'], ['#16C79A', '#7CF29A'], ['#FFB020', '#FFD23F'],
  ['#FF5A3D', '#FF9F3D'], ['#7B2BFF', '#B48CFF'], ['#00B4D8', '#3DE0B5'], ['#FF2BD6', '#FF7AB6'],
  ['#2F6BFF', '#7C5CFF'], ['#FF7A45', '#FFC23D'], ['#8E4BFF', '#FF6AD5'], ['#0FA570', '#38D1FF'],
];
const monthStyle = (m) => { const [a, b] = MONTH_COLORS[m]; return `--month:linear-gradient(135deg,${a},${b});--month-glow:${a}`; };

/* ───────── Storage (IndexedDB, local only) ───────── */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('life-of-me', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('entries', { keyPath: 'id' }); s.createIndex('date', 'date'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => {
    const t = db.transaction('entries', mode); const s = t.objectStore('entries'); const out = fn(s);
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined); t.onerror = () => rej(t.error);
  }); };
  return {
    all: () => tx('readonly', (s) => s.getAll()),
    get: (id) => tx('readonly', (s) => s.get(id)),
    put: (e) => tx('readwrite', (s) => s.put(e)),
    del: (id) => tx('readwrite', (s) => s.delete(id)),
    clear: () => tx('readwrite', (s) => s.clear()),
  };
})();

const LS = {
  get: (k, d = null) => { try { const v = localStorage.getItem('diary.' + k); return v === null ? d : v; } catch (e) { return d; } },
  set: (k, v) => { try { v === null ? localStorage.removeItem('diary.' + k) : localStorage.setItem('diary.' + k, v); } catch (e) {} },
};

/* ───────── SHA-256 (WebCrypto, with a pure-JS fallback for non-secure contexts) ───────── */
function sha256js(ascii) {
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const bytes = new TextEncoder().encode(ascii); const l = bytes.length * 8;
  const K = [], H = []; let p = 0;
  for (let c = 2; p < 64; c++) { let ok = true; for (let i = 2; i * i <= c; i++) if (c % i === 0) { ok = false; break; }
    if (ok) { if (p < 8) H[p] = (Math.pow(c, 1 / 2) * 2 ** 32) | 0; K[p++] = (Math.pow(c, 1 / 3) * 2 ** 32) | 0; } }
  const m = [...bytes, 0x80]; while (m.length % 64 !== 56) m.push(0);
  for (let i = 7; i >= 0; i--) m.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
  for (let j = 0; j < m.length; j += 64) {
    const w = []; for (let i = 0; i < 16; i++) w[i] = (m[j + i * 4] << 24) | (m[j + i * 4 + 1] << 16) | (m[j + i * 4 + 2] << 8) | m[j + i * 4 + 3];
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      if (i >= 16) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      const t1 = (h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
async function hashPin(pin, salt) {
  const input = `${salt}:${pin}:life-of-me`;
  if (crypto.subtle && window.isSecureContext) {
    let buf = new TextEncoder().encode(input);
    for (let i = 0; i < 5000; i++) buf = new Uint8Array(await crypto.subtle.digest('SHA-256', buf)); // key stretching
    return 'v2:' + [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'v1:' + sha256js(input);
}
async function checkPin(pin) {
  const stored = LS.get('pinHash'); const salt = LS.get('pinSalt'); if (!stored || !salt) return true;
  if (stored.startsWith('v2:') && !(crypto.subtle && window.isSecureContext)) return false;
  const h = stored.startsWith('v1:') ? 'v1:' + sha256js(`${salt}:${pin}:life-of-me`) : await hashPin(pin, salt);
  return h === stored;
}
async function setPin(pin) {
  const salt = uid(); LS.set('pinSalt', salt); LS.set('pinHash', await hashPin(pin, salt));
}

/* ───────── State ───────── */
const state = { entries: [], query: '', locked: !!LS.get('pinHash') };
const sorted = () => [...state.entries].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
async function load() { state.entries = (await DB.all()) || []; }
const isEmptyEntry = (e) => !e.title.trim() && !e.body.trim() && !e.mood;

async function saveEntry(e) {
  e.updatedAt = new Date().toISOString();
  const i = state.entries.findIndex((x) => x.id === e.id);
  if (isEmptyEntry(e)) { if (i > -1) { state.entries.splice(i, 1); await DB.del(e.id); } return; }
  if (i > -1) state.entries[i] = { ...e }; else state.entries.push({ ...e });
  await DB.put({ ...e });
}

/* ───────── Theme ───────── */
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = LS.get('theme', 'aurora'); const m = LS.get('mode', 'system');
  const dark = m === 'dark' || (m === 'system' && mq.matches);
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.dark = dark ? '1' : '0';
  const th = THEMES.find((x) => x.id === t) || THEMES[0];
  $('meta[name="theme-color"]').setAttribute('content', dark ? th.dark : th.light);
}
mq.addEventListener ? mq.addEventListener('change', applyTheme) : mq.addListener(applyTheme);

/* ───────── Toast ───────── */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

/* ───────── Sheets ───────── */
function sheet({ title, text, actions }) {
  return new Promise((resolve) => {
    const layer = $('#layer');
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const el = document.createElement('div'); el.className = 'sheet glass'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}<div class="actions">${actions.map((a, i) => `<button class="btn btn-block ${a.cls || 'btn-ghost'}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>`;
    const close = (v) => { el.classList.add('out'); scrim.style.opacity = '0'; scrim.style.transition = 'opacity .25s'; setTimeout(() => { el.remove(); scrim.remove(); }, 250); resolve(v); };
    scrim.onclick = () => close(null);
    el.onclick = (ev) => { const b = ev.target.closest('[data-i]'); if (b) close(actions[+b.dataset.i].value); };
    layer.append(scrim, el);
    setTimeout(() => el.querySelector('button')?.focus({ preventScroll: true }), 50);
  });
}

/* ───────── PIN pad ───────── */
function pinPad({ title, hint, cancellable, onComplete }) {
  const el = document.createElement('div'); el.className = 'lock';
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  el.innerHTML = `<div class="lock-bg"></div>
    <div class="mark-lg">${MARK}</div>
    <h2>${esc(title)}</h2><p class="hint">${esc(hint || '')}</p>
    <div class="pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="keypad">${keys.map((k) => `<button class="key glass" data-k="${k}" aria-label="${k}">${k}</button>`).join('')}
      <span></span><button class="key glass" data-k="0" aria-label="0">0</button>
      <button class="key flat" data-k="del" aria-label="Delete">${ICON.del}</button></div>
    ${cancellable ? '<button class="key-cancel" data-k="cancel">Cancel</button>' : ''}`;
  let val = ''; let busy = false;
  const dots = $$('.pin-dots i', el);
  const render = () => dots.forEach((d, i) => d.classList.toggle('on', i < val.length));
  const api = {
    el,
    setHint: (h) => { $('.hint', el).textContent = h; },
    setTitle: (h) => { $('h2', el).textContent = h; },
    reset: () => { val = ''; render(); },
    fail: (h) => { const d = $('.pin-dots', el); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); haptic([30, 40, 30]); if (h) api.setHint(h); setTimeout(() => { d.classList.remove('shake'); api.reset(); }, 450); },
    close: () => { el.classList.add('unlocking'); document.body.classList.remove('pin-open'); setTimeout(() => el.remove(), 450); },
  };
  const press = async (k) => {
    if (busy) return;
    if (k === 'cancel') { api.close(); onComplete(null, api); return; }
    if (k === 'del') { val = val.slice(0, -1); render(); return; }
    if (val.length >= 4) return;
    haptic(); val += k; render();
    if (val.length === 4) { busy = true; await new Promise((r) => setTimeout(r, 140)); await onComplete(val, api); busy = false; }
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  const onKey = (e) => { if (!document.body.contains(el)) return document.removeEventListener('keydown', onKey);
    if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); };
  document.addEventListener('keydown', onKey);
  document.body.append(el); document.body.classList.add('pin-open');
  return api;
}

function showLock() {
  return new Promise((resolve) => {
    pinPad({ title: 'Welcome back', hint: 'Enter your PIN to open your diary',
      onComplete: async (pin, api) => {
        if (await checkPin(pin)) { haptic(12); api.close(); state.locked = false; resolve(); }
        else api.fail('That’s not it — try again');
      } });
  });
}

function setupPinFlow() {
  return new Promise((resolve) => {
    let first = null;
    pinPad({ title: 'Create a PIN', hint: 'Choose 4 digits you’ll remember', cancellable: true,
      onComplete: async (pin, api) => {
        if (pin === null) return resolve(false);
        if (!first) { first = pin; api.reset(); api.setTitle('Confirm your PIN'); api.setHint('Enter the same 4 digits again'); return; }
        if (pin !== first) { first = null; api.setTitle('Create a PIN'); api.fail('PINs didn’t match — start again'); return; }
        await setPin(pin); api.close(); resolve(true);
      } });
  });
}
function verifyPinFlow(title) {
  return new Promise((resolve) => {
    pinPad({ title, hint: 'Enter your current PIN', cancellable: true,
      onComplete: async (pin, api) => {
        if (pin === null) return resolve(false);
        if (await checkPin(pin)) { api.close(); resolve(true); } else api.fail('Incorrect PIN');
      } });
  });
}

/* ───────── Editor (shared by Today and Entry views) ───────── */
function editorHTML(e) {
  return `<section class="card glass editor">
    <div class="label-row"><span class="eyebrow">How are you feeling?</span></div>
    <div class="mood-row ${e.mood ? 'has-pick' : ''}" role="group" aria-label="Mood">
      ${MOODS.map((m) => `<button class="mood" data-mood="${m.id}" aria-pressed="${e.mood === m.id}"><span class="orb ${m.id}"></span>${m.label}</button>`).join('')}
    </div>
    <div class="label-row"><span class="eyebrow">Season</span></div>
    <div class="season-row" role="radiogroup" aria-label="Season">
      ${SEASONS.map((x) => `<button class="season-chip sc-${x.id}" role="radio" data-season="${x.id}" aria-checked="${entrySeason(e) === x.id}">${SEASON_ICON[x.id]}<span>${x.label}</span></button>`).join('')}
    </div>
    <textarea class="title-input" rows="1" placeholder="Give today a title" maxlength="140" aria-label="Title" enterkeyhint="next">${esc(e.title)}</textarea>
    <textarea class="body-input" placeholder="What’s on your mind?" aria-label="Entry">${esc(e.body)}</textarea>
    <div class="editor-foot"><span class="wc"></span><span class="save-state"><i></i><span>Autosaves</span></span></div>
  </section>`;
}
function bindEditor(root, entry) {
  const title = $('.title-input', root), body = $('.body-input', root), st = $('.save-state', root), wc = $('.wc', root), moods = $('.mood-row', root);
  let t;
  const words = () => { const n = (body.value.trim().match(/\S+/g) || []).length; wc.textContent = `${n} ${n === 1 ? 'word' : 'words'}`; };
  const grow = () => { body.style.height = 'auto'; body.style.height = Math.max(body.scrollHeight, window.innerHeight * 0.38) + 'px'; };
  const setSt = (cls, txt) => { st.className = 'save-state ' + cls; st.lastElementChild.textContent = txt; };
  const commit = async () => { clearTimeout(t); entry.title = title.value; entry.body = body.value; await saveEntry(entry);
    setSt('saved', isEmptyEntry(entry) ? 'Autosaves' : 'Saved'); };
  const schedule = () => { setSt('saving', 'Saving…'); clearTimeout(t); t = setTimeout(commit, 500); };
  const growT = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
  title.addEventListener('input', () => { if (/\n/.test(title.value)) title.value = title.value.replace(/\n+/g, ' '); growT(); schedule(); });
  body.addEventListener('input', () => { grow(); words(); schedule(); });
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });
  moods.addEventListener('click', (ev) => {
    const b = ev.target.closest('.mood'); if (!b) return; haptic();
    entry.mood = entry.mood === b.dataset.mood ? null : b.dataset.mood;
    $$('.mood', moods).forEach((x) => x.setAttribute('aria-pressed', x.dataset.mood === entry.mood));
    moods.classList.toggle('has-pick', !!entry.mood); commit();
  });
  const seasons = $('.season-row', root);
  seasons.addEventListener('click', (ev) => {
    const b = ev.target.closest('.season-chip'); if (!b) return; haptic();
    entry.season = b.dataset.season;
    $$('.season-chip', seasons).forEach((x) => x.setAttribute('aria-checked', x === b));
    Scene.set(entry.season); if (!isEmptyEntry(entry)) commit();
  });
  entry.season = entrySeason(entry);
  Scene.set(entry.season);
  words(); requestAnimationFrame(() => { grow(); growT(); });
  if (!isEmptyEntry(entry)) setSt('saved', 'Saved');
  return { flush: commit };
}

/* ───────── Views ───────── */
let current = { flush: null };
function topbar(right = '') {
  return `<header class="topbar"><span class="wordmark"><span class="mark">${MARK}</span><span>Life of <em>Me</em></span></span>${right}</header>`;
}
function streak() {
  const days = new Set(state.entries.map((e) => e.date)); let n = 0; const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function viewToday(app) {
  const now = new Date(); const key = dayKey(now);
  const entry = { ...(state.entries.filter((e) => e.date === key).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ||
    { id: uid(), date: key, title: '', body: '', mood: null, season: currentSeason(), createdAt: now.toISOString() }) };
  const hour = now.getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const monthCount = state.entries.filter((e) => e.date.slice(0, 7) === key.slice(0, 7)).length;
  const s = streak();
  app.innerHTML = `<div class="view">
    ${topbar()}
    <div class="date-hero">
      <div class="eyebrow">${greet}</div>
      <h1 class="h-display"><span>${fmt(now, { weekday: 'long' })}</span></h1>
      <div class="sub">${fmt(now, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="stats">
      <span class="chip glass"><span class="dot"></span><b>${s}</b> day streak</span>
      <span class="chip glass"><b>${monthCount}</b> ${monthCount === 1 ? 'entry' : 'entries'} in ${fmt(now, { month: 'long' })}</span>
    </div>
    ${editorHTML(entry)}
  </div>`;
  current = bindEditor(app, entry);
}

function highlight(text, q) {
  const safe = esc(text); if (!q) return safe;
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'gi');
  return safe.replace(re, (m) => `<mark>${m}</mark>`);
}
function excerpt(body, q) {
  const flat = body.replace(/\s+/g, ' ').trim(); if (!q) return flat.slice(0, 180);
  const i = flat.toLowerCase().indexOf(q.toLowerCase()); if (i < 40) return flat.slice(0, 180);
  return '…' + flat.slice(i - 30, i + 150);
}

function viewTimeline(app) {
  app.innerHTML = `<div class="view">
    ${topbar()}
    <h1 class="page-title">Timeline</h1>
    <label class="search glass ${state.query ? 'has-q' : ''}">${ICON.search}
      <input type="search" placeholder="Search your entries" value="${esc(state.query)}" aria-label="Search entries" autocomplete="off" enterkeyhint="search">
      <button class="clear" aria-label="Clear search">${ICON.x}</button></label>
    <div id="list"></div></div>`;
  const input = $('.search input', app), box = $('.search', app);
  input.addEventListener('input', () => { state.query = input.value; box.classList.toggle('has-q', !!input.value); renderList(); });
  $('.clear', app).addEventListener('click', (e) => { e.preventDefault(); state.query = ''; input.value = ''; box.classList.remove('has-q'); renderList(); input.focus(); });
  renderList();
}
function renderList() {
  const list = $('#list'); if (!list) return;
  const q = state.query.trim().toLowerCase();
  const items = sorted().filter((e) => !q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) || (e.mood || '').includes(q) || entrySeason(e).includes(q));
  if (!state.entries.length) {
    list.innerHTML = `<div class="empty card glass"><div class="art">${ICON.pen}</div><h3>Your story starts today</h3><p>Entries you write will appear here, grouped by month.</p><a class="btn btn-primary" href="#/today">Write your first entry</a></div>`;
    return;
  }
  if (!items.length) { list.innerHTML = `<div class="empty card glass"><div class="art">${ICON.search}</div><h3>Nothing found</h3><p>No entries match “${esc(state.query)}”.</p></div>`; return; }
  const groups = new Map();
  for (const e of items) { const k = e.date.slice(0, 7); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
  let i = 0;
  list.innerHTML = [...groups].map(([k, es]) => {
    const d = parseKey(k + '-01'); const st = monthStyle(d.getMonth());
    return `<section class="month" style="${st}">
      <div class="month-head"><h2>${fmt(d, { month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })}</h2><span>${es.length} ${es.length === 1 ? 'entry' : 'entries'}</span></div>
      <div class="entries">${es.map((e) => { const dd = parseKey(e.date); const m = moodOf(e.mood);
        const sn = entrySeason(e);
        return `<a class="entry-card glass s-${sn}" href="#/entry/${encodeURIComponent(e.id)}" style="--i:${i++}">
          <span class="sfx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          <span class="daybox"><b>${dd.getDate()}</b><small>${fmt(dd, { weekday: 'short' })}</small></span>
          <div class="entry-body"><h3>${highlight(e.title.trim() || (e.body.trim().split('\n')[0].slice(0, 60)) || 'Untitled', q)}</h3><p>${highlight(excerpt(e.body, q) || 'No words yet — just a feeling.', q)}</p>
          <span class="entry-meta">${m ? `<span class="mood-pill"><span class="orb ${m.id}"></span>${m.label}</span>` : ''}<span class="season-pill sp-${sn}">${SEASON_ICON[sn]}${seasonOf(sn).label}</span></span></div>
        </a>`; }).join('')}</div></section>`;
  }).join('');
}

async function viewEntry(app, id) {
  const e = state.entries.find((x) => x.id === id);
  if (!e) { location.hash = '#/timeline'; return; }
  const entry = { ...e }; const d = parseKey(entry.date);
  app.innerHTML = `<div class="view">
    <div class="entry-top"><button class="icon-btn glass" data-act="back" aria-label="Back">${ICON.back}</button>
      <button class="icon-btn glass" data-act="delete" aria-label="Delete entry">${ICON.trash}</button></div>
    <div class="entry-date" style="${monthStyle(d.getMonth())}"><div class="eyebrow">${fmt(d, { weekday: 'long' })}</div>
      <h1 class="h-display">${fmt(d, { day: 'numeric', month: 'long' })}</h1><div class="sub" style="color:var(--ink-2);margin-top:6px;font-weight:500">${d.getFullYear()}</div></div>
    ${editorHTML(entry)}</div>`;
  current = bindEditor(app, entry);
  $('[data-act="back"]', app).onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/timeline'); };
  $('[data-act="delete"]', app).onclick = async () => {
    const ok = await sheet({ title: 'Delete this entry?', text: 'It will be permanently removed from this device. This can’t be undone.',
      actions: [{ label: 'Delete entry', value: true, cls: 'btn-danger' }, { label: 'Keep it', value: false }] });
    if (!ok) return;
    current = { flush: null };
    state.entries = state.entries.filter((x) => x.id !== entry.id); await DB.del(entry.id);
    haptic(20); toast('Entry deleted'); location.hash = '#/timeline';
  };
}

function viewSettings(app) {
  const theme = LS.get('theme', 'aurora'); const mode = LS.get('mode', 'system'); const hasPin = !!LS.get('pinHash');
  const modes = ['system', 'light', 'dark'];
  app.innerHTML = `<div class="view">
    ${topbar()}
    <h1 class="page-title">Settings</h1>
    <div class="section"><span class="eyebrow">Theme</span>
      <div class="themes card glass" role="radiogroup" aria-label="Theme" style="padding:8px">
        ${THEMES.map((t) => `<button class="theme-swatch" role="radio" data-theme="${t.id}" aria-checked="${t.id === theme}"><span class="sw ${t.id}"></span>${t.label}</button>`).join('')}
      </div></div>
    <div class="section"><span class="eyebrow">Appearance</span>
      <div class="segmented glass" role="radiogroup" aria-label="Appearance"><span class="thumb" style="transform:translateX(${modes.indexOf(mode) * 100}%)"></span>
        ${modes.map((m) => `<button role="radio" data-mode="${m}" aria-checked="${m === mode}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}
      </div></div>
    <div class="section"><span class="eyebrow">Seasons</span>
      <div class="list glass">
        <button class="row" data-act="scenes"><span class="ic sky">${SEASON_ICON.winter}</span><span class="txt"><b>Seasonal scenes</b><small>Living photo backdrops — snow, blossom, summer sun, autumn rain</small></span><span class="switch" role="switch" aria-checked="${LS.get('scenes', '1') === '1'}"></span></button>
      </div></div>
    <div class="section"><span class="eyebrow">Privacy</span>
      <div class="list glass">
        <button class="row" data-act="pin"><span class="ic violet">${ICON.lock}</span><span class="txt"><b>PIN lock</b><small>${hasPin ? 'On — asks for your PIN on open' : 'Off — ask for a 4-digit PIN on open'}</small></span><span class="switch" role="switch" aria-checked="${hasPin}"></span></button>
        ${hasPin ? `<button class="row" data-act="change"><span class="ic blue">${ICON.key}</span><span class="txt"><b>Change PIN</b></span>${ICON.chev}</button>` : ''}
      </div></div>
    <div class="section"><span class="eyebrow">Backup</span>
      <div class="list glass">
        <button class="row" data-act="export"><span class="ic green">${ICON.down}</span><span class="txt"><b>Export backup</b><small>Save all ${state.entries.length} ${state.entries.length === 1 ? 'entry' : 'entries'} as a JSON file</small></span>${ICON.chev}</button>
        <button class="row" data-act="import"><span class="ic orange">${ICON.up}</span><span class="txt"><b>Import backup</b><small>Restore entries from a JSON file</small></span>${ICON.chev}</button>
      </div>
      <input type="file" id="importFile" accept="application/json,.json" hidden></div>
    <div class="privacy-note glass">${ICON.shield}<span>Your diary lives only on this phone. No account, no cloud, no tracking — nothing ever leaves your device. Export a backup now and then so you never lose a word.</span></div>
    <p class="foot-meta">Life of Me · v1.0</p>
  </div>`;

  $('.themes', app).addEventListener('click', (e) => { const b = e.target.closest('[data-theme]'); if (!b) return; haptic();
    LS.set('theme', b.dataset.theme); applyTheme(); $$('.theme-swatch', app).forEach((x) => x.setAttribute('aria-checked', x === b)); });
  $('.segmented', app).addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (!b) return; haptic();
    LS.set('mode', b.dataset.mode); applyTheme(); $$('.segmented button', app).forEach((x) => x.setAttribute('aria-checked', x === b));
    $('.thumb', app).style.transform = `translateX(${modes.indexOf(b.dataset.mode) * 100}%)`; });
  $('[data-act="pin"]', app).onclick = async () => {
    if (LS.get('pinHash')) { if (await verifyPinFlow('Turn off PIN')) { LS.set('pinHash', null); LS.set('pinSalt', null); toast('PIN lock turned off'); } }
    else if (await setupPinFlow()) toast('PIN lock is on');
    viewSettings(app);
  };
  const ch = $('[data-act="change"]', app);
  if (ch) ch.onclick = async () => { if (await verifyPinFlow('Change PIN') && await setupPinFlow()) toast('PIN updated'); };
  $('[data-act="scenes"]', app).onclick = () => { const on = LS.get('scenes', '1') !== '1'; LS.set('scenes', on ? '1' : '0'); Scene.enabled = on; haptic();
    $('[data-act="scenes"] .switch', app).setAttribute('aria-checked', on); toast(on ? 'Seasonal scenes on' : 'Seasonal scenes off'); };
  $('[data-act="export"]', app).onclick = exportBackup;
  const file = $('#importFile', app);
  $('[data-act="import"]', app).onclick = () => file.click();
  file.onchange = async () => { const f = file.files[0]; file.value = ''; if (f) await importBackup(f); viewSettings(app); };
}

/* ───────── Backup ───────── */
async function exportBackup() {
  const data = { app: 'life-of-me', version: 5, exportedAt: new Date().toISOString(), entries: sorted(), workoutBlocks: WK.all(), trophies: TR.get(), workoutStats: WKS.get() };
  const name = `life-of-me-backup-${dayKey()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  try {
    const f = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Life of Me backup' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Backup exported');
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.entries;
    if (!Array.isArray(list)) throw new Error('bad');
    let added = 0, updated = 0;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date || '')) continue;
      const e = { id: String(raw.id || uid()), date: raw.date, title: String(raw.title || ''), body: String(raw.body || ''),
        mood: moodOf(raw.mood) ? raw.mood : null, season: seasonOf(raw.season) ? raw.season : seasonForKey(raw.date), createdAt: raw.createdAt || new Date().toISOString(), updatedAt: raw.updatedAt || new Date().toISOString() };
      const ex = state.entries.find((x) => x.id === e.id);
      if (ex && (ex.updatedAt || '') >= e.updatedAt) continue;
      await DB.put(e); ex ? updated++ : added++;
    }
    let wkMerged = 0;
    // v4 backups: { workoutBlocks: { <blockId>: { <day>: progress } } }; v3 backups: { workouts: { <day>: progress } } = Block 1
    const incoming = data && data.workoutBlocks && typeof data.workoutBlocks === 'object' ? data.workoutBlocks
      : data && data.workouts && typeof data.workouts === 'object' && !Array.isArray(data.workouts) && firstBlock() ? { [firstBlock().id]: data.workouts } : null;
    if (incoming) {
      const all = WK.all();
      for (const [bid, days] of Object.entries(incoming)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(bid) || !days || typeof days !== 'object') continue;
        const blk = blockById(bid); const prog = all[bid] || (all[bid] = {});
        for (const [day, inc] of Object.entries(days)) {
          if (!/^\d{1,3}$/.test(day) || (blk && !wkByDay(blk, day)) || !inc || typeof inc !== 'object') continue; // unknown blocks are kept for a future build
          const pr = WK.of(prog, day); const before = JSON.stringify(pr);
          for (const [slug, v] of Object.entries(inc.ex || {})) if (v === true && /^[a-z0-9-]+$/.test(slug)) pr.ex[slug] = true;
          if (inc.done === true && !pr.done) { pr.done = true; pr.doneAt = typeof inc.doneAt === 'string' ? inc.doneAt : new Date().toISOString(); }
          if (typeof inc.warm === 'boolean' && pr.warm === undefined) pr.warm = inc.warm; else if (inc.warm === true) pr.warm = true;
          if (JSON.stringify(pr) !== before) wkMerged++;
        }
      }
      WK.saveAll(all);
    }
    // v5: trophies { id: unlockedAt } (earliest date wins) and timer counters (highest wins)
    let trMerged = 0;
    if (data && data.trophies && typeof data.trophies === 'object') { const got = TR.get();
      for (const [id, at] of Object.entries(data.trophies)) if (TROPHIES.some((t) => t.id === id) && typeof at === 'string' && !isNaN(new Date(at)) && (!got[id] || at < got[id])) { if (!got[id]) trMerged++; got[id] = at; }
      TR.save(got); }
    if (data && data.workoutStats && typeof data.workoutStats === 'object') { const s = WKS.get();
      for (const k of ['timers', 'timerSets', 'warmTimers']) { const v = +data.workoutStats[k]; if (Number.isFinite(v) && v > (+s[k] || 0)) s[k] = Math.floor(v); }
      LS.set('wkstats', JSON.stringify(s)); }
    await load();
    toast(added + updated || wkMerged ? `Imported ${added} new${updated ? `, ${updated} updated` : ''}${wkMerged ? ` · ${wkMerged} workout${wkMerged === 1 ? '' : 's'}` : ''}${trMerged ? ` · ${trMerged} troph${trMerged === 1 ? 'y' : 'ies'}` : ''}` : trMerged ? `Imported ${trMerged} troph${trMerged === 1 ? 'y' : 'ies'}` : 'Everything was already here');
    checkTrophies({ quiet: true });
  } catch (e) { toast('That file isn’t a Life of Me backup'); }
}

/* ───────── Workouts (multi-block) ───────── */
const BLOCKS = (window.WORKOUT_BLOCKS || (window.WORKOUT_PLAN ? [{ ...window.WORKOUT_PLAN, id: window.WORKOUT_PLAN.start, block: 1 }] : []))
  .slice().sort((a, b) => a.start.localeCompare(b.start));
const WK_COLORS = [['#FF7A45', '#FF3D8B'], ['#7C5CFF', '#3FA9FF'], ['#00C2D1', '#16C79A'], ['#FFB020', '#FF5A3D'], ['#B13BFF', '#FF6AD5'], ['#3DE0B5', '#38D1FF']];
const wkStyle = (w) => { const [a, b] = WK_COLORS[(w.day - 1) % WK_COLORS.length]; return `--wk:linear-gradient(135deg,${a},${b});--wk-glow:${a}`; };
const londonKey = () => { try { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const v = (t) => p.find((x) => x.type === t).value; return `${v('year')}-${v('month')}-${v('day')}`; } catch (e) { return dayKey(); } };
const blockById = (id) => BLOCKS.find((b) => b.id === id);
const firstBlock = () => BLOCKS.find((b) => b.block === 1) || BLOCKS[0];
/* Progress lives in localStorage "diary.wkblocks" as { <blockId = start date>: { <day>: { ex:{slug:true}, done, doneAt } } }.
   Block ids never change, so progress for older blocks survives every rebuild. v1 progress ("diary.workouts") is migrated into Block 1. */
const WK = {
  all() {
    let all; try { all = JSON.parse(LS.get('wkblocks', 'null')); } catch (e) { all = null; }
    if (!all || typeof all !== 'object') {
      all = {}; let legacy = null; try { legacy = JSON.parse(LS.get('workouts', 'null')); } catch (e) {}
      if (legacy && typeof legacy === 'object' && firstBlock()) all[firstBlock().id] = legacy;
      LS.set('wkblocks', JSON.stringify(all)); if (legacy) LS.set('workouts', null);
    }
    return all;
  },
  saveAll(all) { LS.set('wkblocks', JSON.stringify(all)); },
  load(b) { const all = WK.all(); return all[b.id] || {}; },
  save(b, p) { const all = WK.all(); all[b.id] = p; WK.saveAll(all); },
  of(p, day) { return p[day] || (p[day] = { ex: {}, done: false, doneAt: null }); },
};
const wkByDay = (b, d) => b && b.workouts.find((w) => String(w.day) === String(d));
const exDone = (pr, w) => w.exercises.filter((e) => pr.ex[e.slug]).length;
const blockDone = (b, prog) => b.workouts.filter((w) => prog[w.day] && prog[w.day].done).length;
const lastDate = (b) => b.workouts.reduce((m, w) => (w.date > m ? w.date : m), b.start);
const blockFinished = (b, prog, today = londonKey()) => blockDone(b, prog) === b.workouts.length || today > lastDate(b);
/* Default block: the latest one that has started; if that one is finished and a newer one is waiting, show the newer one. */
function defaultBlock() {
  const today = londonKey(); const started = BLOCKS.filter((b) => b.start <= today);
  const cur = started[started.length - 1] || BLOCKS[0]; if (!cur) return null;
  const nxt = BLOCKS[BLOCKS.indexOf(cur) + 1];
  return nxt && blockFinished(cur, WK.load(cur), today) ? nxt : cur;
}
function wkStatus(b, w, prog) {
  const today = londonKey(), pr = prog[w.day];
  if (pr && pr.done) return { id: 'done', label: 'Done' };
  if (w.date === today) return { id: 'today', label: 'Today' };
  const next = b.workouts.find((x) => x.date > today && !(prog[x.day] && prog[x.day].done));
  if (next && next.day === w.day && !b.workouts.some((x) => x.date === today && !(prog[x.day] && prog[x.day].done))) return { id: 'next', label: 'Up next' };
  if (w.date < today) return b === BLOCKS[BLOCKS.length - 1] || today <= b.end ? { id: 'missed', label: 'Catch up' } : { id: 'missed', label: 'Skipped' };
  return { id: 'later', label: fmt(parseKey(w.date), { weekday: 'short' }) };
}
const WICON = {
  dumbbell: '<svg viewBox="0 0 24 24" class="wi"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  clock: '<svg viewBox="0 0 24 24" class="wi"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  list: '<svg viewBox="0 0 24 24" class="wi"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" class="wi"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" class="wi"><path d="M8 5.5v13l10.5-6.5L8 5.5Z"/></svg>',
  loop: '<svg viewBox="0 0 24 24" class="wi"><path d="M17 3.5 20.5 7 17 10.5"/><path d="M20.5 7H9a5 5 0 0 0-5 5M7 20.5 3.5 17 7 13.5"/><path d="M3.5 17H15a5 5 0 0 0 5-5"/></svg>',
  flame: '<svg viewBox="0 0 24 24" class="wi"><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.9 3.4-5.8 3.9-10.3 2.9 1.9 4.4 4.3 4.6 6.6.9-.6 1.5-1.6 1.7-2.7 1.8 1.7 2.8 3.9 2.8 6.4 0 3.6-2.6 6.2-6.5 6.2Z"/></svg>',
  leafy: '<svg viewBox="0 0 24 24" class="wi"><path d="M12 21c-4-3-6-6.5-6-10a6 6 0 0 1 12 0c0 3.5-2 7-6 10Z"/><path d="M12 21V9"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" class="wi"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4M11 8.5v5M8.5 11h5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" class="wi"><path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5Z"/><path d="M18.5 15.5c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z"/></svg>',
  history: '<svg viewBox="0 0 24 24" class="wi"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/></svg>',
};
const amount = (e) => `${e.sets} × ${e.reps || e.time}`;
const shortRange = (b) => `${fmt(parseKey(b.start), { day: 'numeric', month: 'short' })} – ${fmt(parseKey(b.end), { day: 'numeric', month: 'short' })}`;

function viewWorkouts(app, blockId) {
  const b = (blockId && blockById(blockId)) || defaultBlock();
  if (!b) { app.innerHTML = `<div class="view">${topbar()}<h1 class="page-title">Workouts</h1>${comingSoonCard(null, {})}</div>`; return; }
  const today = londonKey(), def = defaultBlock(), newest = BLOCKS[BLOCKS.length - 1];
  const prog = WK.load(b); const total = b.workouts.length; const done = blockDone(b, prog); const pct = total ? Math.round(done / total * 100) : 0;
  const tagOf = (x) => x === def ? 'Current' : x.start > today ? 'Upcoming' : 'Past';
  const switcher = BLOCKS.length > 1 ? `<nav class="wk-blocks" aria-label="Workout blocks"><span class="wk-blocks-label">${WICON.history}Blocks</span>
      <div class="wk-blocks-row">${BLOCKS.slice().reverse().map((x) => { const p = WK.load(x), n = blockDone(x, p), t = tagOf(x);
        return `<a class="wk-blk glass${x === b ? ' is-active' : ''} tag-${t.toLowerCase()}" href="#/workouts/${x.id}"${x === b ? ' aria-current="page"' : ''}>
          <span class="wk-blk-top"><b>Block ${x.block}</b><em>${t}</em></span><small>${shortRange(x)} · ${n}/${x.workouts.length}${n === x.workouts.length ? ' ✓' : ''}</small></a>`; }).join('')}</div></nav>` : '';
  const soon = b === newest && blockFinished(b, prog, today) ? comingSoonCard(b, prog) : '';
  const upcoming = b.start > today ? `<div class="privacy-note glass wk-note">${WICON.spark}<span><b>Starts ${fmt(parseKey(b.start), { weekday: 'long', day: 'numeric', month: 'long' })}.</b> Have a look ahead — you can tick things off any time.</span></div>` : '';
  app.innerHTML = `<div class="view">
    ${topbar()}
    <h1 class="page-title">Workouts</h1>
    ${switcher}
    <section class="wk-summary card glass">
      <div class="ring" style="--p:${pct}"><span><b>${done}</b>/${total}</span></div>
      <div class="wk-sum-txt"><span class="eyebrow">Block ${b.block}${b === def ? ' · Current' : ''}</span><b>${esc(b.title || 'Workout plan')}</b><small>${shortRange(b)} · ${total} sessions</small>
        <div class="wk-equip">${(b.equipment || []).map((q) => `<span class="tag">${esc(q[0].toUpperCase() + q.slice(1))}</span>`).join('')}</div></div>
    </section>
    ${trophyEntryCard()}
    ${soon}${upcoming}
    <div class="wk-list">${b.workouts.map((w, i) => { const st = wkStatus(b, w, prog); const pr = prog[w.day] || { ex: {} }; const n = exDone(pr, w), d = parseKey(w.date);
      return `<a class="wk-card glass st-${st.id}" href="#/workout/${b.id}/${w.day}" style="${wkStyle(w)};--i:${i}">
        <span class="wk-date"><small>${fmt(d, { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${fmt(d, { month: 'short' })}</small></span>
        <div class="wk-main">
          <div class="wk-top"><span class="eyebrow">Workout ${w.day}</span><span class="wk-pill pill-${st.id}">${st.id === 'done' ? WICON.check : ''}${esc(st.label)}</span></div>
          <h3>${esc(w.theme)}</h3>
          <div class="wk-meta"><span>${WICON.clock}${esc(String(w.duration).replace(/^About /, '~'))}</span><span>${WICON.list}${w.exercises.length} exercises</span></div>
          <div class="wk-bar"><i style="width:${(st.id === 'done' ? 1 : n / w.exercises.length) * 100}%"></i></div>
        </div>
        <span class="wk-thumbs">${w.exercises.slice(0, 3).map((x) => `<img src="${x.image}" alt="" loading="lazy" decoding="async">`).join('')}</span>
      </a>`; }).join('')}</div>
    ${b.progression ? `<div class="privacy-note glass">${WICON.flame}<span><b>Progression.</b> ${esc(b.progression)}</span></div>` : ''}
  </div>`;
  const act = $('.wk-blk.is-active', app); if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' }); window.scrollTo(0, 0);
}
function comingSoonCard(b, prog) {
  const n = b ? blockDone(b, prog) : 0, t = b ? b.workouts.length : 0;
  const head = !b ? 'Your first block is on its way' : n === t ? `Block ${b.block} complete — ${n} of ${t}!` : `Block ${b.block} has wrapped up`;
  const sub = !b ? 'Your workout plan will appear here as soon as it’s ready.' : n === t ? 'Brilliant consistency. Your next plan will appear here as soon as it’s ready — take a rest day, you’ve earned it.'
    : `You did ${n} of ${t} sessions. Your next plan will appear here as soon as it’s ready — until then you can still catch up below.`;
  return `<section class="wk-soon card glass"><span class="wk-soon-icon">${WICON.spark}</span><div><span class="eyebrow">Next block coming soon</span><h3>${esc(head)}</h3><p>${esc(sub)}</p></div></section>`;
}

/* ───────── Workout detail: three sections — Warm-up · Exercises · Stretches ─────────
   Warm-up moves and stretches come from the plan (built by tools/build-workouts.py) with their own picture, steps and common mistakes.
   One "Start workout" button runs the guided player (openSession) through all three sections. */
const fmtDur = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} sec` : `${s} sec`);
const moveAmount = (x) => (x.seconds ? (x.sides > 1 ? `${fmtDur(x.seconds)} per ${x.sideWord || 'side'}` : fmtDur(x.seconds)) : (x.reps || x.detail || ''));
const SECS = { warmup: { id: 'warm', label: 'Warm-up', icon: 'flame' }, exercise: { id: 'ex', label: 'Exercises', icon: 'dumbbell' }, stretch: { id: 'str', label: 'Stretches', icon: 'leafy' } };
const WKSESSION = {
  get(b, w) { let s = null; try { s = JSON.parse(LS.get('wksession', 'null')); } catch (e) {}
    return s && s.bid === b.id && s.day === w.day && Date.now() - (+s.at || 0) < 4 * 3600e3 ? s : null; },
  set(s) { LS.set('wksession', s ? JSON.stringify(s) : null); },
};

/* Every step of the session in order. A per-side timed move becomes two steps (side 1, side 2) with a short switch between. */
function buildSession(w) {
  const S = { circuit: true, rounds: 3, minRounds: 3, moveRest: 30, roundRest: 90, switch: 5, transition: 30, ...(w.session || {}) };
  const steps = [];
  const sw = { s: S.switch || 5, kind: 'switch' };
  const addMove = (x, sec, rest) => { const n = x.seconds && x.sides > 1 ? x.sides : 1;
    for (let s = 1; s <= n; s++) steps.push({ sec, item: x, name: x.name, image: x.image, seconds: x.seconds || 0, reps: x.seconds ? null : (x.reps || x.detail || ''),
      side: n > 1 ? s : 0, sides: n, sideWord: x.sideWord || 'side', rest: s < n ? sw : { s: rest, kind: 'rest' } }); };
  const endSection = (kind) => { const l = steps[steps.length - 1]; if (l) l.rest = { s: S.transition || 30, kind }; };
  (w.warmup || []).forEach((x) => addMove(x, 'warmup', x.rest != null ? x.rest : (w.warmupRestSeconds || 10)));
  endSection('transition');
  const ex = w.exercises || [];
  const exStep = (e, k, set, sets, round) => { const t = timerOfEx(e), n = t.work && t.sides > 1 ? 2 : 1;
    for (let s = 1; s <= n; s++) steps.push({ sec: 'exercise', item: e, ex: e, name: e.name, image: e.image, seconds: t.work || 0, reps: t.work ? null : (e.reps || ''),
      side: n > 1 ? s : 0, sides: n, sideWord: /\bleg\b/i.test(e.time || '') ? 'leg' : 'side', set, sets, round, rest: s < n ? sw : null }); };
  if (S.circuit) {
    const R = S.rounds || 3;
    for (let r = 1; r <= R; r++) ex.forEach((e, k) => { exStep(e, k, r, R, r);
      steps[steps.length - 1].rest = k < ex.length - 1 ? { s: S.moveRest, kind: 'rest' } : r < R ? { s: S.roundRest, kind: 'round', canFinish: r >= (S.minRounds || R), round: r } : null; });
  } else ex.forEach((e, k) => { const t = timerOfEx(e), n = t.sets || 1;
    for (let s = 1; s <= n; s++) { exStep(e, k, s, n, 0); steps[steps.length - 1].rest = s < n ? { s: t.rest || 60, kind: 'rest' } : k < ex.length - 1 ? { s: S.moveRest || 60, kind: 'rest' } : null; } });
  if (ex.length) endSection('transition');
  (w.stretches || []).forEach((x) => addMove(x, 'stretch', x.rest != null ? x.rest : (w.stretchRestSeconds || 10)));
  const last = steps[steps.length - 1]; if (last) last.rest = null;
  steps.forEach((s, k) => { s.n = k; });
  const est = steps.reduce((m, s) => m + (s.seconds || (s.sec === 'exercise' ? 40 : 30)) + (s.rest ? s.rest.s : 0), 0) + 5;
  return { steps, S, est };
}

function moveCard(x, k, sec) {
  return `<button class="mv glass" data-howto="${sec}:${k}" aria-label="How to do ${esc(x.name)}">
      <span class="mv-img">${x.image ? `<img src="${x.image}" alt="" loading="lazy" decoding="async" width="800" height="600">` : WICON[SECS[sec === 'w' ? 'warmup' : 'stretch'].icon]}<em>${k + 1}</em></span>
      <span class="mv-txt"><b>${esc(x.name)}</b><small>${esc(moveAmount(x))}</small></span>
      <span class="mv-go">How to${ICON.chevron || '<svg viewBox="0 0 24 24" class="wi"><path d="m9 6 6 6-6 6"/></svg>'}</span></button>`;
}

function viewWorkout(app, blockId, day) {
  const b = blockById(blockId); const w = wkByDay(b, day); if (!w) { location.hash = '#/workouts'; return; }
  const prog = WK.load(b); const pr = WK.of(prog, w.day); const d = parseKey(w.date); const st = wkStatus(b, w, prog);
  const save = () => WK.save(b, prog);
  const warm = w.warmup || [], str = w.stretches || [];
  const ses = buildSession(w); const resume = WKSESSION.get(b, w);
  const S = ses.S;
  const restLine = S.circuit ? `${S.rounds} rounds · ${S.moveRest} sec between moves · ${fmtDur(S.roundRest)} between rounds${S.minRounds < S.rounds ? ` · ${S.minRounds} rounds is fine too` : ''}` : esc(w.rest);
  app.innerHTML = `<div class="view wk-detail" style="${wkStyle(w)}">
    <div class="entry-top"><button class="icon-btn glass" data-act="back" aria-label="Back">${ICON.back}</button><span class="wk-pill pill-${st.id}">${st.id === 'done' ? WICON.check : ''}${esc(st.label)}</span></div>
    <div class="wk-hero"><div class="eyebrow">${BLOCKS.length > 1 ? `Block ${b.block} · ` : ''}Workout ${w.day} · ${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 class="h-display"><span>${esc(w.theme)}</span></h1>
      <div class="stats"><span class="chip glass">${WICON.clock}${esc(w.duration)}</span><span class="chip glass">${WICON.loop}${esc(w.format)}</span></div>
      <div class="wk-progress"><div class="wk-bar big"><i></i></div><span class="wk-count"></span></div>
    </div>
    <section class="wk-start card glass">
      <div class="ws-flow">${[['warmup', warm.length], ['exercise', w.exercises.length], ['stretch', str.length]].filter((x) => x[1]).map(([k, n]) => `<span class="ws-${SECS[k].id}">${WICON[SECS[k].icon]}<b>${n}</b>${SECS[k].label}</span>`).join('<i></i>')}</div>
      <button class="btn btn-block btn-primary ws-go" data-act="start">${WICON.play}${resume ? `Resume · step ${resume.i + 1} of ${ses.steps.length}` : 'Start workout'}</button>
      <p class="ws-sub">${resume ? '<button class="ws-over" data-act="restart">Start over instead</button>' : `${ses.steps.length} steps · about ${Math.max(5, Math.round(ses.est / 300) * 5)} min. Timers and rests run by themselves — you just move.`}</p>
    </section>
    <nav class="wk-seg glass" aria-label="Sections">${warm.length ? `<a href="#sec-warm" data-jump="sec-warm">Warm-up <b>${warm.length}</b></a>` : ''}<a href="#sec-ex" data-jump="sec-ex">Exercises <b>${w.exercises.length}</b></a>${str.length ? `<a href="#sec-str" data-jump="sec-str">Stretches <b>${str.length}</b></a>` : ''}</nav>
    ${warm.length ? `<section class="wk-sec sec-warm" id="sec-warm">
      <h2 class="wk-section">${WICON.flame}Warm-up<small>${warm.length} moves</small><button class="tick warm-tick" role="checkbox" aria-checked="false" aria-label="Warm-up done" data-warmtick>${WICON.check}</button></h2>
      <div class="mv-list">${warm.map((x, k) => moveCard(x, k, 'w')).join('')}</div></section>` : ''}
    <section class="wk-sec sec-ex" id="sec-ex">
      <h2 class="wk-section">${WICON.dumbbell}Exercises<small>${w.exercises.length} moves</small></h2>
      <p class="wk-rest">${restLine}</p>
      <div class="wk-ex-list">${w.exercises.map((e) => `<article class="ex card glass" data-slug="${esc(e.slug)}">
      <button class="ex-photo" data-zoom="${esc(e.slug)}" aria-label="Enlarge ${esc(e.name)} photo"><img src="${e.image}" alt="${esc(e.name)} — ${esc((e.formPoints || []).join(', '))}" loading="lazy" decoding="async" width="800" height="600"><span class="zoom-hint">${WICON.zoom}</span><span class="ex-num">${e.order}</span></button>
      <div class="ex-head"><div><h3>${esc(e.name)}</h3><div class="ex-amount">${esc(amount(e))}</div></div>
        <button class="tick" role="checkbox" aria-checked="${!!pr.ex[e.slug]}" aria-label="Done: ${esc(e.name)}" data-tick="${esc(e.slug)}">${WICON.check}</button></div>
      <p class="ex-tip">${esc(e.formTips)}</p>
      ${e.formPoints && e.formPoints.length ? `<ol class="ex-points">${e.formPoints.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>` : ''}
      <div class="ex-easier"><span>Easier</span>${esc(e.easierOption)}</div>
      <div class="ex-foot"><div class="ex-tags">${(e.muscleGroups || []).map((m) => `<span class="tag">${esc(m)}</span>`).join('')}</div>
        ${e.videoUrl ? `<a class="ex-video" href="${esc(e.videoUrl)}" target="_blank" rel="noopener noreferrer">${WICON.play}<span><b>Watch form video</b><small>${esc(e.videoChannel || 'YouTube')}</small></span></a>` : ''}</div>
    </article>`).join('')}</div></section>
    ${str.length ? `<section class="wk-sec sec-str" id="sec-str">
      <h2 class="wk-section">${WICON.leafy}Stretches<small>${str.length} stretches</small></h2>
      <p class="wk-rest">Slow and easy — breathe out as you ease in. Never stretch into pain.</p>
      <div class="mv-list">${str.map((x, k) => moveCard(x, k, 's')).join('')}</div></section>`
    : `<section class="card glass wk-block"><h2>${WICON.leafy}Cool-down</h2><p class="wk-cool">${esc(w.cooldown || '')}</p></section>`}
    <div class="wk-actions"><button class="btn btn-block wk-done-btn" data-act="done"></button></div>
  </div>`;
  const doneBtn = $('[data-act="done"]', app), bar = $('.wk-progress i', app), count = $('.wk-count', app);
  const render = () => { const n = exDone(pr, w);
    bar.style.width = (pr.done ? 100 : n / w.exercises.length * 100) + '%'; count.textContent = pr.done ? 'Workout complete' : `${n} of ${w.exercises.length} exercises`;
    doneBtn.className = 'btn btn-block wk-done-btn ' + (pr.done ? 'btn-ghost' : 'btn-glass');
    doneBtn.innerHTML = pr.done ? `${WICON.check}Done — tap to undo` : `${WICON.check}Mark workout done`;
    const wt = $('[data-warmtick]', app), wOn = pr.warm === true || (pr.done && pr.warm !== false); if (wt) { wt.setAttribute('aria-checked', wOn); wt.closest('.wk-sec').classList.toggle('is-done', wOn); }
    $$('.ex', app).forEach((el) => { const on = !!pr.ex[el.dataset.slug]; el.classList.toggle('is-done', on); $('.tick', el).setAttribute('aria-checked', on); });
    const pill = $('.entry-top .wk-pill', app), s2 = wkStatus(b, w, prog); pill.className = `wk-pill pill-${s2.id}`; pill.innerHTML = (s2.id === 'done' ? WICON.check : '') + esc(s2.label); };
  render();
  const reopen = () => { if (app.isConnected && location.hash.startsWith('#/workout/')) { const y = window.scrollY; viewWorkout(app, b.id, w.day); window.scrollTo(0, y); } };
  const start = (from) => { Beep.unlock(); openSession({ b, w, prog, pr, save, from, onClose: reopen }); };
  $('[data-act="back"]', app).onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/workouts/' + b.id); };
  if (app._wkClick) app.removeEventListener('click', app._wkClick); // one handler per detail view (views reuse #app)
  app._wkClick = (ev) => {
    if (ev.target.closest('[data-act="start"]')) { start(resume || null); return; }
    if (ev.target.closest('[data-act="restart"]')) { WKSESSION.set(null); start(null); return; }
    const j = ev.target.closest('[data-jump]'); if (j) { ev.preventDefault(); const s = $('#' + j.dataset.jump, app);
      if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 70, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
    const h = ev.target.closest('[data-howto]'); if (h) { const [k, i] = h.dataset.howto.split(':'); openHowTo((k === 'w' ? warm : str)[+i], k === 'w' ? 'warmup' : 'stretch'); return; }
    const t = ev.target.closest('[data-tick]'); if (t) { const s = t.dataset.tick; pr.ex[s] = !pr.ex[s]; if (!pr.ex[s]) delete pr.ex[s];
      haptic(pr.ex[s] ? 12 : 6); save(); render();
      if (!pr.done && exDone(pr, w) === w.exercises.length) toast('All exercises ticked — mark the workout done?');
      if (pr.ex[s]) { Beep.unlock(); checkTrophies(); } return; }
    if (ev.target.closest('[data-warmtick]')) { const on = !(pr.warm === true || (pr.done && pr.warm !== false)); pr.warm = on; haptic(on ? 12 : 6); save(); render(); if (on) { Beep.unlock(); checkTrophies(); } return; }
    const z = ev.target.closest('[data-zoom]'); if (z) { openPhoto(w.exercises.find((e) => e.slug === z.dataset.zoom)); return; }
  };
  app.addEventListener('click', app._wkClick);
  doneBtn.onclick = async () => {
    if (pr.done) { pr.done = false; pr.doneAt = null; save(); render(); toast('Marked as not done — your diary was left as is'); return; }
    Beep.unlock(); render(); haptic([20, 40, 30]);
    const msg = await markWorkoutDone(b, w, prog, pr); render(); celebrate(doneBtn); toast(msg);
    setTimeout(() => checkTrophies(), 900);
  };
}

/* Marks a workout done (all exercises ticked, warm-up ticked unless it was explicitly unticked) and writes the diary line. Returns the toast text. */
async function markWorkoutDone(b, w, prog, pr) {
  pr.done = true; pr.doneAt = new Date().toISOString(); w.exercises.forEach((e) => { pr.ex[e.slug] = true; }); if (pr.warm === undefined) pr.warm = true;
  WK.save(b, prog);
  const added = await logWorkoutToDiary(b, w);
  const finishedAll = b === BLOCKS[BLOCKS.length - 1] && blockDone(b, prog) === b.workouts.length;
  return finishedAll ? `Block ${b.block} complete! Logged in your diary` : added ? `Done! Added to your diary for ${fmt(parseKey(w.date), { day: 'numeric', month: 'short' })}` : 'Done! Already in your diary';
}

/* How-to sheet for a warm-up move or stretch: picture (tap to zoom), steps, common mistakes. */
function openHowTo(x, kind) {
  if (!x) return;
  $$('.howto-layer').forEach((n) => n.remove());
  const layer = document.createElement('div'); layer.className = 'howto-layer';
  layer.innerHTML = `<div class="scrim"></div><section class="howto" role="dialog" aria-modal="true" aria-labelledby="howtoTitle">
    <div class="howto-top"><div><span class="eyebrow">${kind === 'stretch' ? 'Stretch' : 'Warm-up'} · how to</span><h3 id="howtoTitle">${esc(x.name)}</h3></div>
      <button class="icon-btn glass" data-close aria-label="Close">${ICON.x}</button></div>
    <div class="howto-body">
      ${x.image ? `<button class="howto-photo" data-zoom aria-label="Enlarge picture"><img src="${x.image}" alt="${esc(x.name)} — ${esc((x.cues || []).join(', '))}" width="800" height="600" decoding="async"><span class="zoom-hint">${WICON.zoom}</span></button>` : ''}
      <div class="howto-amt"><span class="chip glass">${x.seconds ? WICON.clock : WICON.loop}${esc(moveAmount(x))}</span>${x.detail && x.detail !== moveAmount(x) ? `<small>${esc(x.detail)}</small>` : ''}</div>
      ${(x.steps || []).length ? `<h4>How to do it</h4><ol class="howto-steps">${x.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${(x.mistakes || []).length ? `<h4>Common mistakes</h4><ul class="howto-miss">${x.mistakes.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${(x.cues || []).length ? `<h4>On the picture</h4><ol class="ex-points">${x.cues.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>` : ''}
      ${x.added ? `<p class="howto-note">${WICON.spark}Added to round off this session — it stretches the muscles you worked today.</p>` : ''}
    </div></section>`;
  const el = $('.howto', layer);
  const close = () => { el.classList.add('out'); $('.scrim', layer).style.opacity = '0'; $('.scrim', layer).style.transition = 'opacity .25s'; setTimeout(() => layer.remove(), 240);
    document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', close); };
  const onKey = (k) => { if (k.key === 'Escape' && !$('.viewer')) close(); };
  layer.addEventListener('click', (ev) => { if (ev.target.closest('[data-close]') || ev.target.classList.contains('scrim')) return close();
    if (ev.target.closest('[data-zoom]')) openPhoto({ name: x.name, image: x.image, full: x.full, formPoints: x.cues }); });
  document.addEventListener('keydown', onKey); window.addEventListener('hashchange', close);
  document.body.append(layer); $('[data-close]', el).focus({ preventScroll: true });
}

/* Block 1 keeps its original wording ("Workout 3 done: …") so lines written before blocks existed are still recognised. */
const wkLine = (b, w) => `${b.block > 1 ? `Block ${b.block} · ` : ''}Workout ${w.day} done: ${w.theme}, ${w.exercises.length} exercises`;
async function logWorkoutToDiary(b, w) {
  const line = wkLine(b, w);
  const marker = b.block > 1 ? new RegExp(`(^|\\n)\\s*Block ${b.block} · Workout ${w.day} done\\b`, 'i') : new RegExp(`(^|\\n)\\s*(Block 1 · )?Workout ${w.day} done\\b`, 'i');
  const existing = state.entries.filter((e) => e.date === w.date).sort((a, c) => a.createdAt.localeCompare(c.createdAt))[0];
  if (existing) {
    if (marker.test(existing.body)) return false;
    const e = { ...existing, body: existing.body.trim() ? existing.body.replace(/\s+$/, '') + '\n\n' + line : line };
    await saveEntry(e); return true;
  }
  await saveEntry({ id: uid(), date: w.date, title: '', body: line, mood: null, season: seasonForKey(w.date), createdAt: new Date().toISOString() });
  return true;
}

/* ───────── Workout timers ─────────
   Time is always computed from an end timestamp (Date.now), never by counting ticks, so a backgrounded tab stays accurate.
   The finish beep is scheduled on the AudioContext clock (unlocked by the tap that starts the timer). */
const fmtT = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const TSECS = (t) => { const m = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|s\b|minutes?|mins?|m\b)/i.exec(String(t || '')); return m ? Math.round(+m[1] * (/^m/i.test(m[2]) ? 60 : 1)) : null; };
const timerOfEx = (e) => e.timer || { work: TSECS(e.time), sides: /\b(per|each)\s+(side|leg|arm)\b/i.test(e.time || '') ? 2 : 1, rest: TSECS(e.rest) || 60, restDefault: !TSECS(e.rest), roundRest: null, sets: Math.max(...(String(e.sets).match(/\d+/g) || [1]).map(Number)) };
const TICON = {
  timer: '<svg viewBox="0 0 24 24" class="wi"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M19 6l1.5-1.5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" class="wi"><path d="M8 5.5v13M16 5.5v13"/></svg>',
  reset: '<svg viewBox="0 0 24 24" class="wi"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4v5h5"/></svg>',
  rest: '<svg viewBox="0 0 24 24" class="wi"><path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" class="wi"><path d="M18 6v12L9.5 12 18 6Z"/><path d="M6 6v12"/></svg>',
  skip: '<svg viewBox="0 0 24 24" class="wi"><path d="M6 6v12l8.5-6L6 6Z"/><path d="M18 6v12"/></svg>',
};
const Beep = {
  ctx: null, nodes: [],
  unlock() { // must run inside the tap handler
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state !== 'running') this.ctx.resume();
      const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); // iOS unlock
    } catch (e) {}
  },
  cancel() { this.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); this.nodes = []; },
  tone(at, f, dur, vol = .25, track = true) { const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + .012); g.gain.exponentialRampToValueAtTime(.0008, at + dur);
    o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + .02); if (track) this.nodes.push(o); return o; },
  schedule(msFromNow, final) { // countdown pips at 3-2-1 + finish chime, on the audio clock
    if (!this.ctx) return; this.cancel(); const t0 = this.ctx.currentTime + Math.max(0, msFromNow) / 1000;
    [3, 2, 1].forEach((k) => { if (msFromNow / 1000 > k + .05) this.tone(t0 - k, 660, .09, .12); });
    if (final) { this.tone(t0, 880, .18); this.tone(t0 + .22, 880, .18); this.tone(t0 + .44, 1175, .42); } else this.tone(t0, 988, .3);
  },
  fanfare() { if (!this.ctx) return; try { this.ctx.resume(); } catch (e) {} const t = this.ctx.currentTime + .06; // trophy chime
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(t + i * .1, f, .45, .14, false)); this.tone(t + .42, 1318.5, 1, .11, false); this.tone(t + .42, 1568, 1.1, .06, false); },
  now(final) { if (!this.ctx) return; try { this.ctx.resume(); } catch (e) {} this.schedule(0, final); },
};
const Wake = {
  lock: null,
  async on() { try { if ('wakeLock' in navigator && !this.lock && document.visibilityState === 'visible') { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => { this.lock = null; }); } } catch (e) { this.lock = null; } },
  off() { try { this.lock && this.lock.release(); } catch (e) {} this.lock = null; },
};

/* ───────── Guided workout player ─────────
   Runs warm-up → exercises (every round/set) → stretches. Timed steps count down; rep steps wait for "Done" (with a stopwatch).
   After each step the rest starts by itself and shows what's up next; when the rest ends the next step starts by itself.
   Time is computed from end timestamps (Date.now), and each phase is chained from the previous phase's end time, so a backgrounded or
   locked phone catches up correctly. Beeps are scheduled on the AudioContext clock, unlocked by the Start tap. */
function openSession({ b, w, prog, pr, save, from, onClose }) {
  $$('.player').forEach((x) => x.remove());
  const { steps, S } = buildSession(w); if (!steps.length) return;
  const N = steps.length, rm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const firstOf = (sec) => steps.findIndex((s) => s.sec === sec);
  const counts = ['warmup', 'exercise', 'stretch'].map((k) => [k, steps.filter((s) => s.sec === k).length]).filter((x) => x[1]);
  const P = { i: 0, phase: 'ready', running: false, endAt: 0, left: 0, dur: 5, swAt: 0, swAcc: 0, status: {}, startedAt: Date.now(), natural: false, closed: false };
  if (from && from.status) { P.status = from.status; P.startedAt = from.startedAt || Date.now(); P.i = Math.min(N - 1, Math.max(0, from.i | 0)); }
  const el = document.createElement('div'); el.className = 'player'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `Workout ${w.day} player`);
  el.setAttribute('style', wkStyle(w));
  el.innerHTML = `<div class="pl-glow" aria-hidden="true"></div>
    <header class="pl-top"><button class="pl-x" data-p="end" aria-label="End workout">${ICON.x}</button>
      <div class="pl-where"><b class="pl-sec"></b><span class="pl-count"></span></div><span class="pl-clock" aria-label="Time so far"></span></header>
    <div class="pl-prog" aria-hidden="true">${counts.map(([k, n]) => `<span class="pp-${SECS[k].id}" style="flex:${n}"><i></i></span>`).join('')}</div>
    <main class="pl-main">
      <div class="pl-stage"><button class="pl-photo" data-p="zoom" aria-label="Enlarge picture"><img alt="" width="800" height="600" decoding="async"><span class="pl-ribbon"></span><span class="pl-badge"></span></button></div>
      <div class="pl-info"><span class="pl-kicker"></span><h2 class="pl-name"></h2><span class="pl-amt"></span></div>
      <div class="pl-timer"><span class="pl-phase"></span><b class="pl-digits" aria-live="off">0:00</b><div class="pl-bar"><i></i></div><span class="pl-status" role="status" aria-live="polite"></span></div>
      <div class="pl-extra"></div>
      <details class="pl-how"><summary>How to do it</summary><div class="pl-how-body"></div></details>
    </main>
    <footer class="pl-ctl">
      <button class="pl-sm" data-p="back" aria-label="Back">${TICON.back}<span>Back</span></button>
      <button class="pl-sm" data-p="minus" aria-label="Minus 15 seconds"><b>−15</b><span>sec</span></button>
      <button class="pl-main-btn" data-p="main" aria-label="Pause"></button>
      <button class="pl-sm" data-p="plus" aria-label="Plus 15 seconds"><b>+15</b><span>sec</span></button>
      <button class="pl-sm" data-p="skip" aria-label="Skip">${TICON.skip}<span>Skip</span></button>
    </footer>
    <div class="pl-confirm" hidden><div class="pl-confirm-card"><h3>End the workout?</h3><p>You can pick up where you left off later, or see your summary now.</p>
      <button class="btn btn-block btn-primary" data-p="end-yes">End &amp; see summary</button><button class="btn btn-block btn-ghost" data-p="end-no">Keep going</button></div></div>`;
  document.body.append(el); document.documentElement.classList.add('player-open');
  const q = (s) => $(s, el);
  const img = q('.pl-photo img'), digits = q('.pl-digits'), barI = q('.pl-bar i'), status = q('.pl-status'), mainBtn = q('[data-p="main"]');
  let shownImg = '', howFor = -1;

  const cur = () => steps[P.i];
  const nextWork = () => steps[P.i + 1];
  const countdown = () => P.phase === 'ready' || P.phase === 'rest' || (P.phase === 'work' && cur().seconds > 0);
  const remaining = () => (P.running ? P.endAt - Date.now() : P.left);
  const swMs = () => P.swAcc + (P.running ? Date.now() - P.swAt : 0);
  const persist = () => { if (P.phase === 'done') return WKSESSION.set(null); WKSESSION.set({ bid: b.id, day: w.day, i: P.i, status: P.status, startedAt: P.startedAt, at: Date.now() }); };
  const timeTo = (sec, at, finalChime) => { P.dur = sec; P.endAt = (at || Date.now()) + sec * 1000; P.left = P.endAt - Date.now(); P.running = true; Beep.schedule(P.endAt - Date.now(), finalChime); };
  const sideLabel = (s) => (s.sides > 1 ? `${s.sideWord === 'direction' ? 'Direction' : s.sideWord === 'leg' ? 'Leg' : 'Side'} ${s.side} of ${s.sides}` : '');
  const setLabel = (s) => (s.sec !== 'exercise' ? '' : S.circuit ? `Round ${s.round} of ${s.sets}` : `Set ${s.set} of ${s.sets}`);
  const amt = (s) => (s.seconds ? fmtDur(s.seconds) + (s.sides > 1 ? ` · ${sideLabel(s).toLowerCase()}` : '') : s.reps);

  function enter(i, phase, at) {
    Beep.cancel(); P.i = i; P.phase = phase; const s = cur();
    if (phase === 'work') { if (s.seconds) timeTo(s.seconds, at, true); else { P.running = true; P.swAt = Date.now(); P.swAcc = Math.max(0, Date.now() - (at || Date.now())); } status.textContent = s.seconds ? 'Go!' : 'Tap Done when you finish'; }
    else if (phase === 'rest') { timeTo(s.rest.s, at, false); status.textContent = s.rest.kind === 'switch' ? 'Switch sides' : ''; }
    else if (phase === 'ready') { timeTo(5, at, false); status.textContent = 'Get into position'; }
    persist(); paint(true);
  }
  function complete(i) { const s = steps[i]; if (P.status[i] === 'done') return; P.status[i] = 'done';
    const lastSide = !s.sides || s.side === s.sides || s.side === 0;
    if (s.seconds) WKS.bump('timers');
    if (s.sec === 'exercise' && lastSide) { WKS.bump('timerSets'); tickExercise(s.ex); }
    if (s.sec === 'warmup' && s.seconds && lastSide) WKS.bump('warmTimers');
    const wsteps = steps.filter((x) => x.sec === 'warmup'); if (s.sec === 'warmup' && wsteps.length && wsteps.every((x) => P.status[x.n] === 'done') && pr.warm !== true) { pr.warm = true; save(); }
    flash(); haptic(40); }
  function tickExercise(e) { if (pr.ex[e.slug]) return; const mine = steps.filter((x) => x.ex === e), need = S.circuit ? (S.minRounds || S.rounds) : (mine[0] ? mine[0].sets : 1);
    const sets = new Set(mine.filter((x) => P.status[x.n] === 'done' && (x.side === 0 || x.side === x.sides)).map((x) => x.set));
    if (sets.size >= need) { pr.ex[e.slug] = true; save(); } }
  function afterWork(at) { const s = cur(); if (!s.rest || P.i >= N - 1) return finish(true); enter(P.i, 'rest', at); }
  function onEnd(at) {
    if (P.phase === 'ready') return enter(P.i, 'work', at);
    if (P.phase === 'work') { complete(P.i); return afterWork(at); }
    if (P.phase === 'rest') { WKS.bump('timers'); return enter(P.i + 1, 'work', at); }
  }
  function check() { let guard = 0; while (!P.closed && P.running && countdown() && P.phase !== 'done' && remaining() <= 0 && guard++ < 200) { const at = P.endAt, late = Date.now() - at > 1500; onEnd(at); if (late && P.phase !== 'done') Beep.now(false); } }
  function finish(natural) {
    Beep.cancel(); P.running = false; P.phase = 'done'; P.natural = natural; Wake.off(); WKSESSION.set(null);
    try { Beep.now(true); } catch (e) {} if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) try { navigator.vibrate([180, 90, 180, 90, 320]); } catch (e) {}
    showSummary();
  }
  function flash() { const t = q('.pl-timer'); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }

  function paint(full) {
    if (P.phase === 'done') return;
    const s = cur(), resting = P.phase !== 'work', show = P.phase === 'rest' ? nextWork() || s : s;
    el.dataset.phase = P.phase; el.dataset.sec = SECS[show.sec].id; el.classList.toggle('is-paused', !P.running);
    if (full) {
      const src = show.image || ''; if (src !== shownImg) { img.src = src; shownImg = src; img.parentElement.classList.toggle('no-img', !src); }
      img.alt = show.name;
      q('.pl-ribbon').textContent = P.phase === 'rest' ? (s.rest.kind === 'switch' ? 'Other side next' : 'Up next') : P.phase === 'ready' ? 'Up first' : '';
      q('.pl-badge').textContent = [setLabel(show), sideLabel(show)].filter(Boolean).join(' · ');
      q('.pl-kicker').textContent = P.phase === 'rest' ? (s.rest.kind === 'switch' ? `Switch ${s.sideWord === 'direction' ? 'direction' : s.sideWord === 'leg' ? 'legs' : 'sides'}` : `Up next · ${SECS[show.sec].label}`) : P.phase === 'ready' ? 'Get ready' : `${SECS[s.sec].label}${s.sec === 'exercise' ? ` · ${setLabel(s)}` : ''}`;
      q('.pl-name').textContent = show.name; q('.pl-amt').textContent = amt(show);
      q('.pl-sec').textContent = SECS[show.sec].label;
      q('.pl-count').textContent = `Step ${show.n + 1} of ${N}`;
      q('.pl-phase').textContent = P.phase === 'rest' ? (s.rest.kind === 'switch' ? 'Switch' : s.rest.kind === 'round' ? `Rest · round ${s.rest.round} done` : s.rest.kind === 'transition' ? `Rest · next: ${SECS[show.sec].label.toLowerCase()}` : 'Rest') : P.phase === 'ready' ? 'Starting in' : s.seconds ? 'Work' : (s.reps || 'Reps');
      const ex = q('.pl-extra');
      ex.innerHTML = P.phase === 'rest' && s.rest.canFinish && firstOf('stretch') !== 0 ? `<button class="pl-chip" data-p="finish-rounds">${WICON.check}${s.rest.round} rounds is enough — go to ${firstOf('stretch') > 0 ? 'stretches' : 'finish'}</button>`
        : P.phase === 'work' && !s.seconds ? '' : '';
      // progress per section
      counts.forEach(([k]) => { const all = steps.filter((x) => x.sec === k), done = all.filter((x) => x.n < P.i || (x.n === P.i && P.phase === 'rest')).length;
        q(`.pp-${SECS[k].id} i`).style.width = (done / all.length * 100) + '%'; });
      if (howFor !== show.n) { howFor = show.n; const it = show.item, isEx = show.sec === 'exercise';
        const stepsL = isEx ? [it.formTips, ...(it.formPoints || [])].filter(Boolean) : (it.steps || []);
        const miss = isEx ? [] : (it.mistakes || []);
        q('.pl-how-body').innerHTML = `${stepsL.length ? `<ol class="howto-steps">${stepsL.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}${miss.length ? `<h4>Common mistakes</h4><ul class="howto-miss">${miss.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${isEx && it.easierOption ? `<p class="ex-easier"><span>Easier</span>${esc(it.easierOption)}</p>` : ''}`; }
      const repMode = P.phase === 'work' && !s.seconds;
      q('[data-p="minus"]').disabled = repMode; q('[data-p="plus"]').disabled = repMode;
      q('[data-p="back"]').disabled = P.i === 0 && P.phase !== 'rest';
    }
    // timer read-out
    const repMode = P.phase === 'work' && !s.seconds;
    if (repMode) { digits.textContent = fmtT(swMs() / 1000).replace(/^/, ''); barI.style.width = '0%'; el.classList.add('is-reps'); }
    else { el.classList.remove('is-reps'); const ms = Math.max(0, remaining()); digits.textContent = fmtT(ms / 1000); barI.style.width = (100 * (1 - ms / (P.dur * 1000 || 1))) + '%'; }
    mainBtn.innerHTML = repMode ? `${WICON.check}<span>Done</span>` : P.running ? TICON.pause : WICON.play;
    mainBtn.classList.toggle('is-done-btn', repMode);
    mainBtn.setAttribute('aria-label', repMode ? 'Done — finished this set' : P.running ? 'Pause' : 'Resume');
    q('.pl-clock').textContent = fmtT((Date.now() - P.startedAt) / 1000);
  }

  function showSummary() {
    const doneN = steps.filter((s) => P.status[s.n] === 'done').length;
    const per = counts.map(([k]) => { const all = steps.filter((x) => x.sec === k); return [k, all.filter((x) => P.status[x.n] === 'done').length, all.length]; });
    const sets = steps.filter((s) => s.sec === 'exercise' && (s.side === 0 || s.side === s.sides) && P.status[s.n] === 'done').length;
    const totalSets = steps.filter((s) => s.sec === 'exercise' && (s.side === 0 || s.side === s.sides)).length;
    const skipped = steps.filter((s) => P.status[s.n] === 'skip').length;
    const mins = Math.max(1, Math.round((Date.now() - P.startedAt) / 60000));
    const warmSteps = steps.filter((x) => x.sec === 'warmup');
    if (warmSteps.length && !warmSteps.some((x) => P.status[x.n] === 'done') && pr.warm !== true) { pr.warm = false; save(); }
    el.dataset.phase = 'done';
    q('.pl-main').innerHTML = `<div class="pl-sum">
      <div class="pl-sum-badge">${WICON.check}</div>
      <h2>${P.natural ? 'Workout complete!' : 'Nice effort'}</h2>
      <p class="pl-sum-sub">${esc(w.theme)} · Workout ${w.day}</p>
      <div class="pl-sum-grid">
        <div><b>${mins}</b><small>minutes</small></div>
        <div><b>${sets}<em>/${totalSets}</em></b><small>sets</small></div>
        <div><b>${doneN}<em>/${N}</em></b><small>steps</small></div>
      </div>
      <ul class="pl-sum-secs">${per.map(([k, d, t]) => `<li class="ps-${SECS[k].id}">${WICON[SECS[k].icon]}<span>${SECS[k].label}</span><b>${d === t ? '✓ all done' : `${d} of ${t}`}</b></li>`).join('')}</ul>
      ${skipped ? `<p class="pl-sum-note">${skipped} step${skipped > 1 ? 's' : ''} skipped — that’s fine, listen to your body.</p>` : ''}
      <div class="pl-sum-act">${pr.done ? `<p class="pl-sum-saved">${WICON.check}<span class="pl-saved-txt">Saved — logged in your diary</span></p>` : `<button class="btn btn-block btn-primary" data-p="mark">${WICON.check}Mark workout done</button>`}
        <button class="btn btn-block btn-ghost" data-p="close">Close</button></div></div>`;
    q('.pl-ctl').hidden = true; q('.pl-count').textContent = `${doneN} of ${N} steps`; q('.pl-sec').textContent = 'Summary';
    counts.forEach(([k]) => { q(`.pp-${SECS[k].id} i`).style.width = '100%'; });
    if (P.natural && !pr.done) markDone();
    else { setTimeout(() => celebrate(q('.pl-sum-badge'), 30, 110), 120); setTimeout(() => { if (!P.closed) checkTrophies(); }, 1200); }
  }
  async function markDone() {
    const msg = await markWorkoutDone(b, w, prog, pr); const act = q('.pl-sum-act');
    if (act) { const m = q('[data-p="mark"]'); if (m) m.outerHTML = `<p class="pl-sum-saved">${WICON.check}<span class="pl-saved-txt">${esc(msg)}</span></p>`; else { const t = q('.pl-saved-txt'); if (t) t.textContent = msg; } }
    haptic([20, 40, 30]); setTimeout(() => celebrate(q('.pl-sum-badge') || el, 36, 120), 120);
    setTimeout(() => { if (!P.closed) checkTrophies(); }, 1200);
  }

  let raf = 0, iv = 0, lastSec = -1;
  const loop = () => { cancelAnimationFrame(raf); if (P.closed) return; check(); const s = Math.floor((countdown() ? remaining() : swMs()) / 250); if (s !== lastSec) { lastSec = s; paint(false); } raf = requestAnimationFrame(loop); };
  iv = setInterval(() => { check(); if (!P.closed && P.phase !== 'done') paint(false); }, 250); // backup when rAF is throttled
  const pause = () => { if (!P.running) return; if (countdown()) P.left = remaining(); else P.swAcc = swMs(); P.running = false; Beep.cancel(); status.textContent = 'Paused'; Wake.off(); paint(true); };
  const resume = () => { if (P.running) return; if (countdown()) { P.endAt = Date.now() + P.left; Beep.schedule(P.left, P.phase === 'work'); } else P.swAt = Date.now(); P.running = true; status.textContent = ''; Wake.on(); paint(true); };
  const close = () => { if (P.closed) return; P.closed = true; Beep.cancel(); Wake.off(); cancelAnimationFrame(raf); clearInterval(iv);
    document.removeEventListener('visibilitychange', onVis); document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash);
    if (P.phase !== 'done') persist();
    document.documentElement.classList.remove('player-open'); el.classList.add('out'); setTimeout(() => el.remove(), 240);
    setTimeout(() => checkTrophies(), 400);
    if (onClose) onClose(); };
  const onHash = () => close();
  const onVis = () => { if (document.visibilityState === 'visible' && !P.closed) { if (P.running) Wake.on(); check(); paint(true); } };
  const onKey = (k) => { if (k.key === 'Escape') { if (P.phase === 'done' || !q('.pl-confirm').hidden) close(); else q('[data-p="end"]').click(); }
    else if (k.key === ' ' && (k.target === document.body || el.contains(k.target)) && P.phase !== 'done') { k.preventDefault(); mainBtn.click(); } };
  document.addEventListener('visibilitychange', onVis); document.addEventListener('keydown', onKey); window.addEventListener('hashchange', onHash);

  el.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-p]'); if (!t || t.disabled) return; const a = t.dataset.p; Beep.unlock();
    if (a === 'zoom') { const s = P.phase === 'rest' ? nextWork() || cur() : cur(), it = s.item;
      return openPhoto(s.sec === 'exercise' ? it : { name: it.name, image: it.image, full: it.full, formPoints: it.cues }); }
    if (a === 'close') return close();
    if (a === 'mark') { t.disabled = true; return markDone(); }
    if (a === 'end') { if (P.phase === 'done') return close(); q('.pl-confirm').hidden = false; P.wasRunning = P.running; pause(); q('[data-p="end-no"]').focus({ preventScroll: true }); return; }
    if (a === 'end-no') { q('.pl-confirm').hidden = true; if (P.wasRunning) resume(); return; }
    if (a === 'end-yes') { q('.pl-confirm').hidden = true; return finish(false); }
    haptic(10);
    if (a === 'main') { const s = cur();
      if (P.phase === 'work' && !s.seconds) { if (!P.running) resume(); complete(P.i); return afterWork(Date.now()); }
      return P.running ? pause() : resume(); }
    if (a === 'plus' || a === 'minus') { if (!countdown()) return; const left = Math.max(1000, remaining() + (a === 'plus' ? 15000 : -15000));
      if (P.running) { P.endAt = Date.now() + left; Beep.schedule(left, P.phase === 'work'); } else P.left = left;
      P.dur = Math.max(P.dur, Math.ceil(left / 1000)); status.textContent = a === 'plus' ? '+15 seconds' : '−15 seconds'; return paint(false); }
    if (a === 'skip') { if (P.phase === 'ready') return enter(P.i, 'work');
      if (P.phase === 'rest') return enter(P.i + 1, 'work');
      if (!P.status[P.i]) P.status[P.i] = 'skip'; if (P.i >= N - 1) return finish(true); return enter(P.i + 1, 'work'); }
    if (a === 'back') { if (P.phase === 'rest') return enter(P.i, 'work'); return enter(Math.max(0, P.i - 1), 'work'); }
    if (a === 'finish-rounds') { const fs = firstOf('stretch');
      steps.forEach((s) => { if (s.sec === 'exercise' && s.n > P.i && !P.status[s.n]) P.status[s.n] = 'cut'; });
      w.exercises.forEach((e) => tickExercise(e));
      if (fs < 0) return finish(true); return enter(fs, 'work'); }
  });
  Wake.on();
  if (from && from.status) enter(P.i, 'work'); else enter(0, 'ready');
  loop(); setTimeout(() => mainBtn.focus({ preventScroll: true }), 60);
  return { el, close, P };
}

function celebrate(el, n = 26, dist = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(); const box = document.createElement('div'); box.className = 'confetti'; box.style.left = r.left + r.width / 2 + 'px'; box.style.top = (r.top + (n > 26 ? r.height / 2 : 0)) + 'px';
  const cols = ['#FFD23F', '#FF6AD5', '#3FA9FF', '#16C79A', '#FF7A45', '#9B85FF'];
  box.innerHTML = [...Array(n)].map((_, i) => `<i style="--a:${(i / n) * 360}deg;--d:${60 + Math.random() * dist}px;--c:${cols[i % cols.length]};--r:${Math.random() * 720 - 360}deg"></i>`).join('');
  document.body.append(box); setTimeout(() => box.remove(), 1100);
}

function openPhoto(e) {
  if (!e) return;
  const el = document.createElement('div'); el.className = 'viewer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', e.name);
  el.innerHTML = `<div class="viewer-top"><div><span class="eyebrow">Form check</span><h3>${esc(e.name)}</h3></div><button class="icon-btn glass" data-close aria-label="Close">${ICON.x}</button></div>
    <div class="viewer-stage"><img src="${e.full || e.image}" alt="${esc(e.name)}" onerror="this.onerror=null;this.src='${e.image}'"></div>
    <p class="viewer-hint">Tap the photo to zoom · drag to look around</p>
    <ol class="viewer-points">${(e.formPoints || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ol>`;
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 220); document.removeEventListener('keydown', onKey); };
  const onKey = (k) => { if (k.key === 'Escape') close(); };
  el.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-close]')) return close();
    const st = ev.target.closest('.viewer-stage');
    if (st && ev.target.tagName === 'IMG') { const zoomed = st.classList.toggle('zoomed');
      if (zoomed) { const rect = st.getBoundingClientRect(); const fx = (ev.clientX - rect.left) / rect.width, fy = (ev.clientY - rect.top) / rect.height;
        requestAnimationFrame(() => { st.scrollLeft = fx * st.scrollWidth - rect.width / 2; st.scrollTop = fy * st.scrollHeight - rect.height / 2; }); } }
    else if (ev.target === el) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.append(el); $('[data-close]', el).focus({ preventScroll: true });
}

/* ───────── Trophies ─────────
   Computed from progress the app already keeps (diary.wkblocks) plus a few on-device counters (diary.wkstats: finished timers).
   Unlocks are stored in diary.trophies as { <id>: <ISO date unlocked> } and never removed, so they survive new blocks and undo. */
const WKS = {
  get() { let s = null; try { s = JSON.parse(LS.get('wkstats', 'null')); } catch (e) {} return { timers: 0, timerSets: 0, warmTimers: 0, ...(s && typeof s === 'object' ? s : {}) }; },
  bump(k, n = 1) { const s = WKS.get(); s[k] = (+s[k] || 0) + n; s.lastAt = new Date().toISOString(); LS.set('wkstats', JSON.stringify(s)); },
};
const TR = {
  has() { return LS.get('trophies', null) !== null; },
  get() { let o = null; try { o = JSON.parse(LS.get('trophies', 'null')); } catch (e) {} return o && typeof o === 'object' ? o : {}; },
  save(o) { LS.set('trophies', JSON.stringify(o)); },
};
const londonAt = (iso) => { const d = new Date(iso); if (isNaN(d)) return null;
  try { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d);
    const v = (t) => p.find((x) => x.type === t).value; return { key: `${v('year')}-${v('month')}-${v('day')}`, hour: +v('hour') % 24 }; }
  catch (e) { return { key: dayKey(d), hour: d.getHours() }; } };
const setsOf = (e) => Math.max(...(String(e.sets).match(/\d+/g) || [1]).map(Number));
const mondayOf = (k) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
const nextKey = (k) => { const d = parseKey(k); d.setDate(d.getDate() + 1); return dayKey(d); };

function trophyFacts() {
  const all = WK.all(), today = londonKey(), items = [];
  BLOCKS.forEach((b) => { const p = all[b.id] || {};
    b.workouts.slice().sort((x, y) => x.date.localeCompare(y.date) || x.day - y.day).forEach((w) => {
      const pr = p[w.day] || { ex: {} }, done = !!pr.done, at = done ? (pr.doneAt || null) : null, l = at ? londonAt(at) : null;
      items.push({ b, w, pr, done, at, key: l && l.key, hour: l ? l.hour : null, onDay: !!(l && l.key === w.date), late: !!(l && l.key > w.date),
        warm: pr.warm === true || (done && pr.warm !== false), sets: w.exercises.reduce((n, e) => n + (pr.ex && pr.ex[e.slug] ? setsOf(e) : 0), 0) }); }); });
  items.sort((x, y) => x.w.date.localeCompare(y.w.date));
  const done = items.filter((x) => x.done).sort((x, y) => (x.at || '').localeCompare(y.at || ''));
  const nth = (n) => (done[n - 1] || {}).at || null;
  let run = 0, best = 0; for (const x of items) { if (x.done) best = Math.max(best, ++run); else if (x.w.date < today) run = 0; }
  const weeks = {}; items.forEach((x) => (weeks[mondayOf(x.w.date)] ||= []).push(x));
  const fullWeeks = Object.values(weeks).filter((l) => l.length >= 2 && l.every((x) => x.done));
  const doneKeys = new Set(done.map((x) => x.key).filter(Boolean));
  const weekend = [...doneKeys].some((k) => parseKey(k).getDay() === 6 && doneKeys.has(nextKey(k)));
  const blocks = BLOCKS.map((b) => { const l = items.filter((x) => x.b === b); return { n: l.filter((x) => x.done).length, p: l.filter((x) => x.done && x.onDay).length, of: l.length,
    done: l.length > 0 && l.every((x) => x.done), perfect: l.length > 0 && l.every((x) => x.done && x.onDay) }; });
  const bestOf = (l, k) => l.reduce((m, x) => (x.of && x[k] / x.of > m[0] / m[1] ? [x[k], x.of] : m), [0, (l[0] && l[0].of) || 1]);
  const wk = Object.values(weeks).filter((l) => l.length >= 2).map((l) => ({ n: l.filter((x) => x.done).length, w: l.filter((x) => x.done && x.warm).length, of: l.length }));
  const s = WKS.get();
  return { workouts: done.length, nth, streak: best, onDay: done.filter((x) => x.onDay).length, sets: items.reduce((n, x) => n + x.sets, 0),
    warmDone: items.filter((x) => x.warm).length, early: done.some((x) => x.hour !== null && x.hour < 8), late: done.some((x) => x.hour !== null && x.hour >= 21),
    fullWeek: fullWeeks.length, warmWeek: fullWeeks.filter((l) => l.every((x) => x.warm)).length, weekend,
    themes: new Set(done.map((x) => String(x.w.theme).trim().toLowerCase())).size, blocksDone: blocks.filter((b) => b.done).length, perfect: blocks.some((b) => b.perfect),
    comeback: done.some((x) => x.late), bestBlock: bestOf(blocks, 'n'), bestPerfect: bestOf(blocks, 'p'), bestWeek: bestOf(wk, 'n'), bestWarmWeek: bestOf(wk, 'w'), timers: +s.timers || 0, timerSets: +s.timerSets || 0, lastAt: done.length ? done[done.length - 1].at : null };
}
const yes = (v) => (v ? 1 : 0);
/* tier: bronze | silver | gold | special · shape: cup | medal | star · glyph: icon name or text */
const TROPHIES = [
  { id: 'first-workout', tier: 'bronze', shape: 'cup', glyph: '1', title: 'First Step', desc: 'Finish your first workout.', target: 1, unit: 'workout', val: (f) => f.workouts, at: (f) => f.nth(1) },
  { id: 'warmed-up', tier: 'bronze', shape: 'medal', glyph: 'sunrise', title: 'Warmed Up', desc: 'Tick off a warm-up before a workout.', target: 1, unit: 'warm-up', val: (f) => f.warmDone },
  { id: 'first-timer', tier: 'bronze', shape: 'medal', glyph: 'clock', title: 'Clock Starter', desc: 'Run a workout timer all the way to zero.', target: 1, unit: 'timer', val: (f) => f.timers },
  { id: 'streak-3', tier: 'bronze', shape: 'medal', glyph: 'flame', title: 'On a Roll', desc: 'Finish 3 planned workouts in a row.', target: 3, unit: 'in a row', val: (f) => f.streak },
  { id: 'on-time-3', tier: 'bronze', shape: 'medal', glyph: 'cal', title: 'Right on Time', desc: 'Finish 3 workouts on their planned day.', target: 3, unit: 'on the day', val: (f) => f.onDay },
  { id: 'sets-25', tier: 'bronze', shape: 'cup', glyph: 'stack', title: 'Quarter Century', desc: 'Complete 25 sets — every ticked exercise counts its sets.', target: 25, unit: 'sets', val: (f) => f.sets },
  { id: 'early-bird', tier: 'bronze', shape: 'medal', glyph: 'sun', title: 'Early Bird', desc: 'Finish a workout before 8 am.', target: 1, unit: '', val: (f) => yes(f.early) },
  { id: 'night-owl', tier: 'bronze', shape: 'medal', glyph: 'moon', title: 'Night Owl', desc: 'Finish a workout after 9 pm.', target: 1, unit: '', val: (f) => yes(f.late) },
  { id: 'workouts-10', tier: 'silver', shape: 'cup', glyph: '10', title: 'Ten Strong', desc: 'Finish 10 workouts.', target: 10, unit: 'workouts', val: (f) => f.workouts, at: (f) => f.nth(10) },
  { id: 'full-week', tier: 'silver', shape: 'medal', glyph: 'cal', title: 'Full Week', desc: 'Finish every workout planned in one week (Monday–Sunday).', target: 1, unit: 'week', val: (f) => f.fullWeek, prog: (f) => f.bestWeek, punit: 'workouts this week' },
  { id: 'warmup-week', tier: 'silver', shape: 'medal', glyph: 'sunrise', title: 'Never Skip Warm-up', desc: 'Warm up before every workout in a full week.', target: 1, unit: 'week', val: (f) => f.warmWeek, prog: (f) => f.bestWarmWeek, punit: 'warmed up this week' },
  { id: 'weekend', tier: 'silver', shape: 'medal', glyph: 'bolt', title: 'Weekend Warrior', desc: 'Train on both the Saturday and the Sunday of one weekend.', target: 1, unit: '', val: (f) => yes(f.weekend) },
  { id: 'streak-6', tier: 'silver', shape: 'medal', glyph: 'flame', title: 'Unstoppable', desc: 'Finish 6 planned workouts in a row.', target: 6, unit: 'in a row', val: (f) => f.streak },
  { id: 'block-done', tier: 'silver', shape: 'cup', glyph: 'check', title: 'Block Finisher', desc: 'Finish every workout in a block.', target: 1, unit: 'block', val: (f) => f.blocksDone, prog: (f) => f.bestBlock, punit: 'workouts in your best block' },
  { id: 'timers-25', tier: 'silver', shape: 'medal', glyph: 'clock', title: 'Timekeeper', desc: 'Finish 25 timers — warm-ups, work or rest.', target: 25, unit: 'timers', val: (f) => f.timers },
  { id: 'all-rounder', tier: 'silver', shape: 'cup', glyph: 'grid', title: 'All-Rounder', desc: 'Finish 6 different kinds of workout.', target: 6, unit: 'kinds', val: (f) => f.themes },
  { id: 'workouts-25', tier: 'gold', shape: 'cup', glyph: '25', title: 'Twenty-Five', desc: 'Finish 25 workouts.', target: 25, unit: 'workouts', val: (f) => f.workouts, at: (f) => f.nth(25) },
  { id: 'workouts-50', tier: 'gold', shape: 'cup', glyph: '50', title: 'Fifty Club', desc: 'Finish 50 workouts.', target: 50, unit: 'workouts', val: (f) => f.workouts, at: (f) => f.nth(50) },
  { id: 'streak-12', tier: 'gold', shape: 'medal', glyph: 'flame', title: 'Iron Will', desc: 'Finish 12 planned workouts in a row.', target: 12, unit: 'in a row', val: (f) => f.streak },
  { id: 'perfect-block', tier: 'gold', shape: 'cup', glyph: 'crown', title: 'Perfect Block', desc: 'Finish every workout in a block, each one on its planned day.', target: 1, unit: '', val: (f) => yes(f.perfect), prog: (f) => f.bestPerfect, punit: 'on the day in your best block' },
  { id: 'sets-100', tier: 'gold', shape: 'cup', glyph: '100', title: 'Century', desc: 'Complete 100 sets.', target: 100, unit: 'sets', val: (f) => f.sets },
  { id: 'timed-sets-100', tier: 'gold', shape: 'medal', glyph: 'clock', title: 'Timed Hundred', desc: 'Time 100 sets with the work timer.', target: 100, unit: 'timed sets', val: (f) => f.timerSets },
  { id: 'blocks-3', tier: 'gold', shape: 'cup', glyph: '3', title: 'Seasoned', desc: 'Finish 3 whole blocks.', target: 3, unit: 'blocks', val: (f) => f.blocksDone },
  { id: 'comeback', tier: 'special', shape: 'star', glyph: 'back', title: 'Comeback Kid', desc: 'Catch up on a workout after its planned day — it still counts.', target: 1, unit: '', val: (f) => yes(f.comeback) },
  { id: 'legend', tier: 'special', shape: 'star', glyph: 'crown', title: 'Legend', desc: 'Unlock 20 other trophies.', target: 20, unit: 'trophies', val: (f, got) => Object.keys(got).filter((k) => k !== 'legend' && TROPHIES.some((t) => t.id === k)).length },
];
const TIERS = { bronze: { name: 'Bronze', c: ['#FFD9B8', '#D98C52', '#8A4A20'], r: '#FF7A45' }, silver: { name: 'Silver', c: ['#FFFFFF', '#C8CFDC', '#727D92'], r: '#3FA9FF' },
  gold: { name: 'Gold', c: ['#FFF3A6', '#F6C232', '#A86E05'], r: '#FF3D8B' }, special: { name: 'Special', c: ['#FFC4F1', '#A98BFF', '#3B6BFF'], r: '#16C79A' } };
const TGLYPH = {
  sunrise: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5v3.5M4.6 9.6l2 2M19.4 9.6l-2 2"/>',
  clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 1.6M9.5 2.8h5"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.9 3.4-5.8 3.9-10.3 2.9 1.9 4.4 4.3 4.6 6.6.9-.6 1.5-1.6 1.7-2.7 1.8 1.7 2.8 3.9 2.8 6.4 0 3.6-2.6 6.2-6.5 6.2Z"/>',
  cal: '<rect x="4.5" y="5.5" width="15" height="14" rx="2.5"/><path d="M4.5 10h15M9 3.5v4M15 3.5v4M9 14.5l2 2 4-4"/>',
  stack: '<path d="M4 8.5 12 4.5l8 4-8 4-8-4ZM4 12.5l8 4 8-4M4 16.5l8 4 8-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
  bolt: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  grid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
  crown: '<path d="M4 18h16M5 18 3.8 8.2l4.7 3.6L12 5.5l3.5 6.3 4.7-3.6L19 18"/>',
  back: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 4v4.7h4.7M12 8v4l3 2"/>',
};
let trUid = 0;
function trophyArt(t, locked) {
  const u = 'tg' + (++trUid), [l, m, d] = TIERS[t.tier].c, rib = TIERS[t.tier].r;
  const glyph = (cx, cy, s) => TGLYPH[t.glyph] ? `<g transform="translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})" fill="none" stroke="${d}" stroke-width="${2.4 / s * .9}" stroke-linecap="round" stroke-linejoin="round">${TGLYPH[t.glyph]}</g>`
    : `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Bricolage, Jakarta, system-ui, sans-serif" font-weight="800" font-size="${t.glyph.length > 2 ? 9.5 : 13}" fill="${d}">${esc(t.glyph)}</text>`;
  const defs = `<defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <radialGradient id="${u}c" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${l}"/><stop offset=".6" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs>`;
  let body;
  if (t.shape === 'cup') body = `<path d="M19 15h-5.5c0 7 3.5 11.5 9 12.5M45 15h5.5c0 7-3.5 11.5-9 12.5" fill="none" stroke="url(#${u}b)" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M18 9.5h28v9.5C46 28 40 35 32 35s-14-7-14-16V9.5Z" fill="url(#${u}a)"/><path d="M18 9.5h28" stroke="${l}" stroke-width="1.6" opacity=".9"/>
      <path d="M28.5 35h7l1.2 8.5h-9.4z" fill="url(#${u}b)"/><rect x="21" y="43" width="22" height="6.5" rx="2.2" fill="url(#${u}a)"/><rect x="17" y="49.5" width="30" height="7" rx="2.4" fill="url(#${u}b)"/>
      <rect x="25" y="51.6" width="14" height="2.6" rx="1.3" fill="${l}" opacity=".55"/>
      <path d="M22.5 12.5c0 9 2.5 15 7 18.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
      <circle cx="32" cy="21" r="8" fill="${l}" opacity=".55"/>${glyph(32, 21, .55)}`;
  else if (t.shape === 'medal') body = `<path d="M20 3h9l6 17h-9z" fill="${rib}"/><path d="M44 3h-9l-6 17h9z" fill="${rib}" opacity=".78"/><path d="M20 3h9l1.5 4.3h-9z" fill="#fff" opacity=".25"/>
      <circle cx="32" cy="38" r="19" fill="url(#${u}c)"/><circle cx="32" cy="38" r="14" fill="none" stroke="${l}" stroke-width="1.6" opacity=".85"/><circle cx="32" cy="38" r="19" fill="none" stroke="${d}" stroke-width="1.2" opacity=".5"/>
      <path d="M19.5 31a14 14 0 0 1 9-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>${glyph(32, 38, .72)}`;
  else { const pts = [...Array(16)].map((_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 21 : 27; return `${(32 + r * Math.cos(a)).toFixed(1)},${(33 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
    body = `<polygon points="${pts}" fill="url(#${u}a)"/><circle cx="32" cy="33" r="16" fill="url(#${u}c)" stroke="${l}" stroke-width="1.6"/>
      <path d="M21 27a12 12 0 0 1 8-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".65"/>${glyph(32, 33, .7)}`; }
  return `<span class="tr-art tier-${t.tier}${locked ? ' is-locked' : ''}"><svg viewBox="0 0 64 64" aria-hidden="true">${defs}${body}</svg>${locked ? `<span class="tr-lock">${ICON.lock}</span>` : ''}</span>`;
}
function trophyList(f = trophyFacts(), got = TR.get()) {
  return TROPHIES.map((t) => { const n = Math.min(t.target, t.val(f, got)), ok = !!got[t.id];
    const d = t.prog && n < t.target ? t.prog(f) : [n, t.target]; return { t, n, ok, at: got[t.id] || null, d, r: ok ? 1 : d[0] / d[1] }; });
}
const trUnit = (x) => (x.t.prog && x.n < x.t.target ? `${x.d[0]} / ${x.d[1]} ${x.t.punit}` : x.t.unit ? `${x.n} / ${x.t.target} ${x.t.unit}` : x.n >= x.t.target ? 'Done' : 'Not yet');
const trShort = (x) => (x.t.unit || x.t.prog ? `${x.d[0]}/${x.d[1]}` : 'Locked');

/* Checks for new unlocks. quiet: seeding/import — no diary lines, one summary popup, and dates from the workouts themselves. */
async function checkTrophies({ quiet = false } = {}) {
  const first = !TR.has(), got = TR.get(), f = trophyFacts(), now = new Date().toISOString(), fresh = [];
  const seed = quiet || first;
  for (let pass = 0; pass < 2; pass++) TROPHIES.forEach((t) => { if (got[t.id] || t.val(f, got) < t.target) return;
    got[t.id] = seed ? ((t.at && t.at(f)) || f.lastAt || now) : now; fresh.push(t); });
  TR.save(got);
  if (!fresh.length) return [];
  const card = $('.tr-entry'); if (card) card.outerHTML = trophyEntryCard();
  if (location.hash === '#/trophies' && !$('.tr-sheet')) viewTrophies($('#app'));
  if (seed) showTrophyPop(fresh, true);
  else { await logTrophiesToDiary(fresh); fresh.forEach((t) => showTrophyPop([t], false)); }
  return fresh;
}
async function logTrophiesToDiary(list) {
  const key = londonKey(); const existing = state.entries.filter((e) => e.date === key).sort((a, c) => a.createdAt.localeCompare(c.createdAt))[0];
  const body0 = existing ? existing.body : ''; const add = list.map((t) => `🏆 Unlocked: ${t.title}`).filter((l) => !body0.split('\n').some((x) => x.trim() === l));
  if (!add.length) return;
  if (existing) await saveEntry({ ...existing, body: body0.trim() ? body0.replace(/\s+$/, '') + '\n\n' + add.join('\n') : add.join('\n') });
  else await saveEntry({ id: uid(), date: key, title: '', body: add.join('\n'), mood: null, season: seasonForKey(key), createdAt: new Date().toISOString() });
}

const trQueue = []; let trShowing = false;
function showTrophyPop(list, summary) { trQueue.push({ list, summary }); if (!trShowing) nextTrophyPop(); }
function nextTrophyPop() {
  const item = trQueue.shift(); if (!item) { trShowing = false; return; } trShowing = true;
  const { list, summary } = item, t = list[0], tier = TIERS[t.tier];
  const layer = document.createElement('div'); layer.className = 'tr-pop'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'trPopTitle');
  const arts = summary ? list.slice().sort((a, b) => 'special gold silver bronze'.indexOf(a.tier) - 'special gold silver bronze'.indexOf(b.tier)).slice(0, 3) : [t];
  layer.innerHTML = `<div class="scrim tr-scrim"></div>
    <section class="tr-card glass tier-${summary ? arts[0].tier : t.tier}">
      <div class="tr-rays" aria-hidden="true"></div>
      <div class="tr-hero-art${arts.length > 1 ? ' is-fan' : ''}">${arts.map((x) => trophyArt(x)).join('')}</div>
      <span class="eyebrow">${summary ? 'Your trophy cabinet' : `Trophy unlocked · ${tier.name}`}</span>
      <h3 id="trPopTitle">${summary ? `You’ve already earned ${list.length} ${list.length === 1 ? 'trophy' : 'trophies'}` : esc(t.title)}</h3>
      <p>${summary ? esc(`From the workouts you’ve done so far: ${list.slice(0, 4).map((x) => x.title).join(', ')}${list.length > 4 ? ` and ${list.length - 4} more` : ''}.`) : esc(t.desc)}</p>
      <div class="tr-actions"><button class="btn btn-ghost" data-go>See cabinet</button><button class="btn btn-primary" data-ok>${summary ? 'Lovely' : 'Nice!'}</button></div>
    </section>`;
  document.body.append(layer);
  const card = $('.tr-card', layer);
  const close = (go) => { card.classList.add('out'); $('.tr-scrim', layer).style.opacity = '0'; document.removeEventListener('keydown', onKey);
    setTimeout(() => { layer.remove(); if (go) { trQueue.length = 0; trShowing = false; if (location.hash !== '#/trophies') location.hash = '#/trophies'; } else nextTrophyPop(); }, 260); };
  const onKey = (k) => { if (k.key === 'Escape') close(false); };
  document.addEventListener('keydown', onKey);
  layer.addEventListener('click', (ev) => { if (ev.target.closest('[data-go]')) close(true); else if (ev.target.closest('[data-ok]') || ev.target.classList.contains('tr-scrim')) close(false); });
  Beep.fanfare(); if (!navigator.userActivation || navigator.userActivation.hasBeenActive) haptic([30, 60, 30, 60, 80]);
  requestAnimationFrame(() => celebrate($('.tr-hero-art', card), 36, 140));
  setTimeout(() => $('[data-ok]', card)?.focus({ preventScroll: true }), 80);
}

function viewTrophies(app) {
  const got = TR.get(), list = trophyList(trophyFacts(), got), n = list.filter((x) => x.ok).length, pct = Math.round(n / list.length * 100);
  const next = list.filter((x) => !x.ok && x.r > 0).sort((a, b) => b.r - a.r).slice(0, 2);
  const tierCount = (id) => { const l = list.filter((x) => x.t.tier === id); return `<span class="tr-tc tier-${id}"><i></i><span><b>${l.filter((x) => x.ok).length}</b>/${l.length}</span></span>`; };
  const tile = (x) => `<button class="tr-tile glass${x.ok ? ' is-ok' : ''}" data-tr="${x.t.id}" aria-label="${esc(x.t.title)}, ${x.ok ? 'unlocked' : 'locked'}">${trophyArt(x.t, !x.ok)}
      <b>${esc(x.t.title)}</b>${x.ok ? `<small class="tr-date">${fmt(new Date(x.at), { day: 'numeric', month: 'short' })}</small>`
      : `<span class="tr-mini"><i style="width:${x.r * 100}%"></i></span><small>${trShort(x)}</small>`}</button>`;
  app.innerHTML = `<div class="view tr-view">
    <div class="entry-top"><button class="icon-btn glass" data-act="back" aria-label="Back to workouts">${ICON.back}</button><span class="eyebrow">Workouts</span></div>
    <h1 class="page-title">Trophies</h1>
    <section class="tr-sum card glass">
      <div class="ring tr-ring" style="--p:${pct}"><span><b>${n}</b>/${list.length}</span></div>
      <div class="tr-sum-txt"><span class="eyebrow">Trophy cabinet</span><b>${n} of ${list.length} trophies</b>
        <div class="tr-tcs">${['bronze', 'silver', 'gold', 'special'].map(tierCount).join('')}</div></div>
    </section>
    ${next.length ? `<h2 class="wk-section">Almost there</h2><div class="tr-next">${next.map((x) => `<button class="tr-row glass" data-tr="${x.t.id}">${trophyArt(x.t, true)}
      <span class="tr-row-txt"><b>${esc(x.t.title)}</b><small>${esc(x.t.desc)}</small><span class="tr-bar"><i style="width:${x.r * 100}%"></i></span></span><em>${trShort(x)}</em></button>`).join('')}</div>` : ''}
    ${['gold', 'silver', 'bronze', 'special'].map((id) => `<h2 class="wk-section tr-h tier-${id}"><i></i>${TIERS[id].name}</h2>
      <div class="tr-grid">${list.filter((x) => x.t.tier === id).sort((a, b) => b.ok - a.ok).map(tile).join('')}</div>`).join('')}
    <div class="privacy-note glass">${ICON.shield}<span>Trophies are worked out from your own workout ticks and timers and stay on this device. They’re included in backups.</span></div>
  </div>`;
  $('[data-act="back"]', app).onclick = () => { location.hash = '#/workouts'; };
  $$('[data-tr]', app).forEach((b) => b.onclick = () => openTrophy(b.dataset.tr));
}
function openTrophy(id) {
  const got = TR.get(), x = trophyList(trophyFacts(), got).find((y) => y.t.id === id); if (!x) return;
  const t = x.t, left = t.target - x.n;
  const layer = $('#layer'), scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('div'); el.className = `sheet glass tr-sheet tier-${t.tier}${x.ok ? ' is-ok' : ''}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', t.title);
  el.innerHTML = `<div class="tr-sheet-art">${trophyArt(t, !x.ok)}</div>
    <span class="eyebrow">${TIERS[t.tier].name} trophy</span><h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p>
    <div class="tr-prog"><span class="tr-bar big"><i style="width:${x.r * 100}%"></i></span><b>${esc(trUnit(x))}</b></div>
    <div class="tr-status ${x.ok ? 'ok' : ''}">${x.ok ? `${WICON.check}Unlocked ${fmt(new Date(x.at), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
      : `${ICON.lock}${t.unit && !t.prog && left > 0 ? `${left} more ${left === 1 ? t.unit.replace(/ies$/, 'y').replace(/([^s])s$/, '$1') : t.unit} to go` : 'Locked — keep going'}`}</div>
    <div class="actions"><button class="btn btn-block btn-ghost" data-close>Close</button></div>`;
  const close = () => { el.classList.add('out'); scrim.style.opacity = '0'; scrim.style.transition = 'opacity .25s'; setTimeout(() => { el.remove(); scrim.remove(); }, 250); window.removeEventListener('hashchange', close); };
  scrim.onclick = close; $('[data-close]', el).onclick = close; window.addEventListener('hashchange', close);
  layer.append(scrim, el); setTimeout(() => $('[data-close]', el).focus({ preventScroll: true }), 50);
}
function trophyEntryCard() {
  const got = TR.get(), list = trophyList(trophyFacts(), got), ok = list.filter((x) => x.ok).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  const next = list.filter((x) => !x.ok).sort((a, b) => b.r - a.r)[0];
  const arts = ok.length ? ok.slice(0, 3).map((x) => trophyArt(x.t)).join('') : trophyArt(TROPHIES[0], true);
  return `<a class="tr-entry card glass" href="#/trophies"><span class="tr-entry-art${ok.length > 1 ? ' is-fan' : ''}">${arts}</span>
    <span class="tr-entry-txt"><span class="eyebrow">Trophy cabinet</span><b>${ok.length} of ${list.length} trophies</b>
      <small>${next ? `Next: ${esc(next.t.title)}${next.t.unit || next.t.prog ? ` · ${trShort(next)}` : ''}` : 'Every trophy unlocked — legend!'}</small></span>${ICON.chev}</a>`;
}

/* ───────── Router ───────── */
const tabbar = $('#tabbar');
function setTab(name) {
  const tabs = $$('.tab', tabbar).map((t) => t.dataset.tab); tabbar.style.setProperty('--tabs', tabs.length); const i = tabs.indexOf(name);
  $$('.tab', tabbar).forEach((t) => t.dataset.tab === name ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
  tabbar.classList.toggle('hidden', i < 0);
  if (i >= 0) $('.tab-indicator', tabbar).style.transform = `translateX(${i * 100}%)`;
}
async function route() {
  if (current.flush) { const f = current.flush; current = { flush: null }; await f(); }
  if (state.locked) return;
  const app = $('#app'); if (app._wkClick) { app.removeEventListener('click', app._wkClick); app._wkClick = null; }
  const [, name, arg, arg2] = (location.hash || '#/today').split('/');
  window.scrollTo(0, 0);
  if (name !== 'entry' && name !== 'today' && name) Scene.stop();
  if (name === 'timeline') { setTab('timeline'); viewTimeline(app); }
  else if (name === 'settings') { setTab('settings'); viewSettings(app); }
  else if (name === 'workouts') { setTab('workouts'); $('.tab[data-tab="workouts"]', tabbar).classList.remove('has-new'); viewWorkouts(app, arg && decodeURIComponent(arg)); }
  else if (name === 'trophies') { setTab('workouts'); viewTrophies(app); }
  else if (name === 'workout' && arg) { setTab('workout'); arg2 ? viewWorkout(app, decodeURIComponent(arg), decodeURIComponent(arg2)) : viewWorkout(app, firstBlock() && firstBlock().id, decodeURIComponent(arg)); }
  else if (name === 'entry' && arg) { setTab('entry'); await viewEntry(app, decodeURIComponent(arg)); }
  else { setTab('today'); viewToday(app); }
}
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (document.hidden && current.flush) current.flush(); });
window.addEventListener('pagehide', () => { if (current.flush) current.flush(); });

/* ───────── Updates ─────────
   The service worker is cache-first. Every deploy built with tools/build-workouts.py gets a new cache name, so the browser
   installs the new worker in the background on open; when it takes over we save, reload once and show a small toast. */
function setupUpdates() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const sw = navigator.serviceWorker; const hadController = !!sw.controller; let reloading = false;
  sw.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return; // first install: nothing to refresh
    const go = async () => {
      if (reloading) return; reloading = true;
      if (current.flush) { try { await current.flush(); } catch (e) {} }
      sessionStorage.setItem('lom.updated', '1'); if (!state.locked) sessionStorage.setItem('lom.grant', String(Date.now()));
      location.reload();
    };
    const typing = () => { const a = document.activeElement; return a && /^(TEXTAREA|INPUT)$/.test(a.tagName); };
    if (state.locked) { const t = setInterval(() => { if (!state.locked) { clearInterval(t); go(); } }, 400); return; } // never interrupt the PIN pad
    if (document.hidden || !typing()) go();
    else { document.addEventListener('focusout', () => setTimeout(() => { if (!typing()) go(); }, 300)); document.addEventListener('visibilitychange', () => { if (document.hidden) go(); }); }
  });
}
function noteNewBlocks(updated) {
  let seen = null; try { seen = JSON.parse(LS.get('wkSeen', 'null')); } catch (e) {}
  const ids = BLOCKS.map((b) => b.id); const fresh = Array.isArray(seen) ? BLOCKS.filter((b) => !seen.includes(b.id)) : [];
  LS.set('wkSeen', JSON.stringify(ids));
  const msg = fresh.length ? `Updated · Block ${fresh[fresh.length - 1].block} workouts are ready` : updated ? 'Updated to the latest version' : '';
  if (msg) setTimeout(() => toast(msg), 700);
  if (fresh.length) $('.tab[data-tab="workouts"]', tabbar)?.classList.add('has-new');
  if (location.hash.startsWith('#/workouts')) $('.tab[data-tab="workouts"]', tabbar)?.classList.remove('has-new');
}

/* ───────── Boot ───────── */
(async function boot() {
  applyTheme();
  Scene.enabled = LS.get('scenes', '1') === '1';
  await load();
  const justUpdated = sessionStorage.getItem('lom.updated'); sessionStorage.removeItem('lom.updated');
  const grant = +sessionStorage.getItem('lom.grant') || 0; sessionStorage.removeItem('lom.grant');
  if (state.locked && justUpdated && Date.now() - grant < 20000) state.locked = false; // don't ask for the PIN twice because of an update reload
  if (state.locked) await showLock();
  route();
  noteNewBlocks(!!justUpdated);
  if (!TR.has()) setTimeout(() => checkTrophies({ quiet: true }), 1200); // first run with trophies: unlock what's already earned
  setupUpdates();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
})();
