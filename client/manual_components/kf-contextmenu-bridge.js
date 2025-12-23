(function () {
  function findHostAt(x, y) {
    var node = document.elementFromPoint(x, y);
    var host = node && node.closest('[context-menu][data-target]');
    if (host) return host;

    // cache temporairement les calques qui bloquent
    var ids = ['dropcanvas', 'selectioncanvas', 'windows'];
    var hidden = [];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && getComputedStyle(el).visibility !== 'hidden') {
        hidden.push(el);
        el.style.visibility = 'hidden';
      }
    });

    try {
      node = document.elementFromPoint(x, y);
      host = node && node.closest('[context-menu][data-target]');
    } finally {
      hidden.forEach(function (el) { el.style.visibility = ''; });
    }
    return host;
  }

  document.addEventListener('contextmenu', function (e) {
    var host = e.target.closest('[context-menu][data-target]') || findHostAt(e.clientX, e.clientY);
    if (!host) return;           // rien d’ouvrable sous la souris

    e.preventDefault();

    // Appelle la fonction Angular si dispo (onContextOpen(this))
    try {
      var el = angular.element(host);
      var sc = el.scope() || el.isolateScope();
      if (sc && typeof sc.onContextOpen === 'function') {
        sc.$apply(function () { sc.onContextOpen(sc); });
      }
    } catch (_) {}

    var id = host.getAttribute('data-target') || 'menu-A';
    var menu = document.getElementById(id);
    if (!menu) return;

    menu.style.display = 'block';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top  = e.clientY + 'px';
    menu.style.zIndex = 99999;
  }, true);

  // Clic gauche ailleurs => on ferme les menus
  document.addEventListener('click', function () {
    ['menu-A', 'menu-Canvas'].forEach(function (id) {
      var m = document.getElementById(id);
      if (m) m.style.display = 'none';
    });
  }, true);

  window.kfCtxBridgeReady = true;
})();


(function () {
  function closeAllMenus() {
    ['menu-A', 'menu-Canvas'].forEach(function (id) {
      var m = document.getElementById(id);
      if (m) {
        m.style.display = 'none';
        m.style.left = '-9999px';
        m.style.top  = '-9999px';
      }
    });
  }

  // ---- cacher au démarrage (important)
  document.addEventListener('DOMContentLoaded', closeAllMenus);
  window.addEventListener('load', closeAllMenus);

  function findHostAt(x, y) {
    var node = document.elementFromPoint(x, y);
    var host = node && node.closest('[context-menu][data-target]');
    if (host) return host;

    var ids = ['dropcanvas', 'selectioncanvas', 'windows'];
    var hidden = [];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && getComputedStyle(el).visibility !== 'hidden') {
        hidden.push(el);
        el.style.visibility = 'hidden';
      }
    });
    try {
      node = document.elementFromPoint(x, y);
      host = node && node.closest('[context-menu][data-target]');
    } finally {
      hidden.forEach(function (el) { el.style.visibility = ''; });
    }
    return host;
  }

  document.addEventListener('contextmenu', function (e) {
    var host = e.target.closest('[context-menu][data-target]') || findHostAt(e.clientX, e.clientY);
    if (!host) return;

    e.preventDefault();

    // Notifie Angular si possible (ouvre avec la bonne cible)
    try {
      var el = angular.element(host);
      var sc = el.scope() || el.isolateScope();
      if (sc && typeof sc.onContextOpen === 'function') {
        sc.$apply(function () { sc.onContextOpen(sc); });
      }
    } catch (_) {}

    var id = host.getAttribute('data-target') || 'menu-A';
    var menu = document.getElementById(id);
    if (!menu) return;

    menu.style.display = 'block';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top  = e.clientY + 'px';
    menu.style.zIndex = 2147483647;
  }, true);

  // Fermer sur clic ailleurs, scroll, ou Échap
  document.addEventListener('click', closeAllMenus, true);
  document.addEventListener('scroll', closeAllMenus, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllMenus();
  }, true);

  window.kfCtxBridgeReady = true;
})();
