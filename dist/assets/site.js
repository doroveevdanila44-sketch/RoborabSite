(function(){var b=document.querySelector('.app'),d=document.getElementById('stores');if(!b||!d)return;
b.addEventListener('click',function(){if(d.showModal)d.showModal();else d.setAttribute('open','');try{d.focus({preventScroll:true})}catch(e){}});
d.addEventListener('click',function(e){
  if(e.target.closest('.dl-x')||e.target===d){d.close();return}
  var a=e.target.closest('a[data-empty]');if(a)e.preventDefault()});
})();

(function(){var d=document.getElementById('lb');if(!d)return;var st=document.getElementById('lbst'),cn=document.getElementById('lbcn'),list=[],i=0;
function show(){
  var shot=list[i];
  st.style.backgroundImage=getComputedStyle(shot).backgroundImage;
  if(shot.dataset.clock)st.dataset.clock=shot.dataset.clock;else delete st.dataset.clock;
  st.textContent='';
  shot.querySelectorAll('.shot-brand,.shot-url').forEach(function(overlay){ st.appendChild(overlay.cloneNode(true)); });
  cn.textContent=(i+1)+' / '+list.length;
}
function go(n){i=(i+n+list.length)%list.length;show()}
document.querySelectorAll('.shots').forEach(function(g){g.querySelectorAll('.shot').forEach(function(b,n){b.addEventListener('click',function(){list=[].slice.call(g.querySelectorAll('.shot'));i=n;show();if(d.showModal)d.showModal();else d.setAttribute('open','')})})});
d.querySelector('.x').addEventListener('click',function(){d.close()});
d.querySelector('.pv').addEventListener('click',function(){go(-1)});
d.querySelector('.nx').addEventListener('click',function(){go(1)});
d.addEventListener('click',function(e){if(e.target===d)d.close()});
d.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1)});
var x0=null;st.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
st.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)go(dx<0?1:-1);x0=null});
st.addEventListener('click',function(e){var r=st.getBoundingClientRect();go(e.clientX>r.left+r.width/2?1:-1)});
})();


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
  var COLORS = {violet: '#141414', lime: '#4a24c9', limeLow: '#4a24c9', bg: '#f4f4f2', deep: '#141414'};
  // Цветная подложка первого экрана: фиксированная и шире окна, заходит под панели Safari сверху и снизу
  // Две фиксированные подложки, тёмная и фиолетовая. Safari пересчитывает цвет панелей,
  // когда слой у края скрывается или появляется, поэтому переключаем видимость, а не цвет.
  function makeBackdrop(color){
    var d = document.createElement('div');
    d.className = 'hero-backdrop'; d.setAttribute('aria-hidden', 'true'); d.style.backgroundColor = color;
    body.insertBefore(d, body.firstChild); return d;
  }
  // Пока открыто окно с градиентом, фиксированных слоёв нет вовсе: панели берут цвет страницы,
  // а он совпадает с краями градиента, поэтому градиент как будто продолжается под панелями.
  // Фиксированных слоёв у краёв нет совсем: с ними Safari заливает панели сплошным цветом,
  // а без них показывает под стеклом панелей саму страницу до края экрана.
  root.classList.add('has-backdrop');
  function showBackdrops(){}
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
      if (covered !== stageHidden) { stageHidden = covered; stage.style.visibility = covered ? 'hidden' : ''; showBackdrops(); }
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
    var wi = clamp((y - vh * 0.3) / (vh * 0.45)), wout = 1 - clamp((y - vh * 1.5) / (vh * 0.5));
    hword.style.setProperty('--wo', (wi * wout).toFixed(3));
    hword.style.setProperty('--wy', ((1 - wi) * 40 - clamp((y - vh) / vh) * 60).toFixed(1) + 'px');
    // Safari берёт цвет панелей у элемента под краем экрана: когда лаймовое окно раскрылось, им должно быть оно
    var open = e > 0.985;
    if (open !== heroOpen) {
      heroOpen = open;
      himg.style.pointerEvents = open ? 'auto' : 'none';
      showBackdrops();
    }
    heroTop = open ? 'lime' : 'violet';
    heroBottom = open ? 'limeLow' : 'violet';
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

  /* 3. Свет за курсором на первом экране: слой двигается трансформом, без перерисовки */
  (function(){
    var stage = $('#stage'), spot = document.querySelector('.hspot'); if (!stage || !spot || reduce) return;
    var touch = !matchMedia('(hover:hover) and (pointer:fine)').matches;
    var tx = .72, ty = .45, x = tx, y = ty, live = true, raf = 0, t0 = performance.now(), W = 1, H = 1;
    function size(){ W = stage.clientWidth; H = stage.clientHeight; }
    size(); window.addEventListener('resize', size);
    function step(now){
      raf = 0;
      if (touch) { var k = (now - t0) / 1000; tx = .64 + Math.sin(k * .35) * .22; ty = .48 + Math.cos(k * .27) * .22; }
      x += (tx - x) * .1; y += (ty - y) * .1;
      spot.style.transform = 'translate3d(' + (x * W - 380).toFixed(1) + 'px,' + (y * H - 380).toFixed(1) + 'px,0)';
      if (live && (touch || Math.abs(tx - x) + Math.abs(ty - y) > .001)) raf = requestAnimationFrame(step);
    }
    function kick(){ if (!raf && live) raf = requestAnimationFrame(step); }
    stage.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; kick();
    });
    onScreen(stage, function(v){ live = v; kick(); });
    kick();
  })();

  /* 2. Жидкий градиент в окне «РОБОРАБ»: маленький холст, браузер сам растягивает, 30 кадров в секунду */
  (function(){
    var c = $('#liquid'); if (!c) return;
    var ctx = c.getContext('2d', {alpha: false}), live = false, last = 0;
    var blobs = [
      {c:[123,77,255], a:.95, r:.62, x:.25, y:.35, ax:.34, ay:.3, sx:.42, sy:.37, p:0},
      {c:[18,14,32], a:.9, r:.55, x:.78, y:.68, ax:.3, ay:.28, sx:.33, sy:.46, p:1.7},
      {c:[205,185,255], a:.95, r:.5, x:.62, y:.22, ax:.36, ay:.32, sx:.51, sy:.39, p:3.1},
      {c:[44,20,130], a:.9, r:.55, x:.18, y:.82, ax:.3, ay:.34, sx:.29, sy:.44, p:4.4},
      {c:[160,110,255], a:.95, r:.46, x:.5, y:.5, ax:.4, ay:.36, sx:.57, sy:.31, p:2.2},
      {c:[20,20,20], a:.7, r:.45, x:.85, y:.15, ax:.3, ay:.3, sx:.36, sy:.52, p:5.3}
    ];
    try {
      var n = document.createElement('canvas'); n.width = n.height = 160; var nx = n.getContext('2d'), img = nx.createImageData(160, 160);
      for (var q = 0; q < img.data.length; q += 4) { var v = Math.random() * 255 | 0; img.data[q] = img.data[q + 1] = img.data[q + 2] = v; img.data[q + 3] = 22; }
      nx.putImageData(img, 0, 0); c.parentNode.style.setProperty('--grain', 'url(' + n.toDataURL() + ')');
    } catch (e) {}
    function size(){ c.width = 128; c.height = Math.max(48, Math.round(128 * c.clientHeight / Math.max(1, c.clientWidth))); }
    size(); window.addEventListener('resize', size);
    onScreen($('#himg'), function(v){ live = v; if (v) kick(); });
    function draw(t){
      var w = c.width, h = c.height, m = Math.max(w, h);
      ctx.fillStyle = '#4a24c9'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = (b.x + Math.sin(t * b.sx + b.p) * b.ax + Math.sin(t * b.sy * .6 + b.p * 2) * .08) * w;
        var y = (b.y + Math.cos(t * b.sy + b.p) * b.ay) * h;
        var r = b.r * m * (1 + Math.sin(t * .5 + b.p) * .2);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r), col = b.c.join(',');
        g.addColorStop(0, 'rgba(' + col + ',' + b.a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
    }
    var raf = 0;
    function loop(now){
      raf = 0; if (!live) return;
      if (now - last > 33) { last = now; draw(now / 1000 * 1.7); }
      raf = requestAnimationFrame(loop);
    }
    function kick(){ if (!raf) raf = requestAnimationFrame(loop); }
    draw(0);
    if (reduce) live = false;
  })();

  /* Слово «РОБОРАБ» на холсте: только там, где первый экран держится анимацией по прокрутке (телефоны) */
  (function(){
    var hw = $('#hword'); if (!hw || !window.CSS || !CSS.supports) return;
    if (!matchMedia('(pointer:coarse)').matches || !CSS.supports('animation-timeline', 'scroll()')) return;
    var text = hw.textContent, c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
    function build(){
      var cs = getComputedStyle(hw), fs = parseFloat(cs.fontSize) || 80, W = hw.clientWidth; if (!W) return;
      var H = Math.ceil(fs * 1.4), dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.height = H + 'px'; c.style.top = ((fs - H) / 2) + 'px';
      var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      x.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      try { x.letterSpacing = cs.letterSpacing; } catch (e) {}
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
      x.fillText(text, W / 2, H / 2 + fs * .04);
    }
    hw.appendChild(c); hw.classList.add('is-canvas'); build();
    window.addEventListener('resize', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
  })();

  /* Иллюстрации отраслей двигаются, только когда видны */
  document.querySelectorAll('.ind-svg').forEach(function(svg){
    if (!svg.pauseAnimations) return;
    svg.pauseAnimations();
    if (!reduce) onScreen(svg, function(v){ if (v) svg.unpauseAnimations(); else svg.pauseAnimations(); });
  });

  /* 5. Чат печатает поверх телефона */
  (function(){
    var box = $('#dchat'); if (!box) return;
    var SCRIPT = [
      ['bot', 'Здравствуйте! Расскажите о своём деле: я на связи в любое время, а специалист изучит итог и предложит решение.'],
      ['me', 'Сдаю 4 квартиры посуточно, путаюсь в бронях'],
      ['bot', 'Понял. На скольких площадках объявления?'],
      ['me', 'Авито и Суточно'],
      ['bot', 'Подойдёт Букинг-CRM: даты закроются на обеих площадках сами.']
    ];
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function add(who, text){ var d = document.createElement('div'); d.className = 'dmsg' + (who === 'me' ? ' me' : ''); d.textContent = text; box.appendChild(d); fit(); return d; }
    function fit(){ while (box.children.length > 1 && box.scrollHeight > box.clientHeight + 1) box.firstChild.remove(); }
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
            for (var k = 1; k <= text.length; k++) { d.textContent = text.slice(0, k); fit(); await wait(16); }
          } else { await wait(600); add(who, text); }
          await wait(900);
        }
        await wait(4000);
      }
    }
    onScreen(box, function(v){ live = v; if (v && !started) { started = true; play(); } }, {threshold: .3});
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

})();
