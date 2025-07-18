'use strict';

angular.module('kf6App')
    .controller('SignupCtrl', function($scope, Auth, $location, $window, $http) {
        $scope.user = {};
        $scope.errors = {};
        $scope.captchaSigned = false;

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
                        $location.path('/');
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
    });
