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


  // every click is a sword cut: a bright slash flashes through the point, and a small disc there is cut in two and the halves fly apart
  if (!reduce) {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden';
    document.body.appendChild(layer);
    const ANG = 32; // degrees, the cut runs from upper left to lower right
    const slashAt = (x, y) => {
      const mk = (css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;pointer-events:none;' + css; layer.appendChild(d); return d; };
      const done = (els, ms) => setTimeout(() => els.forEach((e) => e.remove()), ms);
      // the slash itself
      const len = 190;
      const line = mk('left:' + (x - len / 2) + 'px;top:' + (y - 1.5) + 'px;width:' + len + 'px;height:3px;border-radius:3px;transform-origin:50% 50%;' +
        'background:linear-gradient(90deg,transparent,#fff 28%,#bff3fb 55%,#4cc3d9 80%,transparent);box-shadow:0 0 10px 2px #7ee0ee,0 0 28px 6px #4cc3d977;opacity:0');
      line.animate([
        { transform: 'rotate(' + ANG + 'deg) scaleX(0)', opacity: 1, offset: 0 },
        { transform: 'rotate(' + ANG + 'deg) scaleX(1)', opacity: 1, offset: 0.35 },
        { transform: 'rotate(' + ANG + 'deg) scaleX(1)', opacity: 0, offset: 1 }
      ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      // the disc, cut along the same line: two halves slide away from each other across the cut
      const R = 15, half = (top) => {
        const g = mk('left:' + (x - R) + 'px;top:' + (y - R) + 'px;width:' + (R * 2) + 'px;height:' + (R * 2) + 'px;transform:rotate(' + ANG + 'deg);transform-origin:50% 50%');
        const h = document.createElement('div');
        h.style.cssText = 'position:absolute;left:0;width:100%;height:50%;' + (top
          ? 'top:0;border-radius:' + R * 2 + 'px ' + R * 2 + 'px 0 0;background:linear-gradient(180deg,#e9fdff,#4cc3d9)'
          : 'bottom:0;border-radius:0 0 ' + R * 2 + 'px ' + R * 2 + 'px;background:linear-gradient(180deg,#4cc3d9,#0e7490)');
        h.style.boxShadow = '0 0 14px #4cc3d999';
        g.appendChild(h);
        const dir = top ? -1 : 1;
        h.animate([
          { transform: 'translateY(0) scale(1)', opacity: 1 },
          { transform: 'translateY(' + dir * 3 + 'px) scale(1)', opacity: 1, offset: 0.22 },
          { transform: 'translateY(' + dir * 30 + 'px) scale(.55)', opacity: 0 }
        ], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
        return g;
      };
      const a = half(true), b = half(false);
      done([line, a, b], 600);
    };
    addEventListener('pointerdown', (e) => { if (e.button === 0 || e.pointerType === 'touch') slashAt(e.clientX, e.clientY); }, { passive: true });
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
