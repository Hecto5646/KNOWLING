(() => {
'use strict';

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const vista = $('#vista'), esc = $('#escena'), fx = $('#fx'), destello = $('#destello');
const W = 1230, H = 960;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const S = (tag, attrs = {}, parent = fx) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};

/* Sigue una ruta SVG (varios tramos) devolviendo fotogramas para Web Animations.
   segs: [{d, share, r(f,t,ang)}]  ·  tf(punto, grados) -> texto transform */
function ruta(segs, tf) {
  const kf = []; let c = 0;
  for (const s of segs) {
    const p = S('path', { d: s.d, opacity: 0 });
    const L = p.getTotalLength(), n = Math.max(4, Math.ceil(L / 5));
    for (let i = kf.length ? 1 : 0; i <= n; i++) {
      const l = L * i / n, q = p.getPointAtLength(l), q2 = p.getPointAtLength(Math.min(L, l + 4));
      const ang = Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI, f = i / n;
      kf.push({ transform: tf(q, s.r ? s.r(f, c + s.share * f, ang) : 0), offset: c + s.share * f });
    }
    p.remove(); c += s.share;
  }
  kf[kf.length - 1].offset = 1;
  return kf;
}

/* ---------- Zoom y arrastre (táctil, ratón y rueda) ---------- */
let z = 1, px = 0, py = 0, fit = 1;
function aplicar() {
  const k = fit * z, vw = innerWidth, vh = innerHeight, w = W * k, h = H * k;
  px = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, px));
  py = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, py));
  esc.style.transform = `translate(${px}px,${py}px) scale(${k})`;
}
function ajustar() { fit = Math.min(innerWidth / W, innerHeight / H); aplicar(); }
function zoomEn(cx, cy, nz) {
  nz = Math.min(5, Math.max(1, nz));
  const k0 = fit * z, k1 = fit * nz;
  px = cx - (cx - px) * k1 / k0; py = cy - (cy - py) * k1 / k0; z = nz; aplicar();
}
addEventListener('resize', ajustar);

