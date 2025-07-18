'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('help', {
                url: '/help/',
                templateUrl: 'app/help/help.html',
                controller: 'HelpCtrl'
            });
    });