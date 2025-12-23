(function(){
  var original = window.onSvgInitialized;
  window.onSvgInitialized = function(){
    var tries = 0, max = 60; // ~6s
    var t = setInterval(function(){
      var el = document.getElementById('svgedit');
      var wnd = el && el.contentWindow;
      var ok = wnd && wnd.svgCanvas && typeof wnd.svgCanvas.setSvgString === 'function';
      if (ok){
        clearInterval(t);
        try { original && original(); } catch(e){ console.error(e); }
      } else if (++tries >= max) {
        clearInterval(t);
        console.warn('[KF] svgCanvas non prêt : timeout');
      }
    }, 100);
  };
})();
