/* Life of Me — cinematic seasonal scenes.
   Layers (back → front): photo backdrop with slow Ken Burns + scroll parallax (DOM, GPU-composited),
   theme colour wash, then one canvas of depth-of-field particles. Everything sits behind the frosted glass.
   dt-based, DPR-capped, pauses when hidden; reduced motion = still photo + one still frame. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* Where the sun sits in the summer photo (fraction of the image). */
const PHOTO = { w: 720, h: 1280, sun: [0.78, 0.29] };

/* ── Sprites ── */
function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function sprite(w, h, draw) { const c = canvas(w, h); draw(c.getContext('2d'), w, h); return c; }
function soften(src, f = 4) { // cheap blur: shrink, then let drawImage upscale (works on every Safari)
  const c = canvas(Math.max(2, Math.round(src.width / f)), Math.max(2, Math.round(src.height / f)));
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height); return c; }
function loadImg(src) { const i = new Image(); i.decoding = 'async'; i.src = src; return i; }
const ok = (i) => i && (i instanceof HTMLCanvasElement || (i.complete && i.naturalWidth));

const SPR = {};
function buildSprites() {
  if (SPR.ready) return;
  SPR.flake = sprite(24, 24, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(255,255,255,.9)'); r.addColorStop(.75, 'rgba(240,246,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s); });
  SPR.bokeh = sprite(96, 96, (g, s) => { const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c);
    r.addColorStop(0, 'rgba(255,255,255,.34)'); r.addColorStop(.72, 'rgba(255,255,255,.42)'); r.addColorStop(.86, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill(); });
  SPR.pinkBokeh = sprite(128, 128, (g, s) => { const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c);
    r.addColorStop(0, 'rgba(255,200,222,.30)'); r.addColorStop(.8, 'rgba(255,175,205,.26)'); r.addColorStop(1, 'rgba(255,175,205,0)');
    g.fillStyle = r; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill(); });
  SPR.streak = sprite(6, 96, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h);
    r.addColorStop(0, 'rgba(225,235,255,0)'); r.addColorStop(.7, 'rgba(225,235,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,.9)');
    g.fillStyle = r; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - .5, h / 2, 0, 0, TAU); g.fill(); });
  SPR.drop = sprite(64, 64, (g, s) => { const c = s / 2, R = c - 2; // a bead of water on glass
    let r = g.createRadialGradient(c, c + R * .25, R * .1, c, c, R);
    r.addColorStop(0, 'rgba(255,255,255,.10)'); r.addColorStop(.75, 'rgba(255,255,255,.06)'); r.addColorStop(.92, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(20,20,30,.28)'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R - 3, .15 * Math.PI, .85 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(c - R * .35, c - R * .4, R * .2, R * .12, -.6, 0, TAU); g.fill(); });
  SPR.mote = sprite(16, 16, (g, s) => { const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c);
    r.addColorStop(0, 'rgba(255,246,215,1)'); r.addColorStop(.4, 'rgba(255,222,150,.55)'); r.addColorStop(1, 'rgba(255,210,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s); });
  SPR.ghost = ['rgba(120,220,255,', 'rgba(190,140,255,', 'rgba(255,200,110,', 'rgba(150,255,190,', 'rgba(255,150,120,'].map((col) => sprite(128, 128, (g, s) => {
    const c = s / 2; const r = g.createRadialGradient(c, c, c * .15, c, c, c);
    r.addColorStop(0, col + '.10)'); r.addColorStop(.78, col + '.22)'); r.addColorStop(.9, col + '.32)'); r.addColorStop(1, col + '0)');
    g.fillStyle = r; g.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); } g.closePath(); g.fill(); }));
  SPR.sun = sprite(512, 512, (g, s) => { const c = s / 2;
    let r = g.createRadialGradient(c, c, 0, c, c, c); r.addColorStop(0, 'rgba(255,255,245,1)'); r.addColorStop(.06, 'rgba(255,248,220,.95)');
    r.addColorStop(.18, 'rgba(255,225,160,.45)'); r.addColorStop(.5, 'rgba(255,200,120,.12)'); r.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + (i % 2) * .1, len = c * (i % 3 === 0 ? .98 : .6);
      const lg = g.createLinearGradient(c, c, c + Math.cos(a) * len, c + Math.sin(a) * len);
      lg.addColorStop(0, 'rgba(255,245,210,.5)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      g.strokeStyle = lg; g.lineWidth = i % 3 === 0 ? 2.2 : 1.2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len); g.stroke(); }
    const h = g.createLinearGradient(0, c, s, c); h.addColorStop(0, 'rgba(255,220,160,0)'); h.addColorStop(.5, 'rgba(255,235,190,.5)'); h.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = h; g.fillRect(0, c - 1.5, s, 3); }); // anamorphic streak
  SPR.leaves = [0, 1, 2, 3, 4, 5].map((i) => loadImg(`scenes/leaf${i}.webp`));
  SPR.petals = [0, 1, 2, 3, 4, 5].map((i) => loadImg(`scenes/petal${i}.webp`));
  SPR.soft = new Map();
  SPR.ready = true;
}
function softOf(img) { if (!ok(img)) return null; let s = SPR.soft.get(img); if (!s) { const c = canvas(img.naturalWidth || img.width); c.getContext('2d').drawImage(img, 0, 0); s = soften(c, 5); SPR.soft.set(img, s); } return s; }

/* ── Shared state ── */
const Scene = { season: null, enabled: true };
let cvs, g, W = 0, H = 0, DPR = 1, raf = 0, last = 0, T = 0, layers = {};
const wind = (t) => .6 * Math.sin(t * .13) + .3 * Math.sin(t * .37 + 1) + .1 * Math.sin(t * 1.3 + 2); // gusty, -1…1

function sunPos() { // map the sun in the photo to screen space (photo box is inset -6% + object-fit: cover)
  const bw = W * 1.12, bh = H * 1.12, s = Math.max(bw / PHOTO.w, bh / PHOTO.h);
  const iw = PHOTO.w * s, ih = PHOTO.h * s, ox = -W * .06 + (bw - iw) / 2, oy = -H * .06 + (bh - ih) / 2;
  return [ox + PHOTO.sun[0] * iw, oy + PHOTO.sun[1] * ih + (Scene.par || 0)];
}

/* ── Seasons ── */
const SEASONS = {
  winter: {
    init(n) { // three depth planes: far crisp specks, mid flakes, near out-of-focus bokeh flakes
      return { p: [...Array(n(110))].map(() => this.make(true, 0)), m: [...Array(n(44))].map(() => this.make(true, 1)), b: [...Array(n(9))].map(() => this.make(true, 2)) }; },
    make(fresh, d) { const k = [[.7, 1.5, 16, 30, .75], [1.8, 3.6, 38, 70, .9], [12, 30, 85, 150, .5]][d];
      return { d, x: rnd(-30, W + 30), y: fresh ? rnd(-H * .1, H) : rnd(-60, -10), r: rnd(k[0], k[1]), vy: rnd(k[2], k[3]), ph: rnd(0, TAU), sw: rnd(.4, 1.3), a: rnd(k[4] * .7, k[4]) }; },
    frame(L, dt, t) { const w = wind(t);
      for (const key of ['p', 'm', 'b']) { const arr = L[key];
        for (let i = 0; i < arr.length; i++) { let f = arr[i]; const depth = f.d === 0 ? .5 : f.d === 1 ? 1 : 1.8;
          f.y += f.vy * dt; f.x += (w * 28 * depth + Math.sin(t * f.sw + f.ph) * 10 * depth) * dt;
          if (f.y > H + 40 || f.x > W + 60 || f.x < -60) f = arr[i] = this.make(false, f.d), f.x = f.x - w * 40;
          g.globalAlpha = f.a; const s = f.r * 2;
          g.drawImage(f.d === 2 ? SPR.bokeh : SPR.flake, f.x - f.r, f.y - f.r, s, s); } } },
  },
  spring: {
    init(n) { return { p: [...Array(n(30))].map(() => this.make(true)), b: [...Array(6)].map(() => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(40, 90), vx: rnd(-6, 6), vy: rnd(-4, 4), ph: rnd(0, TAU) })) }; },
    make(fresh) { const z = Math.random() ** .8;
      return { z, x: fresh ? rnd(-40, W) : rnd(-120, W * .7), y: fresh ? rnd(-H * .1, H) : rnd(-80, -20), s: 9 + z * 22, vy: 18 + z * 38, vx: 10 + z * 20,
        rot: rnd(0, TAU), vr: rnd(-1.2, 1.2), f1: rnd(1.4, 3), f2: rnd(.7, 1.6), ph: rnd(0, TAU), img: pick(SPR.petals), blur: z > .88 }; },
    frame(L, dt, t) { const w = wind(t);
      g.globalCompositeOperation = 'lighter';
      for (const b of L.b) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < -100) b.x = W + 90; if (b.x > W + 100) b.x = -90; if (b.y < -100) b.y = H + 90; if (b.y > H + 100) b.y = -90;
        g.globalAlpha = .55 + .25 * Math.sin(t * .4 + b.ph); g.drawImage(SPR.pinkBokeh, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); }
      g.globalCompositeOperation = 'source-over';
      const arr = L.p;
      for (let i = 0; i < arr.length; i++) { let p = arr[i];
        p.y += p.vy * dt; p.x += (p.vx + w * 40 * (0.5 + p.z) + Math.sin(t * .9 + p.ph) * 18) * dt; p.rot += (p.vr + w * .4) * dt;
        if (p.y > H + 40 || p.x > W + 60) p = arr[i] = this.make(false);
        const img = p.blur ? softOf(p.img) : (ok(p.img) ? p.img : null); if (!img) continue;
        const sx = Math.cos(t * p.f1 + p.ph), sy = .55 + .45 * Math.cos(t * p.f2 + p.ph * 2);
        g.globalAlpha = (p.blur ? .7 : .92) * (.75 + .25 * Math.abs(sx));
        g.setTransform(DPR, 0, 0, DPR, 0, 0); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(Math.max(.12, Math.abs(sx)) * (sx < 0 ? -1 : 1), sy);
        g.drawImage(img, -p.s / 2, -p.s / 2, p.s, p.s); }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); },
  },
  autumn: {
    init(n) { return { l: [...Array(n(14))].map(() => this.make(true)), r: [...Array(n(120))].map(() => this.drop(true)), s: [], d: [], next: 0 }; },
    make(fresh) { const z = Math.random() ** .9;
      return { z, x: rnd(-30, W + 30), y: fresh ? rnd(-H * .1, H) : rnd(-110, -40), s: 20 + z * 36, vy: 40 + z * 55, amp: rnd(30, 70), f: rnd(.7, 1.3), spin: rnd(-.8, .8),
        rot: rnd(0, TAU), fl: rnd(1, 2.2), ph: rnd(0, TAU), img: pick(SPR.leaves), blur: z > .9 }; },
    drop(fresh) { const z = Math.random(); return { z, x: rnd(-80, W + 40), y: fresh ? rnd(-H, H) : rnd(-160, -40), v: 900 + z * 600, l: 16 + z * 30, a: .1 + z * .28, ground: rnd(H * .55, H * 1.02) }; },
    frame(L, dt, t) { const w = wind(t), ang = -.12 - w * .1; // rain leans with the wind
      // rain streaks (motion-blurred sprites)
      const dark = document.documentElement.dataset.dark === '1'; const sx = Math.sin(-ang), cy = Math.cos(ang);
      for (let i = 0; i < L.r.length; i++) { let d = L.r[i]; d.y += d.v * cy * dt; d.x += d.v * sx * dt;
        if (d.y > d.ground) { if (Math.random() < .35 && L.s.length < 40) L.s.push({ x: d.x, y: d.y, t: 0, r: 2 + d.z * 5 }); d = L.r[i] = this.drop(false); }
        g.globalAlpha = d.a * (dark ? 1.15 : .9); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.translate(d.x, d.y); g.rotate(ang);
        g.drawImage(SPR.streak, -1.2, -d.l, 2.4 + d.z, d.l); }
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      // splashes: expanding ripples + tiny bounce droplets
      g.strokeStyle = dark ? 'rgba(220,230,255,.55)' : 'rgba(255,255,255,.7)'; g.lineWidth = .8;
      for (let i = L.s.length - 1; i >= 0; i--) { const s = L.s[i]; s.t += dt; const k = s.t / .35; if (k >= 1) { L.s.splice(i, 1); continue; }
        g.globalAlpha = (1 - k) * .7; g.beginPath(); g.ellipse(s.x, s.y, s.r * (.4 + k * 1.6), s.r * (.15 + k * .5), 0, 0, TAU); g.stroke();
        g.globalAlpha = (1 - k) * .8; g.fillStyle = g.strokeStyle; const hgt = Math.sin(k * Math.PI) * s.r * 2.2;
        g.fillRect(s.x - s.r * k * 1.3, s.y - hgt, 1.2, 1.2); g.fillRect(s.x + s.r * k * 1.1, s.y - hgt * .8, 1.2, 1.2); }
      // beads of water forming and sliding on the glass
      L.next -= dt; if (L.next <= 0 && L.d.length < 16) { L.d.push({ x: rnd(10, W - 10), y: rnd(10, H * .9), r: rnd(1.5, 3.5), g: rnd(.15, .5), vy: 0, life: rnd(7, 14), t: 0 }); L.next = rnd(.25, .7); }
      for (let i = L.d.length - 1; i >= 0; i--) { const d = L.d[i]; d.t += dt; d.r = Math.min(9, d.r + d.g * dt);
        if (d.r > 6.5) { d.vy += 60 * dt; d.y += d.vy * dt; d.x += Math.sin(d.t * 6) * 4 * dt; }
        const a = Math.min(1, d.t * 2) * Math.min(1, (d.life - d.t)); if (a <= 0 || d.y > H + 20) { L.d.splice(i, 1); continue; }
        g.globalAlpha = a * .95; const s = d.r * 2; g.drawImage(SPR.drop, d.x - d.r, d.y - d.r * (1 + Math.min(.35, d.vy / 300)), s, s * (1 + Math.min(.35, d.vy / 300))); }
      // falling leaves with 3D flutter
      for (let i = 0; i < L.l.length; i++) { let p = L.l[i];
        p.y += p.vy * dt; const sw = Math.sin(t * p.f + p.ph); p.x += (sw * p.amp + w * 50 * (.5 + p.z)) * dt; p.rot += (p.spin + Math.cos(t * p.f + p.ph) * .9) * dt;
        if (p.y > H + 60 || p.x > W + 80 || p.x < -80) p = L.l[i] = this.make(false);
        const img = p.blur ? softOf(p.img) : (ok(p.img) ? p.img : null); if (!img) continue;
        const fx = Math.cos(t * p.fl + p.ph), fy = .7 + .3 * Math.sin(t * p.fl * .7 + p.ph);
        g.globalAlpha = (p.blur ? .8 : 1) * (.7 + .3 * Math.abs(fx));
        g.setTransform(DPR, 0, 0, DPR, 0, 0); g.translate(p.x, p.y); g.rotate(p.rot + sw * .5); g.scale(Math.max(.1, Math.abs(fx)) * (fx < 0 ? -1 : 1), fy);
        g.drawImage(img, -p.s / 2, -p.s / 2, p.s, p.s); }
      g.setTransform(DPR, 0, 0, DPR, 0, 0); },
  },
  summer: {
    init(n) { return { m: [...Array(n(70))].map(() => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.8, 2.6), vx: rnd(-4, 4), vy: rnd(-8, -2), ph: rnd(0, TAU), tw: rnd(.6, 2) })) }; },
    frame(L, dt, t) {
      const [sx, sy] = sunPos(), cx = W / 2, cy = H * .55, breathe = .85 + .15 * Math.sin(t * .5);
      g.globalCompositeOperation = 'lighter';
      // sun bloom + starburst
      const S = Math.max(W, H) * .95 * (1 + .03 * Math.sin(t * .7));
      g.globalAlpha = .85 * breathe; g.save(); g.translate(sx, sy); g.rotate(t * .01); g.drawImage(SPR.sun, -S / 2, -S / 2, S, S); g.restore();
      // lens-flare ghosts along the sun → centre axis; they drift as if the camera breathes
      const ghosts = [[.35, 26, 0, .5], [.62, 54, 1, .4], [.95, 18, 2, .7], [1.2, 90, 3, .25], [1.45, 36, 4, .45], [1.75, 64, 1, .3]];
      for (const [k0, r, c, a] of ghosts) { const k = k0 + .03 * Math.sin(t * .3 + k0 * 3);
        const gx = sx + (cx - sx) * k, gy = sy + (cy - sy) * k; g.globalAlpha = a * breathe; g.drawImage(SPR.ghost[c], gx - r, gy - r, r * 2, r * 2); }
      // drifting light dust, brighter near the sun
      for (const m of L.m) { m.x += (m.vx + Math.sin(t * .7 + m.ph) * 5) * dt; m.y += (m.vy + Math.cos(t * .5 + m.ph) * 3) * dt;
        if (m.y < -10) { m.y = H + 10; m.x = rnd(0, W); } if (m.x < -10) m.x = W + 10; if (m.x > W + 10) m.x = -10;
        const near = clamp(1 - Math.hypot(m.x - sx, m.y - sy) / (W * .9), 0, 1);
        g.globalAlpha = (.25 + .75 * near) * (.55 + .45 * Math.sin(t * m.tw + m.ph)); const s = m.r * (2 + near * 2.5); g.drawImage(SPR.mote, m.x - s, m.y - s, s * 2, s * 2); }
      g.globalCompositeOperation = 'source-over'; },
  },
};

