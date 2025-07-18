'use strict';

angular.module('kf6App')
    .controller('LoginIDULCtrl', function ($scope, Auth, $location, $window) {
        $scope.user = {};
        $scope.errors = {};

        $scope.loginIDUL = function (form) {
            $scope.submitted = true;

            if (form.$valid) {
                Auth.loginIDUL({
                    userName: $scope.user.userName,
                    password: $scope.user.password
                })
                    .then(function () {
                        // Logged in, redirect to original requested URL if exists, otherwise to home
                        if ($location.search().redirect) {
                            $location.url(decodeURI($location.search().redirect));
                        } else {
                            $location.path('/');
                        }
                    })
                    .catch(function (err) {
                        $scope.errors.other = err.message;
                    });
            }
        };

        $scope.loginOauth = function (provider) {
            $window.location.href = '/auth/' + provider;
        };
    });
