(() => {
  const root = document.getElementById('solution-catalog');
  if (!root) return;
  const filters = root.querySelector('.rr-price-filters');
  const tabs = Array.from(filters.querySelectorAll('[role="tab"]'));
  function selectTab(index) {
    tabs.forEach((tab,i) => {
      const active = i === index;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => selectTab(index));
    tab.addEventListener('keydown',event => {
      const targets = {ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,Home:0,End:tabs.length-1};
      if (!Object.hasOwn(targets,event.key)) return;
      event.preventDefault();
      const next = targets[event.key];
      selectTab(next);
      tabs[next].focus();
    });
  });
  selectTab(0);
  root.classList.add('rr-catalog-ready');
  filters.hidden = false;
})();
