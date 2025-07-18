'use strict';

angular.module('kf6App')
    .controller('GroupCtrl', function($scope, $community) {

        $scope.group = {};

        if (!$scope.initializingHooks) {
            window.alert('error !$scope.initializingHooks');
        }
        $scope.initializingHooks.push(function() {
            $community.refreshGroups(function() {
                $scope.group = $scope.community.groups[$scope.contribution._id];
                $scope.group._members = [];
                $scope.group.members.forEach(function(authorId) {
                    $scope.group._members.push($community.getMember(authorId));
                });
            });
        });

        $scope.preContributeHooks.push(function() {
            $scope.contribution.members = _.map($scope.group._members, '_id');
        });

        $scope.authorSelected = function(author) {
            $scope.addMember(author);
        };

        $scope.addMember = function(author) {
            if (_.includes($scope.group._members, author)) {
                window.alert('already included');
                return;
            }
            $scope.group._members.push(author);
        };

        $scope.removeMember = function(author) {
            var authors = $scope.group._members;
            var index = authors.indexOf(author);
            if (index >= 0) {
                authors.splice(index, 1);
            }
        };
    });
