'use strict';

angular.module('kf6App')
  .controller('MainCtrl', function($scope, Auth) {
    $scope.isLoggedIn = Auth.isLoggedIn;
  });
