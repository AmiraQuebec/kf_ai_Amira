'use strict';

// angular.module('kf6App')
//     .controller('LoginChoiceCtrl', function ($scope, $location) {
//
//         $scope.loginLocal = function () {
//             $location.path('/login/local');
//         };
//
//         $scope.loginIDUL = function () {
//             $location.path('/login/idul');
//         };
//     });
angular.module('kf6App')
    .controller('LoginChoiceCtrl', function($scope, Auth, $location, $window, $kfutil) {
        $scope.user = {};
        $scope.errors = {};

        $scope.loginLocal = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                Auth.login({
                    userName: $scope.user.userName,
                    password: $scope.user.password
                })
                    .then(function() {
                        // Logged in, redirect to original requested URL if exists, otherwise to home
                        if ($location.search().redirect) {
                            $location.url(decodeURI($location.search().redirect));
                        } else {
                            $location.path('/');
                        }
                    })
                    .catch(function(err) {
                        $scope.errors.other = err.message;
                    });
            }
        };

        $scope.loginOauth = function(provider) {
            $window.location.href = '/auth/' + provider;
        };

        if ($kfutil.isIE()) {
            $scope.IEwarning = true;
            window.alert("Internet Explorer is not recommended for use of KF6.");
        }
    });

