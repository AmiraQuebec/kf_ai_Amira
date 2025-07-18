'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('admintools', {
                url: '/admintools',
                templateUrl: 'app/admintools/admintools.html',
                controller: 'AdminToolsCtrl'
            });
    });
