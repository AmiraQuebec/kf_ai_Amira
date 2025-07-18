'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('scaffoldmanager', {
        url: '/scaffoldmanager/:communityId',
        templateUrl: 'app/scaffoldmanager/scaffoldmanager.html',
        controller: 'ScaffoldmanagerCtrl'
      });
  });