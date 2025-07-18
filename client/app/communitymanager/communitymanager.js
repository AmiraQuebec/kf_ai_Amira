'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('communitymanager', {
        url: '/communitymanager',
        templateUrl: 'app/communitymanager/communitymanager.html',
        controller: 'CommunitymanagerCtrl'
      });
  });