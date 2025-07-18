'use strict';

angular.module('kf6App')
    .controller('ScaffoldeditorCtrl', function($scope, $community, $http) {

        $scope.input = {};

        $scope.update = function() {
            $community.fillSupport($scope.contribution);
        };

        $scope.update();

        $scope.preContributeHooks.push(function() {
            if (!$scope.contribution.supports) {
                console.error('contribution.supports is not set.');
                return;
            }

            var order = 0;
            $scope.contribution.supports.forEach(function(each) {
                if (!each.data) {
                    each.data = {};
                }
                order++;
                each.data.order = order;
                $http.put('/api/links/' + each._id, each);
            });
        });

        $scope.addSupport = function() {
            if ($scope.input.supportTitle === '') {
                return;
            }
            if (!$scope.contribution) {
                console.error('contribution is not set.');
                return;
            }
            $community.createSupport($scope.contribution, $scope.input.supportTitle, 100, function() {
                $scope.update();
            });
            $scope.input.supportTitle = '';
        };

        $scope.removeSupport = function(supportref) {
            if (!$scope.contribution) {
                console.error('contribution is not set.');
                return;
            }
            var confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer:' + supportref._to.title + '?');
            if (!confirmation) {
                return;
            }
            $http.delete('api/links/' + supportref._id).success(function() {
                $scope.update();
            });
        };

        $scope.selectSupport = function(supportref) {
            var url = 'contribution/' + supportref.to;
            window.open(url, '_blank');
        };

    });
