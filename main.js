// Theme toggle, typed role line, blur-in reveal, active nav link, project modal.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme
  document.getElementById('theme').addEventListener('click', () => {
    // every colour fades together for a moment, including icons and masks that have no transition of their own
    root.classList.add('theme-anim');
    clearTimeout(window.__themeT); window.__themeT = setTimeout(() => root.classList.remove('theme-anim'), 700);
    const dark = root.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  function start() {
  // typed role
  const el = document.getElementById('typed');
  const roles = ['Web3 Developer', 'Community Manager', 'Ambassador and Moderator', 'Content Creator'];
  if (el && !reduce) {
    let i = 0, n = roles[0].length, del = false;
    const tick = () => {
      const w = roles[i];
      if (!del && n < w.length) { n++; }
      else if (!del) { del = true; return setTimeout(tick, 1800); }
      else if (n > 0) { n--; }
      else { del = false; i = (i + 1) % roles.length; }
      el.textContent = roles[i].slice(0, n);
      setTimeout(tick, del ? 75 : 130);
    };
    setTimeout(tick, 2200);
  }

  // blur-in reveal: hero on load, the rest as it scrolls into view
  const items = [...document.querySelectorAll('.rv')];
  items.forEach((e) => {
    const sib = e.parentElement ? [...e.parentElement.children].filter((c) => c.classList.contains('rv')) : [];
    const k = Math.max(0, sib.indexOf(e));
    e.style.setProperty('--rd', (Math.min(k, 6) * 0.1) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach((e) => io.observe(e));
  } else items.forEach((e) => e.classList.add('in'));

  }

  // loader: his portrait fills in with colour as the ring completes, then it flies to its place in the hero
  (function loader() {
    const L = document.getElementById('loader');
    let started = false;
    const go = () => { if (started) return; started = true; start(); };
    if (!L) { root.classList.remove('loading', 'await-land'); return go(); }

    const nameEl = document.getElementById('ld-name'), num = document.getElementById('ld-num');
    nameEl.innerHTML = [...nameEl.textContent].map((ch, i) => '<span style="--i:' + i + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>').join('');
    const face = L.querySelector('.ld-face');
    const MIN = reduce ? 300 : 2800, t0 = performance.now();
    let loaded = document.readyState === 'complete', finished = false;
    addEventListener('load', () => { loaded = true; });

    // the portrait lands exactly on the hero picture: that picture is held back (and its float paused) until the landing,
    // so the swap from the flying copy to the real one happens on the same pixels
    const fly = () => {
      const heroArt = document.querySelector('.hero-art');
      const to = document.querySelector('.hero .avatar img');
      if (!to || !heroArt || !face.animate || reduce) return null;
      root.classList.add('fly');
      // measure where it will really sit once revealed, not where the reveal animation starts it
      heroArt.style.transition = 'none'; heroArt.style.transform = 'none';
      const b = to.getBoundingClientRect();
      heroArt.style.transform = ''; void heroArt.offsetWidth; heroArt.style.transition = '';
      const a = face.getBoundingClientRect();
      const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      const s = b.width / a.width;
      return face.animate(
        [{ transform: 'none' }, { transform: 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) scale(' + s.toFixed(5) + ')' }],
        { duration: 1150, delay: 200, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' }
      );
    };

    const finish = () => {
      if (finished) return; finished = true;
      L.style.setProperty('--pn', '1'); num.textContent = '100';
      L.classList.add('go');
      const anim = fly();
      setTimeout(() => { root.classList.remove('loading'); go(); }, reduce ? 150 : 300);
      const end = () => { root.classList.remove('fly'); root.classList.remove('await-land'); L.classList.add('done'); };
      if (anim) { anim.onfinish = end; setTimeout(end, 2600); }
      else setTimeout(end, reduce ? 200 : 900);
    };

    const tick = (now) => {
      const t = now - t0;
      const ease = 1 - Math.pow(1 - Math.min(1, t / MIN), 3);
      const p = loaded ? ease : Math.min(0.9, ease);
      L.style.setProperty('--pn', p.toFixed(3));
      num.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if ((loaded && t >= MIN) || t > 9000) return finish();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  // hero background reacts a little to the pointer
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && !reduce && matchMedia('(hover: hover)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; if (!raf) raf = requestAnimationFrame(step); }, { passive: true });
    const step = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      heroBg.style.setProperty('--px', cx.toFixed(3)); heroBg.style.setProperty('--py', cy.toFixed(3));
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(step) : 0;
    };
  }


  // download CV menu: ATS or friendly version
  const cvMenus = [...document.querySelectorAll('.cvmenu')];
  const closeCv = () => cvMenus.forEach((m) => { m.classList.remove('open'); m.querySelector('.cv-toggle').setAttribute('aria-expanded', 'false'); });
  cvMenus.forEach((m) => {
    const t = m.querySelector('.cv-toggle');
    t.addEventListener('click', (e) => {
      e.stopPropagation();
      const was = m.classList.contains('open');
      closeCv();
      if (!was) {
        // open downward when there is room, otherwise upward, so the four options are never cut off by the bottom of the window
        m.classList.remove('up');
        const pop = m.querySelector('.cv-pop');
        const need = pop.scrollHeight + 16, r = m.getBoundingClientRect();
        const below = innerHeight - r.bottom, above = r.top;
        const goUp = below < need && above > below;
        if (goUp) m.classList.add('up');
        // never taller than the room it opens into (the fixed navbar takes the top 100px), the menu scrolls inside if it must
        pop.style.maxHeight = Math.max(170, (goUp ? above - 104 : below - 16)) + 'px';
        m.classList.add('open'); t.setAttribute('aria-expanded', 'true');
        if (Math.max(below, above) < need) m.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    m.querySelectorAll('.cv-pop a').forEach((a) => a.addEventListener('click', () => setTimeout(closeCv, 150)));
  });
  addEventListener('click', closeCv);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCv(); });


  // every click is a sword cut, and it is never the same twice: six different cuts at random angles and colours,
  // short enough that spamming clicks stays crisp instead of piling up
  if (!reduce) {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden';
    document.body.appendChild(layer);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];
    const PAL = [['#ffffff', '#7ee0ee', '#4cc3d9'], ['#ffffff', '#bff3fb', '#38bdf8'], ['#f4fffd', '#9ff0dc', '#2dd4bf'], ['#ffffff', '#b9c6ff', '#6f8bff']];
    let live = 0;
    const el = (css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;pointer-events:none;' + css; layer.appendChild(d); live++; return d; };
    const run = (d, frames, opt) => { const a = d.animate(frames, Object.assign({ fill: 'forwards' }, opt)); a.onfinish = () => { d.remove(); live--; }; return a; };

    // one bright blade-line through (x,y)
    const line = (x, y, ang, len, c, w, dur, delay) => {
      const d = el('left:' + (x - len / 2) + 'px;top:' + (y - w / 2) + 'px;width:' + len + 'px;height:' + w + 'px;border-radius:' + w + 'px;opacity:0;' +
        'background:linear-gradient(90deg,transparent,' + c[0] + ' 30%,' + c[1] + ' 62%,' + c[2] + ' 85%,transparent);box-shadow:0 0 8px 1px ' + c[1] + ',0 0 20px 4px ' + c[2] + '66');
      run(d, [
        { transform: 'rotate(' + ang + 'deg) scaleX(0)', opacity: 1, offset: 0 },
        { transform: 'rotate(' + ang + 'deg) scaleX(1)', opacity: 1, offset: 0.3 },
        { transform: 'rotate(' + ang + 'deg) scaleX(1.05)', opacity: 0, offset: 1 }
      ], { duration: dur, delay: delay || 0, easing: 'cubic-bezier(.2,.8,.2,1)' });
    };
    // a disc cut in two along the angle, the halves sliding apart
    const halves = (x, y, ang, c, R) => {
      [true, false].forEach((top) => {
        const g = el('left:' + (x - R) + 'px;top:' + (y - R) + 'px;width:' + R * 2 + 'px;height:' + R * 2 + 'px;transform:rotate(' + ang + 'deg)');
        const h = document.createElement('div');
        h.style.cssText = 'position:absolute;left:0;width:100%;height:50%;box-shadow:0 0 12px ' + c[2] + '99;' + (top
          ? 'top:0;border-radius:' + R * 2 + 'px ' + R * 2 + 'px 0 0;background:linear-gradient(180deg,' + c[0] + ',' + c[2] + ')'
          : 'bottom:0;border-radius:0 0 ' + R * 2 + 'px ' + R * 2 + 'px;background:linear-gradient(180deg,' + c[2] + ',' + c[1] + ')');
        g.appendChild(h);
        const dir = top ? -1 : 1;
        h.animate([{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(' + dir * 2 + 'px) scale(1)', opacity: 1, offset: 0.2 }, { transform: 'translateY(' + dir * R * 1.9 + 'px) scale(.5)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }).onfinish = () => { g.remove(); live--; };
      });
    };
    // small shards flying outward
    const shards = (x, y, n, c, far) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 360), dist = rnd(far * 0.5, far), s = rnd(4, 9);
        const d = el('left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;width:' + s + 'px;height:' + s * 2.4 + 'px;opacity:0;clip-path:polygon(50% 0,100% 100%,0 100%);background:' + pick(c));
        run(d, [
          { transform: 'rotate(' + a + 'deg) translateY(0) scale(1)', opacity: 1 },
          { transform: 'rotate(' + a + 'deg) translateY(' + (-dist) + 'px) scale(.2)', opacity: 0 }
        ], { duration: rnd(260, 380), easing: 'cubic-bezier(.1,.7,.2,1)' });
      }
    };
    // radial sparks
    const sparks = (x, y, n, c, far) => {
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + rnd(-10, 10), l = rnd(8, 16);
        const d = el('left:' + (x - 1) + 'px;top:' + (y - l / 2) + 'px;width:2px;height:' + l + 'px;border-radius:2px;opacity:0;background:' + pick(c) + ';box-shadow:0 0 6px ' + c[2]);
        run(d, [
          { transform: 'rotate(' + a + 'deg) translateY(' + (-far * 0.25) + 'px)', opacity: 1 },
          { transform: 'rotate(' + a + 'deg) translateY(' + (-far) + 'px) scaleY(.3)', opacity: 0 }
        ], { duration: rnd(240, 340), easing: 'cubic-bezier(.1,.8,.2,1)' });
      }
    };
    // a ring snapped in two
    const ring = (x, y, ang, c, R) => {
      [0, 180].forEach((off) => {
        const d = el('left:' + (x - R) + 'px;top:' + (y - R) + 'px;width:' + R * 2 + 'px;height:' + R * 2 + 'px;border-radius:50%;border:2.5px solid ' + c[1] + ';box-shadow:0 0 10px ' + c[2] + ';' +
          'clip-path:inset(' + (off ? '50% 0 0 0' : '0 0 50% 0') + ');opacity:0');
        run(d, [
          { transform: 'rotate(' + ang + 'deg) translateY(0) scale(.5)', opacity: 1 },
          { transform: 'rotate(' + ang + 'deg) translateY(' + (off ? R * 0.6 : -R * 0.6) + 'px) scale(1.5)', opacity: 0 }
        ], { duration: 360, easing: 'cubic-bezier(.15,.7,.2,1)' });
      });
    };

    const effects = [
      // 0 the clean cut: one slash, the disc splits
      (x, y, c) => { const a = rnd(-70, 70); line(x, y, a, rnd(90, 130), c, 3, 300); halves(x, y, a, c, 11); },
      // 1 cross: two quick slashes, an X
      (x, y, c) => { const a = rnd(-50, 50); line(x, y, a, rnd(80, 110), c, 2.5, 280); line(x, y, a + rnd(70, 100), rnd(80, 110), c, 2.5, 280, 70); sparks(x, y, 6, c, 22); },
      // 2 claw: three parallel slashes
      (x, y, c) => { const a = rnd(-60, 60), r = a * Math.PI / 180, nx = -Math.sin(r), ny = Math.cos(r); [-1, 0, 1].forEach((k, i) => line(x + nx * k * 9, y + ny * k * 9, a, rnd(60, 90), c, 2.2, 260, i * 45)); },
      // 3 shatter: one slash and a burst of shards
      (x, y, c) => { const a = rnd(-70, 70); line(x, y, a, rnd(80, 110), c, 3, 280); shards(x, y, 9, c, 46); },
      // 4 ring snap: a ring broken in two along a slash
      (x, y, c) => { const a = rnd(-70, 70); line(x, y, a, rnd(90, 120), c, 2.5, 280); ring(x, y, a, c, 16); },
      // 5 spark cut: a fast slash and a star of sparks
      (x, y, c) => { const a = rnd(-70, 70); line(x, y, a, rnd(70, 100), c, 3.5, 240); sparks(x, y, 10, c, 38); }
    ];
    let last = -1;
    addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      if (live > 90) return; // spamming: never let the layer grow without bound
      let i; do { i = (Math.random() * effects.length) | 0; } while (i === last);
      last = i;
      effects[i](e.clientX, e.clientY, pick(PAL));
    }, { passive: true });
  }

  // active section in the nav
  const links = [...document.querySelectorAll('.nav nav a')];
  const secs = [...document.querySelectorAll('main section')];
  const onScroll = () => {
    let cur = 'home';
    secs.forEach((s) => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) cur = s.id; });
    links.forEach((a) => a.classList.toggle('on', a.dataset.s === cur));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // project details
  const P = {
    agenteco: {
      meta: 'Solo build · Sep to Oct 2026', title: 'AgentEco',
      lead: 'An escrow, dispute and reputation layer where AI agents find, negotiate with, hire and pay each other.',
      img: ['assets/agenteco-hero.webp', 'assets/agenteco-marketplace.webp'],
      stats: [['97', 'passing Foundry tests'], ['54s', 'full on-chain deal, BSC Testnet'], ['7', 'test networks, one live app']],
      points: [
        'Built entirely with Claude Code. I set the direction and the rules, ran and checked what it produced, and shipped it.',
        'The result: Solidity escrow, dispute and rating contracts where every state has a deadline and an exit anyone can trigger, so funds cannot be locked forever.',
        'A TypeScript backend (Express, Prisma, PostgreSQL, viem) and a Next.js app, with LLMs behind guardrails for negotiation and verification: the AI proposes, code and the contract decide.',
        'An SDK and CLI published on npm, plus an MCP server with 11 tools.'],
      links: [['Live app', 'https://www.agenteco.web.id'], ['Source', 'https://github.com/SannyDermawan/agenteco-multichain'], ['Verified contract', 'https://testnet.bscscan.com/address/0xdC08Dd97e959Ab6ED2AB76702F25757Fe1fF46BE#code'], ['npm', 'https://www.npmjs.com/package/@agenteco/sdk'], ['Demo', 'https://youtu.be/arWL6aU59ic']],
      note: 'Test networks only. Contracts not audited. No real users yet. Built with AI coding tools.'
    },
    machinecredit: {
      meta: 'Team MVP · paused', title: 'MachineCredit',
      lead: 'Financing for machine companies based on verified machine performance and revenue, with agreements settled on BOT Chain.',
      img: ['assets/machinecredit.webp'],
      points: ['Built solo, from the smart contract side to the landing page.', 'Performance data is simulated in this MVP.', 'The project is currently paused.'],
      links: [['Website', 'https://machinecredit.my.id']]
    },
    museum: {
      meta: 'University project', title: 'Museum MPU Purwa',
      lead: 'A museum guide built as a full system: a mobile app in Dart, an admin website, and a TypeScript backend API.',
      img: ['assets/mpu/dashboard.webp', 'assets/mpu/booking.webp', 'assets/mpu/koleksi.webp', 'assets/mpu/login.webp'],
      two: true,
      phones: ['assets/mpu/app-beranda.webp', 'assets/mpu/app-katalog.webp', 'assets/mpu/app-detail.webp', 'assets/mpu/app-booking.webp'],
      points: [
        'Admin website: dashboard with visitor statistics, group booking management, collection management and account management.',
        'Mobile app for visitors, written in Dart: collection catalogue, collection detail pages, history timeline, QR check-in and group booking.',
        'TypeScript backend API behind both.'],
      links: [['Mobile app', 'https://github.com/SannyDermawan/mobile-mpupurwa'], ['Admin web', 'https://github.com/SannyDermawan/web-admin-museum-mpupurwa']],
      note: 'Screenshots show sample data.'
    }
  };
  const dlg = document.getElementById('modal'), body = document.getElementById('m-body');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function open(key) {
    const p = P[key]; if (!p) return;
    dlg.classList.remove('is-cert');
    body.innerHTML =
      '<p class="sub-meta">' + esc(p.meta) + '</p><h3 id="m-title">' + esc(p.title) + '</h3><p class="lead">' + esc(p.lead) + '</p>' +
      '<div class="m-gallery' + (p.two ? ' two' : '') + '">' + p.img.map((s) => '<img src="' + s + '" alt="' + esc(p.title) + ' screenshot" loading="lazy">').join('') + '</div>' +
      (p.phones ? '<div class="m-phones">' + p.phones.map((s) => '<img src="' + s + '" alt="' + esc(p.title) + ' mobile app screenshot" loading="lazy">').join('') + '</div>' : '') +
      (p.stats ? '<div class="m-stats">' + p.stats.map((s) => '<div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>').join('') + '</div>' : '') +
      '<ul>' + p.points.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
      '<div class="m-links">' + p.links.map((l) => '<a href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>').join('') + '</div>' +
      (p.note ? '<p class="m-note">' + esc(p.note) + '</p>' : '');
    dlg.showModal();
    dlg.querySelector('.m-box').scrollTop = 0;
  }
  document.querySelectorAll('.card').forEach((c) => {
    c.addEventListener('click', () => open(c.dataset.p));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c.dataset.p); } });
  });
  document.querySelectorAll('[data-cert]').forEach((b) => b.addEventListener('click', () => {
    dlg.classList.add('is-cert');
    body.innerHTML = '<div class="m-cert"><img src="' + b.dataset.cert + '" alt="' + esc(b.dataset.alt) + '"></div>';
    dlg.showModal();
    dlg.querySelector('.m-box').scrollTop = 0;
  }));
  dlg.querySelector('.m-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
