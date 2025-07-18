'use strict';

angular.module('kf6App')
    .controller('AdminToolsCtrl', function($scope, $http, Auth, $community) {
        $scope.isAdmin = Auth.isAdmin;
        $scope.model = {};

        $scope.migratePressed = function() {
            if ($scope.model.password !== 'kf6') {
                window.alert('passowrd doesn\'t match');
                return;
            }

            $http.get('/api/users/myRegistrations').success(function(authors) {
                $http.get('api/communities/').success(function(communities) {
                    communities.forEach(function(community) {
                        if (!isRegistered(authors, community)) {
                            console.error('I am not an author of the community: ' + community.title + ', ' + community._id);
                            return;
                        }
                        if (community.rootContextId) {
                            console.log('The community already has a rootContextId: ' + community.title + ', ' + community._id);
                            return;
                        }

                        console.log('The community of ' + community.title + ', ' + community._id + ' will be migrated.');
                        $community.createRootContext(community, function(context) {
                            var counter = 1;
                            community.scaffolds.forEach(function(scaffoldId) {
                                $community.usesScaffold(context, scaffoldId, counter);
                                counter++;
                            });
                        }, function(err) {
                            console.error('An ERROR happened during migration of:' + community.title);
                            console.error(err);
                        });
                    });
                });
            });
        };

        function isRegistered(authors, community) {
            for (var i = 0; i < authors.length; i++) {
                var author = authors[i];
                if (author.communityId === community._id) {
                    return true;
                }
            }
            return false;
        }

    });
