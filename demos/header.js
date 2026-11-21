/* Adapt the original product controls inside the demo iframe. */
(() => {
  const app = document.documentElement.dataset.demoScreen;
  const native = app === 'booking' || app === 'construction';
  const icon = {
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + icon[name] + '</svg>';
  const dataRoute = app === 'fitness' ? '#/' : '#dashboard';
  let lastCount = 0;
  let alertEntries = [];
  let listVersion = '';
  let dialog;
  let dialogList;
  let dialogTitle;
  let mode = '';
  let returnRoute = null;
  let chatOrigin = '#dashboard';

  function el(tag, css, text) {
    const node = document.createElement(tag);
    node.className = css;
    if (text) node.textContent = text;
    return node;
  }
  function activeRoute() {
    return location.hash || dataRoute;
  }
  function readEntries() {
    if (app === 'tax') {
      const list = document.querySelector('.warns');
      if (!list) return null;
      return Array.from(list.querySelectorAll(':scope > li.warn'), row => ({
        title: row.querySelector('.warn-title').textContent.trim(),
        detail: row.querySelector('.warn-text').textContent.trim(),
        tag: row.querySelector('.pill')?.textContent.trim() || ''
      }));
    }
    const section = document.querySelector('[data-tour="home-expiring"]');
    if (!section) return null;
    return Array.from(section.querySelectorAll('li'), row => ({
      title: row.querySelector('.row-title a').textContent.trim(),
      href: row.querySelector('.row-title a').getAttribute('href'),
      detail: row.querySelector('.muted').textContent.trim(),
      note: row.querySelector('.note')?.textContent.trim() || ''
    }));
  }

  function drawList() {
    const content = document.createDocumentFragment();
    if (!alertEntries.length) {
      content.append(el('p', 'rr-inbox-empty', app === 'tax' ? 'Предупреждений нет.' : 'Нет абонементов, которые скоро закончатся.'));
    }
    for (const item of alertEntries) {
      if (app === 'tax') {
        const details = el('details', 'rr-inbox-item');
        const summary = el('summary', 'rr-inbox-summary');
        summary.append(el('strong', '', item.title), el('small', '', item.tag));
        details.append(summary, el('p', 'rr-inbox-detail', item.detail));
        content.append(details);
      } else {
        const card = el('article', 'rr-inbox-item');
        const link = el('a', 'rr-inbox-client', item.title);
        link.href = item.href;
        link.addEventListener('click', () => {
          returnRoute = null;
          dialog.close();
        });
        card.append(link, el('p', 'rr-inbox-detail', item.detail));
        if (item.note) card.append(el('p', 'rr-inbox-note', item.note));
        if (mode === 'messages') {
          const reminder = el('button', 'rr-inbox-remind', 'Напомнить');
          reminder.type = 'button';
          reminder.setAttribute('aria-label', 'Напомнить о продлении: ' + item.title);
          reminder.addEventListener('click', () => {
            const row = Array.from(document.querySelectorAll('[data-tour="home-expiring"] li'))
              .find(node => node.querySelector('.row-title a')?.getAttribute('href') === item.href);
            const action = row?.querySelector('.row-actions button');
            if (action && !action.disabled) action.click();
          });
          card.append(reminder);
        }
        content.append(card);
      }
    }
    dialogList.replaceChildren(content);
  }

  function inbox(nextMode) {
    if (!dialog) {
      dialog = el('dialog', 'rr-demo-inbox');
      dialog.setAttribute('aria-labelledby', 'rr-demo-inbox-title');
      const head = el('header', 'rr-inbox-head');
      dialogTitle = el('h2', '');
      dialogTitle.id = 'rr-demo-inbox-title';
      const close = el('button', 'rr-inbox-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Закрыть');
      close.addEventListener('click', () => dialog.close());
      head.append(dialogTitle, close);
      dialogList = el('div', 'rr-inbox-list');
      dialog.append(head, dialogList);
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        if (returnRoute && activeRoute() === dataRoute) location.hash = returnRoute;
        returnRoute = null;
        mode = '';
      });
    }
    mode = nextMode;
    dialogTitle.textContent = mode === 'messages' ? 'Сообщения о продлении' : 'Уведомления';
    returnRoute = activeRoute() !== dataRoute ? activeRoute() : null;
    if (returnRoute) location.hash = dataRoute;
    drawList();
    dialog.showModal();
  }

  function chat() {
    if (app === 'fitness') return inbox('messages');
    if (activeRoute() === '#agent') location.hash = chatOrigin;
    else {
      chatOrigin = activeRoute();
      location.hash = '#agent';
    }
  }

  function mountRow(header) {
    const row = el('div', 'rr-header-row rr-demo-controls');
    const word = el('span', 'rr-wordmark', 'РОБОРАБ');
    const bell = el('button', 'rr-header-action');
    bell.type = 'button';
    bell.setAttribute('aria-label', 'Уведомления');
    bell.setAttribute('aria-haspopup', 'dialog');
    bell.dataset.demoBell = '';
    bell.innerHTML = svg('bell') + '<span class="rr-demo-count" hidden></span>';
    bell.addEventListener('click', () => inbox('alerts'));
    const message = el('button', 'rr-header-action');
    message.type = 'button';
    message.setAttribute('aria-label', 'Сообщения');
    message.dataset.demoMessages = '';
    message.innerHTML = svg('chat');
    message.addEventListener('click', chat);
    row.append(word, bell, message);
    header.append(row);
    return row;
  }

  function keepFitnessLinks(header) {
    const main = document.querySelector('.app-content');
    if (!main) return;
    const nativeBack = header.querySelector('.topbar-back');
    let back = main.querySelector(':scope > .rr-demo-back');
    if (nativeBack && !back) {
      back = el('button', 'rr-demo-back', 'Назад');
      back.type = 'button';
      back.addEventListener('click', () => header.querySelector('.topbar-back')?.click());
      main.prepend(back);
    } else if (!nativeBack && back) back.remove();
    if (activeRoute() === '#/profile' && !main.querySelector('.rr-demo-settings')) {
      const link = el('a', 'button button--secondary rr-demo-settings', 'Настройки клуба');
      link.href = '#/settings';
      main.querySelector('.page-narrow')?.append(link);
    }
  }

  function sync() {
    const header = document.querySelector('.app-header.rr-header, .topbar.rr-header, .app-shell > .top.rr-header');
    if (!header) return;
    header.dataset.demoMainHeader = '';
    if (native) {
      header.querySelector('#btn-bell').dataset.demoBell = '';
      header.querySelector('#btn-chat').dataset.demoMessages = '';
      return;
    }
    const row = header.querySelector('.rr-demo-controls') || mountRow(header);
    const entries = readEntries();
    if (entries) {
      lastCount = entries.length;
      const version = JSON.stringify(entries);
      if (version !== listVersion) {
        listVersion = version;
        alertEntries = entries;
        if (dialog?.open) drawList();
      }
    }
    const badge = row.querySelector('.rr-demo-count');
    const number = String(lastCount);
    if (badge.textContent !== number) badge.textContent = number;
    badge.hidden = lastCount === 0;
    if (app === 'fitness') keepFitnessLinks(header);
    else {
      const button = row.querySelector('[data-demo-messages]');
      const open = activeRoute() === '#agent';
      button.setAttribute('aria-label', open ? 'Закрыть чат' : 'Сообщения');
      button.setAttribute('aria-pressed', String(open));
    }
  }

  let raf = 0;
  function queue() {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); });
  }
  sync();
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('hashchange', queue);
})();
