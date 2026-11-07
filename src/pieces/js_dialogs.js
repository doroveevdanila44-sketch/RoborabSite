(function(){var b=document.querySelector('.app'),d=document.getElementById('stores');if(!b||!d)return;
b.addEventListener('click',function(){if(d.showModal)d.showModal();else d.setAttribute('open','');try{d.focus({preventScroll:true})}catch(e){}});
d.addEventListener('click',function(e){
  if(e.target.closest('.dl-x')||e.target===d){d.close();return}
  var a=e.target.closest('a[data-empty]');if(a)e.preventDefault()});
})();

(function(){document.querySelectorAll('.product').forEach(function(c){var b=c.querySelector('.pc-more'),d=c.querySelector('.pd');if(!b||!d)return;
b.addEventListener('click',function(){if(d.showModal)d.showModal();else d.setAttribute('open','');try{d.focus({preventScroll:true})}catch(e){}});
d.addEventListener('click',function(e){if(e.target.closest('.dl-x')||e.target===d)d.close()})})})();

(function(){var d=document.getElementById('lb');if(!d)return;var st=document.getElementById('lbst'),cn=document.getElementById('lbcn'),list=[],i=0;
function show(){
  var shot=list[i];
  st.style.backgroundImage=getComputedStyle(shot).backgroundImage;
  if(shot.dataset.clock)st.dataset.clock=shot.dataset.clock;else delete st.dataset.clock;
  st.textContent='';
  shot.querySelectorAll('.shot-brand,.shot-url').forEach(function(overlay){ st.appendChild(overlay.cloneNode(true)); });
  cn.textContent=(i+1)+' / '+list.length;
}
function go(n){i=(i+n+list.length)%list.length;show()}
document.querySelectorAll('.shots').forEach(function(g){g.querySelectorAll('.shot').forEach(function(b,n){b.addEventListener('click',function(){list=[].slice.call(g.querySelectorAll('.shot'));i=n;show();if(d.showModal)d.showModal();else d.setAttribute('open','')})})});
d.querySelector('.x').addEventListener('click',function(){d.close()});
d.querySelector('.pv').addEventListener('click',function(){go(-1)});
d.querySelector('.nx').addEventListener('click',function(){go(1)});
d.addEventListener('click',function(e){if(e.target===d)d.close()});
d.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1)});
var x0=null;st.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
st.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)go(dx<0?1:-1);x0=null});
st.addEventListener('click',function(e){var r=st.getBoundingClientRect();go(e.clientX>r.left+r.width/2?1:-1)});
})();

