(function(){
  if (window.__KF_SVGFIX_INITED) return;      // évite multi-init
  window.__KF_SVGFIX_INITED = true;

  function handleIframe(node){
    if (!node || node.__kf_svgfix_done) return;
    node.__kf_svgfix_done = true;

    var src = node.getAttribute('src') || '';
    var hasCB = /\bcb=\d+/.test(src);         // le contrôleur a-t-il déjà mis ?cb=...

    // Laisse un petit délai pour que l'iframe charge
    setTimeout(function(){
      var ok = false;
      try {
        var w = node.contentWindow;
        ok = !!(w && w.document && w.document.querySelector('#tools_left') && w.svgCanvas);
      } catch(e) {}
      // Si pas ok ET pas de cb, on force UN SEUL rechargement avec cb
      if (!ok && !hasCB) {
        var s = src || 'manual_components/svg-edit-2.8.1/svg-editor.html';
        node.setAttribute('src', s + (s.indexOf('?')>-1 ? '&' : '?') + 'cb=' + Date.now());
      }
    }, 600);
  }

  // Observe l'injection de l'iframe par Angular
  var mo = new MutationObserver(function(muts){
    muts.forEach(function(m){
      [].forEach.call(m.addedNodes || [], function(n){
        if (n.nodeType === 1 && n.tagName === 'IFRAME' && n.id === 'svgedit') {
          handleIframe(n);
        }
      });
    });
  });
  mo.observe(document.documentElement, {childList:true, subtree:true});

  // Cas où l'iframe existe déjà quand ce script s'exécute
  var ifr = document.getElementById('svgedit');
  if (ifr) handleIframe(ifr);
})();
