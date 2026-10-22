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
  const data = { app: 'life-of-me', version: 4, exportedAt: new Date().toISOString(), entries: sorted(), workoutBlocks: WK.all() };
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
          if (JSON.stringify(pr) !== before) wkMerged++;
        }
      }
      WK.saveAll(all);
    }
    await load();
    toast(added + updated || wkMerged ? `Imported ${added} new${updated ? `, ${updated} updated` : ''}${wkMerged ? ` · ${wkMerged} workout${wkMerged === 1 ? '' : 's'}` : ''}` : 'Everything was already here');
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

function viewWorkout(app, blockId, day) {
  const b = blockById(blockId); const w = wkByDay(b, day); if (!w) { location.hash = '#/workouts'; return; }
  const prog = WK.load(b); const pr = WK.of(prog, w.day); const d = parseKey(w.date); const st = wkStatus(b, w, prog);
  const save = () => WK.save(b, prog);
  app.innerHTML = `<div class="view wk-detail" style="${wkStyle(w)}">
    <div class="entry-top"><button class="icon-btn glass" data-act="back" aria-label="Back">${ICON.back}</button><span class="wk-pill pill-${st.id}">${st.id === 'done' ? WICON.check : ''}${esc(st.label)}</span></div>
    <div class="wk-hero"><div class="eyebrow">${BLOCKS.length > 1 ? `Block ${b.block} · ` : ''}Workout ${w.day} · ${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 class="h-display"><span>${esc(w.theme)}</span></h1>
      <div class="stats"><span class="chip glass">${WICON.clock}${esc(w.duration)}</span><span class="chip glass">${WICON.loop}${esc(w.format)}</span></div>
      <p class="wk-rest">Rest: ${esc(w.rest)}</p>
      <div class="wk-progress"><div class="wk-bar big"><i></i></div><span class="wk-count"></span></div>
    </div>
    <section class="card glass wk-block"><h2>${WICON.flame}Warm-up</h2>
      <ol class="wk-steps">${(w.warmup || []).map((x, i) => { const t = timerOfWarm(x);
        return `<li${t ? ' class="has-timer"' : ''}><b>${esc(x.move)}</b><span>${esc(x.detail)}</span>${t ? `<button class="t-btn" data-warm="${i}" aria-label="Start ${esc(x.move)} timer, ${t.sides > 1 ? '2 sides of ' : ''}${fmtT(t.work)}">${WICON.play}${t.sides > 1 ? '2×' : ''}${fmtT(t.work)}</button>` : ''}</li>`; }).join('')}</ol></section>
    <h2 class="wk-section">Exercises</h2>
    <div class="wk-ex-list">${w.exercises.map((e) => `<article class="ex card glass" data-slug="${esc(e.slug)}">
      <button class="ex-photo" data-zoom="${esc(e.slug)}" aria-label="Enlarge ${esc(e.name)} photo"><img src="${e.image}" alt="${esc(e.name)} — ${esc((e.formPoints || []).join(', '))}" loading="lazy" decoding="async" width="800" height="600"><span class="zoom-hint">${WICON.zoom}</span><span class="ex-num">${e.order}</span></button>
      <div class="ex-head"><div><h3>${esc(e.name)}</h3><div class="ex-amount">${esc(amount(e))}</div></div>
        <button class="tick" role="checkbox" aria-checked="${!!pr.ex[e.slug]}" aria-label="Done: ${esc(e.name)}" data-tick="${esc(e.slug)}">${WICON.check}</button></div>
      ${(() => { const t = timerOfEx(e); return `<div class="ex-timers">${t.work ? `<button class="t-chip t-work" data-ext="${esc(e.slug)}" data-mode="work">${WICON.play}<span><b>${t.sides > 1 ? `2 × ${fmtT(t.work)}` : fmtT(t.work)}</b><small>${t.sides > 1 ? 'Each side' : 'Work timer'}</small></span></button>` : ''}${t.rest ? `<button class="t-chip t-rest" data-ext="${esc(e.slug)}" data-mode="rest">${TICON.rest}<span><b>${fmtT(t.rest)}</b><small>${t.restDefault ? 'Rest' : t.roundRest ? 'Rest after' : 'Rest'}</small></span></button>` : ''}${t.roundRest ? `<button class="t-chip t-round" data-ext="${esc(e.slug)}" data-mode="round">${TICON.timer}<span><b>${fmtT(t.roundRest)}</b><small>Round rest</small></span></button>` : ''}</div>`; })()}
      <p class="ex-tip">${esc(e.formTips)}</p>
      ${e.formPoints && e.formPoints.length ? `<ol class="ex-points">${e.formPoints.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>` : ''}
      <div class="ex-easier"><span>Easier</span>${esc(e.easierOption)}</div>
      <div class="ex-foot"><div class="ex-tags">${(e.muscleGroups || []).map((m) => `<span class="tag">${esc(m)}</span>`).join('')}</div>
        ${e.videoUrl ? `<a class="ex-video" href="${esc(e.videoUrl)}" target="_blank" rel="noopener noreferrer">${WICON.play}<span><b>Watch form video</b><small>${esc(e.videoChannel || 'YouTube')}</small></span></a>` : ''}</div>
    </article>`).join('')}</div>
    <section class="card glass wk-block"><h2>${WICON.leafy}Cool-down</h2><p class="wk-cool">${esc(w.cooldown)}</p></section>
    <div class="wk-actions"><button class="btn btn-block wk-done-btn" data-act="done"></button></div>
  </div>`;
  const doneBtn = $('[data-act="done"]', app), bar = $('.wk-progress i', app), count = $('.wk-count', app);
  const render = () => { const n = exDone(pr, w);
    bar.style.width = (pr.done ? 100 : n / w.exercises.length * 100) + '%'; count.textContent = pr.done ? 'Workout complete' : `${n} of ${w.exercises.length} exercises`;
    doneBtn.className = 'btn btn-block wk-done-btn ' + (pr.done ? 'btn-ghost' : 'btn-primary');
    doneBtn.innerHTML = pr.done ? `${WICON.check}Done — tap to undo` : `${WICON.check}Mark workout done`;
    const pill = $('.entry-top .wk-pill', app), s2 = wkStatus(b, w, prog); pill.className = `wk-pill pill-${s2.id}`; pill.innerHTML = (s2.id === 'done' ? WICON.check : '') + esc(s2.label); };
  render();
  $('[data-act="back"]', app).onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/workouts/' + b.id); };
  if (app._wkClick) app.removeEventListener('click', app._wkClick); // one handler per detail view (views reuse #app)
  app._wkClick = (ev) => {
    const t = ev.target.closest('[data-tick]'); if (t) { const s = t.dataset.tick; pr.ex[s] = !pr.ex[s]; if (!pr.ex[s]) delete pr.ex[s];
      t.setAttribute('aria-checked', !!pr.ex[s]); t.closest('.ex').classList.toggle('is-done', !!pr.ex[s]); haptic(pr.ex[s] ? 12 : 6); save(); render();
      if (!pr.done && exDone(pr, w) === w.exercises.length) toast('All exercises ticked — mark the workout done?'); return; }
    const z = ev.target.closest('[data-zoom]'); if (z) { openPhoto(w.exercises.find((e) => e.slug === z.dataset.zoom)); return; }
    const wb = ev.target.closest('[data-warm]'); if (wb) { const x = w.warmup[+wb.dataset.warm], t = timerOfWarm(x); Beep.unlock();
      openTimer({ kind: 'warm', title: x.move, eyebrow: `Warm-up · ${x.detail}`, phases: warmPhases(x, t), autostart: true }); return; }
    const xb = ev.target.closest('[data-ext]'); if (xb) { const e = w.exercises.find((q) => q.slug === xb.dataset.ext), t = timerOfEx(e), m = xb.dataset.mode; Beep.unlock();
      const tickEl = $(`.tick[data-tick="${CSS.escape(e.slug)}"]`, app);
      const phases = m === 'work' ? workPhases(t) : m === 'round' ? [{ label: 'Rest between rounds', seconds: t.roundRest, type: 'rest' }] : [{ label: t.roundRest ? 'Rest between moves' : 'Rest between sets', seconds: t.rest, type: 'rest' }];
      openTimer({ kind: 'ex', title: e.name, eyebrow: `Exercise ${e.order} · ${amount(e)}`, phases, mode: m, autostart: m !== 'work',
        ex: { timer: t, name: e.name, onTickOff: () => { if (tickEl && tickEl.getAttribute('aria-checked') !== 'true') tickEl.click(); } } }); return; }
  };
  app.addEventListener('click', app._wkClick);
  $$('.ex', app).forEach((el) => el.classList.toggle('is-done', !!pr.ex[el.dataset.slug]));
  doneBtn.onclick = async () => {
    if (pr.done) { pr.done = false; pr.doneAt = null; save(); render(); toast('Marked as not done — your diary was left as is'); return; }
    pr.done = true; pr.doneAt = new Date().toISOString(); w.exercises.forEach((e) => { pr.ex[e.slug] = true; });
    $$('.tick', app).forEach((t) => t.setAttribute('aria-checked', 'true')); $$('.ex', app).forEach((el) => el.classList.add('is-done'));
    save(); render(); haptic([20, 40, 30]); celebrate(doneBtn);
    const added = await logWorkoutToDiary(b, w);
    const finishedAll = b === BLOCKS[BLOCKS.length - 1] && blockDone(b, prog) === b.workouts.length;
    toast(finishedAll ? `Block ${b.block} complete! Logged in your diary` : added ? `Done! Added to your diary for ${fmt(parseKey(w.date), { day: 'numeric', month: 'short' })}` : 'Done! Already in your diary');
  };
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
const timerOfWarm = (x) => x.timer !== undefined ? x.timer : (TSECS(x.detail) ? { work: TSECS(x.detail), sides: /\b(per|each)\s+(side|leg|arm|way|direction)\b/i.test(x.detail) ? 2 : 1 } : null);
const timerOfEx = (e) => e.timer || { work: TSECS(e.time), sides: /\b(per|each)\s+(side|leg|arm)\b/i.test(e.time || '') ? 2 : 1, rest: TSECS(e.rest) || 60, restDefault: !TSECS(e.rest), roundRest: null, sets: Math.max(...(String(e.sets).match(/\d+/g) || [1]).map(Number)) };
const TICON = {
  timer: '<svg viewBox="0 0 24 24" class="wi"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M19 6l1.5-1.5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" class="wi"><path d="M8 5.5v13M16 5.5v13"/></svg>',
  reset: '<svg viewBox="0 0 24 24" class="wi"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4v5h5"/></svg>',
  rest: '<svg viewBox="0 0 24 24" class="wi"><path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5"/></svg>',
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
  tone(at, f, dur, vol = .25) { const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + .012); g.gain.exponentialRampToValueAtTime(.0008, at + dur);
    o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + .02); this.nodes.push(o); return o; },
  schedule(msFromNow, final) { // countdown pips at 3-2-1 + finish chime, on the audio clock
    if (!this.ctx) return; this.cancel(); const t0 = this.ctx.currentTime + Math.max(0, msFromNow) / 1000;
    [3, 2, 1].forEach((k) => { if (msFromNow / 1000 > k + .05) this.tone(t0 - k, 660, .09, .12); });
    if (final) { this.tone(t0, 880, .18); this.tone(t0 + .22, 880, .18); this.tone(t0 + .44, 1175, .42); } else this.tone(t0, 988, .3);
  },
  now(final) { if (!this.ctx) return; try { this.ctx.resume(); } catch (e) {} this.schedule(0, final); },
};
const Wake = {
  lock: null,
  async on() { try { if ('wakeLock' in navigator && !this.lock && document.visibilityState === 'visible') { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => { this.lock = null; }); } } catch (e) { this.lock = null; } },
  off() { try { this.lock && this.lock.release(); } catch (e) {} this.lock = null; },
};

