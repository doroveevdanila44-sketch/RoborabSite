(() => {
  const base = new URL('.', document.currentScript.src);
  const signalIcons = '<svg class="rr-demo-icons" viewBox="0 0 42 13" fill="currentColor" aria-hidden="true"><path d="M0 9h3v3H0zm4-2h3v5H4zm4-3h3v8H8zm4-3h3v11h-3z"/><rect x="21" y="2" width="17" height="9" rx="2.5" fill="none" stroke="currentColor"/><rect x="23" y="4" width="13" height="5" rx="1"/><path d="M39.5 4.5q2.5 1.5 0 4z"/></svg>';

  function installChrome(frame, key, onAssetError) {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc?.body || !win || doc.documentElement.dataset.demoScreen) return;
    const root = doc.documentElement;
    root.dataset.demoScreen = key;
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.dataset.demoChrome = '';
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
    function assetFailed() {
      root.dataset.demoAssetError = 'true';
      onAssetError();
    }
    style.addEventListener('error', assetFailed, { once: true });
    style.addEventListener('load', update, { once: true });
    doc.head.append(style);
    const controls = doc.createElement('script');
    controls.src = new URL('header.js', base).href;
    controls.addEventListener('error', assetFailed, { once: true });
    doc.head.append(controls);
    // Routes replace React roots and detail sheets can open without a scroll.
    const observer = new win.MutationObserver(update);
    observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    update();
  }

  for (const host of document.querySelectorAll('.automation-demo[data-app]')) {
    const key = host.dataset.app;
    const screen = host.querySelector('.demo-display');
    const frame = screen.querySelector('iframe');
    const retry = screen.querySelector('.demo-retry');
    let attempts = 0;
    let checkTimer;

    function fit() {
      const scale = screen.clientWidth / 390;
      if (!scale) return;
      host.style.setProperty('--demo-screen-scale', scale);
      host.style.setProperty('--demo-screen-height', screen.clientHeight / scale + 'px');
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screen);
    else window.addEventListener('resize', fit);

    function reload() {
      clearTimeout(checkTimer);
      retry.hidden = true;
      const next = new URL(frame.src);
      next.searchParams.set('retry', String(Date.now()));
      frame.src = next.href;
    }

    function check() {
      const doc = frame.contentDocument;
      if (doc?.documentElement.dataset.demoApp === key &&
          !doc.documentElement.dataset.demoAssetError && doc.querySelector('main > *') &&
          Array.from(doc.querySelectorAll('link[rel="stylesheet"]:not([data-demo-chrome])')).every(link => link.sheet)) {
        retry.hidden = true;
        attempts = 0;
        return;
      }
      if (navigator.onLine && attempts < 2) {
        attempts++;
        reload();
      } else retry.hidden = false;
    }

    function scheduleCheck() {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(check, 2500 * (attempts + 1));
    }
    function loaded() {
      if (frame.contentDocument?.documentElement.dataset.demoApp === key) installChrome(frame, key, scheduleCheck);
      // Check for a blank route after scripts have run. Never gate rendering on this timer.
      scheduleCheck();
    }
    frame.addEventListener('load', loaded);
    frame.addEventListener('error', loaded);
    if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.URL !== 'about:blank') loaded();
    retry.addEventListener('click', () => { attempts = 0; reload(); });
    window.addEventListener('online', () => {
      if (!retry.hidden) { attempts = 0; reload(); }
    });
  }
})();
