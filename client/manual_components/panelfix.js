(function () {
  console.log('panel-fix loading...');
  function closeAutoPanels() {
    try {
      var elems = document.querySelectorAll('[data-panel-auto-open="true"], [auto-open]');
      Array.prototype.forEach.call(elems, function (el) {
        el.removeAttribute('auto-open');
        el.setAttribute('data-panel-auto-open', 'false');
      });
      console.log('â Panel fix applied - panneaux fermÃ©s');
    } catch (e) { console.warn('[panel-fix]', e); }
  }
  document.addEventListener('DOMContentLoaded', closeAutoPanels);
  window.addEventListener('hashchange', function(){ setTimeout(closeAutoPanels, 200); });
})();