/* ── Photo backdrop (DOM) ── */
let photo;
function ensurePhoto(season) {
  if (!photo) photo = document.getElementById('photo');
  if (!photo || !season) return;
  let el = photo.querySelector(`[data-ph="${season}"]`);
  if (!el) {
    el = document.createElement('div'); el.className = 'ph'; el.dataset.ph = season;
    const pic = `<picture><source srcset="scenes/${season}.webp" type="image/webp"><img src="scenes/${season}.jpg" alt="" decoding="async"></picture>`;
    el.innerHTML = `<div class="kb">${pic}</div>` + (season === 'summer' ? `<div class="shimmer"><div class="kb">${pic}</div></div>` : '');
    photo.append(el);
  }
  const img = el.querySelector('img');
  const show = () => requestAnimationFrame(() => { photo.querySelectorAll('.ph').forEach((p) => p.classList.toggle('on', p === el)); });
  img.complete ? show() : img.addEventListener('load', show, { once: true });
}
function hidePhoto() { photo && photo.querySelectorAll('.ph').forEach((p) => p.classList.remove('on')); }

/* parallax: photo drifts a little slower than the page */
let parRaf = 0;
addEventListener('scroll', () => { if (parRaf || !Scene.season || reduce.matches) return; parRaf = requestAnimationFrame(() => { parRaf = 0;
  Scene.par = -Math.min(60, scrollY * .08); document.documentElement.style.setProperty('--par', Scene.par.toFixed(1) + 'px'); }); }, { passive: true });

