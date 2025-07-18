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
    .controller('LoginChoiceCtrl', function($scope, Auth, $location, $window, $http, $kfutil) {
        $scope.user = {};
        $scope.errors = {};
        $scope.captchaSigned = false;

        $scope.login = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                Auth.login({
                    userName: $scope.user.userName,
                    password: $scope.user.password
                })
                    .then(function() {
                        $window.location.href = "/";
                    })
                    .catch(function(err) {
                        $scope.errors.other = err.message;
                    });
            }
        };

        $scope.loginIDUL = function (formIdul) {
            $scope.submitted = true;

            if (formIdul.$valid) {
                Auth.loginIDUL({
                    userName: $scope.user.userName,
                    password: $scope.user.password
                })
                    .then(function () {
                        $window.location.href = "/";
                    })
                    .catch(function (err) {
                        $scope.errors.other = err.message;
                    });
            }
        };

        $scope.setResponse = function (response) {
            // send the client `response` to the server for verification with the secret/private key.
            var req = {};
            req.gRecaptchaResponse = response;

            $http.post('/api/recaptcha', req).then(function(res) {
                if (res.data.responseCode === 0) {
                    $scope.captchaSigned = true;
                }
            });
        };

        $scope.register = function(formRegister) {
            $scope.submitted = true;

            if (formRegister.$valid) {
                Auth.createUser({
                    firstName: $scope.user.firstName,
                    lastName: $scope.user.lastName,
                    email: $scope.user.email,
                    userName: $scope.user.userName,
                    password: $scope.user.password,
                    registrationKey: $scope.user.registrationKey
                })
                    .then(function() {
                        // Account created, redirect to home
                        $window.location.href = "/";
                    })
                    .catch(function(err) {
                        err = err.data;
                        $scope.errors = {};

                        if (err.errorCode) {
                            $scope.errors = err;
                            return;
                        }

                        // Update validity of form fields that match the mongoose errors
                        angular.forEach(err.errors, function(error, field) {
                            formRegister[field].$setValidity('mongoose', false);
                            $scope.errors[field] = error.message;
                        });
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
