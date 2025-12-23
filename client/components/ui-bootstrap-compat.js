/*!
 * ui-bootstrap-compat: expose $modal comme alias de $uibModal (et provider pour la phase config)
 */
(function (angular) {
  'use strict';
  if (!angular) return;
  try {
    var mod = angular.module('ui.bootstrap'); // module existant
    // Fournir un provider $modal utilisable en phase config()
    mod.provider('$modal', function $modalCompatProvider() {
      this.$get = ['$uibModal', function ($uibModal) { return $uibModal; }];
    });
    // Alias runtime au cas où du code attend un service $modal
    mod.factory('$modal', ['$uibModal', function ($uibModal) { return $uibModal; }]);
  } catch (e) {
    // Si ui.bootstrap n'existe pas, on crée un mini module pour éviter le plantage dur
    angular.module('ui.bootstrap', [])
      .provider('$modal', function(){ this.$get=['$injector',function($injector){ return $injector.get('$uibModal'); }]; });
  }
})(window.angular);
