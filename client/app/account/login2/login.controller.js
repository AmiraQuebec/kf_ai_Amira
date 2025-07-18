'use strict';

angular.module('kf6App')
    .controller('LoginCtrl2', function($scope, Auth, $location, $window, $kfutil) {
        $scope.user = {};
        $scope.errors = {};

        $scope.login = function(form) {
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
            if(provider === 'global'){
                window.alert("Login with Global KF not implemented!");
            }
            else if(provider === 'google'){
                $window.location.href = '/auth/' + provider;
            }
            else if(provider === 'facebook'){
                window.alert("Login with Global Facebook not implemented!");
            }
            else if(provider === 'twitter'){
                window.alert("Login with Global Twitter not implemented!");
            }
        };

        if ($kfutil.isIE()) {
            $scope.IEwarning = true;
            window.alert("Internet Explorer is not recommended for use of KF6.");
        }
    });
