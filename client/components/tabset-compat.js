// Compatibilité pour tabset/tab avec Angular Bootstrap 1.3.3
angular.module('ui.bootstrap')
  .directive('tabset', ['$timeout', function($timeout) {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {},
      template: '<div><ul class="nav nav-tabs" ng-transclude></ul><div class="tab-content" ng-transclude></div></div>',
      controller: ['$scope', function($scope) {
        var tabs = $scope.tabs = [];
        
        $scope.select = function(tab) {
          angular.forEach(tabs, function(t) {
            t.active = false;
          });
          tab.active = true;
        };
        
        this.addTab = function(tab) {
          tabs.push(tab);
          if (tabs.length === 1 || tab.active) {
            $scope.select(tab);
          }
        };
      }]
    };
  }])
  .directive('tab', function() {
    return {
      require: '^tabset',
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {
        heading: '@',
        active: '=?',
        onSelect: '&select',
        onDeselect: '&deselect'
      },
      template: '<li ng-class="{active: active}"><a ng-click="select()">{{heading}}</a></li>',
      link: function(scope, element, attrs, tabsetCtrl) {
        scope.select = function() {
          if (!scope.active) {
            scope.active = true;
            if (scope.onSelect) {
              scope.onSelect();
            }
          }
        };
        
        tabsetCtrl.addTab(scope);
      }
    };
  });
