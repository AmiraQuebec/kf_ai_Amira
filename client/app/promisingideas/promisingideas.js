'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('promisingideas', {
        url: '/promisingideas/:ids',
        templateUrl: 'app/promisingideas/promisingideas.html',
        controller: 'PromisingIdeasCtrl'
      });
  });
