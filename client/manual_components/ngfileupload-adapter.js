(function(angular){
  try { angular.module('ngFileUpload'); } catch(e){ return; }

  // Mappe les vieux attributs vers les nouveaux
  angular.module('ngFileUpload')
    .directive('ngFileSelect', function(){ return {
      restrict:'A', priority: 1000, terminal:true,
      link: function(scope, el, attrs){
        if (!attrs.ngfSelect) el.attr('ngf-select', attrs.ngFileSelect);
      }
    };})
    .directive('ngFileDrop', function(){ return {
      restrict:'A', priority: 1000, terminal:true,
      link: function(scope, el, attrs){
        if (!attrs.ngfDrop) el.attr('ngf-drop', attrs.ngFileDrop);
      }
    };});
})(window.angular);
