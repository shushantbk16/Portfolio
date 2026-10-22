(() => {
    'use strict';
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Theme ---------- */
    const root = document.documentElement;
    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
    } catch (e) { /* storage unavailable */ }
    $('#themeToggle').addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
        netColors();
    });

    /* ---------- Mobile menu ---------- */
    const burger = $('#burger'), links = $('#navLinks');
    burger.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
    });
    $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
    }));

    /* ---------- Scramble text ---------- */
    const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
    function scramble(el, text, dur = 1100) {
        if (reduce) { el.textContent = text; return; }
        const start = performance.now();
        const tick = now => {
            const p = Math.min((now - start) / dur, 1);
            let out = '';
            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ') { out += ' '; continue; }
                out += i < p * text.length ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /* ---------- Preloader ---------- */
    function typeLines(done) {
        const lines = $$('.boot-line');
        let i = 0;
        const next = () => {
            if (i >= lines.length) return setTimeout(done, 220);
            const el = lines[i++], t = el.dataset.t;
            let c = 0;
            const iv = setInterval(() => {
                el.textContent = t.slice(0, ++c);
                if (c >= t.length) { clearInterval(iv); setTimeout(next, 60); }
            }, 14);
        };
        next();
    }
    let started = false;
    function startSite() {
        if (started) return; started = true;
        $('#preloader').classList.add('done');
        scramble($('#heroName'), 'Shushant Kamatar');
        $$('.hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 200 + i * 140));
        rotateRoles();
    }
    if (reduce) { $('#preloader').remove(); started = true; $('#heroName').textContent = 'Shushant Kamatar'; $$('.hero .reveal').forEach(e => e.classList.add('in')); }
    else {
        typeLines(startSite);
        setTimeout(startSite, 2600); // safety net
    }

    /* ---------- Role rotator ---------- */
    function rotateRoles() {
        const el = $('#roleRotator');
        if (reduce) return;
        const roles = ['LLM Agents', 'MCP Tooling', 'Workflow Orchestration', 'RAG & Document Intelligence', 'MLOps'];
        let r = 0;
        setInterval(() => { r = (r + 1) % roles.length; scramble(el, roles[r], 600); }, 2600);
    }

    /* ---------- Scroll reveal + counters ---------- */
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        if (e.target.matches('[data-count]')) countUp(e.target);
        io.unobserve(e.target);
    }), { threshold: .12 });
    $$('.reveal').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

    function countUp(el) {
        if (el.dataset.done) return; el.dataset.done = 1;
        const end = +el.dataset.count, suf = el.dataset.suffix || '';
        if (reduce) { el.textContent = end + suf; return; }
        const t0 = performance.now(), dur = 1400;
        const step = now => {
            const p = Math.min((now - t0) / dur, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /* ---------- Progress bar, timeline line, active nav ---------- */
    const bar = $('.progress span'), tl = $('.timeline'), tlLine = $('.timeline .line i');
    const secs = $$('main section[id]'), navA = $$('#navLinks a');
    function onScroll() {
        const h = document.documentElement;
        bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + '%';
        const r = tl.getBoundingClientRect(), vh = innerHeight;
        const p = Math.min(Math.max((vh * .6 - r.top) / r.height, 0), 1);
        tlLine.style.height = (p * 100) + '%';
        let cur = '';
        secs.forEach(s => { if (s.getBoundingClientRect().top < vh * .4) cur = s.id; });
        navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    /* ---------- Cursor ---------- */
    if (fine && !reduce) {
        const dot = $('.cursor-dot'), ring = $('.cursor-ring');
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
        document.body.classList.add('has-cursor');
        addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
        (function loop() {
            rx += (mx - rx) * .16; ry += (my - ry) * .16;
            ring.style.transform = `translate(${rx}px,${ry}px)`;
            requestAnimationFrame(loop);
        })();
        document.addEventListener('mouseover', e => ring.classList.toggle('big', !!e.target.closest('a, button, .tilt')));
    }

    /* ---------- Magnetic buttons ---------- */
    if (fine && !reduce) {
        $$('.magnetic').forEach(b => {
            b.addEventListener('mousemove', e => {
                const r = b.getBoundingClientRect();
                b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
            });
            b.addEventListener('mouseleave', () => { b.style.transform = ''; });
        });
    }

    /* ---------- 3D tilt + spotlight ---------- */
    $$('.tilt').forEach(c => {
        c.addEventListener('mousemove', e => {
            const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
            if (fine && !reduce && c.closest('.reveal.in')) {
                c.style.transform = `perspective(800px) rotateX(${((y / r.height) - .5) * -8}deg) rotateY(${((x / r.width) - .5) * 8}deg) translateZ(0)`;
            }
        });
        c.addEventListener('mouseleave', () => { c.style.transform = ''; });
    });

    /* ---------- Skill chip relationships ---------- */
    $$('.chips span[data-g]').forEach(ch => {
        const g = ch.dataset.g;
        ch.addEventListener('mouseenter', () => $$(`.chips span[data-g="${g}"]`).forEach(s => s.classList.add('hl')));
        ch.addEventListener('mouseleave', () => $$('.chips span.hl').forEach(s => s.classList.remove('hl')));
    });

    /* ---------- Copy email + sparks ---------- */
    const copy = $('#copyMail'), sparks = $('#sparks');
    copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(copy.dataset.mail); copy.textContent = 'Copied!'; }
        catch (e) { copy.textContent = copy.dataset.mail; }
        setTimeout(() => { copy.textContent = 'Copy email'; }, 2000);
        if (reduce) return;
        const r = copy.getBoundingClientRect(), f = sparks.getBoundingClientRect();
        const cx = r.left - f.left + r.width / 2, cy = r.top - f.top + r.height / 2;
        const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#34d399'];
        for (let i = 0; i < 24; i++) {
            const s = document.createElement('i'); s.className = 'spark';
            const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
            s.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % 4]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
            sparks.appendChild(s); setTimeout(() => s.remove(), 950);
        }
    });

    /* ---------- Neural network background ---------- */
    const cv = $('#net'), ctx = cv.getContext('2d');
    let W, H, pts = [], mouse = { x: -999, y: -999 }, colors = ['6,182,212', '139,92,246'], running = true;
    function netColors() { colors = root.dataset.theme === 'light' ? ['8,145,178', '124,58,237'] : ['6,182,212', '139,92,246']; }
    function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
        cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(Math.floor(innerWidth * innerHeight / 22000), 70);
        pts = Array.from({ length: n }, () => ({
            x: Math.random() * innerWidth, y: Math.random() * innerHeight,
            vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, c: Math.random() < .5 ? 0 : 1, p: Math.random() * 6
        }));
    }
    function draw(t) {
        if (!running) return;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        const sy = scrollY * .0004;
        for (const p of pts) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
            if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
            if (d < 140) { p.x += dx / d * .6; p.y += dy / d * .6; }
        }
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            for (let j = i + 1; j < pts.length; j++) {
                const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < 140) {
                    ctx.strokeStyle = `rgba(${colors[a.c]},${(1 - d / 140) * .22})`;
                    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    // packet travelling along the edge
                    const k = ((t * .0004 + a.p + sy) % 1);
                    if ((i + j) % 7 === 0) {
                        ctx.fillStyle = `rgba(${colors[b.c]},.9)`;
                        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1.8, 0, 6.3); ctx.fill();
                    }
                }
            }
            const glow = .5 + .5 * Math.sin(t * .002 + a.p);
            ctx.fillStyle = `rgba(${colors[a.c]},${.35 + glow * .5})`;
            ctx.beginPath(); ctx.arc(a.x, a.y, 2 + glow, 0, 6.3); ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    if (!reduce) {
        resize(); netColors();
        addEventListener('resize', resize);
        addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        document.addEventListener('visibilitychange', () => {
            running = !document.hidden;
            if (running) requestAnimationFrame(draw);
        });
        requestAnimationFrame(draw);
    } else {
        cv.remove();
    }
})();
