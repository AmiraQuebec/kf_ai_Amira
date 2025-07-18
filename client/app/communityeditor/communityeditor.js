'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('communityeditor', {
        url: '/communityeditor/:communityId',
        templateUrl: 'app/communityeditor/communityeditor.html',
        controller: 'CommunityeditorCtrl'
      });
  });