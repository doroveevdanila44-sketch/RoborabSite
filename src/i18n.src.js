(function(){
  var EN=/*EN*/{};var HTML=/*HTML*/{};var EXTRA=/*EXTRA*/{};
  var LANGS=['ru','en'], cbs=[], cur='ru', recs=[], htmls=[];
  function norm(s){return s.replace(/\s+/g,' ').trim()}
  function detect(){
    try{var u=new URLSearchParams(location.search).get('lang');if(u&&LANGS.indexOf(u)>=0)return u}catch(e){}
    try{var s=localStorage.getItem('rr_lang');if(s&&LANGS.indexOf(s)>=0)return s}catch(e){}
    var n=((navigator.languages&&navigator.languages[0])||navigator.language||'ru').toLowerCase();
    return /^(ru|be|kk)/.test(n)?'ru':'en';
  }
  function collect(){
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),n;
    while((n=w.nextNode())){
      var p=n.parentNode&&n.parentNode.nodeName; if(p==='SCRIPT'||p==='STYLE'||p==='NOSCRIPT')continue;
      var k=norm(n.nodeValue); if(k&&EN[k]!==undefined){var m=n.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);recs.push({n:n,k:k,a:null,pre:m[1],post:m[2]})}
    }
    document.querySelectorAll('[aria-label],[placeholder],[title],[alt]').forEach(function(el){
      ['aria-label','placeholder','title','alt'].forEach(function(a){var v=el.getAttribute(a);if(v){var k=norm(v);if(EN[k]!==undefined)recs.push({n:el,k:k,a:a,orig:v})}})
    });
    document.querySelectorAll('[data-i18n]').forEach(function(el){htmls.push({el:el,key:el.getAttribute('data-i18n'),ru:el.innerHTML})});
  }
  function apply(l){
    cur=l;
    recs.forEach(function(r){
      if(r.a){r.n.setAttribute(r.a,l==='en'?EN[r.k]:r.orig)}
      else{r.n.nodeValue=l==='en'?r.pre+EN[r.k]+r.post:r.pre+r.k+r.post}
    });
    htmls.forEach(function(h){h.el.innerHTML=(l==='en'&&HTML[h.key])?HTML[h.key]:h.ru});
    document.documentElement.lang=l;
    var ti=document.querySelector('title'); if(ti){if(!ti._ru)ti._ru=ti.textContent;ti.textContent=l==='en'&&EXTRA.title&&EXTRA.title[ti._ru]?EXTRA.title[ti._ru]:ti._ru}
    document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-l')===l?'true':'false')});
  }
  function set(l,user){
    if(LANGS.indexOf(l)<0)return;
    if(user){try{localStorage.setItem('rr_lang',l)}catch(e){}}
    apply(l);
    cbs.forEach(function(f){try{f(l)}catch(e){}});
    try{window.dispatchEvent(new Event('resize'))}catch(e){}
  }
  function t(ru){var k=norm(ru);return cur==='en'&&EN[k]!==undefined?EN[k]:ru}
  function ui(){
    var css=document.createElement('style');
    css.textContent='.lang{position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:50;display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 0 0 1px rgba(16,20,23,.12),0 6px 18px -8px rgba(16,20,23,.35);backdrop-filter:blur(6px)}'
      +'.lang.in{position:static;box-shadow:0 0 0 1px rgba(16,20,23,.14);backdrop-filter:none}'
      +'.lang button{border:0;background:transparent;color:#5b646c;font:700 12px/1 Inter,system-ui,sans-serif;letter-spacing:.04em;padding:8px 11px;border-radius:999px;cursor:pointer}'
      +'.lang button[aria-pressed=true]{background:#101417;color:#fff}'
      +'.lang button:focus-visible{outline:2px solid #101417;outline-offset:2px}';
    document.head.appendChild(css);
    var d=document.createElement('div');d.className='lang';d.setAttribute('role','group');d.setAttribute('aria-label','Language / Язык');
    d.innerHTML='<button type="button" data-l="ru" lang="ru">RU</button><button type="button" data-l="en" lang="en">EN</button>';
    d.addEventListener('click',function(e){var b=e.target.closest('button');if(b)set(b.getAttribute('data-l'),true)});
    var slot=document.getElementById('langslot');
    if(slot){d.className+=' in';slot.appendChild(d)}else document.body.appendChild(d);
  }
  window.I18N={lang:function(){return cur},set:set,t:t,onChange:function(f){cbs.push(f)},extra:EXTRA};
  collect();ui();
  var l=detect(); if(l==='en')set('en',false);else apply('ru');
})();
