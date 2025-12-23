(function (root) {
  var $ = root.jQuery || (root.angular && root.angular.element);
  if (!$) return;
  var fn = ($.fn || ($.fn = {}));
  fn.annotator = function () {
    var api = {
      addPlugin: function(){ return api; },
      subscribe:  function(){ return api; },
      unsubscribe:function(){ return api; },
      destroy:    function(){ return; }
    };
    console.log('[annotator-stub] ready');
    return api;
  };
})(window);
