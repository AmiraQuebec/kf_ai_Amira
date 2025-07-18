'use strict';

angular.module('kf6App')
    .controller('CommunityeditorCtrl', function($scope, $stateParams, $http, $community) {
        var communityId = $stateParams.communityId;

        $scope.community = {};

        $http.get('api/communities/' + communityId).success(function(community) {
            $scope.community = community;
        });

        $scope.save = function() {
            $http.put('api/communities/' + communityId, $scope.community).success(function() {
                window.alert('successed.');
            }).error(function() {
                window.alert('failed.');
            });
        };

        $scope.blockLoginWriters = function() {
            $scope.changeWritersState(function(member) {
                return member.role === 'writer';
            }, function(member) {
                member.blockLogin = true;
            });
        };

        $scope.unblockLoginWriters = function() {
            $scope.changeWritersState(function(member) {
                return member.role === 'writer';
            }, function(member) {
                member.blockLogin = false;
            });
        };

        $scope.changeWritersState = function(test, change) {
            var key = window.prompt('Please community registration key to confirm');
            if (key === $scope.community.registrationKey) {
                $community.enter($scope.community._id, function() {
                    $community.refreshMembers(function() {
                        var cData = $community.getCommunityData();
                        var targets = [];
                        cData.membersArray.forEach(function(member) {
                            if (test(member)) {
                                targets.push(member);
                            }
                        });
                        targets.forEach(function(member) {
                            change(member);
                        });
                        window.alert(targets.length + ' objects will be updated.');
                        $community.modifyObjects(targets, function() {
                            window.alert('finished.');
                        });
                    });
                });
            } else {
                window.alert('The key didn\'t match.');
            }
        };


        $scope.updateAllCash = function() {
            $http.get('/api/links/updateallcache/' + communityId).
            success(function() {
                window.alert('updateing cache successed.');
            });
        };
    });
