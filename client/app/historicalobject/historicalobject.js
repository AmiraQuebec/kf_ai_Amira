'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('historicalobject', {
                url: '/historicalobject/:id',
                templateUrl: 'app/historicalobject/historicalobject.html',
                controller: 'HistoricalobjectCtrl'
            });
    });