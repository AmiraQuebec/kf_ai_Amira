'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('stats', {
                url: '/stats/:communityId',
                templateUrl: 'app/stats/stats.html',
                controller: 'StatsCtrl'
            });
    });

angular.module('kf6App')
    .directive('kfelement', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var contribution = scope.contribution;
                var el = element[0];
                el.addEventListener('dragstart', function(e) {
                    var ids = [contribution._id];
                    e.dataTransfer.setData('text', 'objectIds:' + JSON.stringify(ids));
                });
            }
        };
    });