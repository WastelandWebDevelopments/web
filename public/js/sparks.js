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
    this.size  = rand(0.8, 2.2);
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
  draw() {
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const sparks = Array.from({ length: 50 }, (_, i) => new Spark(true));

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
    this.size  = rand(0.8, 2.4);
    this.alpha = rand(0.7, 1.0);
    this.decay = rand(0.010, 0.022);
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
  draw() {
    if (!this.active) return;
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const titleEmbers = Array.from({ length: 15 }, () => new TitleEmber());

// ── Smoke ─────────────────────────────────────────────────────────────────

class Smoke {
  constructor() { this.init(); }
  init() {
    const el = document.querySelector('.site-title');
    if (!el) { this.active = false; return; }
    const r     = el.getBoundingClientRect();
    this.x      = rand(r.left + r.width * 0.08, r.right - r.width * 0.08);
    this.y      = rand(r.top, r.top + r.height * 0.4);
    this.vx     = rand(-0.3, 0.3);
    this.vy     = rand(-0.5, -0.15);
    this.radius = rand(10, 22);
    this.grow   = rand(0.08, 0.20);
    this.alpha  = rand(0.10, 0.28);
    this.decay  = rand(0.001, 0.004);
    this.warm   = Math.random() > 0.4;
    this.gray   = Math.floor(rand(50, 95));
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
  draw() {
    if (!this.active || this.alpha <= 0) return;
    const c = this.gray;
    const r = this.warm ? c + 18 : c;
    const b = this.warm ? Math.max(0, c - 22) : c - 14;
    // Simple alpha circle — no gradient per frame (perf)
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = `rgb(${r},${c - 4},${b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

const smoke = Array.from({ length: 15 }, () => new Smoke());

// ── 30fps throttle ────────────────────────────────────────────────────────

const FRAME_MS = 1000 / 30;
let lastFrame  = 0;

function loop(ts) {
  requestAnimationFrame(loop);
  if (ts - lastFrame < FRAME_MS) return;
  lastFrame = ts;

  ctx.clearRect(0, 0, W, H);

  // smoke — no shadowBlur
  ctx.shadowBlur = 0;
  for (const s of smoke) { s.update(); s.draw(); }

  // sparks — no shadowBlur, just colored dots
  for (const s of sparks) { s.update(); s.draw(); }

  // title embers
  for (const e of titleEmbers) { e.update(); e.draw(); }

  ctx.globalAlpha = 1;
}

requestAnimationFrame(loop);
