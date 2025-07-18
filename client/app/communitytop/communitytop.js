'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('communitytop', {
        url: '/communitytop/:communityId',
        templateUrl: 'app/communitytop/communitytop.html',
        controller: 'CommunitytopCtrl'
      });
  });