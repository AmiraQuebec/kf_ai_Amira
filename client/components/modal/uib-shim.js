'use strict';
angular.module('kf6App')
  .factory('$modal', ['$uibModal', function($uibModal){ return $uibModal; }])
  .factory('$modalInstance', ['$uibModalInstance', function($uibModalInstance){ return $uibModalInstance; }]);
