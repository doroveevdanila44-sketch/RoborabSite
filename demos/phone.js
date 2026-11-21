(() => {
  const base = new URL('.', document.currentScript.src);
  const products = {
    booking: { title: 'Букинг-CRM', route: '#calendar', poster: 'booking-calendar' },
    construction: { title: 'Строй-учёт', poster: 'stroy-home' },
    tax: { title: 'Агент по НДС', poster: 'tax-overview' },
    fitness: { title: 'Глаза фитнеса', poster: 'fitness-dashboard' }
  };
  const signalIcons = '<svg class="rr-demo-icons" viewBox="0 0 42 13" fill="currentColor" aria-hidden="true"><path d="M0 9h3v3H0zm4-2h3v5H4zm4-3h3v8H8zm4-3h3v11h-3z"/><rect x="21" y="2" width="17" height="9" rx="2.5" fill="none" stroke="currentColor"/><rect x="23" y="4" width="13" height="5" rx="1"/><path d="M39.5 4.5q2.5 1.5 0 4z"/></svg>';

  function installChrome(frame, key, reveal) {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc?.body || !win || doc.documentElement.dataset.demoScreen) return;
    const root = doc.documentElement;
    root.dataset.demoScreen = key;
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('screen.css', base).href;
    const status = doc.createElement('div');
    status.className = 'rr-demo-status';
    status.setAttribute('aria-hidden', 'true');
    status.innerHTML = '<span>9:41</span><i class="rr-demo-island"></i>' + '<span class="rr-demo-level">100% ' + signalIcons + '</span>';
    doc.body.append(status);

    const dismissHint = () => { root.dataset.demoTouched = 'true'; };
    doc.addEventListener('pointerdown', dismissHint, { once: true, capture: true });
    doc.addEventListener('keydown', dismissHint, { once: true, capture: true });
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = 0;
    let changed = false;
    let target = 0;
    let shift = 0;
    let height = 102;
    let lastTime = 0;
    let source;
    let previous = 0;

    function readScroll() {
      const sheet = doc.querySelector('.sheet.open');
      const header = sheet?.querySelector('.rr-header') ||
        doc.querySelector('.app-header, .topbar, .app-shell > .top');
      if (!header) return;
      height = header.offsetHeight || height;
      let scroll = doc.scrollingElement;
      if (sheet) scroll = sheet.querySelector('.sheet-body');
      else if (key === 'tax') scroll = doc.querySelector('.chat-scroll, .app-main:not(:has(.chat-scroll))') || scroll;
      else if (key === 'fitness') {
        const shell = doc.querySelector('.app-shell');
        if (shell && win.getComputedStyle(shell).overflowY === 'auto') scroll = shell;
      }
      if (!scroll) return;
      const position = Math.max(0, Math.min(scroll.scrollTop, scroll.scrollHeight - scroll.clientHeight));
      if (source !== scroll) target = Math.min(height, position);
      else target = Math.max(0, Math.min(height, target + position - previous));
      if (position === 0 || header.querySelector(':focus-visible')) target = 0;
      source = scroll;
      previous = position;
    }

    function paint(now) {
      if (changed) {
        changed = false;
        readScroll();
      }
      const dt = lastTime ? Math.min(48, now - lastTime) : 16;
      lastTime = now;
      shift = reduced.matches ? target : shift + (target - shift) * (1 - Math.exp(-dt / 42));
      if (Math.abs(target - shift) < .15) shift = target;
      // The clock turns dark as the header's rounded bottom clears the clock.
      const safe = Number.parseFloat(win.getComputedStyle(status).height) || 46;
      const exposure = Math.max(0, Math.min(1, 1 - (height - shift) / safe));
      root.style.setProperty('--demo-chrome-shift', -shift.toFixed(2) + 'px');
      root.style.setProperty('--demo-glass', exposure.toFixed(3));
      animation = shift === target ? 0 : win.requestAnimationFrame(paint);
      if (!animation) lastTime = 0;
    }
    function update() {
      changed = true;
      if (!animation) animation = win.requestAnimationFrame(paint);
    }
    win.addEventListener('scroll', update, { capture: true, passive: true });
    win.addEventListener('resize', update);
    win.addEventListener('hashchange', update);
    doc.addEventListener('focusin', update);
    doc.addEventListener('rr:header-reset', update);
    let pendingAssets = 2;
    let revealed = false;
    function revealWhenReady() {
      if (!revealed && !pendingAssets && doc.querySelector('main h1, main h2, main h3')) {
        revealed = true;
        reveal();
      }
    }
    function assetSettled() {
      pendingAssets--;
      revealWhenReady();
    }
    style.addEventListener('load', update, { once: true });
    style.addEventListener('load', assetSettled, { once: true });
    style.addEventListener('error', assetSettled, { once: true });
    doc.head.append(style);
    const controls = doc.createElement('script');
    controls.src = new URL('header.js', base).href;
    controls.addEventListener('load', assetSettled, { once: true });
    controls.addEventListener('error', assetSettled, { once: true });
    doc.head.append(controls);
    // Routes replace React roots and detail sheets can open without a scroll.
    const observer = new win.MutationObserver(() => { update(); revealWhenReady(); });
    observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    update();
  }

  function mount(host) {
    const key = host.dataset.app;
    if (!Object.hasOwn(products, key) || host.querySelector('iframe')) return;
    const product = products[key];
    let screen = host.querySelector('.demo-display');
    if (!screen) {
      // Also support demo hosts inserted without server-rendered preview markup.
      const device = document.createElement('div');
      device.className = 'demo-device';
      screen = document.createElement('div');
      screen.className = 'demo-display';
      const poster = new Image();
      poster.className = 'demo-poster';
      poster.alt = product.title;
      poster.src = new URL('../assets/' + product.poster + '.webp', base).href;
      screen.append(poster);
      device.append(screen);
      host.append(device);
    }
    const caption = document.createElement('p');
    caption.className = 'demo-caption';
    caption.textContent = 'Попробуйте сами — нажмите на колокольчик или откройте раздел приложения.';
    host.append(caption);
    const frame = document.createElement('iframe');
    frame.title = product.title + ' — демоприложение';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals allow-downloads allow-top-navigation-by-user-activation');
    frame.inert = true;
    frame.addEventListener('load', () => installChrome(frame, key, () => {
      host.classList.add('demo-ready');
      frame.inert = false;
    }));
    function fit() {
      const scale = screen.clientWidth / 390;
      if (!scale) return;
      host.style.setProperty('--demo-screen-scale', scale);
      host.style.setProperty('--demo-screen-height', screen.clientHeight / scale + 'px');
    }
    fit();
    new ResizeObserver(fit).observe(screen);
    frame.src = new URL(key + '/app.html' + (product.route || ''), base).href;
    screen.append(frame);
  }

  const selector = '.automation-demo[data-app]';
  const warmGroups = new WeakSet();
  function warm(group) {
    warmGroups.add(group);
    if (group.matches(selector)) mount(group);
    else group.querySelectorAll(selector).forEach(mount);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        warm(entry.target);
      }
    }
  }, { rootMargin: '1200px 0px' });
  function watch(host) {
    const group = host.closest('#cases') || host;
    if (warmGroups.has(group)) mount(host);
    else observer.observe(group);
  }
  function register(node) {
    if (!(node instanceof Element)) return;
    if (node.matches(selector)) watch(node);
    node.querySelectorAll(selector).forEach(watch);
  }
  register(document.documentElement);
  new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(register);
  }).observe(document.body, { childList: true, subtree: true });
})();
