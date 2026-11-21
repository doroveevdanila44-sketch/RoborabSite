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
  const diagnosticsURL = 'https://roborab-app.vercel.app/?lang=ru';
  const conversations = {
    booking: {
      product: 'Букинг-CRM',
      lines: [
        'Пришла бронь. Где проверить, с какой площадки она поступила?',
        'Откройте «Брони» и выберите гостя. В карточке указаны площадка, объект и даты проживания.',
        'Можно добавить в календарь имя сотрудника, который встречает гостя?',
        'Да, добавим имя ответственного прямо в бронь. Тогда при передаче смены будет видно, кто встречает гостя.'
      ]
    },
    construction: {
      product: 'Строй-учёт',
      lines: [
        'Бригадир прислал фото кровли. Где посмотреть их вместе?',
        'Откройте объект и вкладку «Отчёты». В отчёте по кровле фотографии можно листать прямо в карточке.',
        'Можно добавить список обязательных ракурсов? На прошлых фото не было видно водостока.',
        'Да, добавим к этапу список снимков. Бригадир увидит, что для приёмки кровли нужен ещё и кадр водостока.'
      ]
    },
    tax: {
      product: 'Агент по НДС',
      lines: [
        'На главной вижу предупреждение. Как понять, какой компании оно касается?',
        'Откройте колокольчик и разверните предупреждение. Внутри есть пояснение.',
        'Можно добавить выгрузку предупреждений для нашего бухгалтера?',
        'Да, добавим таблицу с компанией, текстом предупреждения и датой. Её можно будет скачать одним файлом.'
      ]
    },
    fitness: {
      product: 'Глаза фитнеса',
      lines: [
        'Где посмотреть, у кого скоро заканчивается абонемент?',
        'Откройте колокольчик. В списке видны клиенты, у которых подходит срок продления.',
        'Можно добавить фильтр по тренеру, чтобы у каждого был свой список продлений?',
        'Да, добавим выбор тренера. Вы сможете посмотреть и его клиентов, и весь клуб целиком.'
      ]
    }
  };
  let lastCount = 0;
  let alertEntries = [];
  let listVersion = '';
  let dialog;
  let dialogList;
  let dialogTitle;
  let mode = '';
  let returnRoute = null;
  let opener = null;

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
          opener = null;
          dialog.close();
        });
        card.append(link, el('p', 'rr-inbox-detail', item.detail));
        if (item.note) card.append(el('p', 'rr-inbox-note', item.note));
        content.append(card);
      }
    }
    dialogList.replaceChildren(content);
  }

  function drawConversation() {
    const { product, lines } = conversations[app];
    const example = el('p', 'rr-support-example', 'Пример переписки · ' + product);
    const thread = el('ol', 'rr-support-thread');
    thread.setAttribute('aria-label', 'Переписка с поддержкой');
    lines.forEach((text, index) => {
      const support = index % 2 === 1;
      const item = el('li', 'rr-support-message rr-support-message--' + (support ? 'support' : 'user'));
      item.append(el('span', 'rr-support-author', support ? 'Поддержка' : 'Пользователь'), el('p', 'rr-support-text', text));
      thread.append(item);
    });
    const link = el('a', 'rr-support-cta', 'Перейти в чат бесплатной диагностики');
    link.href = diagnosticsURL;
    link.target = '_top';
    dialogList.replaceChildren(example, thread, link);
  }

  function inbox(nextMode, trigger) {
    if (dialog?.open) return;
    if (!dialog) {
      dialog = el('dialog', 'rr-demo-inbox');
      dialog.setAttribute('aria-labelledby', 'rr-demo-inbox-title');
      const head = el('header', 'rr-inbox-head');
      dialogTitle = el('h2', '');
      dialogTitle.id = 'rr-demo-inbox-title';
      dialogTitle.tabIndex = -1;
      dialogTitle.setAttribute('autofocus', '');
      const close = el('button', 'rr-inbox-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Закрыть');
      close.addEventListener('click', () => dialog.close());
      head.append(dialogTitle, close);
      dialogList = el('div', 'rr-inbox-list');
      dialog.append(head, dialogList);
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        const focusControl = opener;
        const selector = mode === 'messages' ? '[data-demo-messages]' : '[data-demo-bell]';
        if (returnRoute && activeRoute() === dataRoute) location.hash = returnRoute;
        returnRoute = null;
        opener = null;
        mode = '';
        if (focusControl) requestAnimationFrame(() => {
          const button = focusControl.isConnected ? focusControl : document.querySelector(selector);
          button?.focus({ preventScroll: true });
        });
      });
    }
    mode = nextMode;
    opener = trigger;
    dialog.dataset.inboxMode = mode;
    dialogTitle.textContent = mode === 'messages' ? 'Поддержка' : 'Уведомления';
    returnRoute = mode === 'alerts' && activeRoute() !== dataRoute ? activeRoute() : null;
    if (returnRoute) location.hash = dataRoute;
    if (mode === 'messages') drawConversation();
    else drawList();
    dialogList.scrollTop = 0;
    dialog.showModal();
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
    bell.addEventListener('click', () => inbox('alerts', bell));
    const message = el('button', 'rr-header-action');
    message.type = 'button';
    message.setAttribute('aria-label', 'Сообщения');
    message.setAttribute('aria-haspopup', 'dialog');
    message.dataset.demoMessages = '';
    message.innerHTML = svg('chat');
    message.addEventListener('click', () => inbox('messages', message));
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
      const message = header.querySelector('#btn-chat');
      if (!message.hasAttribute('data-demo-messages')) {
        message.dataset.demoMessages = '';
        message.setAttribute('aria-label', 'Сообщения');
        message.setAttribute('aria-haspopup', 'dialog');
        message.onclick = () => inbox('messages', message);
      }
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
        if (dialog?.open && mode === 'alerts') drawList();
      }
    }
    const badge = row.querySelector('.rr-demo-count');
    const number = String(lastCount);
    if (badge.textContent !== number) badge.textContent = number;
    badge.hidden = lastCount === 0;
    if (app === 'fitness') keepFitnessLinks(header);
  }

  let raf = 0;
  function queue() {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); });
  }
  sync();
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('hashchange', queue);
})();
