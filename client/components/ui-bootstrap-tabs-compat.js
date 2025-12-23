/**
 * Compatibilité pour les anciennes directives tabset/tab
 * Mappe vers uib-tabset/uib-tab pour Angular Bootstrap >= 0.14.0
 */
angular.module('kf6App')
  .directive('tabset', function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {},
      controller: 'UibTabsetController',
      templateUrl: 'uib/template/tabs/tabset.html',
      link: function(scope, element, attrs) {
        scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
        scope.justified = angular.isDefined(attrs.justified) ? scope.$parent.$eval(attrs.justified) : false;
        scope.type = attrs.type || 'tabs';
      }
    };
  })
  .directive('tab', ['$parse', function($parse) {
    return {
      require: '^tabset',
      restrict: 'E',
      replace: true,
      templateUrl: 'uib/template/tabs/tab.html',
      transclude: true,
      scope: {
        heading: '@',
        active: '=?',
        onSelect: '&select',
        onDeselect: '&deselect'
      },
      controller: function() {},
      controllerAs: 'tab',
      link: function(scope, elm, attrs, tabsetCtrl, transclude) {
        scope.disabled = false;
        if (attrs.disable) {
          scope.$parent.$watch($parse(attrs.disable), function(value) {
            scope.disabled = !!value;
          });
        }
        
        scope.select = function() {
          if (!scope.disabled) {
            scope.active = true;
          }
        };
        
        tabsetCtrl.addTab(scope);
        
        scope.$on('$destroy', function() {
          tabsetCtrl.removeTab(scope);
        });
        
        scope.$transcludeFn = transclude;
      }
    };
  }]);
