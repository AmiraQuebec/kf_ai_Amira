'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('contribution2', {
                url: '/contribution/:contributionId/:contextId',
                templateUrl: 'app/contribution/contribution.html',
                controller: 'ContributionCtrl'
            });
        $stateProvider
            .state('contribution', {
                url: '/contribution/:contributionId',
                templateUrl: 'app/contribution/contribution.html',
                controller: 'ContributionCtrl'
            });
    });

angular.module('kf6App')
    .directive('kfDragSource', function() {
        return {
            restrict: 'C',
            link: function(scope, element) {
                var $scope = scope.$parent;
                var el = element[0];
                //el.draggable = true;
                el.addEventListener('dragstart', $scope.kfdragstart);
                el.addEventListener('copy', $scope.kfcopy);
            }
        };
    });

angular.module('kf6App')
    .directive('kfimgdrag', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var $scope = scope.$parent;
                var el = element[0];
                //el.draggable = true;
                el.addEventListener('dragstart', $scope.imgDragStart);
            }
        };
    });

angular.module('kf6App').filter('filterByProject', function() {
    return function(threads, project) {
        var filtered = [];
        if (!project || project === 'all') {
            return (threads);
        }
        for( var i = 0; i < threads.length; ++i ) {
            if (threads[i].projectId === parseInt(project)) {
                filtered.push(threads[i]);
            }
        }
        return filtered;
    };
});

angular.module('kf6App').filter('filterBelongsToThread', function() {
    return function(threads, currentThreadsObj) {
        var filtered = [];
        if (!currentThreadsObj || currentThreadsObj.length === 0) {
            return (threads);
        }
        for( var i = 0; i < threads.length; ++i ) {
            if (!currentThreadsObj[threads[i].id]) {
                filtered.push(threads[i]);
            }
        }
        return filtered;
    };
});

angular.module('kf6App')
    .directive('kffiledrag', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var $scope = scope.$parent;
                var el = element[0];
                //el.draggable = true;
                el.addEventListener('dragstart', $scope.fileDragStart);
            }
        };
    });
