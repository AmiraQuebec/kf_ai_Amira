'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('timemachine', {
        url: '/timemachine/:viewId',
        templateUrl: 'app/timemachine/timemachine.html',
        controller: 'TimemachineCtrl'
      });
  });
