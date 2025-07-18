'use strict';

angular.module('kf6App')
    .controller('DateSelectorCtrl', function ($scope) {
        $scope.openFrom = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.fromOpened = true;
        };

        $scope.openTo = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.toOpened = true;
        };

        $scope.$watch('from', function () {
            if ($scope.from !== undefined) {
                $scope.dateSelectedFrom($scope.from);
            }
        });
        $scope.$watch('to', function () {
            if ($scope.to !== undefined) {
                $scope.dateSelectedTo($scope.to);
            }
        });

    });