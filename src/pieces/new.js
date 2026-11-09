/* ---------- движение (по мотивам join-way.com) ---------- */
(function(){
  var root = document.documentElement, body = document.body;
  root.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var bot = !!navigator.webdriver;
  function $(s){ return document.querySelector(s); }
  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* вкладки каталога */
  var tabs = [].slice.call(document.querySelectorAll('#tabs [role=tab]')), prods = [].slice.call(document.querySelectorAll('#cgrid .product'));
  function pick(i){
    var id = tabs[i].dataset.t;
    prods.forEach(function(p){ p.classList.toggle('on', p.id === id); });
    tabs.forEach(function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
  }
  if (tabs.length && tabs.length === prods.length) {
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ pick(i); });
      t.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); var n = (i + d + tabs.length) % tabs.length; pick(n); tabs[n].focus();
      });
    });
    pick(0);
    var fromHash = function(){
      var id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch(e) { return; }
      var k = tabs.findIndex(function(t){ return t.dataset.t === id; });
      if (k >= 0) pick(k);
    };
    window.addEventListener('hashchange', fromHash); fromHash();
  }

  /* иллюстрации отраслей: без движения при «уменьшить движение» */
  if (reduce) document.querySelectorAll('.ind-svg').forEach(function(s){ if (s.pauseAnimations) s.pauseAnimations(); });

  if (bot) { var hb = document.querySelector('.hart'); if (hb) hb.classList.add('go'); return; }

  function textPart(text, delay){
    var motion = document.createElement('span');
    motion.className = 'text-motion';
    motion.style.setProperty('--text-delay', delay + 'ms');
    motion.textContent = text;
    // Когда слово доехало, возвращаем обычный текст: Safari не держит лишних слоёв
    var done = function(e){
      if (e.target !== motion || !motion.parentNode || (e.propertyName && e.propertyName !== 'transform')) return;
      motion.parentNode.replaceChild(document.createTextNode(motion.textContent), motion);
    };
    motion.addEventListener('animationend', done);
    motion.addEventListener('transitionend', done);
    return motion;
  }

  /* столбцы на первом экране растут после заставки */
  var hart = $('.hart');
  function hartGo(){ if (hart) hart.classList.add('go'); }
  /* заставка: один раз за сессию */
  if (!reduce) {
    var seen = false; try { seen = sessionStorage.getItem('rr_splash'); } catch(e) {}
    if (!seen) {
      var sp = document.createElement('div'); sp.className = 'splash'; sp.innerHTML = '<i></i>'; body.appendChild(sp);
      try { sessionStorage.setItem('rr_splash', '1'); } catch(e) {}
      setTimeout(function(){ sp.classList.add('out'); setTimeout(function(){ sp.remove(); }, 800); hartGo(); }, 1000);
    }
    if (seen) setTimeout(hartGo, 200);
    var title = $('#h1');
    title.classList.add('text-intro');
    title.querySelectorAll('.ln').forEach(function(line, i){
      var text = line.firstChild;
      text.replaceWith(textPart(text.textContent, (seen ? 40 : 1080) + i * 90));
    });
  }

  /* появление блоков снизу */
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = ['.sh','.panel-art','.cols3>div','.dsub','.ditem','.tabs','.cgrid','.steps li','.way','.faqlist details','.cta .box>div','#lead'].join(',');
    var seenP = new Map(), targets = [].slice.call(document.querySelectorAll(sel));
    var headings = [].slice.call(document.querySelectorAll('#sheet h2.t'));
    headings.forEach(function(heading){
      var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT), nodes = [], index = 0;
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(node){
        var parts = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function(word){
          if (!word) return;
          parts.appendChild(/^\s+$/.test(word) ? document.createTextNode(word) : textPart(word, 80 + index++ * 55));
        });
        node.replaceWith(parts);
      });
      heading.classList.add('text-words');
    });
    targets.forEach(function(el){
      var p = el.parentNode, n = seenP.get(p) || 0; seenP.set(p, n + 1);
      el.style.setProperty('--d', Math.min(n, 5) * 0.08 + 's'); el.classList.add('rv');
    });
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        if (el.classList.contains('rv')) setTimeout(function(){ el.classList.add('done'); }, 1500);
      });
    }, {threshold: 0.1, rootMargin: '0px 0px -6% 0px'});
    targets.concat(headings).forEach(function(el){ io.observe(el); });
  }

  /* первый экран: окно-пилюля раскрывается на весь экран, дальше проступает надпись, потом наезжает лист */
  var heroTop = 'violet', heroBottom = 'violet';
  var COLORS = {violet: '#141414', lime: '#7b4dff', limeLow: '#7b4dff', bg: '#f4f4f2', deep: '#141414'};
  // Цветная подложка первого экрана: фиксированная и шире окна, заходит под панели Safari сверху и снизу
  var backdrop = document.createElement('div');
  backdrop.className = 'hero-backdrop'; backdrop.setAttribute('aria-hidden', 'true');
  body.insertBefore(backdrop, body.firstChild); root.classList.add('has-backdrop');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  var sheetEl = document.getElementById('sheet'), darks = [].slice.call(document.querySelectorAll('.dk'));
  function colorAt(y, hero){
    if (sheetEl && sheetEl.getBoundingClientRect().top > y) return hero;
    for (var i = 0; i < darks.length; i++) { var r = darks[i].getBoundingClientRect(); if (r.top <= y && r.bottom >= y) return 'deep'; }
    return 'bg';
  }
  var lastTop, lastBottom, stageHidden = false, heroOpen = false, heroEl = document.querySelector('.hero');
  function paintEdges(){
    var vh = window.innerHeight || 800;
    var t = colorAt(1, heroTop), b = colorAt(vh - 1, heroBottom);
    if (t !== lastTop) {
      lastTop = t; meta.content = COLORS[t];
      root.style.backgroundColor = COLORS[t]; body.style.backgroundColor = COLORS[t];
    }
    if (stage && sheetEl) {
      var covered = sheetEl.getBoundingClientRect().top <= 0;
      if (covered !== stageHidden) { stageHidden = covered; stage.style.visibility = backdrop.style.visibility = covered ? 'hidden' : ''; }
    }
    if (b !== lastBottom) { lastBottom = b; }
  }
  var stage = $('#stage'), htext = $('#htext'), himg = $('#himg'), hword = $('#hword'), pill = $('#pill');
  var R = null;
  function measure(){
    var keep = htext.style.transform; htext.style.transform = 'none';
    var pr = pill.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    R = {l: pr.left - sr.left, t: pr.top - sr.top, r: sr.right - pr.right, b: sr.bottom - pr.bottom, h: pr.height};
    htext.style.transform = keep; frame();
  }
  var sy = window.scrollY || 0, last = 0, raf = 0;
  function frame(){
    var y = sy, vh = window.innerHeight || 800;
    if (reduce || !R) { paintEdges(); return; }
    var t = clamp(y / (vh * 0.6)), e = 1 - Math.pow(1 - t, 3);
    var rad = Math.max(0, R.h / 2 * (1 - e));
    himg.style.clipPath = 'inset(' + (R.t * (1 - e)) + 'px ' + (R.r * (1 - e)) + 'px ' + (R.b * (1 - e)) + 'px ' + (R.l * (1 - e)) + 'px round ' + rad + 'px)';
    himg.style.setProperty('--sc', (1.18 - 0.18 * e).toFixed(3));
    var to = clamp(y / (vh * 0.3));
    htext.style.opacity = (1 - to).toFixed(3);
    htext.style.transform = 'translateY(' + (-to * 50).toFixed(1) + 'px)';
    var wi = clamp((y - vh * 0.3) / (vh * 0.45)), wout = 1 - clamp((y - vh * 1.25) / (vh * 0.6));
    hword.style.setProperty('--wo', (wi * wout).toFixed(3));
    hword.style.setProperty('--wy', ((1 - wi) * 40 - clamp((y - vh) / vh) * 60).toFixed(1) + 'px');
    // Safari берёт цвет панелей у элемента под краем экрана: когда лаймовое окно раскрылось, им должно быть оно
    var open = e > 0.985;
    if (open !== heroOpen) {
      heroOpen = open;
      himg.style.pointerEvents = open ? 'auto' : 'none';
      // Safari перечитывает цвет нижней панели, когда у края появляется новый фиксированный слой,
      // поэтому подложку не перекрашиваем, а меняем на новую
      var next = backdrop.cloneNode(false);
      next.style.backgroundColor = open ? COLORS.lime : COLORS.violet;
      backdrop.replaceWith(next); backdrop = next;
    }
    heroTop = R.t * (1 - e) < 2 ? 'lime' : 'violet';
    heroBottom = R.b * (1 - e) < 2 ? 'limeLow' : 'violet';
    paintEdges();
  }
  function step(now){
    var target = window.scrollY || root.scrollTop || 0;
    var dt = last ? Math.min(32, now - last) : 16; last = now;
    sy += (target - sy) * (1 - Math.exp(-dt / 70));
    if (Math.abs(target - sy) < .5) sy = target;
    frame();
    if (sy !== target) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
  }
  window.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(step); }, {passive: true});
  window.addEventListener('resize', function(){ sy = window.scrollY || 0; measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();


  /* ===== Живые эффекты ===== */
  function onScreen(el, cb, opts){ if (!el || !('IntersectionObserver' in window)) return; new IntersectionObserver(function(es){ cb(es[0].isIntersecting); }, opts || {}).observe(el); }

  /* 3. Свет за курсором на первом экране */
  (function(){
    var stage = $('#stage'); if (!stage || reduce) return;
    var tx = 72, ty = 45, x = 72, y = 45, user = false, live = true, t0 = performance.now();
    stage.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect(); user = true;
      tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100;
    });
    stage.addEventListener('pointerleave', function(){ user = false; });
    onScreen(stage, function(v){ live = v; });
    (function loop(now){
      if (live) {
        if (!user) { var k = (now - t0) / 1000; tx = 64 + Math.sin(k * .35) * 22; ty = 48 + Math.cos(k * .27) * 22; }
        x += (tx - x) * .08; y += (ty - y) * .08;
        stage.style.setProperty('--mx', x.toFixed(2) + '%'); stage.style.setProperty('--my', y.toFixed(2) + '%');
      }
      requestAnimationFrame(loop);
    })(t0);
  })();

  /* 2. Жидкий градиент в окне «РОБОРАБ» */
  (function(){
    var c = $('#liquid'); if (!c) return;
    var ctx = c.getContext('2d'), live = false;
    var blobs = [
      {c:'#7B4DFF', r:.55, x:.3, y:.4, sx:.13, sy:.17, p:0},
      {c:'#141414', r:.5, x:.75, y:.6, sx:.11, sy:.09, p:1.7},
      {c:'#B79BFF', r:.38, x:.6, y:.25, sx:.17, sy:.13, p:3.1},
      {c:'#3B1F9E', r:.45, x:.2, y:.8, sx:.09, sy:.15, p:4.4}
    ];
    function size(){ c.width = 160; c.height = Math.max(60, Math.round(160 * c.clientHeight / Math.max(1, c.clientWidth))); }
    size(); window.addEventListener('resize', size);
    onScreen($('#himg'), function(v){ live = v; });
    function draw(now){
      var t = reduce ? 0 : now / 1000, w = c.width, h = c.height;
      ctx.fillStyle = '#6A3FF0'; ctx.fillRect(0, 0, w, h);
      blobs.forEach(function(b){
        var x = (b.x + Math.sin(t * b.sx + b.p) * .22) * w, y = (b.y + Math.cos(t * b.sy + b.p) * .22) * h, r = b.r * Math.max(w, h);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, b.c); g.addColorStop(1, b.c + '00');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
    }
    draw(0);
    (function loop(now){ if (live && !reduce) draw(now); requestAnimationFrame(loop); })(0);
  })();

  /* 4. Расшифровка меток разделов */
  (function(){
    var CH = '█▓▒░<>/\\01#%АБВГДЕЖЗИК', labs = [].slice.call(document.querySelectorAll('#sheet .lab'));
    labs.forEach(function(el){
      el.dataset.text = el.textContent; el.classList.add('scr');
      onScreen(el, function(v){
        if (!v || el.dataset.done || reduce) return; el.dataset.done = '1';
        var text = el.dataset.text, f = 0, total = 22;
        el.style.minWidth = el.offsetWidth + 'px';
        var t = setInterval(function(){
          f++;
          el.textContent = text.split('').map(function(ch, i){ return ch === ' ' ? ' ' : i < (f / total) * text.length ? ch : CH[(Math.random() * CH.length) | 0]; }).join('');
          if (f >= total) { clearInterval(t); el.textContent = text; }
        }, 45);
      }, {threshold: .6});
    });
  })();

  /* 5. Чат печатает поверх телефона */
  (function(){
    var box = $('#dchat'); if (!box) return;
    var SCRIPT = [
      ['me', 'Сдаю 4 квартиры посуточно, путаюсь в бронях'],
      ['bot', 'Понял. На скольких площадках объявления?'],
      ['me', 'Авито и Суточно'],
      ['bot', 'Подойдёт Букинг-CRM: даты закроются на обеих площадках сами.']
    ];
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function add(who, text){ var d = document.createElement('div'); d.className = 'dmsg' + (who === 'me' ? ' me' : ''); d.textContent = text; box.appendChild(d); while (box.children.length > 4) box.firstChild.remove(); return d; }
    if (reduce) { SCRIPT.forEach(function(m){ add(m[0], m[1]); }); return; }
    var started = false, live = false;
    async function play(){
      for (;;) {
        box.innerHTML = '';
        await wait(800);
        for (var i = 0; i < SCRIPT.length; i++) {
          while (!live) await wait(400);
          var who = SCRIPT[i][0], text = SCRIPT[i][1];
          if (who === 'bot') {
            var t = document.createElement('div'); t.className = 'dmsg typing'; t.innerHTML = '<i></i><i></i><i></i>'; box.appendChild(t);
            await wait(1000); t.remove();
            var d = add(who, '');
            for (var k = 1; k <= text.length; k++) { d.textContent = text.slice(0, k); await wait(22); }
          } else { await wait(600); add(who, text); }
          await wait(900);
        }
        await wait(4000);
      }
    }
    onScreen(box, function(v){ live = v; if (v && !started) { started = true; play(); } }, {threshold: .3});
  })();

  /* 7. Линия через шаги */
  (function(){
    var list = $('.steps'); if (!list) return;
    var items = [].slice.call(list.children);
    var line = document.createElement('div'); line.className = 'steps-line'; line.setAttribute('aria-hidden', 'true'); line.innerHTML = '<span></span>';
    list.appendChild(line); list.classList.add('has-line');
    function update(){
      var r = list.getBoundingClientRect(), vh = window.innerHeight || 800;
      var p = reduce ? 1 : clamp((vh * .78 - r.top) / (r.height * .85));
      list.style.setProperty('--sp', (p * 100).toFixed(1) + '%');
      items.forEach(function(li, i){ li.classList.toggle('lit', p >= (i + .25) / items.length); });
    }
    var tk = false;
    window.addEventListener('scroll', function(){ if (!tk) { tk = true; requestAnimationFrame(function(){ tk = false; update(); }); } }, {passive: true});
    window.addEventListener('resize', update); update();
  })();

  /* 8. Объёмные экраны в каталоге */
  (function(){
    if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    document.addEventListener('pointermove', function(e){
      var shot = e.target.closest && e.target.closest('.product-gallery .shot');
      if (!shot) return;
      var r = shot.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      shot.classList.add('tilting');
      shot.style.transform = 'rotateY(' + ((x - .5) * 14).toFixed(2) + 'deg) rotateX(' + ((.5 - y) * 10).toFixed(2) + 'deg) translateZ(8px)';
      shot.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); shot.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    document.addEventListener('pointerout', function(e){
      var shot = e.target.closest && e.target.closest('.product-gallery .shot');
      if (shot && !shot.contains(e.relatedTarget)) { shot.classList.remove('tilting'); shot.style.transform = ''; }
    });
  })();

  /* 1. «РОБОРАБ» в подвале из частиц */
  (function(){
    var wrap = $('#wm-wrap'), c = $('#wm-dots'), wm = wrap && wrap.querySelector('.wm');
    if (!wrap || !c || !c.getContext) return;
    var ctx = c.getContext('2d'), pts = [], W = 0, H = 0, dpr = 1, mx = -9999, my = -9999, live = false;
    function build(){
      dpr = Math.min(2, window.devicePixelRatio || 1); W = wrap.clientWidth; H = wrap.clientHeight;
      if (!W || !H) return;
      c.width = W * dpr; c.height = H * dpr;
      var cs = getComputedStyle(wm), o = document.createElement('canvas'); o.width = W; o.height = H;
      var ox = o.getContext('2d');
      ox.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      ox.fillStyle = '#000'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
      ox.fillText('РОБОРАБ', W / 2, H / 2 + parseFloat(cs.fontSize) * .04);
      var data = ox.getImageData(0, 0, W, H).data, step = Math.max(3, Math.round(W / 240)), old = pts; pts = [];
      for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) {
          var p = old[pts.length] || {x: x, y: y, vx: 0, vy: 0};
          p.hx = x; p.hy = y; p.s = step * .42; p.v = Math.random() < .07; pts.push(p);
        }
      }
      root.classList.add('has-dots');
      paint();
    }
    function paint(){
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var R = Math.max(60, W * .07), moving = 0;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (R - d) / R * 6; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx += (p.hx - p.x) * .05; p.vy += (p.hy - p.y) * .05; p.vx *= .82; p.vy *= .82; p.x += p.vx; p.y += p.vy;
        var m = Math.abs(p.vx) + Math.abs(p.vy) > .5; if (m) moving++;
        ctx.fillStyle = p.v || m ? '#7B4DFF' : '#141414';
        ctx.fillRect(p.x, p.y, p.s * 2, p.s * 2);
      }
      return moving;
    }
    var raf = 0;
    function loop(){ raf = 0; var moving = paint(); if (live && (moving || mx > -9000)) raf = requestAnimationFrame(loop); }
    function kick(){ if (!raf) raf = requestAnimationFrame(loop); }
    function pos(e){ var r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; kick(); }
    c.addEventListener('pointermove', pos); c.addEventListener('pointerdown', pos);
    c.addEventListener('pointerleave', function(){ mx = my = -9999; kick(); });
    c.addEventListener('pointerup', function(e){ if (e.pointerType !== 'mouse') { mx = my = -9999; kick(); } });
    onScreen(wrap, function(v){ live = v; if (v) kick(); });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(build);
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(build, 150); });
  })();
})();
