'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('s2viz', {
        url: '/s2viz/:communityId',
        templateUrl: 'app/s2viz/s2viz.html',
        controller: 'S2vizCtrl'
      });
  });