const pts = new Map(); let tap = null, pinch = null;
vista.addEventListener('pointerdown', e => {
  vista.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 1) tap = { x: e.clientX, y: e.clientY, t: e.target, m: false };
  else { tap = null; const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z }; }
});
vista.addEventListener('pointermove', e => {
  const p = pts.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pts.size === 2 && pinch) {
    const [a, b] = [...pts.values()];
    zoomEn((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
  } else if (pts.size === 1) {
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 14) tap.m = true;
    if (!tap || tap.m) { px += dx; py += dy; aplicar(); }
  }
});
const fin = e => {
  if (!pts.has(e.pointerId)) return;
  pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
  if (tap && !tap.m && e.type === 'pointerup') {
    const a = tap.t.dataset && tap.t.dataset.act;
    if (a && acciones[a]) acciones[a]();
  }
  tap = null;
};
vista.addEventListener('pointerup', fin);
vista.addEventListener('pointercancel', fin);
vista.addEventListener('wheel', e => { e.preventDefault(); zoomEn(e.clientX, e.clientY, z * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
$('#mas').onclick = () => zoomEn(innerWidth / 2, innerHeight / 2, z * 1.5);
$('#menos').onclick = () => zoomEn(innerWidth / 2, innerHeight / 2, z / 1.5);
$('#reset').onclick = () => { z = 1; px = py = 0; aplicar(); };

/* ---------- Poema (dos columnas) ---------- */
const POEMA = [
  ['No digáis que agotado su tesoro,', 'de asuntos falta, enmudeció la lira;', 'podrá no haber poetas; pero siempre', 'habrá poesía.'],
  ['Mientras las ondas de la luz al beso', 'palpiten encendidas;', 'mientras el sol las desgarradas nubes', 'de fuego y oro vista;'],
  ['mientras el aire en su regazo lleve', 'perfumes y armonías;', 'mientras haya en el mundo primavera,', '¡habrá poesía!'],
  ['Mientras la ciencia a descubrir no alcance', 'las fuentes de la vida,', 'y en el mar o en el cielo haya un abismo', 'que al cálculo resista;'],
  ['mientras la humanidad, siempre avanzando', 'no sepa a do camina;', 'mientras haya un misterio para el hombre,', '¡habrá poesía!'],
  ['Mientras sintamos que se alegra el alma,', 'sin que los labios rían;', 'mientras se llore sin que el llanto acuda', 'a nublar la pupila;'],
  ['mientras el corazón y la cabeza', 'batallando prosigan;', 'mientras haya esperanzas y recuerdos,', '¡habrá poesía!'],
  ['Mientras haya unos ojos que reflejen', 'los ojos que los miran;', 'mientras responda el labio suspirando', 'al labio que suspira;'],
  ['mientras sentirse puedan en un beso', 'dos almas confundidas;', 'mientras exista una mujer hermosa', '¡habrá poesía!']
];
let nVerso = 0;
$('#versos').innerHTML = POEMA.map(e =>
  '<p>' + e.map((v, i) => `<span class="${i % 2 ? 'sg' : ''}"><i class="n">${++nVerso}</i>${v}</span>`).join('') + '</p>').join('');
const poema = $('#poema');
const abrirPoema = () => { ocultarPista(); poema.classList.add('abierto'); poema.setAttribute('aria-hidden', 'false'); };
const cerrarPoema = () => { poema.classList.remove('abierto'); poema.setAttribute('aria-hidden', 'true'); };
$('#cerrar').onclick = cerrarPoema;
poema.addEventListener('click', e => { if (e.target === poema) cerrarPoema(); });
addEventListener('keydown', e => { if (e.key === 'Escape') cerrarPoema(); });

/* ---------- 1. NUBE: tormenta con rayos hacia las figuras de cuerda ---------- */
const nubeEl = $('#nube'), cuerdaEl = $('#cuerda'), luces = document.querySelectorAll('.luz');
const ORIGEN = [[930, 170], [850, 235], [800, 110], [1040, 250], [760, 200]];
const DESTINO = [[110, 625], [265, 695], [395, 715], [515, 660], [60, 780]];
function rayo() {
  const a = pick(ORIGEN), b = pick(DESTINO), g = S('g');
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = 11;
  let d = `M${a[0]} ${a[1]}`, mid = null;
  for (let i = 1; i < n; i++) {
    const t = i / n, o = rnd(-32, 32), x = a[0] + dx * t + nx * o, y = a[1] + dy * t + ny * o;
    if (i === 5) mid = [x, y];
    d += `L${x} ${y}`;
  }
  d += `L${b[0]} ${b[1]}`;
  const rama = `M${mid[0]} ${mid[1]}l${rnd(30, 70) * pick([-1, 1])} ${rnd(40, 80)}l${rnd(-20, 20)} ${rnd(30, 60)}`;
  for (const dd of [d, rama]) {
    S('path', { d: dd, fill: 'none', stroke: '#7db8ff', 'stroke-width': 17, 'stroke-linejoin': 'round', opacity: .75, filter: 'url(#brillo)' }, g);
    S('path', { d: dd, fill: 'none', stroke: '#fff', 'stroke-width': dd === d ? 4.5 : 2.5, 'stroke-linejoin': 'round' }, g);
  }
  g.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: .25 }, { opacity: 1 }, { opacity: 0 }], { duration: 520 }).finished.then(() => g.remove());
  destello.animate([{ opacity: 0 }, { opacity: .6 }, { opacity: .05 }, { opacity: .4 }, { opacity: 0 }], { duration: 650 });
  cuerdaEl.animate([{ filter: 'none' }, { filter: 'brightness(1.7) drop-shadow(0 0 8px #9fcbff) drop-shadow(0 0 22px #5aa0ff)' }, { filter: 'none' }], { duration: 620 });
  nubeEl.animate([{ filter: 'none' }, { filter: 'brightness(1.35) contrast(1.05)' }, { filter: 'none' }], { duration: 600 });
  luces.forEach(l => l.animate([{ opacity: 0 }, { opacity: rnd(.65, 1) }, { opacity: .15 }, { opacity: rnd(.7, 1) }, { opacity: 0 }], { duration: rnd(520, 900), delay: rnd(0, 220) }));
}
async function nube() {
  for (let i = 0; i < 5; i++) { rayo(); if (Math.random() < .5) setTimeout(rayo, 170); await sleep(rnd(480, 850)); }
}

