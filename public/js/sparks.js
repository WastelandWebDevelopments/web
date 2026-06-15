const canvas = document.getElementById('sparks');
const ctx    = canvas.getContext('2d');

let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

function rand(min, max) { return Math.random() * (max - min) + min; }

const COLORS = [
  '#ff6a00','#ff8c00','#ffaa33',
  '#cc3300','#ff4500','#ffcc44',
  '#ff3300','#e85000',
];

// ── Background sparks ──────────────────────────────────────────────────────

class Spark {
  constructor(scatter) { this.init(scatter); }
  init(scatter) {
    this.x     = rand(0, W);
    this.y     = scatter ? rand(0, H) : H + rand(0, 20);
    this.vx    = rand(-0.5, 0.5);
    this.vy    = rand(-1.4, -0.3);
    this.size  = rand(0.6, 2.2);
    this.alpha = rand(0.4, 1.0);
    this.decay = rand(0.003, 0.010);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  update() {
    this.x    += this.vx + rand(-0.08, 0.08);
    this.y    += this.vy;
    this.vy   -= 0.008;
    this.alpha -= this.decay;
    if (this.alpha <= 0 || this.y < -10) this.init(false);
  }
}

const sparks = Array.from({ length: 80 }, (_, i) => new Spark(true));

// ── Title embers ───────────────────────────────────────────────────────────

class TitleEmber {
  constructor() { this.init(); }
  init() {
    const el = document.querySelector('.site-title');
    if (!el) { this.active = false; return; }
    const r    = el.getBoundingClientRect();
    this.x     = rand(r.left + r.width * 0.05, r.right - r.width * 0.05);
    this.y     = rand(r.top + r.height * 0.2, r.bottom);
    this.vx    = rand(-0.8, 0.8);
    this.vy    = rand(-2.0, -0.5);
    this.size  = rand(0.8, 2.6);
    this.alpha = rand(0.7, 1.0);
    this.decay = rand(0.008, 0.020);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.active = true;
  }
  update() {
    if (!this.active) return;
    this.x    += this.vx + rand(-0.1, 0.1);
    this.y    += this.vy;
    this.vy   -= 0.012;
    this.alpha -= this.decay;
    if (this.alpha <= 0) this.init();
  }
}

const titleEmbers = Array.from({ length: 25 }, () => new TitleEmber());

// ── Smoke ─────────────────────────────────────────────────────────────────

class Smoke {
  constructor() { this.init(); }
  init() {
    const el = document.querySelector('.site-title');
    if (!el) { this.active = false; return; }
    const r     = el.getBoundingClientRect();
    this.x      = rand(r.left + r.width * 0.05, r.right - r.width * 0.05);
    this.y      = rand(r.top - 4, r.top + r.height * 0.5);
    this.vx     = rand(-0.4, 0.4);
    this.vy     = rand(-0.7, -0.2);
    this.radius = rand(14, 34);
    this.grow   = rand(0.14, 0.35);
    this.warm   = rand(0, 1) > 0.4;
    this.alpha  = rand(0.28, 0.55);
    this.decay  = rand(0.002, 0.006);
    this.gray   = Math.floor(rand(50, 100));
    this.active = true;
  }
  update() {
    if (!this.active) return;
    this.x      += this.vx;
    this.y      += this.vy;
    this.vx     += rand(-0.015, 0.015);
    this.radius += this.grow;
    this.alpha  -= this.decay;
    if (this.alpha <= 0) this.init();
  }
}

const smoke = Array.from({ length: 32 }, () => new Smoke());

// ── Loop ───────────────────────────────────────────────────────────────────

function loop() {
  ctx.clearRect(0, 0, W, H);

  // smoke
  ctx.shadowBlur = 0;
  for (const s of smoke) {
    s.update();
    if (!s.active || s.alpha <= 0) continue;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
    const c = s.gray;
    // warm smoke near source (brownish), neutral gray further out
    const r = s.warm ? c + 18 : c;
    const b = s.warm ? Math.max(0, c - 22) : c - 14;
    g.addColorStop(0, `rgba(${r},${c-4},${b},${s.alpha})`);
    g.addColorStop(1, `rgba(${r},${c-4},${b},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle   = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // sparks
  ctx.shadowBlur = 7;
  for (const s of sparks) {
    s.update();
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.fillStyle   = s.color;
    ctx.shadowColor = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // title embers
  ctx.shadowBlur = 9;
  for (const e of titleEmbers) {
    e.update();
    if (!e.active) continue;
    ctx.globalAlpha = Math.max(0, e.alpha);
    ctx.fillStyle   = e.color;
    ctx.shadowColor = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
