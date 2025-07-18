'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('authormanager', {
                url: '/authormanager/:communityId',
                templateUrl: 'app/authormanager/authormanager.html',
                controller: 'AuthormanagerCtrl'
            });
    });