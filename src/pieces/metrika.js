/* Яндекс Метрика: счётчик {{METRIKA_ID}} */
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j=0;j<e.scripts.length;j++){ if (e.scripts[j].src===r) return; }
  k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id={{METRIKA_ID}}','ym');

ym({{METRIKA_ID}},'init',{webvisor:true,clickmap:true,trackLinks:true,accurateTrackBounce:true,referrer:document.referrer,url:location.href});

/* цель «chat_click»: переход в чат с любой кнопки */
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href*="roborab-app.vercel.app"]');
  if(a) ym({{METRIKA_ID}},'reachGoal','chat_click');
});
