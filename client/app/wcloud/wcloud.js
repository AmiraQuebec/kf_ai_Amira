'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('wcloud', {
        url: '/wcloud/:viewId',
        templateUrl: 'app/wcloud/wcloud.html',
        controller: 'WcloudCtrl'
      });
  });