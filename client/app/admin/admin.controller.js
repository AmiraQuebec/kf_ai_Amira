'use strict';

angular.module('kf6App')
    .controller('AdminCtrl', function($scope, $http) {

        $scope.pager = {};
        $scope.pager.getStart = function() {
            return (($scope.pager.page - 1) * $scope.pager.pagesize) + 1;
        };
        $scope.pager.getEnd = function() {
            var end = $scope.pager.getStart() + $scope.pager.pagesize - 1;
            if (end > $scope.pager.total) {
                end = $scope.pager.total;
            }
            return end;
        };
        $scope.pager.pagesize = 50;

        $scope.count = function() {
            $http.post('/api/users/search/count', {
                query: $scope.queryString
            }).success(function(result) {
                $scope.pager.total = result.count;
                $scope.pager.page = 1;
                $scope.search();
            }).error(function() {});
        };

        $scope.search = function() {
            $http.post('api/users/search', {
                query: $scope.queryString,
                pagesize: $scope.pager.pagesize,
                page: $scope.pager.page
            }).success(function(users) {
                $scope.users = users;
            });
        };

        $scope.pageChanged = function() {
            $scope.search();
        };

        $scope.count();

        $scope.resetPassword = function(user) {
            $http.put('api/users/' + user._id, user).success(function() {
                window.alert('succeeded.');
            }).error(function(err) {
                console.error(err);
                window.alert(err.message);
            });
        };

    });