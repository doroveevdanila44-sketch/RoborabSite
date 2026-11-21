/* Adapt the original product controls inside the demo iframe. */
(() => {
  const app = document.documentElement.dataset.demoScreen;
  const native = app === 'booking' || app === 'construction';
  const icon = {
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="m5 12 7-7 7 7M12 19V5"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + icon[name] + '</svg>';
  const dataRoute = app === 'fitness' ? '#/' : '#dashboard';
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
  const sample = conversations[app];
  const messages = [...sample.lines];
  let draft = '';
  let draftFile = '';
  let scrollPosition = 0;
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
  function button(css, text) {
    const node = el('button', css, text);
    node.type = 'button';
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

  function bubble(text, index) {
    const support = index % 2 === 1;
    const item = el('li', 'rr-support-message rr-support-message--' + (support ? 'support' : 'user'));
    item.append(el('span', 'rr-support-author', support ? 'Поддержка' : 'Пользователь'), el('p', 'rr-support-text', text));
    return item;
  }

  function demoReply(text) {
    if (text === sample.lines[0]) return sample.lines[1];
    if (text === sample.lines[2]) return sample.lines[3];
    if (/спасибо|благодарю/i.test(text)) return 'Пожалуйста!';
    if (/добав|доработ|настро|можно ли/i.test(text)) {
      return 'Как это должно работать для вас? Опишите, на каком экране вы хотите увидеть изменение и что будете делать дальше.';
    }
    return 'Это демочат. Чтобы попробовать работу приложения, откройте «Решения».';
  }

  function drawConversation() {
    const example = el('p', 'rr-support-example', 'Пример переписки · ' + sample.product);
    const thread = el('ol', 'rr-support-thread');
    thread.setAttribute('aria-label', 'Переписка с поддержкой');
    thread.setAttribute('aria-live', 'polite');
    thread.setAttribute('aria-relevant', 'additions');
    messages.forEach((text, index) => thread.append(bubble(text, index)));
    if (!messages.length) thread.append(el('li', 'rr-support-note', 'Здесь появятся сообщения демочата.'));
    const composer = el('div', 'rr-support-composer');
    composer.setAttribute('role', 'group');
    composer.setAttribute('aria-label', 'Ввод сообщения');
    const plus = button('rr-support-plus');
    plus.innerHTML = svg('plus');
    plus.setAttribute('aria-label', 'Добавить вложение');
    plus.setAttribute('aria-expanded', 'false');
    const input = el('textarea', 'rr-support-input');
    input.rows = 1;
    input.placeholder = 'Напишите сообщение';
    input.setAttribute('aria-label', input.placeholder);
    input.enterKeyHint = 'send';
    input.value = draft;
    const send = button('rr-support-send');
    send.innerHTML = svg('send');
    send.setAttribute('aria-label', 'Отправить');
    const quick = el('div', 'rr-support-quick');
    quick.id = 'rr-support-attachments';
    quick.hidden = true;
    plus.setAttribute('aria-controls', quick.id);
    function showAttachments(show) {
      quick.hidden = !show;
      plus.setAttribute('aria-expanded', String(show));
    }
    const attachment = el('div', 'rr-support-attachment');
    const fileName = el('span', 'rr-support-filename');
    const removeFile = button('rr-support-remove-attachment', '×');
    removeFile.setAttribute('aria-label', 'Убрать вложение');
    attachment.append(fileName, removeFile);
    function updateDraft() {
      draft = input.value;
      send.disabled = !draft.trim() && !draftFile;
      fileName.textContent = draftFile;
      attachment.hidden = !draftFile;
    }
    removeFile.onclick = () => {
      draftFile = '';
      updateDraft();
      plus.focus();
    };
    for (const label of ['Файл', 'Фото']) {
      const picker = el('input', '');
      picker.type = 'file';
      picker.hidden = true;
      if (label === 'Фото') picker.accept = 'image/*';
      picker.onchange = () => {
        const selected = picker.files[0];
        if (!selected) return;
        draftFile = selected.name;
        picker.value = '';
        updateDraft();
      };
      const choice = button('rr-support-question', label);
      choice.onclick = () => {
        showAttachments(false);
        plus.focus({ preventScroll: true });
        picker.click();
      };
      composer.append(picker);
      quick.append(choice);
    }
    plus.onclick = () => {
      showAttachments(quick.hidden);
      if (!quick.hidden) quick.firstElementChild.focus();
    };
    quick.onkeydown = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      showAttachments(false);
      plus.focus();
    };
    input.oninput = updateDraft;
    input.onkeydown = event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        sendLocal();
      }
    };
    function sendLocal() {
      const text = input.value.trim();
      if (!text && !draftFile) return;
      thread.querySelector('.rr-support-note')?.remove();
      const sentText = [text, draftFile && 'Вложение · ' + draftFile].filter(Boolean).join('\n');
      const reply = draftFile ? 'В демочате сохранено название вложения «' + draftFile + '».' : demoReply(text);
      const start = messages.length;
      messages.push(sentText, reply);
      thread.append(bubble(sentText, start), bubble(reply, start + 1));
      input.value = '';
      draftFile = '';
      updateDraft();
      showAttachments(false);
      input.focus({ preventScroll: true });
      thread.scrollTop = thread.scrollHeight;
    }
    send.onclick = sendLocal;
    thread.addEventListener('scroll', () => { scrollPosition = thread.scrollTop; }, { passive: true });
    composer.prepend(plus, input, send);
    updateDraft();
    dialogList.replaceChildren(example, thread, quick, attachment, composer);
    thread.scrollTop = scrollPosition;
  }

  function drawProfile() {
    const profile = el('section', 'rr-support-profile');
    const fields = el('dl', 'rr-support-fields');
    for (const [label, value] of [['Телефон', 'не указан'], ['Почта', 'не указана']]) {
      const field = el('div', '');
      field.append(el('dt', '', label), el('dd', '', value));
      fields.append(field);
    }
    const actions = el('div', 'rr-support-actions');
    const clear = button('rr-support-clear', 'Очистить чат');
    clear.disabled = !messages.length && !draft && !draftFile;
    const confirm = el('div', 'rr-support-confirm');
    confirm.hidden = true;
    confirm.setAttribute('role', 'group');
    confirm.setAttribute('aria-label', 'Подтверждение очистки');
    const yes = button('rr-support-confirm-clear', 'Очистить');
    const cancel = button('rr-support-cancel', 'Отмена');
    const feedback = el('p', 'rr-support-feedback');
    feedback.setAttribute('role', 'status');
    clear.onclick = () => {
      confirm.hidden = false;
      cancel.focus();
    };
    cancel.onclick = () => {
      confirm.hidden = true;
      clear.focus();
    };
    yes.onclick = () => {
      messages.length = 0;
      draft = '';
      draftFile = '';
      scrollPosition = 0;
      clear.disabled = true;
      confirm.hidden = true;
      feedback.textContent = 'Демочат очищен.';
      dialog.querySelector('[data-tab="profile"]').focus();
    };
    confirm.append(el('p', '', 'Очистить переписку в демо этого приложения?'), cancel, yes);
    const avatar = el('span', 'rr-guest-avatar', 'Г');
    avatar.setAttribute('aria-hidden', 'true');
    actions.append(clear);
    profile.append(avatar, el('h3', '', 'Гость'), fields, actions, confirm, feedback);
    dialogList.replaceChildren(profile);
  }

  function selectSupportTab(tab) {
    if (tab === 'solutions') {
      dialog.close();
      return;
    }
    dialog.dataset.supportTab = tab;
    dialog.querySelectorAll('.rr-support-tab').forEach(node => {
      node.setAttribute('aria-pressed', String(node.dataset.tab === tab));
    });
    if (tab === 'profile') drawProfile();
    else drawConversation();
  }

  // The mobile keyboard resizes the outer visual viewport, while the scaled
  // product iframe can keep its original CSS height.
  function fitComposerToKeyboard() {
    const frame = window.frameElement;
    const host = frame ? window.parent : window;
    const viewport = host.visualViewport;
    if (!viewport) return;
    let restingHeight = viewport.height;
    function fit() {
      if (!document.activeElement?.matches('.rr-support-input')) {
        dialog.style.removeProperty('--rr-chat-height');
        return;
      }
      const baseline = Math.max(restingHeight, host.innerHeight);
      if (baseline - viewport.height < 100 || viewport.scale !== 1) {
        dialog.style.removeProperty('--rr-chat-height');
        return;
      }
      const rect = frame?.getBoundingClientRect();
      const scale = rect ? rect.width / window.innerWidth : 1;
      if (!scale) return;
      const available = (viewport.offsetTop + viewport.height - (rect?.top || 0)) / scale;
      if (available > 0) dialog.style.setProperty('--rr-chat-height', Math.min(window.innerHeight, available) + 'px');
    }
    dialog.addEventListener('focusin', event => {
      if (event.target.matches('.rr-support-input')) restingHeight = viewport.height;
      fit();
    });
    dialog.addEventListener('focusout', () => requestAnimationFrame(fit));
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
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
      const tabs = el('nav', 'rr-support-tabs');
      tabs.setAttribute('aria-label', 'Разделы демочата');
      for (const [key, label] of [['chat', 'Чат'], ['profile', 'Профиль'], ['solutions', 'Решения']]) {
        const tab = button('rr-support-tab', label);
        tab.dataset.tab = key;
        if (key === 'solutions') tab.title = 'Вернуться в приложение';
        tab.onclick = () => selectSupportTab(key);
        tabs.append(tab);
      }
      head.append(dialogTitle, close, tabs);
      dialogList = el('div', 'rr-inbox-list');
      dialog.append(head, dialogList);
      document.body.append(dialog);
      fitComposerToKeyboard();
      dialog.addEventListener('close', () => {
        dialog.style.removeProperty('--rr-chat-height');
        const status = dialog.querySelector(':scope > .rr-demo-status');
        if (status) document.body.append(status);
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
    dialogTitle.className = mode === 'messages' ? 'rr-support-sr-title' : '';
    dialog.querySelector('.rr-inbox-close').hidden = mode === 'messages';
    dialog.querySelector('.rr-support-tabs').hidden = mode !== 'messages';
    returnRoute = mode === 'alerts' && activeRoute() !== dataRoute ? activeRoute() : null;
    if (returnRoute) location.hash = dataRoute;
    if (mode === 'messages') {
      const status = document.querySelector('body > .rr-demo-status');
      if (status) dialog.prepend(status);
      selectSupportTab('chat');
    }
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
