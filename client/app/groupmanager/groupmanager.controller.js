'use strict';

angular.module('kf6App')
    .controller('GroupmanagerCtrl', function($scope, $community, $state, $stateParams) {
        var communityId = $stateParams.communityId;
        $community.enter(communityId);
        $community.refreshGroups(function(groups) {
            $scope.groups = groups;
        });

        $scope.selectGroup = function(group) {
            var url = 'contribution/' + group._id;
            window.open(url, '_blank');
        };

        $scope.addGroup = function() {
            if ($scope.input.groupTitle === '') {
                return;
            }

            $community.createGroup($scope.input.groupTitle, function() {
                $state.reload();
            });
            $scope.input.supportTitle = '';
        };

        $scope.removeGroup = function(group) {
            if (!window.confirm('Are you sure to remove the group?')) {
                return;
            }

            group.status = 'inactive';
            $community.modifyObject(group, function() {
                $state.reload();
            });
        };
    });