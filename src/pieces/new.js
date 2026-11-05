/* ---------- движение (по мотивам join-way.com) ---------- */
(function(){
  var root = document.documentElement, body = document.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var bot = !!navigator.webdriver;   /* при пререндере (headless) движение не включаем */
  function $(s){ return document.querySelector(s); }
  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* меню */

  /* вкладки каталога */
  var tabs = [].slice.call(document.querySelectorAll('#tabs [role=tab]')), prods = [].slice.call(document.querySelectorAll('#cgrid .product'));
  var cur = 0, timer = null, manual = false, DUR = 8000;
  function pick(i, user){
    if (i < 0 || i >= prods.length) return;
    cur = i;
    prods.forEach(function(p, k){ p.classList.toggle('on', k === i); });
    tabs.forEach(function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; t.classList.toggle('manual', !!manual); });
    clearTimeout(timer);
    if (!manual && !reduce && !bot) timer = setTimeout(function(){ pick((cur + 1) % prods.length); }, DUR);
  }
  function byId(id){ for (var k = 0; k < prods.length; k++) if (prods[k].id === id) return k; return -1; }
  if (tabs.length && tabs.length === prods.length) {
    tabs.forEach(function(t, i){
      t.style.setProperty('--tdur', DUR + 'ms');
      t.addEventListener('click', function(){ manual = true; pick(i); });
      t.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); manual = true; var n = (i + d + tabs.length) % tabs.length; pick(n); tabs[n].focus();
      });
    });
    var g = $('#tabs'); if (g) { ['mouseenter','touchstart','focusin'].forEach(function(ev){ g.addEventListener(ev, function(){ if (!manual) { manual = true; pick(cur); } }, {passive: true}); }); }
    var gg = $('#cgrid'); if (gg) gg.addEventListener('mouseenter', function(){ if (!manual) { manual = true; pick(cur); } });
    pick(0);
    var fromHash = function(){ var k = byId(decodeURIComponent(location.hash.slice(1))); if (k >= 0) { manual = true; pick(k); } };
    window.addEventListener('hashchange', fromHash); fromHash();
  }

  if (bot) return;

  /* заставка: один раз за сессию */
  if (!reduce) {
    var seen = false; try { seen = sessionStorage.getItem('rr_splash'); } catch(e) {}
    if (!seen) {
      var sp = document.createElement('div'); sp.className = 'splash'; sp.innerHTML = '<i></i>'; body.appendChild(sp);
      try { sessionStorage.setItem('rr_splash', '1'); } catch(e) {}
      setTimeout(function(){ sp.classList.add('out'); setTimeout(function(){ sp.remove(); }, 800); }, 1000);
    }
  }

  /* появление блоков снизу */
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = ['.sh','.note','.panel-art','.cols3>div','.dsub','.ditem','.tabs','.cgrid','.steps li','.way','.faqlist details','.cta .box>div','#lead','.mq'].join(',');
    var seenP = new Map(), targets = [].slice.call(document.querySelectorAll(sel));
    targets.forEach(function(el){
      var p = el.parentNode, n = seenP.get(p) || 0; seenP.set(p, n + 1);
      el.style.setProperty('--d', Math.min(n, 5) * 0.08 + 's'); el.classList.add('rv');
    });
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(function(){ el.classList.add('done'); }, 1500);
      });
    }, {threshold: 0.1, rootMargin: '0px 0px -6% 0px'});
    targets.forEach(function(el){ io.observe(el); });
  }

  /* первый экран: окно-пилюля раскрывается на весь экран, дальше проступает надпись, потом наезжает лист */
  var stage = $('#stage'), htext = $('#htext'), himg = $('#himg'), hword = $('#hword'), pill = $('#pill');
  var R = null;
  function measure(){
    var keep = htext.style.transform; htext.style.transform = 'none';
    var pr = pill.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    R = {l: pr.left - sr.left, t: pr.top - sr.top, r: sr.right - pr.right, b: sr.bottom - pr.bottom, h: pr.height};
    htext.style.transform = keep; frame();
  }
  function frame(){
    var y = window.scrollY || root.scrollTop, vh = window.innerHeight || 800;
    if (reduce || !R) return;
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
  }
  var tick = false;
  window.addEventListener('scroll', function(){ if (!tick) { tick = true; requestAnimationFrame(function(){ tick = false; frame(); }); } }, {passive: true});
  window.addEventListener('resize', function(){ measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();

  /* раскрытие блоков из «объекта»: окно растёт из малой формы по мере прокрутки (как первый экран) */
  if (!reduce && !bot) {
    var gx = [].slice.call(document.querySelectorAll('.dk,.panel-art,.cgrid,.cta .box,.tile'));
    gx.forEach(function(el){ el.classList.add('gx'); el.style.setProperty('--gp', 0); });
    var gtick = false;
    function grow(){
      var vh = window.innerHeight || 800;
      gx.forEach(function(el){
        var top = el.getBoundingClientRect().top;
        var p = clamp((vh * 0.96 - top) / (vh * (el.classList.contains('tile') ? 0.4 : 0.6)));
        var e = 1 - Math.pow(1 - p, 3);
        el.style.setProperty('--gp', e.toFixed(3));
        el.classList.toggle('gd', e >= 0.999);
      });
    }
    window.addEventListener('scroll', function(){ if (!gtick) { gtick = true; requestAnimationFrame(function(){ gtick = false; grow(); }); } }, {passive: true});
    window.addEventListener('resize', grow); window.addEventListener('load', grow); grow();
  }
})();