/* ---------- 2. PLUMA: escribe con tinta de verdad ---------- */
async function pluma() {
  const P = $('#pluma'), NX = 1165.5, NY = 709, OX = 1009.5, OY = 373;
  const pts = [];
  for (let t = 0; t <= 6 * Math.PI; t += .12)
    pts.push([780 + 9 * t - 17 * Math.sin(t), 540 - 18 * Math.cos(t) * (1 + .35 * Math.sin(t * .4))]);
  const [sx, sy] = pts[0];
  const dTinta = 'M' + pts.map(p => p.join(' ')).join('L') + 'C985 575 880 590 785 596';
  const segs = [
    { d: `M${NX} ${NY}C1100 640 880 480 ${sx} ${sy}`, share: .17, r: f => -5 * f },
    { d: dTinta, share: .66, r: (f, t) => -5 + Math.sin(t * 95) * 3.5 },
    { d: `M785 596C900 640 1100 600 ${NX} ${NY}`, share: .17, r: f => -5 * (1 - f) }
  ];
  const T = 6400;
  const brillo = S('path', { d: dTinta, fill: 'none', stroke: '#f3e7cf', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .3, filter: 'url(#brillo)' });
  const tinta = S('path', { d: dTinta, fill: 'none', stroke: '#f3e7cf', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const L = tinta.getTotalLength();
  const secar = [{ strokeDashoffset: L, offset: 0 }, { strokeDashoffset: L, offset: .17 }, { strokeDashoffset: 0, offset: .83 }, { strokeDashoffset: 0, offset: 1 }];
  [tinta, brillo].forEach(e => { e.style.strokeDasharray = L; e.animate(secar, { duration: T, easing: 'linear', fill: 'forwards' }); });
  P.style.transformOrigin = `${NX - OX}px ${NY - OY}px`;
  const kf = ruta(segs, (q, r) => `translate(${q.x - NX}px,${q.y - NY}px) rotate(${r}deg)`);
  await P.animate(kf, { duration: T, easing: 'linear' }).finished;
  await sleep(1400);
  await Promise.all([tinta, brillo].map(e => e.animate([{ opacity: e === brillo ? .3 : 1 }, { opacity: 0 }], { duration: 1400, fill: 'forwards' }).finished));
  tinta.remove(); brillo.remove();
}

/* ---------- 3. ROSAS: viento, pétalos y una abeja ---------- */
const BEE = `
  <ellipse class="ala" cx="-3" cy="-9" rx="6" ry="11" fill="#fff" opacity=".75" transform="rotate(-20 -3 -9)" style="transform-box:fill-box;transform-origin:50% 100%"/>
  <ellipse class="ala" cx="4" cy="-9" rx="6" ry="11" fill="#fff" opacity=".75" transform="rotate(15 4 -9)" style="transform-box:fill-box;transform-origin:50% 100%"/>
  <ellipse cx="0" cy="0" rx="13" ry="8.5" fill="#f5b81b"/>
  <path d="M-4 -8v16M3 -8.4v16.8" stroke="#1a1209" stroke-width="3.6"/>
  <circle cx="13" cy="0" r="5.2" fill="#1a1209"/>
  <path d="M-13 0l-6 0" stroke="#1a1209" stroke-width="2.4" stroke-linecap="round"/>`;
async function abeja() {
  const g = S('g'); g.innerHTML = BEE;
  const alas = [...g.querySelectorAll('.ala')].map(a => a.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.2)' }], { duration: 55, iterations: Infinity, direction: 'alternate' }));
  let hold = 'M774 842'; for (let i = 0; i < 16; i++) hold += `L${774 + rnd(-3, 3)} ${842 + rnd(-2, 2)}`;
  const segs = [
    { d: 'M-80 650C150 700 520 690 774 842', share: .38, r: (f, t, a) => a * .55 },
    { d: hold, share: .36, r: () => 8 },
    { d: 'M774 842C880 720 1050 580 1300 500', share: .26, r: (f, t, a) => a * .55 }
  ];
  const kf = ruta(segs, (q, r) => `translate(${q.x}px,${q.y}px) rotate(${r}deg) scale(2.1)`);
  await g.animate(kf, { duration: 5600, easing: 'linear' }).finished;
  alas.forEach(a => a.cancel()); g.remove();
}
function petalos() {
  for (let i = 0; i < 7; i++) {
    const p = S('path', { d: 'M0 0C8-11 24-9 26 3C21 16 6 15 0 0Z', fill: pick(['#b3101f', '#c4182b', '#8f0b17']) });
    p.style.transformBox = 'fill-box'; p.style.transformOrigin = 'center';
    const x = rnd(700, 1150), y = rnd(640, 820), x2 = x + rnd(-120, 120), y2 = Math.min(945, y + rnd(110, 260));
    p.animate([
      { transform: `translate(${x}px,${y}px) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x + x2) / 2 + rnd(-50, 50)}px,${(y + y2) / 2}px) rotate(${rnd(90, 200)}deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${x2}px,${y2}px) rotate(${rnd(240, 420)}deg)`, opacity: 0 }
    ], { duration: rnd(2600, 4200), delay: rnd(0, 1800), easing: 'ease-in-out', fill: 'both' }).finished.then(() => p.remove());
  }
}
async function rosas() {
  const R = $('#rosas'); R.style.transformOrigin = '2% 76%';
  const v = R.animate([
    { transform: 'rotate(0) translateX(0)' }, { transform: 'rotate(-3.4deg) translateX(-7px)' },
    { transform: 'rotate(2.2deg) translateX(4px)' }, { transform: 'rotate(-2.8deg) translateX(-6px)' },
    { transform: 'rotate(1.6deg) translateX(3px)' }, { transform: 'rotate(-.8deg)' }, { transform: 'rotate(0)' }
  ], { duration: 5600, easing: 'ease-in-out' });
  petalos();
  await Promise.all([v.finished, abeja()]);
}

/* ---------- 4. COFRE: se abre por abajo y cae la paja ---------- */
function paja() {
  for (let i = 0; i < 38; i++) {
    const r = S('rect', { width: rnd(14, 32), height: rnd(1.6, 3.2), fill: pick(['#d2b565', '#b99a47', '#e0c97f', '#a8873a']) });
    r.style.transformBox = 'fill-box'; r.style.transformOrigin = 'center';
    const x = rnd(30, 300), y = rnd(432, 448), x2 = x + rnd(-45, 45), y2 = rnd(880, 945);
    r.animate([
      { transform: `translate(${x}px,${y}px) rotate(${rnd(-60, 60)}deg)`, opacity: 0 },
      { transform: `translate(${x}px,${y}px) rotate(${rnd(-60, 60)}deg)`, opacity: 1, offset: .08 },
      { transform: `translate(${x2}px,${y2}px) rotate(${rnd(-90, 90)}deg)`, opacity: 1 }
    ], { duration: rnd(750, 1150), delay: i * 55, easing: 'cubic-bezier(.45,0,1,1)', fill: 'forwards' });
    setTimeout(() => r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }).finished.then(() => r.remove()), 3800);
  }
}
async function cofre() {
  const A = $('#cofre2'); A.style.transformOrigin = '0% 62%';
  const a1 = A.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(26deg)' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
  await a1.finished; paja(); await sleep(3000);
  const a2 = A.animate([{ transform: 'rotate(26deg)' }, { transform: 'rotate(0)' }], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
  await a2.finished; a1.cancel(); a2.cancel();
}

/* ---------- 5. CONCHAS: llega una ola y arrastra conchas ---------- */
const CONCHA = 'M0 0C-15-5-24-19-19-32Q0-43 19-32C24-19 15-5 0 0ZM0 0L-12-30M0 0L0-36M0 0L12-30';
async function conchas() {
  const C = $('#conchas'), T = 5200;
  const FR = 'C350 10 300 50 335 80S300 150 335 180S300 250 335 280S300 350 335 380S300 450 335 480S300 550 335 580S300 650 335 680S300 750 335 780S300 850 335 880S300 950 335 980S350 1010 330 1030';
  const clip = S('g', { 'clip-path': 'url(#recorte)' });
  const mk = (dy, fill, op) => {
    const o = S('g', {}, clip);
    S('path', { d: `M-500 -20H320${FR}H-500Z`, fill, opacity: op }, o);
    S('path', { d: `M320 -20${FR}`, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .9 }, o);
    return o;
  };
  const olas = [mk(0, 'url(#agua)', .55)];
  const ease = 'cubic-bezier(.2,.7,.2,1)';
  const kfOla = [
    { transform: 'translateX(-860px)', offset: 0, easing: ease }, { transform: 'translateX(0)', offset: .36 },
    { transform: 'translateX(16px)', offset: .5 }, { transform: 'translateX(0)', offset: .62, easing: 'ease-in' },
    { transform: 'translateX(-860px)', offset: 1 }
  ];
  olas.forEach(o => o.animate(kfOla, { duration: T, easing: 'linear' }));
  C.animate([
    { transform: 'translate(0,0) rotate(0)', offset: 0, easing: ease }, { transform: 'translate(60px,-8px) rotate(4deg)', offset: .36 },
    { transform: 'translate(66px,-6px) rotate(5deg)', offset: .62, easing: 'ease-in-out' }, { transform: 'translate(0,0) rotate(0)', offset: 1 }
  ], { duration: T, easing: 'linear' });
  const sprites = [];
  for (let i = 0; i < 10; i++) {
    const quedan = i < 4, s = rnd(.65, 1.15), y = rnd(15, 280);
    const x = quedan ? rnd(110, 300) : rnd(60, 290), rot = rnd(-70, 70);
    const e = S('path', { d: CONCHA, fill: pick(['#f3d9c6', '#e9bda3', '#f7eee0', '#d9a483']), stroke: '#8a5a44', 'stroke-width': 1.3, 'stroke-linejoin': 'round' });
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    const t = (X, Y, R) => `translate(${X}px,${Y}px) rotate(${R}deg) scale(${s})`;
    const kf = [
      { transform: t(-120, y, rot - 90), offset: 0, easing: ease }, { transform: t(x, y + rnd(-8, 8), rot), offset: .36 },
      { transform: t(x + rnd(6, 22), y, rot + 8), offset: .62, easing: 'ease-in' },
      { transform: quedan ? t(x + 6, y, rot + 8) : t(-120, y, rot - 60), offset: quedan ? .75 : 1 }
    ];
    if (quedan) kf.push({ transform: t(x + 6, y, rot + 8), offset: 1 });
    e.animate(kf, { duration: T, easing: 'linear', fill: 'forwards' });
    if (quedan) sprites.push(e); else setTimeout(() => e.remove(), T + 50);
  }
  await sleep(T + 1500);
  await Promise.all(sprites.map(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' }).finished));
  sprites.forEach(e => e.remove()); clip.remove();
}

/* ---------- 6. FAMILIA: la cuerda baila y los pies se quedan quietos sobre la paja ----------
   Se redibuja la imagen de la cuerda en un canvas, tira a tira (franjas verticales de 2 px).
   Cada franja se inclina y se estira según su altura: 0 en los pies (y por debajo, donde está
   la paja) y máximo en la cabeza. Así el cuerpo se balancea y salta sin despegarse del suelo. */
const FAM = { pad: 80, ancho: 3, T: 10000, entra: 900, sale: 1300, tempo: 1.15 };
const FAM_Y = [0, 170, 330, 470];          // alturas (px de la imagen) donde cambia el movimiento
const FAM_E = [1.45, 1, .38, 0];                // cuánto se balancea cada altura (la cabeza va por delante)
const FAM_G = [1, .72, .3, 0];                  // cuánto salta cada altura
const FAM_C = [200, 540, 790, 1040];            // centro (x) de cada figura: adulto, niño, niño, adulto
const FAM_A = [30, 40, 40, 32];                 // balanceo de cada figura (px en la cabeza)
const FAM_F = [0, 2.9, .5, 3.4];                // fase del balanceo
const FAM_R = [12, 16, 16, 12];                 // salto de cada figura
const FAM_Q = [0, 1.2, 2.2, .7];                // fase del salto
let famCv = null, famCtx = null, famSrc = null;

function famPreparar() {
  if (famCv) return;
  const P = FAM.pad, iw = cuerdaEl.naturalWidth, ih = cuerdaEl.naturalHeight;
  const k = parseFloat(cuerdaEl.style.width) / iw;          // px de escena por px de imagen
  famCv = document.createElement('canvas');
  famCv.width = iw + 2 * P; famCv.height = ih + P;           // margen para que quepa el balanceo
  famCv.className = 'obj'; famCv.dataset.act = 'familia';
  Object.assign(famCv.style, {
    left: (parseFloat(cuerdaEl.style.left) - P * k) + 'px', top: (parseFloat(cuerdaEl.style.top) - P * k) + 'px',
    width: famCv.width * k + 'px', height: famCv.height * k + 'px', zIndex: 2, display: 'none'
  });
  cuerdaEl.after(famCv);
  famCtx = famCv.getContext('2d', { alpha: true });
  famSrc = document.createElement('canvas'); famSrc.width = iw; famSrc.height = ih;   // copia ya decodificada de la cuerda
  famSrc.getContext('2d').drawImage(cuerdaEl, 0, 0);
}
function famMezcla(x, v) {                                   // valor en x, suavizado entre figuras vecinas
  if (x <= FAM_C[0]) return v[0];
  for (let i = 0; i < 3; i++) if (x <= FAM_C[i + 1]) {
    const t = (x - FAM_C[i]) / (FAM_C[i + 1] - FAM_C[i]), s = t * t * (3 - 2 * t);
    return v[i] * (1 - s) + v[i + 1] * s;
  }
  return v[3];
}
function famDibujar(t, env) {
  const c = famCtx, P = FAM.pad, iw = cuerdaEl.naturalWidth, ih = cuerdaEl.naturalHeight, w = FAM.ancho;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, famCv.width, famCv.height);
  if (env <= 0) { c.drawImage(famSrc, P, P); return; }
  const om = 2 * Math.PI / FAM.tempo;
  const bal = FAM_A.map((a, i) => a * Math.sin(om * t + FAM_F[i]));
  const sal = FAM_R.map((r, i) => r * (.5 + .5 * Math.sin(2 * om * t + FAM_Q[i])));
  for (let x = 0; x < iw; x += w) {
    const xs = x + w / 2;
    const A = famMezcla(xs, bal) * env;                                        // hacia los lados
    const sw = Math.min(w + 1.2 + Math.max(0, famMezcla(xs + w, bal) * env - A) * 1.6, iw - x);  // solape: tapa la rendija si la franja vecina se separa
    const B = -(famMezcla(xs, sal) + 9 * Math.sin(xs * .021 - 2.6 * t)) * env; // arriba/abajo (+ ola en los brazos)
    for (let k = 0; k < 3; k++) {
      const y0 = FAM_Y[k], y1 = FAM_Y[k + 1], me = (FAM_E[k + 1] - FAM_E[k]) / (y1 - y0), mg = (FAM_G[k + 1] - FAM_G[k]) / (y1 - y0);
      c.setTransform(1, 0, A * me, 1 + B * mg, A * (FAM_E[k] - me * y0) + P, B * (FAM_G[k] - mg * y0) + P);
      c.drawImage(famSrc, x, y0, sw, y1 - y0 + 1, x, y0, sw, y1 - y0 + 1);
    }
  }
  c.setTransform(1, 0, 0, 1, P, P);                                            // pies y paja: fijos
  c.drawImage(famSrc, 0, 470, iw, ih - 470, 0, 470, iw, ih - 470);
}
async function familia() {
  if (!cuerdaEl.complete) await cuerdaEl.decode().catch(() => {});
  famPreparar();
  famCv.style.display = ''; cuerdaEl.style.visibility = 'hidden';
  const s = x => x * x * (3 - 2 * x), t0 = performance.now();
  let previo = t0, media = 16;
  await new Promise(fin => {
    const paso = ahora => {
      const ms = Math.max(0, ahora - t0), fi = FAM.entra, fo = FAM.sale;
      media = media * .9 + (ahora - previo) * .1; previo = ahora;
      if (media > 30 && FAM.ancho < 8) { FAM.ancho += 1; media = 16; }   // equipo justo: franjas más anchas = menos trabajo
      const env = ms >= FAM.T ? 0 : Math.min(s(Math.min(1, ms / fi)), s(Math.min(1, (FAM.T - ms) / fo)));
      famDibujar(ms / 1000, env);
      if (ms >= FAM.T) fin(); else requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
  cuerdaEl.style.visibility = ''; famCv.style.display = 'none';
}

/* ---------- 7. INTERRUPTOR: luces LED entre las nubes (aparte de los rayos) ----------
   Al activarlo, las luces se van encendiendo de izquierda a derecha, titilan suavemente y la nube
   se atenúa un poco para que brillen más. Al volver a pulsarlo se apagan. */
const LEDS = [[751,94],[770,30],[809,138],[832,61],[839,204],[884,31],[888,121],[915,190],[943,53],[947,137],[992,208],[997,90],[1027,264],[1027,21],[1042,133],[1069,76],[1069,188],[1087,282],[1105,23],[1134,222],[1143,159],[1146,74],[1188,318],[1193,31],[1194,117],[1201,238],[1208,176]];
const LED_COL = [[255,214,140],[255,160,200],[255,214,140],[150,215,255],[255,184,90],[255,214,140],[255,160,200],[150,215,255]];
const interr = $('#interruptor');
let ledsOn = false, ledsCont = null; const ledAnims = [];
function ledsCrear() {
  ledsCont = document.createElement('div'); ledsCont.id = 'leds';
  esc.insertBefore(ledsCont, $('#fx'));                                  // por debajo de los rayos
  LEDS.forEach(([x, y], i) => {
    const [r, g, b] = LED_COL[i % LED_COL.length];
    const w = document.createElement('div'); w.className = 'led';
    w.style.cssText = `left:${x}px;top:${y}px;--c:rgb(${r},${g},${b});--h:rgba(${r},${g},${b},.6)`;
    const p = document.createElement('i'); w.appendChild(p); ledsCont.appendChild(w);
    ledAnims.push(p.animate([
      { opacity: .65, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1.12)' }, { opacity: .7, transform: 'scale(.9)' },
      { opacity: 1, transform: 'scale(1.05)' }, { opacity: .6, transform: 'scale(.85)' }
    ], { duration: rnd(2200, 4200), delay: -rnd(0, 3000), iterations: Infinity, easing: 'ease-in-out' }));
  });
}
function leds() {
  if (!ledsCont) ledsCrear();
  ledsOn = !ledsOn; ocultarPista();
  interr.classList.toggle('on', ledsOn); interr.setAttribute('aria-checked', String(ledsOn));
  [...ledsCont.children].forEach((w, i) => {
    w.style.transitionDelay = (ledsOn ? i * 70 : i * 25) + 'ms';
    w.classList.toggle('on', ledsOn);
  });
  nubeEl.style.filter = ledsOn ? 'brightness(.6) saturate(1.15)' : '';
  ledAnims.forEach(a => { if (ledsOn) a.play(); else setTimeout(() => { if (!ledsOn) a.pause(); }, 1600); });
}
interr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); leds(); } });

/* ---------- Pantalla completa (botón y tecla F) ---------- */
const btnPant = $('#pantalla'), raiz = document.documentElement;
const pedirPantalla = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
const salirPantalla = document.exitFullscreen || document.webkitExitFullscreen;
const enPantalla = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
if (!pedirPantalla) btnPant.style.display = 'none';          // p. ej. iPhone: no permite pantalla completa
function alternarPantalla() {
  if (!pedirPantalla) return;
  const r = enPantalla() ? salirPantalla.call(document) : pedirPantalla.call(raiz);
  if (r && r.catch) r.catch(() => {});
}
function marcarPantalla() {
  btnPant.classList.toggle('activa', enPantalla());
  btnPant.setAttribute('aria-label', enPantalla() ? 'Salir de pantalla completa' : 'Pantalla completa');
}
btnPant.onclick = alternarPantalla;
document.addEventListener('fullscreenchange', marcarPantalla);
document.addEventListener('webkitfullscreenchange', marcarPantalla);
addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) alternarPantalla(); });

/* ---------- Acciones y arranque ---------- */
const ocupado = new Set();
const una = (n, f) => async () => {
  if (ocupado.has(n)) return;
  ocupado.add(n); ocultarPista();
  try { await f(); } finally { ocupado.delete(n); }
};
const acciones = { nube: una('nube', nube), familia: una('familia', familia), interruptor: leds, pluma: una('pluma', pluma), rosas: una('rosas', rosas), cofre: una('cofre', cofre), conchas: una('conchas', conchas), papel: abrirPoema };
function ocultarPista() { $('#pista').classList.add('oculta'); }
setTimeout(ocultarPista, 9000);
ajustar();
})();
