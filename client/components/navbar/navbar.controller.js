'use strict';

angular.module('kf6App')
  .controller('NavbarCtrl', function($scope, $location, Auth, $http, $modal, $localStorage) {
    $scope.$localStorage = $localStorage; // To pass localstorage to view.
    $scope.menu = [{
      'title': 'home',
      'link': '/'
    }];
    $scope.isCollapsed = false;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.openDialog = function(size) {
      $modal.open({
        animation: true,
        templateUrl: 'VersionModalContent.html',
        controller: 'VersionModalCtrl',
        size: size
      });
    };

    $scope.openWhatsNewDialog = function(size) {
      $modal.open({
        animation: true,
        templateUrl: 'ChangeLogContent.html',
        controller: 'ChangeLogModalCtrl',
        size: size
      });
    };

    $scope.loadVersion = function() {
      if (!$scope.version) {
        $http.get('api/version').success(function(res) {
          $scope.version = res;
        });
      }
    };
    $scope.loadVersion();

  });

angular.module('kf6App')
  .controller('VersionModalCtrl', function($scope, $http, $kfutil) {
    $kfutil.mixIn($scope);
    $scope.loadVersion = function() {
      if (!$scope.version) {
        $http.get('api/version').success(function(res) {
          $scope.version = res;
        });
      }
    };
    $scope.loadVersion();
  });

angular.module('kf6App')
  .controller('ChangeLogModalCtrl', function($scope, $http, $kfutil, $localStorage) {
    $kfutil.mixIn($scope);
    $kfutil.getKfVersion().then(function(versionObj){
      $localStorage.changeLogViewedVersion = versionObj.version; // saves the last time user viewed the changelog
      $http.get('api/changeLog').success(function(res) {
        $scope.changeLog = res;
      });
    });
});
