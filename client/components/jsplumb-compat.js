'use strict';
angular.module('kf6App').run(['$rootScope', function($rootScope){
  var jp = window.jsPlumb || window.jsp;
  if (!jp) return;
  // prendre une instance si dispo
  var api = (typeof jp.getInstance === 'function') ? jp.getInstance() : jp;
  // alias des méthodes renommées dans les versions récentes
  if (!api.detachEveryConnection && typeof api.deleteEveryConnection === 'function') {
    api.detachEveryConnection = api.deleteEveryConnection.bind(api);
  }
  if (!api.detach && typeof api.deleteConnection === 'function') {
    api.detach = api.deleteConnection.bind(api);
  }
  // exposer sur $rootScope pour les contrôleurs qui attendent $scope.jsPlumb
  $rootScope.jsPlumb = api;
}]);
