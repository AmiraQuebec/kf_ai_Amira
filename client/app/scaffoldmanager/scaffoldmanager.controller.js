'use strict';

angular.module('kf6App')
    .controller('ScaffoldmanagerCtrl', function($scope, $stateParams, $community) {
        if ($stateParams.communityId) {
            $community.enter($stateParams.communityId, function() {}, function() {
                $community.refreshRegisteredScaffolds();
                $community.getContext(null, function(context) {
                    $scope.rootContext = context;
                });
            });
        }

        $scope.status = {};
        $scope.status.isSavingProgressMonitorCollapsed = true;

        $scope.scaffolds = $community.getCommunityData().registeredScaffolds;

        $scope.showSaved = function() {
            $scope.status.isSavingProgressMonitorCollapsed = false;
            window.setTimeout(function() {
                $scope.status.isSavingProgressMonitorCollapsed = true;
                $scope.$digest($scope.status.isSavingProgressMonitorCollapsed);
            }, 2000);
        };

        $scope.addScaffold = function() {
            if ($scope.input.scaffoldTitle === '') {
                return;
            }
            $community.createScaffold($scope.input.scaffoldTitle, function() {
                $community.refreshRegisteredScaffolds();
                //$state.reload();
            });
            $scope.input.scaffoldTitle = '';
        };

        $scope.removeScaffold = function(scaffold) {
            var confirmation = window.confirm('Are you sure to delete ' + scaffold.title + '?');
            if (!confirmation) {
                return;
            }

            $community.getLinksTo(scaffold._id, 'uses', function(links) {
                if (links.length > 0) {
                    window.alert('You cannot delete a scaffold which is used');
                    return;
                }
                _.remove($scope.scaffolds, function(n) {
                    return n._id === scaffold._id;
                });
                $scope.save();
            });
        };

        $scope.editScaffold = function(scaffold) {
            var url = 'contribution/' + scaffold._id;
            window.open(url, '_blank');
        };

        $scope.saveOrder = function() {
            $scope.save();
        };

        $scope.isManager = function() {
            var author = $community.getCommunityData().author;
            if (!author) {
                return false;
            }
            return author.role === 'manager';
        };

        $scope.save = function() {
            var community = {};
            community.scaffolds = _.map($scope.scaffolds, '_id');
            $community.updateCommunity(community, function() {
                $community.refreshScaffolds(function() {});
                $scope.showSaved();
            });
        };

        $scope.openRootContext = function() {
            var url = '/contribution/' + $scope.rootContext._id;
            window.open(url, '_rootcontext');
        };
    });
