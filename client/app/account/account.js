'use strict';

angular.module('kf6App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        params: {
          param1 : null
        },
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginChoiceCtrl'
      })
      .state('login/local', {
        url: '/login/local',
        templateUrl: 'app/account/login/local/login.html',
        controller: 'LoginCtrl'
      })
      .state('login/idul', {
        url: '/login/idul',
        templateUrl: 'app/account/login/idul/idul.html',
        controller: 'LoginIDULCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      });
  });
