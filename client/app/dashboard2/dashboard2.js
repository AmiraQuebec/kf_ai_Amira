'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('dashboard2', {
        url: '/dashboard2/:communityId',
        templateUrl: 'app/dashboard2/dashboard2.html',
        controller: 'Dashboard2Ctrl'
      });
  });
