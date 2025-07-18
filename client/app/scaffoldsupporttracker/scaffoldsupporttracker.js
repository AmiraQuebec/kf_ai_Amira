'use strict';

angular.module('kf6App')
    .config(function ($stateProvider) {
        $stateProvider
            .state('scaffoldsupporttracker', {
                url: '/scaffoldsupporttracker/:communityId',
                templateUrl: 'app/scaffoldsupporttracker/scaffoldsupporttracker.html',
                controller: 'ScaffoldsupporttrackerCtrl'
            });
    });