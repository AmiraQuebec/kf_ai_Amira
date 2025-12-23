(function () {
  var j = window.jsPlumb || window.jsp;
  if (!j) return;

  function alias(obj, oldName, newName) {
    if (obj && typeof obj[oldName] !== 'function' && typeof obj[newName] === 'function') {
      obj[oldName] = obj[newName];
    }
  }

  // Alias sur l'objet global
  alias(j, 'detachEveryConnection',    'deleteEveryConnection');
  alias(j, 'detachAllConnections',     'deleteConnectionsForElement');

  // Hook sur getInstance pour aliaser CHAQUE instance créée
  var _getInstance = j.getInstance;
  if (typeof _getInstance === 'function') {
    j.getInstance = function() {
      var inst = _getInstance.apply(j, arguments);
      alias(inst, 'detachEveryConnection', 'deleteEveryConnection');
      alias(inst, 'detachAllConnections',  'deleteConnectionsForElement');
      return inst;
    };
  }

  // Si une instance existait déjà au moment du chargement, tente aussi l'alias
  try {
    alias(j.instance, 'detachEveryConnection', 'deleteEveryConnection');
    alias(j.instance, 'detachAllConnections',  'deleteConnectionsForElement');
  } catch (e) {}
})();
