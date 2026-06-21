(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const TIP = 3;

  const track = document.createElement('div');
  track.id = 'cursor-track';
  track.innerHTML = `<svg id="cursor-blade" width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="2.5" y1="2.5" x2="36"  y2="36"  stroke="#d4c4a8" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="2.5" y1="2.5" x2="33"  y2="33"  stroke="rgba(255,255,255,0.22)" stroke-width="0.8" stroke-linecap="round"/>
    <line x1="5"   y1="5"   x2="31"  y2="31"  stroke="rgba(70,55,35,0.6)"     stroke-width="1"   stroke-linecap="round"/>
    <line x1="27"  y1="45"  x2="45"  y2="27"  stroke="#8a7265" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="28"  y1="44"  x2="44"  y2="28"  stroke="rgba(50,38,25,0.45)"    stroke-width="1.2" stroke-linecap="round"/>
    <line x1="36"  y1="36"  x2="39"  y2="39"  stroke="#b8aa88" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="41"  y1="41"  x2="50"  y2="50"  stroke="#3d2010" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="41.5" y1="41.5" x2="49.5" y2="49.5" stroke="#5a3820" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="2.5 2"/>
    <circle cx="52"  cy="52"  r="3.5" fill="#c94a1a"/>
    <circle cx="52"  cy="52"  r="3.5" fill="none" stroke="rgba(201,74,26,0.5)" stroke-width="2"/>
  </svg>`;
  document.body.appendChild(track);

  const blade = document.getElementById('cursor-blade');

  let cx = -100;
  let cy = -100;

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    track.style.transform = `translate3d(${cx - TIP}px,${cy - TIP}px,0)`;
  });

  document.addEventListener('mouseleave', () => { track.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { track.style.opacity = '1'; });

  function spawnSlash(x, y) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('sword-slash');
    svg.setAttribute('viewBox', '0 0 70 70');
    svg.style.cssText = `left:${x - 35}px;top:${y - 35}px;`;

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glow.setAttribute('d', 'M 12,58 Q 35,28 58,12');
    glow.setAttribute('stroke', 'rgba(201,74,26,0.45)');
    glow.setAttribute('stroke-width', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-linecap', 'round');

    const edge = glow.cloneNode();
    edge.setAttribute('stroke', 'rgba(255,165,45,0.9)');
    edge.setAttribute('stroke-width', '1.5');

    svg.append(glow, edge);
    document.body.appendChild(svg);
    svg.addEventListener('animationend', () => svg.remove(), { once: true });
  }

  document.addEventListener('mousedown', () => {
    blade.classList.remove('is-swinging');
    void blade.offsetWidth;
    blade.classList.add('is-swinging');
    spawnSlash(cx, cy);
  });

  blade.addEventListener('animationend', () => {
    blade.classList.remove('is-swinging');
  });
})();
