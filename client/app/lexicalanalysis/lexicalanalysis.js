'use strict';

angular.module('kf6App')
    .config(function ($stateProvider) {
        $stateProvider
            .state('lexicalanalysis', {
                url: '/lexicalanalysis/:communityId',
                templateUrl: 'app/lexicalanalysis/lexicalanalysis.html',
                controller: 'LexicalAnalysisCtrl'
            });
    });