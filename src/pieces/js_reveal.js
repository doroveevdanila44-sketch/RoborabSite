/* РОБОРАБ: единое появление экрана. Каждая часть выезжает из-под соседа.
   Разметка: data-rr-from="top|left|right|bottom|fade"
             data-rr-order="N"  (равные номера идут одновременно, шаг между номерами 480 мс)
             data-rr-parent="селектор" (необязательно: сосед, из которого выезжает, он слегка вздрагивает)
   Запуск:   RoborabReveal.run(rootElement, {speed:1})  // speed < 1 быстрее, > 1 медленнее */
(function (g) {
  'use strict';
  var EASE = 'cubic-bezier(.45,.05,.25,1)';   // мягкий вход и мягкий выход, без резкого старта
  var DUR = 1400, STEP = 480, GAP = 12, STRETCH = 1.1;

  function reduced() {
    return g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Выезд одного элемента: сдвиг, открытие по краю соседа, лёгкая вытяжка как у жидкости, мягкое появление
  function emerge(el, dir, o) {
    o = o || {};
    var r = el.getBoundingClientRect();
    var gap = o.gap == null ? GAP : o.gap, dur = (o.dur || DUR) * (o.speed || 1), delay = (o.delay || 0) * (o.speed || 1);
    var s, from, to, clipFrom, origin, stretch;
    if (dir === 'fade') {
      from = { opacity: 0, transform: 'translateY(10px)' }; to = { opacity: 1, transform: 'none' };
      return el.animate([from, to], { duration: dur, delay: delay, easing: EASE, fill: 'both' });
    }
    var vert = dir === 'top' || dir === 'bottom';
    s = (vert ? r.height : r.width) + gap;
    var sign = (dir === 'top' || dir === 'left') ? -1 : 1;
    var ax = vert ? 'Y' : 'X';
    origin = { top: '50% 0', bottom: '50% 100%', left: '0 50%', right: '100% 50%' }[dir];
    clipFrom = { top: 'inset(' + s + 'px 0 0 0)', bottom: 'inset(0 0 ' + s + 'px 0)', left: 'inset(0 0 0 ' + s + 'px)', right: 'inset(0 ' + s + 'px 0 0)' }[dir];
    stretch = 'scale' + ax + '(' + STRETCH + ')';
    el.style.transformOrigin = origin;
    return el.animate([
      { transform: 'translate' + ax + '(' + (sign * s) + 'px) ' + stretch, clipPath: clipFrom, opacity: 0 },
      { opacity: 1, offset: .3 },
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1 }
    ], { duration: dur, delay: delay, easing: EASE, fill: 'both' });
  }

  // Сосед чуть вздрагивает, когда из него что-то выезжает
  function nudge(el, delay, speed) {
    return el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.985)', offset: .35 }, { transform: 'scale(1)' }],
      { duration: 800 * speed, delay: delay + 120 * speed, easing: 'ease-in-out' });
  }

  function run(root, opts) {
    opts = opts || {};
    var speed = opts.speed || 1, list = [].slice.call((root || document).querySelectorAll('[data-rr-from]')), anims = [];
    list.forEach(function (el) { el.__rrDir = el.getAttribute('data-rr-from'); });
    if (reduced()) return { cancel: function () {}, finished: Promise.resolve() };
    var base = opts.delay || 0;
    list.forEach(function (el, i) {
      var order = el.hasAttribute('data-rr-order') ? +el.getAttribute('data-rr-order') : i;
      var delay = base + order * STEP;
      anims.push(emerge(el, el.__rrDir, { delay: delay, speed: speed, gap: +el.getAttribute('data-rr-gap') || GAP }));
      var sel = el.getAttribute('data-rr-parent');
      if (sel) { var p = (root || document).querySelector(sel); if (p) anims.push(nudge(p, delay * speed, speed)); }
    });
    var fin = Promise.all(anims.map(function (a) { return a.finished.catch(function () {}); }));
    return { cancel: function () { anims.forEach(function (a) { a.cancel(); }); }, finished: fin };
  }

  g.RoborabReveal = { run: run, emerge: emerge, STEP: STEP, DUR: DUR };
})(window);
