(() => {
  const base = new URL('.', document.currentScript.src);
  const products = {
    booking: { title: 'Букинг-CRM', route: '#calendar' },
    construction: { title: 'Строй-учёт' },
    tax: { title: 'Агент по НДС' },
    fitness: { title: 'Глаза фитнеса' }
  };
  const signalIcons = '<svg class="rr-demo-icons" viewBox="0 0 42 13" fill="currentColor" aria-hidden="true"><path d="M0 9h3v3H0zm4-2h3v5H4zm4-3h3v8H8zm4-3h3v11h-3z"/><rect x="21" y="2" width="17" height="9" rx="2.5" fill="none" stroke="currentColor"/><rect x="23" y="4" width="13" height="5" rx="1"/><path d="M39.5 4.5q2.5 1.5 0 4z"/></svg>';

  function installChrome(frame, key) {
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
    status.innerHTML = '<span>9:41</span><i class="rr-demo-island"></i>' + signalIcons;
    doc.body.append(status);

    const dismissHint = () => { root.dataset.demoTouched = 'true'; };
    doc.addEventListener('pointerdown', dismissHint, { once: true, capture: true });
    doc.addEventListener('keydown', dismissHint, { once: true, capture: true });
    doc.head.append(style);
    const controls = doc.createElement('script');
    controls.src = new URL('header.js', base).href;
    doc.head.append(controls);

  }

  function mount(host) {
    const key = host.dataset.app;
    if (!Object.hasOwn(products, key) || host.querySelector('iframe')) return;
    const product = products[key];
    const device = document.createElement('div');
    device.className = 'demo-device';
    const screen = document.createElement('div');
    screen.className = 'demo-display';
    const caption = document.createElement('p');
    caption.className = 'demo-caption';
    caption.textContent = 'Попробуйте сами — нажмите на колокольчик или откройте раздел приложения.';
    device.append(screen);
    host.append(device, caption);
    const frame = document.createElement('iframe');
    frame.title = product.title + ' — демоприложение';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals allow-downloads');
    frame.addEventListener('load', () => installChrome(frame, key));
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

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRect.width && entry.intersectionRect.height) {
        observer.unobserve(entry.target);
        mount(entry.target);
      }
    }
  });
  function register(node) {
    if (!(node instanceof Element)) return;
    if (node.matches('.automation-demo[data-app]')) observer.observe(node);
    node.querySelectorAll('.automation-demo[data-app]').forEach(host => observer.observe(host));
  }
  register(document.documentElement);
  new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(register);
  }).observe(document.body, { childList: true, subtree: true });
})();
