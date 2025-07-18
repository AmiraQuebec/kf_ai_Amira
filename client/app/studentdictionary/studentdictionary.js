'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('studentdictionary', {
        url: '/studentdictionary/:communityId',
        templateUrl: 'app/studentdictionary/studentdictionary.html',
        controller: 'StudentdictionaryCtrl'
      });
  });