/* opts: { kind:'warm'|'ex', title, eyebrow, phases:[{label,seconds,type}], ex?:{timer, name, onTickOff} } */
function openTimer(opts) {
  $$('.timer-layer').forEach((x) => x.remove());
  const layer = document.createElement('div'); layer.className = 'timer-layer';
  const tm = opts.ex ? opts.ex.timer : null; const totalSets = tm ? tm.sets : 0;
  const st = { phases: opts.phases, i: 0, dur: opts.phases[0].seconds, endAt: 0, left: opts.phases[0].seconds * 1000, running: false, finished: false, set: 1, late: false };
  const modes = tm ? [tm.work && { id: 'work', label: tm.sides > 1 ? `Work ${tm.sides}×${fmtT(tm.work)}` : `Work ${fmtT(tm.work)}`, phases: workPhases(tm) },
    tm.rest && { id: 'rest', label: `Rest ${fmtT(tm.rest)}`, phases: [{ label: tm.restDefault ? 'Rest between sets' : (tm.roundRest ? 'Rest between moves' : 'Rest between sets'), seconds: tm.rest, type: 'rest' }] },
    tm.roundRest && { id: 'round', label: `Round rest ${fmtT(tm.roundRest)}`, phases: [{ label: 'Rest between rounds', seconds: tm.roundRest, type: 'rest' }] }].filter(Boolean) : [];
  let mode = opts.mode || (modes[0] && modes[0].id);
  const R = 118, C = 2 * Math.PI * R;
  layer.innerHTML = `<div class="scrim timer-scrim"></div>
    <section class="timer glass" role="dialog" aria-modal="true" aria-label="${esc(opts.title)} timer">
      <div class="timer-top"><div><span class="eyebrow">${esc(opts.eyebrow)}</span><h3>${esc(opts.title)}</h3></div>
        <button class="icon-btn glass" data-t="close" aria-label="Close timer">${ICON.x}</button></div>
      ${modes.length > 1 ? `<div class="timer-modes" role="radiogroup" aria-label="Timer type">${modes.map((m) => `<button role="radio" data-mode="${m.id}">${esc(m.label)}</button>`).join('')}</div>` : ''}
      <div class="timer-dial">
        <svg viewBox="0 0 260 260" aria-hidden="true"><circle class="trk" cx="130" cy="130" r="${R}"/><circle class="prg" cx="130" cy="130" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="timer-read"><span class="timer-phase"></span><b class="timer-digits" aria-live="off">0:00</b><span class="timer-sub"></span></div>
      </div>
      ${totalSets > 1 ? `<div class="timer-sets"><button class="ts-btn" data-t="set-" aria-label="Previous set">−</button>
        <div class="ts-mid"><span class="ts-dots">${Array.from({ length: totalSets }, () => '<i></i>').join('')}</span><span class="ts-label"></span></div>
        <button class="ts-btn" data-t="set+" aria-label="Next set">+</button></div>` : ''}
      <div class="timer-ctl">
        <button class="tc-small glass" data-t="minus" aria-label="Minus 15 seconds">−15s</button>
        <button class="tc-main" data-t="toggle" aria-label="Start"></button>
        <button class="tc-small glass" data-t="plus" aria-label="Plus 15 seconds">+15s</button>
      </div>
      <div class="timer-foot"><button class="tc-link" data-t="reset">${TICON.reset}Reset</button><span class="timer-status" role="status" aria-live="polite"></span>
        ${opts.ex ? '<button class="tc-link" data-t="tickoff" hidden>' + WICON.check + 'Tick off</button>' : ''}</div>
    </section>`;
  document.body.append(layer); document.documentElement.classList.add('timer-open');
  const el = $('.timer', layer), digits = $('.timer-digits', el), prg = $('.prg', el), phaseEl = $('.timer-phase', el), sub = $('.timer-sub', el), status = $('.timer-status', el);
  const toggleBtn = $('[data-t="toggle"]', el);
  const remaining = () => (st.running ? st.endAt - Date.now() : st.left);
  const paint = () => {
    const ms = Math.max(0, remaining()), ph = st.phases[st.i];
    digits.textContent = fmtT(ms / 1000); prg.style.strokeDashoffset = String(C * (1 - ms / (st.dur * 1000 || 1)));
    phaseEl.textContent = st.finished ? 'Time!' : ph.label; sub.textContent = st.phases.length > 1 ? `${st.i + 1} of ${st.phases.length}` : (st.running ? '' : st.finished ? '' : 'Ready');
    el.dataset.type = ph.type; el.classList.toggle('is-running', st.running); el.classList.toggle('is-done', st.finished);
    toggleBtn.innerHTML = st.running ? TICON.pause : WICON.play; toggleBtn.setAttribute('aria-label', st.running ? 'Pause' : st.finished ? 'Start again' : 'Start');
    if (totalSets > 1) { $$('.ts-dots i', el).forEach((d, k) => { d.classList.toggle('on', k < st.set - 1 || (k === st.set - 1 && st.finished && ph.type === 'work')); d.classList.toggle('cur', k === st.set - 1); });
      $('.ts-label', el).textContent = `Set ${st.set} of ${totalSets}`; }
    $$('[data-mode]', el).forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === mode));
    const tk = $('[data-t="tickoff"]', el); if (tk) tk.hidden = !(st.set >= totalSets && st.finished);
  };
  let raf = 0, iv = 0;
  const loop = () => { cancelAnimationFrame(raf); if (!st.running) return; check(); paint(); raf = requestAnimationFrame(loop); };
  const check = () => { if (st.running && remaining() <= 0) phaseEnd(); };
  const startPhase = (resetLeft) => { if (resetLeft) st.left = st.dur * 1000; st.endAt = Date.now() + st.left; st.running = true; st.finished = false;
    Beep.schedule(st.left, st.i === st.phases.length - 1); Wake.on(); loop(); };
  function phaseEnd() {
    const lateBy = Date.now() - st.endAt; st.running = false; st.left = 0;
    if (lateBy > 1500) Beep.now(st.i === st.phases.length - 1); // we were in the background: the scheduled beep may have been suspended
    flash();
    if (st.i < st.phases.length - 1) { st.i++; st.dur = st.phases[st.i].seconds; st.left = st.dur * 1000; startPhase(true); status.textContent = `${st.phases[st.i].label} — go`; return; }
    st.finished = true; Wake.off();
    if (navigator.vibrate) try { navigator.vibrate([180, 90, 180, 90, 320]); } catch (e) {}
    const ph = st.phases[st.i];
    if (totalSets > 1 && ph.type === 'rest' && st.set < totalSets) { st.set++; status.textContent = `Rest over — set ${st.set} of ${totalSets}`; }
    else if (totalSets > 1 && ph.type === 'work') status.textContent = st.set < totalSets ? 'Nice! Take your rest' : `All ${totalSets} sets done`;
    else status.textContent = 'Time’s up';
    if (totalSets > 1 && ph.type === 'work' && st.set < totalSets && modes.some((m) => m.id === 'rest')) setTimeout(() => { if (layer.isConnected && st.finished) { setMode('rest'); status.textContent = 'Rest ready — tap play'; } }, 1400);
    paint();
  }
  function flash() { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); haptic(40); }
  function setMode(id) { const m = modes.find((x) => x.id === id); if (!m) return; mode = id; Beep.cancel(); st.running = false; st.phases = m.phases; st.i = 0; st.dur = m.phases[0].seconds; st.left = st.dur * 1000; st.finished = false; Wake.off(); paint(); }
  const close = () => { st.running = false; Beep.cancel(); Wake.off(); cancelAnimationFrame(raf); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); document.removeEventListener('keydown', onKey);
    el.classList.add('out'); $('.timer-scrim', layer).style.opacity = '0'; document.documentElement.classList.remove('timer-open'); setTimeout(() => layer.remove(), 240); };
  const onVis = () => { if (document.visibilityState === 'visible') { if (st.running) { Wake.on(); check(); loop(); } paint(); } };
  const onKey = (k) => { if (k.key === 'Escape') close(); else if (k.key === ' ' && k.target === document.body) { k.preventDefault(); toggleBtn.click(); } };
  document.addEventListener('visibilitychange', onVis); document.addEventListener('keydown', onKey); window.addEventListener('hashchange', close, { once: true });
  iv = setInterval(() => { check(); if (st.running) paint(); }, 250); // backup when rAF is throttled
  el.addEventListener('click', (ev) => {
    const mb = ev.target.closest('[data-mode]'); if (mb) { setMode(mb.dataset.mode); return; }
    const b = ev.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t;
    if (t === 'close') return close();
    if (t === 'toggle') { Beep.unlock();
      if (st.running) { st.left = remaining(); st.running = false; Beep.cancel(); Wake.off(); status.textContent = 'Paused'; }
      else { if (st.finished) { st.i = 0; st.dur = st.phases[0].seconds; st.left = st.dur * 1000; } status.textContent = ''; startPhase(st.left <= 0); }
      haptic(10); paint(); return; }
    if (t === 'reset') { Beep.cancel(); st.running = false; st.i = 0; st.dur = st.phases[0].seconds; st.left = st.dur * 1000; st.finished = false; Wake.off(); status.textContent = ''; paint(); return; }
    if (t === 'plus' || t === 'minus') { const d = t === 'plus' ? 15000 : -15000;
      if (st.finished) { st.finished = false; st.left = 0; }
      const left = Math.max(st.running ? 1000 : 5000, remaining() + d); if (st.running) { st.endAt = Date.now() + left; Beep.schedule(left, st.i === st.phases.length - 1); } else st.left = left;
      st.dur = Math.max(st.dur, Math.ceil(left / 1000)); paint(); return; }
    if (t === 'set+' || t === 'set-') { st.set = Math.min(totalSets, Math.max(1, st.set + (t === 'set+' ? 1 : -1))); paint(); return; }
    if (t === 'tickoff' && opts.ex && opts.ex.onTickOff) { opts.ex.onTickOff(); close(); }
  });
  $('.timer-scrim', layer).onclick = () => { if (!st.running) close(); };
  paint(); setTimeout(() => toggleBtn.focus({ preventScroll: true }), 60);
  if (opts.autostart) { Beep.unlock(); startPhase(true); paint(); }
  return { el, close };
}
function workPhases(tm) { return tm.sides > 1 ? [{ label: 'Side 1', seconds: tm.work, type: 'work' }, { label: 'Side 2', seconds: tm.work, type: 'work' }] : [{ label: 'Work', seconds: tm.work, type: 'work' }]; }
function warmPhases(x, t) { return t.sides > 1 ? [{ label: 'Side 1', seconds: t.work, type: 'work' }, { label: 'Side 2', seconds: t.work, type: 'work' }] : [{ label: x.move, seconds: t.work, type: 'work' }]; }

function celebrate(el) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(); const box = document.createElement('div'); box.className = 'confetti'; box.style.left = r.left + r.width / 2 + 'px'; box.style.top = r.top + 'px';
  const cols = ['#FFD23F', '#FF6AD5', '#3FA9FF', '#16C79A', '#FF7A45', '#9B85FF'];
  box.innerHTML = [...Array(26)].map((_, i) => `<i style="--a:${(i / 26) * 360}deg;--d:${60 + Math.random() * 90}px;--c:${cols[i % cols.length]};--r:${Math.random() * 720 - 360}deg"></i>`).join('');
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
  setupUpdates();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
})();
