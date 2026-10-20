(function(){
  var D=/*D*/{},HT=/*HT*/{},META=/*META*/{},CFG=/*CFG*/{},EXTRA=/*EXTRA*/{};
  var LANGS=CFG.order.concat(['ru']).filter(function(v,i,a){return a.indexOf(v)===i});
  var cbs=[],cur='ru',recs=[],htmls=[];
  function norm(s){return s.replace(/\s+/g,' ').trim()}
  function has(k){return D.en[k]!==undefined}
  function detect(){
    try{var u=new URLSearchParams(location.search).get('lang');if(u&&LANGS.indexOf(u)>=0)return u}catch(e){}
    try{var s=localStorage.getItem('rr_lang');if(s&&LANGS.indexOf(s)>=0)return s}catch(e){}
    return 'en';
  }
  function collect(){
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),n;
    while((n=w.nextNode())){
      var p=n.parentNode&&n.parentNode.nodeName; if(p==='SCRIPT'||p==='STYLE'||p==='NOSCRIPT')continue;
      if(n.parentNode.closest&&n.parentNode.closest('.lang'))continue;
      var k=norm(n.nodeValue); if(k&&has(k)){var m=n.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);recs.push({n:n,k:k,a:null,pre:m[1],post:m[2]})}
    }
    document.querySelectorAll('[aria-label],[placeholder],[title],[alt]').forEach(function(el){
      if(el.closest('.lang'))return;
      ['aria-label','placeholder','title','alt'].forEach(function(a){var v=el.getAttribute(a);if(v){var k=norm(v);if(has(k))recs.push({n:el,k:k,a:a,orig:v})}})
    });
    document.querySelectorAll('[data-i18n]').forEach(function(el){htmls.push({el:el,key:el.getAttribute('data-i18n'),ru:el.innerHTML})});
  }
  function apply(l){
    cur=l;var dd=D[l];
    recs.forEach(function(r){
      var tr=dd&&dd[r.k]!==undefined?dd[r.k]:null;
      if(r.a){r.n.setAttribute(r.a,tr!==null?tr:r.orig)}
      else{r.n.nodeValue=r.pre+(tr!==null?tr:r.k)+r.post}
    });
    htmls.forEach(function(h){h.el.innerHTML=(HT[l]&&HT[l][h.key])?HT[l][h.key]:h.ru});
    document.documentElement.lang=l;document.documentElement.dir=(/^(ar|he|fa|ur)$/.test(l)?'rtl':'ltr');
    var ti=document.querySelector('title'); if(ti){if(!ti._ru)ti._ru=ti.textContent;ti.textContent=l!=='ru'&&EXTRA.title&&EXTRA.title[ti._ru]?EXTRA.title[ti._ru]:ti._ru}
    var cl=document.querySelector('.lang .cur');if(cl)cl.textContent=CFG.names[l];
    document.querySelectorAll('.lang li').forEach(function(li){li.setAttribute('aria-selected',li.getAttribute('data-l')===l?'true':'false')});
  }
  function set(l,user){
    if(LANGS.indexOf(l)<0)return;
    if(user){try{localStorage.setItem('rr_lang',l)}catch(e){}}
    apply(l);
    cbs.forEach(function(f){try{f(l)}catch(e){}});
    try{window.dispatchEvent(new Event('resize'))}catch(e){}
  }
  function t(ru){var k=norm(ru),dd=D[cur];return dd&&dd[k]!==undefined?dd[k]:ru}
  function ui(){
    var css=document.createElement('style');
    css.textContent='.lang{position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:50;font:600 13px/1 Inter,system-ui,sans-serif}'
      +'.lang>button{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;color:#101417;background:rgba(255,255,255,.96);padding:10px 12px 10px 11px;border-radius:999px;box-shadow:0 0 0 1px rgba(16,20,23,.12),0 6px 18px -8px rgba(16,20,23,.35);font:inherit}'
      +'.lang svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}'
      +'.lang .chev{width:14px;height:14px;transition:transform .15s}.lang.open .chev{transform:rotate(180deg)}'
      +'.lang>button:focus-visible{outline:2px solid #101417;outline-offset:2px}'
      +'.lang ul{display:none;position:absolute;right:0;bottom:calc(100% + 8px);margin:0;padding:6px;list-style:none;width:220px;max-height:min(60vh,420px);overflow:auto;background:#fff;border-radius:16px;box-shadow:0 0 0 1px rgba(16,20,23,.12),0 18px 40px -12px rgba(16,20,23,.35)}'
      +'.lang.open ul{display:block}'
      +'.lang li{padding:10px 12px;border-radius:10px;cursor:pointer;color:#101417;font-weight:500;display:flex;justify-content:space-between;gap:8px}'
      +'.lang li:hover{background:#f1f3f4}'
      +'.lang li[aria-selected=true]{font-weight:700;background:#eceff1}'
      +'.lang li[aria-selected=true]::after{content:"✓"}'
      +'.lang li.sep{padding:0;margin:6px 8px;height:1px;background:#e3e7ea;cursor:default;pointer-events:none}'
      +'.lang.in{position:relative;right:auto;bottom:auto}.lang.in ul{bottom:auto;top:calc(100% + 8px)}'
      +'.lang.in>button{box-shadow:0 0 0 1px rgba(16,20,23,.14)}'
      +'@media(max-width:520px){.lang .cur{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}';
    document.head.appendChild(css);
    var d=document.createElement('div');d.className='lang';
    var items=CFG.order.map(function(c,i){return (i===CFG.top?'<li class="sep" role="presentation"></li>':'')+'<li role="option" data-l="'+c+'" lang="'+c+'">'+CFG.names[c]+'</li>'}).join('');
    d.innerHTML='<button type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Language"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg><span class="cur"></span><svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button><ul role="listbox" aria-label="Language">'+items+'</ul>';
    var btn=d.querySelector('button');
    function tog(o){d.classList.toggle('open',o);btn.setAttribute('aria-expanded',o?'true':'false')}
    btn.addEventListener('click',function(e){e.stopPropagation();tog(!d.classList.contains('open'))});
    d.querySelector('ul').addEventListener('click',function(e){var li=e.target.closest('li[data-l]');if(li){tog(false);set(li.getAttribute('data-l'),true)}});
    document.addEventListener('click',function(e){if(!d.contains(e.target))tog(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')tog(false)});
    var slot=document.getElementById('langslot');
    if(slot){d.className+=' in';slot.appendChild(d)}else document.body.appendChild(d);
  }
  window.I18N={lang:function(){return cur},set:set,t:t,onChange:function(f){cbs.push(f)},extra:EXTRA,
    meta:function(l){return META[l||cur]||META.en}};
  collect();ui();
  var l=detect(); if(l!=='ru')set(l,false);else apply('ru');
})();
