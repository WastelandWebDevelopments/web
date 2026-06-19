// ── Audio ──────────────────────────────────────────────────────────────────

let ac = null;

function getAC() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

let whooshBuffer = null;

fetch('/sounds/mixkit-dagger-woosh-1487.wav')
  .then(r => r.arrayBuffer())
  .then(data => getAC().decodeAudioData(data))
  .then(buf => { whooshBuffer = buf; })
  .catch(() => {});

function playWhoosh() {
  if (!whooshBuffer) return;
  const ctx = getAC();
  const src = ctx.createBufferSource();
  src.buffer = whooshBuffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, ctx.currentTime);
  src.connect(g);
  g.connect(ctx.destination);
  src.start(ctx.currentTime);
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

// Wire whoosh to dropdown subsection links, click to CTAs
document.querySelectorAll('.dropdown li a').forEach(el => {
  el.addEventListener('click', playWhoosh);
});
document.querySelectorAll('.btn-cta').forEach(el => {
  el.addEventListener('click', playClick);
});

// ── Mobile nav ─────────────────────────────────────────────────────────────

const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const open = navToggle.classList.toggle('is-open');
  navLinks.classList.toggle('is-open', open);
  playClick();
});

// Accordion dropdowns on mobile
document.querySelectorAll('.nav-item.has-dropdown > a').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      const item    = link.closest('.nav-item');
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.nav-item.has-dropdown').forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) {
        item.classList.add('is-open');
        playClick();
      }
    }
  });
});

// ── Mission scroll — trigger-based unroll ─────────────────────────────────

const missionWrapper = document.querySelector('.mission-scroll-wrapper');

if (missionWrapper) {
  const missionScroll = missionWrapper.querySelector('.mission-scroll');
  let wordEls   = [];
  let fullH     = 0;
  let triggered = false;

  missionScroll.querySelectorAll('p').forEach(p => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  });
  wordEls = [...missionScroll.querySelectorAll('.word')];

  function openScroll() {
    if (triggered || !fullH) return;
    triggered = true;
    missionScroll.style.height = fullH + 'px';
    wordEls.forEach((w, i) => {
      setTimeout(() => w.classList.add('revealed'), i * 88 + 250);
    });
  }

  // Measure after fonts load so Cinzel line-heights are accurate
  document.fonts.ready.then(() => {
    missionScroll.style.height = 'auto';
    fullH = missionScroll.offsetHeight;
    missionScroll.style.height = '0px';
  });

  // Fire when the wrapper is 25% into the viewport from the bottom
  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Small delay lets fonts.ready resolve first if it hasn't yet
      setTimeout(openScroll, 60);
      obs.unobserve(missionWrapper);
    });
  }, { threshold: 0.25 }).observe(missionWrapper);
}

// ── Chronicle card expand/collapse ───────────────────────────────────────

document.querySelectorAll('.chronicle-card').forEach(card => {
  const body = card.querySelector('.chronicle-body');
  const btn  = card.querySelector('.chronicle-read');
  if (!body || !btn) return;

  card.addEventListener('click', () => {
    const isOpen = card.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', isOpen);
    body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0';
    if (isOpen) {
      btn.textContent = btn.textContent.replace(/^Read/, 'Close').replace('›', '↑');
    } else {
      btn.textContent = btn.textContent.replace(/^Close/, 'Read').replace('↑', '›');
    }
  });
});

// ── Chronicle filter ──────────────────────────────────────────────────────

function applyChronicleFilter(filter) {
  document.querySelectorAll('.chronicle-card').forEach(card => {
    card.classList.toggle('hidden', filter !== 'all' && card.dataset.type !== filter);
  });
  document.querySelectorAll('.cf-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

document.querySelectorAll('.cf-btn').forEach(btn => {
  btn.addEventListener('click', () => applyChronicleFilter(btn.dataset.filter));
});

// Chronicle nav dropdown links set the filter then scroll to section
document.querySelectorAll('.dropdown a[data-filter]').forEach(link => {
  link.addEventListener('click', () => {
    applyChronicleFilter(link.dataset.filter);
  });
});

// ── Ember Codex cards ─────────────────────────────────────────────────────

document.querySelectorAll('.codex-card .card-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.codex-card');
    const body = card.querySelector('.card-body');
    const isOpen = card.classList.contains('is-open');

    document.querySelectorAll('.codex-card.is-open').forEach(c => {
      const b = c.querySelector('.card-body');
      if (b.style.maxHeight === 'none') b.style.maxHeight = b.scrollHeight + 'px';
      requestAnimationFrame(() => { b.style.maxHeight = '0'; });
      c.classList.remove('is-open');
    });

    if (!isOpen) {
      card.classList.add('is-open');
      body.style.maxHeight = body.scrollHeight + 'px';
      body.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'max-height') return;
        if (card.classList.contains('is-open')) body.style.maxHeight = 'none';
        body.removeEventListener('transitionend', onEnd);
      });
      playWhoosh();
    }
  });
});

