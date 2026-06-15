// ── Audio ──────────────────────────────────────────────────────────────────

let ac = null;

function getAC() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function playClick() {
  const ctx = getAC();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.48, now);
  master.connect(ctx.destination);

  // Long noise buffer — the raw material for all resonances
  const bufLen  = Math.floor(ctx.sampleRate * 1.0);
  const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const nd       = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;

  // Resonant peaks — inharmonic, slightly randomised each hit
  // High Q = long ringing tail. Low freqs ring longer, high freqs die fast.
  const modes = [
    { f: 760  + (Math.random() - 0.5) * 40,  Q: 160, amp: 1.00, decay: 0.70 },
    { f: 1140 + (Math.random() - 0.5) * 60,  Q: 110, amp: 0.80, decay: 0.50 },
    { f: 1830 + (Math.random() - 0.5) * 90,  Q: 75,  amp: 0.60, decay: 0.34 },
    { f: 2570 + (Math.random() - 0.5) * 120, Q: 50,  amp: 0.40, decay: 0.22 },
    { f: 3480 + (Math.random() - 0.5) * 150, Q: 32,  amp: 0.25, decay: 0.14 },
    { f: 4620 + (Math.random() - 0.5) * 200, Q: 20,  amp: 0.14, decay: 0.08 },
  ];

  for (const m of modes) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const bpf = ctx.createBiquadFilter();
    bpf.type  = 'bandpass';
    bpf.frequency.value = m.f;
    bpf.Q.value = m.Q;

    const g = ctx.createGain();
    g.gain.setValueAtTime(m.amp * 0.28, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + m.decay);

    src.connect(bpf); bpf.connect(g); g.connect(master);
    src.start(now);
    src.stop(now + m.decay + 0.05);
  }

  // Broadband impact transient — the actual collision moment
  const impLen = Math.floor(ctx.sampleRate * 0.018);
  const impBuf = ctx.createBuffer(1, impLen, ctx.sampleRate);
  const id     = impBuf.getChannelData(0);
  for (let i = 0; i < impLen; i++) {
    id[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impLen, 0.4);
  }
  const imp = ctx.createBufferSource();
  imp.buffer = impBuf;
  const ig   = ctx.createGain();
  ig.gain.setValueAtTime(1.4, now);
  ig.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
  imp.connect(ig); ig.connect(master);
  imp.start(now);
}

// Wire sound to all interactive nav elements
document.querySelectorAll('.dropdown li a, .btn-cta').forEach(el => {
  el.addEventListener('click', playClick);
});

// ── Mobile nav ─────────────────────────────────────────────────────────────

const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');
const navCta    = document.querySelector('.nav-cta');

navToggle.addEventListener('click', () => {
  const open = navToggle.classList.toggle('is-open');
  navLinks.classList.toggle('is-open', open);
  navCta.classList.toggle('is-open', open);
  playClick();
});

// Accordion dropdowns on mobile
document.querySelectorAll('.nav-item.has-dropdown > a').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      const item = link.closest('.nav-item');
      const wasOpen = item.classList.contains('is-open');
      // close all siblings first
      document.querySelectorAll('.nav-item.has-dropdown').forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) {
        item.classList.add('is-open');
        playClick();
      }
    }
  });
});

// Close menu when a dropdown link is tapped on mobile
document.querySelectorAll('.dropdown li a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 1024) {
      navToggle.classList.remove('is-open');
      navLinks.classList.remove('is-open');
      navCta.classList.remove('is-open');
    }
  });
});
