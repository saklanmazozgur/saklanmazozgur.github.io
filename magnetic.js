(function initCursor() {
  const dot  = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  if (!dot || !ring) return;

  let mx=0, my=0, rx=0, ry=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
  document.querySelectorAll('a,button,[data-hover]').forEach(el => {
    el.addEventListener('mouseenter', ()=>document.body.classList.add('hov'));
    el.addEventListener('mouseleave', ()=>document.body.classList.remove('hov'));
  });
  document.addEventListener('mouseover', e => {
    if (e.target.closest('#scroll-top')) document.body.classList.add('hov');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('#scroll-top')) document.body.classList.remove('hov');
  });
  (function loop() {
    dot.style.left=mx+'px'; dot.style.top=my+'px';
    rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();
})();


(function initNetwork() {
  const canvas = document.getElementById('mag-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = window.innerWidth;
  let H = window.innerHeight;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  let mouseX = W / 2, mouseY = H / 2, mouseActive = false;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY; mouseActive = true;
  });

  const NODE_COUNT   = 160;
  const CONNECT_DIST = 155;  
  const MOUSE_DIST   = 210;  

  class Node {
    constructor(randomPos) {
      this.vx = (Math.random() - 0.5) * 0.38;
      this.vy = (Math.random() - 0.5) * 0.38;
      this.r  = 1.6 + Math.random() * 1.6;
      this.energy = 0;
      if (randomPos) {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
      } else {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = Math.random() * W; this.y = -10; }
        else if (edge === 1) { this.x = W + 10; this.y = Math.random() * H; }
        else if (edge === 2) { this.x = Math.random() * W; this.y = H + 10; }
        else { this.x = -10; this.y = Math.random() * H; }
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;

      const dx = mouseX - this.x, dy = mouseY - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      this.energy = mouseActive ? Math.max(0, 1 - d / MOUSE_DIST) : 0;
    }

    draw() {
      const alpha  = 0.22 + this.energy * 0.78;
      const radius = this.r + this.energy * 2.8;

      if (this.energy > 0.08) {
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius * 4);
        grd.addColorStop(0, `rgba(129,140,248,${this.energy * 0.35})`);
        grd.addColorStop(1, 'rgba(129,140,248,0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96,165,250,${alpha})`;
      ctx.fill();
    }
  }

  const nodes = Array.from({ length: NODE_COUNT }, () => new Node(true));

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    nodes.forEach(n => n.update());

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b   = nodes[j];
        const dx  = a.x - b.x, dy = a.y - b.y;
        const d   = Math.sqrt(dx * dx + dy * dy);
        if (d >= CONNECT_DIST) continue;

        const t     = 1 - d / CONNECT_DIST;
        const boost = Math.max(a.energy, b.energy);
        const alpha = t * (0.07 + boost * 0.38);
        const width = t * (0.4  + boost * 1.8);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = boost > 0.15
          ? `rgba(129,140,248,${alpha})`
          : `rgba(59,130,246,${alpha})`;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    }

    if (mouseActive) {
      nodes.forEach(n => {
        if (n.energy <= 0.02) return;
        const t    = n.energy;
        const grad = ctx.createLinearGradient(n.x, n.y, mouseX, mouseY);
        grad.addColorStop(0,   `rgba(96,165,250,${t * 0.45})`);
        grad.addColorStop(0.5, `rgba(99,102,241,${t * 0.65})`);
        grad.addColorStop(1,   `rgba(129,140,248,${t * 0.85})`);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = t * 2.2;
        ctx.stroke();
      });

      const hub = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 90);
      hub.addColorStop(0,   'rgba(129,140,248,0.22)');
      hub.addColorStop(0.45,'rgba(59,130,246,0.10)');
      hub.addColorStop(1,   'rgba(59,130,246,0)');
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 90, 0, Math.PI * 2);
      ctx.fillStyle = hub;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(129,140,248,0.7)';
      ctx.fill();
    }

    nodes.forEach(n => n.draw());
  }
  animate();
})();

(function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('in'), i * 90);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el => obs.observe(el));
})();

(function initNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();
