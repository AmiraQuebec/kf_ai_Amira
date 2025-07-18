'use strict';

angular.module('kf6App')
    .controller('ScaffoldsettingsubeditorCtrl', function($scope, $community, $http) {
        $scope.input = {};

        $scope.registeredScaffolds = $community.getCommunityData().registeredScaffolds;

        $scope.update = function() {
            $community.loadScaffoldLinks($scope.contribution, function(scaffoldlinks) {
                $scope.scaffoldlinks = scaffoldlinks;
            });
            $community.refreshRegisteredScaffolds();
        };

        if (!$scope.initializingHooks) {
            window.alert('error !$scope.initializingHooks');
        }
        if ($scope.initializingHookInvoked === true) {
            $scope.update();
        } else {
            $scope.initializingHooks.push(function() {
                $scope.update();
            });
        }

        $scope.preContributeHooks.push(function() {
            if (!$scope.scaffoldlinks) {
                console.error('scaffoldlinks is not set.');
                return;
            }

            var order = 0;
            $scope.scaffoldlinks.forEach(function(each) {
                if (!each.data) {
                    each.data = {};
                }
                order++;
                each.data.order = order;
                $http.put('/api/links/' + each._id, each);
            });
        });

        $scope.addScaffold = function() {
            if ($scope.input.scaffoldTitle === '') {
                return;
            }
            if (!$scope.contribution) {
                console.error('contribution is not set.');
                return;
            }
            $community.createScaffold($scope.input.scaffoldTitle, function(scaffold) {
                $community.usesScaffold($scope.contribution, scaffold, 100, function() {
                    $scope.update();
                });
            });
            $scope.input.scaffoldTitle = '';
        };

        $scope.removeSupport = function(scaffoldlink) {
            if (!$scope.contribution) {
                console.error('contribution is not set.');
                return;
            }
            var confirmation = window.confirm('Are you sure to delete ' + scaffoldlink._to.title + '?');
            if (!confirmation) {
                return;
            }
            $http.delete('api/links/' + scaffoldlink._id).success(function() {
                $scope.update();
            });
        };

        $scope.useScaffold = function(scaffold) {
            if ($scope.includes(scaffold)) {
                window.alert('The scaffold is already in use.');
                return;
            }
            $community.usesScaffold($scope.contribution, scaffold, 100, function() {
                $scope.update();
            });
        };

        $scope.includes = function(scaffold) {
            var len = $scope.scaffoldlinks.length;
            for (var i = 0; i < len; i++) {
                if ($scope.scaffoldlinks[i].to === scaffold._id) {
                    return true;
                }
            }
            return false;
        };

        $scope.selectSupport = function(scaffoldlink) {
            var url = 'contribution/' + scaffoldlink.to;
            window.open(url, '_blank');
        };
    });
