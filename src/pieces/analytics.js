/* Google Analytics 4 с согласием на cookie. Пока посетитель не нажал «Принять», скрипт Google не загружается. */
(function(){
  var ID = '{{GA_ID}}';
  if (!ID || ID.indexOf('{{') === 0) return;
  var KEY = 'rr-cookie-consent', banner = null;

  function read(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v){ try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load(){
    if (window.__rrGA) return;
    window.__rrGA = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID, {anonymize_ip: true});
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
  }

  function wipe(){
    var host = location.hostname.split('.');
    var domains = ['', location.hostname, '.' + location.hostname];
    if (host.length > 1) domains.push('.' + host.slice(-2).join('.'));
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        domains.forEach(function(d){
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function hide(){ if (banner) { banner.remove(); banner = null; } }

  function show(){
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-bar';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Согласие на cookie');
    banner.innerHTML =
      '<p>Мы используем cookie Google Analytics, чтобы понимать, как люди пользуются сайтом. ' +
      'Без вашего согласия они не включаются.</p>' +
      '<div class="cookie-actions"><button type="button" class="cookie-yes">Принять</button>' +
      '<button type="button" class="cookie-no">Отклонить</button></div>';
    banner.querySelector('.cookie-yes').addEventListener('click', function(){ save('granted'); hide(); load(); });
    banner.querySelector('.cookie-no').addEventListener('click', function(){ save('denied'); hide(); wipe(); });
    document.body.appendChild(banner);
  }

  function init(){
    var ft = document.querySelector('.ft .row');
    if (ft) {
      var nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Cookie');
      nav.innerHTML = '<a href="#cookie-settings" data-cookie-settings>Настройки cookie</a>';
      ft.appendChild(nav);
    }
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (a) { e.preventDefault(); show(); }
    });
    var v = read();
    if (v === 'granted') load();
    else if (v !== 'denied') show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
