(function () {
  function arm() {
    try {
      var closeBtns = document.querySelectorAll(
        '.modal .close, .panel .close, [data-dismiss="modal"]'
      );
      Array.prototype.forEach.call(closeBtns, function (btn) {
        btn.setAttribute('data-dismiss', 'modal');
      });
    } catch (e) { console.warn('[modal-hotfix]', e); }
  }
  document.addEventListener('DOMContentLoaded', arm);
  window.addEventListener('hashchange', function(){ setTimeout(arm, 200); });
})();
