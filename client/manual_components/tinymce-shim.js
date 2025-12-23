(function () {
  function ready(fn){ /complete|interactive|loaded/.test(document.readyState)? fn(): document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    if (!window.tinymce || !tinymce.PluginManager) return;
    try {
      if (!tinymce.util || !tinymce.util.Tools || !tinymce.util.Tools.resolve || !tinymce.util.Tools.resolve('tinymce.plugins.drawingTool')) {
        tinymce.PluginManager.add('drawingTool', function(){ return {}; });
        console.warn('[tiny-shim] drawingTool plugin not found -> stubbed');
      }
    } catch(e){ /* no-op */ }
  });
})();