/* ── Engine ── */
function ensure() {
  if (cvs) return; cvs = document.getElementById('scene'); g = cvs.getContext('2d');
  addEventListener('resize', () => { if (!Scene.season) return; resize(); populate(); if (!raf) frame(performance.now(), true); });
  document.addEventListener('visibilitychange', () => { document.hidden ? pause() : resume(); });
}
function resize() {
  DPR = Math.min(devicePixelRatio || 1, Scene.lite ? 1 : Scene.season === 'summer' ? 1.25 : 2); W = innerWidth; H = innerHeight;
  cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR); cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function populate() { const scale = clamp((W * H) / (390 * 844), .6, 1.6); layers = SEASONS[Scene.season].init((k) => Math.round(k * scale)); }
function frame(now, still) {
  const dt = still ? 0 : Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
  const S = SEASONS[Scene.season]; if (!S) return;
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  S.frame(layers, still ? 0 : dt, T);
  g.globalAlpha = 1;
  if (!still && !Scene.lite && !FULL) adapt(dt);
  if (!still) raf = requestAnimationFrame(frame);
}
/* Adaptive quality: if the device can't hold ~45fps, drop the photo motion and canvas resolution. */
let acc = 0, cnt = 0; const FULL = (() => { try { return localStorage.getItem('diary.quality') === 'full'; } catch (e) { return false; } })();
function adapt(dt) {
  if (dt <= 0) return; acc += dt; cnt++;
  if (cnt < 120) return;
  if (acc / cnt > 1 / 45) { Scene.lite = true; document.documentElement.classList.add('scene-lite'); resize(); }
  acc = 0; cnt = 0;
}
function pause() { cancelAnimationFrame(raf); raf = 0; }
function resume() { if (!Scene.season || document.hidden || !Scene.enabled) return; pause();
  if (reduce.matches) { T = 12; frame(performance.now(), true); setTimeout(() => Scene.season && reduce.matches && frame(performance.now(), true), 400); return; } // still frame (re-drawn once sprites decode)
  last = performance.now(); acc = 0; cnt = 0; raf = requestAnimationFrame(frame); }

Scene.set = (season) => {
  ensure(); buildSprites();
  if (!Scene.enabled) season = null;
  const root = document.documentElement;
  if (season === Scene.season) { if (season) resume(); return; }
  root.dataset.season = season || '';
  clearTimeout(Scene._t);
  if (!season) { Scene.season = null; cvs.classList.remove('on'); hidePhoto(); pause(); Scene._t = setTimeout(() => g.clearRect(0, 0, W, H), 600); return; }
  ensurePhoto(season);
  const swap = () => { Scene.season = season; resize(); populate(); T = rnd(5, 30); cvs.classList.add('on'); resume(); };
  if (Scene.season && cvs.classList.contains('on')) { cvs.classList.remove('on'); pause(); Scene.season = season; Scene._t = setTimeout(() => { if (Scene.season === season) swap(); }, 320); }
  else swap();
};
Scene.stop = () => Scene.set(null);
reduce.addEventListener && reduce.addEventListener('change', resume);
window.Scene = Scene;
})();
