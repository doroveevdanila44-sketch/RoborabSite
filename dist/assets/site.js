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

  if (bot) return;

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

  /* заставка: один раз за сессию */
  if (!reduce) {
    var seen = false; try { seen = sessionStorage.getItem('rr_splash'); } catch(e) {}
    if (!seen) {
      var sp = document.createElement('div'); sp.className = 'splash'; sp.innerHTML = '<i></i>'; body.appendChild(sp);
      try { sessionStorage.setItem('rr_splash', '1'); } catch(e) {}
      setTimeout(function(){ sp.classList.add('out'); setTimeout(function(){ sp.remove(); }, 800); }, 1000);
    }
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
  var COLORS = {violet: '#6a2cf0', lime: '#cdf200', limeLow: '#cdf200', bg: '#f5f2fc', deep: '#25104f'};
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
      backdrop.style.backgroundColor = open ? COLORS.lime : COLORS.violet;
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

})();
