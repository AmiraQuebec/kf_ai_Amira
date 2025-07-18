'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('groupmanager', {
                url: '/groupmanager/:communityId',
                templateUrl: 'app/groupmanager/groupmanager.html',
                controller: 'GroupmanagerCtrl'
            });
    });