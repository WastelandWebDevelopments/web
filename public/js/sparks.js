const canvas = document.getElementById('sparks');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const COLORS = [
  '#ff6a00', '#ff8c00', '#ffaa33',
  '#cc3300', '#ff4500', '#ffcc44',
  '#ff3300', '#e85000',
];

const COUNT = 160;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Spark {
  constructor(scatter) {
    this.init(scatter);
  }

  init(scatter) {
    this.x     = rand(0, canvas.width);
    this.y     = scatter ? rand(0, canvas.height) : canvas.height + rand(0, 20);
    this.vx    = rand(-0.5, 0.5);
    this.vy    = rand(-1.4, -0.3);
    this.size  = rand(0.6, 2.4);
    this.alpha = rand(0.4, 1.0);
    this.decay = rand(0.003, 0.010);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  update() {
    this.x     += this.vx + rand(-0.08, 0.08);
    this.y     += this.vy;
    this.vy    -= 0.008;
    this.alpha -= this.decay;

    if (this.alpha <= 0 || this.y < -10) {
      this.init(false);
    }
  }
}

const sparks = Array.from({ length: COUNT }, () => new Spark(true));

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.shadowBlur = 7;

  for (const s of sparks) {
    s.update();
    ctx.globalAlpha  = Math.max(0, s.alpha);
    ctx.fillStyle    = s.color;
    ctx.shadowColor  = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;

  requestAnimationFrame(loop);
}

loop();