// ── Bonfire lore fade-in ───────────────────────────────────────────────────

const bonfireEls = document.querySelectorAll(
  '.bonfire-creed, .bonfire-title, .bonfire-para, .bonfire-callout, .bonfire-highlight, .bonfire-tagline, .bonfire-sig'
);

if (bonfireEls.length) {
  const bonfireObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('bonfire-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  bonfireEls.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
    bonfireObs.observe(el);
  });
}

// ── Terminology search ─────────────────────────────────────────────────────

const termSearch = document.querySelector('.term-search');
if (termSearch) {
  termSearch.addEventListener('input', () => {
    const q = termSearch.value.trim().toLowerCase();
    const entries = document.querySelectorAll('.term-entry');
    let visible = 0;
    entries.forEach(entry => {
      const match = !q || entry.textContent.toLowerCase().includes(q);
      entry.hidden = !match;
      if (match) visible++;
    });
    document.querySelector('.term-no-results').hidden = visible > 0;
  });
}

// Close accordion when a leaf link is tapped on mobile
document.querySelectorAll('.dropdown li a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 1024) {
      navToggle.classList.remove('is-open');
      navLinks.classList.remove('is-open');
    }
  });
});

// ── The Forge entry cards ─────────────────────────────────────────────────

function openEntry(card) {
  const body = card.querySelector('.entry-body');
  card.classList.add('is-open');
  body.style.maxHeight = body.scrollHeight + 'px';
}

document.querySelectorAll('.entry-card').forEach(card => {
  const body = card.querySelector('.entry-body');
  if (!body) return;

  card.querySelector('.entry-toggle').addEventListener('click', () => {
    const isOpen = card.classList.toggle('is-open');
    body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0';
  });
});

document.querySelectorAll('.entry-related-link').forEach(link => {
  link.addEventListener('click', e => {
    e.stopPropagation();
    const target = document.getElementById(link.dataset.target);
    if (!target) return;

    openEntry(target);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    target.classList.add('is-flash');
    setTimeout(() => target.classList.remove('is-flash'), 1100);
  });
});

// ── Hero entrance ─────────────────────────────────────────────────────────

const heroEl = document.querySelector('.hero');
if (heroEl) heroEl.classList.add('hero-staged');

function revealHero() {
  const steps = [
    { sel: '.site-title',   delay: 500,  transform: 'translateY(0)' },
    { sel: '.hero-divider', delay: 880,  transform: 'scaleX(1)'     },
    { sel: '.tagline',      delay: 1180, transform: 'translateY(0)' },
  ];
  steps.forEach(({ sel, delay, transform }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)';
      el.style.opacity    = '1';
      el.style.transform  = transform;
    }, delay);
  });

  setTimeout(() => {
    document.querySelector('.scroll-invite')?.classList.add('is-visible');
  }, 1700);
}

// ── Oath of the Hollow ─────────────────────────────────────────────────────

(function () {
  const overlay  = document.getElementById('oath-overlay');
  const checkbox = document.getElementById('oath-checkbox');
  const enterBtn = document.getElementById('oath-enter');

  if (!overlay || !checkbox || !enterBtn) return;

  setTimeout(() => overlay.classList.add('visible'), 1800);

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      enterBtn.removeAttribute('disabled');
    } else {
      enterBtn.setAttribute('disabled', '');
    }
  });

  enterBtn.addEventListener('click', () => {
    if (enterBtn.hasAttribute('disabled')) return;
    overlay.classList.remove('visible');
    overlay.classList.add('dismissed');
    setTimeout(() => overlay.remove(), 1400);
    revealHero();
  });
})();
