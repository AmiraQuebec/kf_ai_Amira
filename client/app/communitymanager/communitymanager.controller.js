'use strict';

angular.module('kf6App')
    .controller('CommunitymanagerCtrl', function ($scope, $http, $state, Auth, $location, $community, $kfutil) {
        $kfutil.mixIn($scope);

        $scope.selected = {};
        $scope.myRegistrations = [];
        $scope.communities = [];
        $scope.newCommunity = {};
        $scope.isAdmin = Auth.isAdmin;
        $scope.getCurrentUser = Auth.getCurrentUser;

        $http.get('/api/users/myRegistrations').success(function (myRegs) {
            $scope.myRegistrations = myRegs;
        });

        $http.get('/api/communities').success(function (communities) {
            $scope.communities = communities;
        });

        $scope.addRegistration = function () {
            if (!$scope.selected.community) {
                window.alert('Community must be selected');
                return;
            }
            var author = {};
            author.userId = Auth.getCurrentUser()._id;
            author.communityId = $scope.selected.community._id;
            author.registrationKey = $scope.selected.key;
            $http.post('/api/authors', author).success(function () {
                $state.reload();
            }).error(function (msg) { //function(data, status, headers, config)
                window.alert('Error: ' + msg);
            });
        };

        $scope.addNewCommunity = function () {
            if (!$scope.newCommunity.title || $scope.newCommunity.title === '') {
                window.alert('Title must be input');
                return;
            }
            if (!$scope.newCommunity.key || $scope.newCommunity.key === '') {
                window.alert('RegistrationKey must be input');
                return;
            }
            if (!$scope.newCommunity.key_admin || $scope.newCommunity.key_admin === '') {
                window.alert('RegistrationKey must be input');
                return;
            }

            $community.createCommunity($scope.newCommunity.title, $scope.newCommunity.key, $scope.newCommunity.key_admin,  function () {
                $state.reload();
            }, function (err) {

                console.error(err);

                window.alert('error in creating community');
            });

            $scope.newCommunity = {};
        };

        $scope.enterCommunity = function (author) {
            //$community.login(author._id, function() {
            $location.path('communitytop/' + author.communityId);
            //});
        };

        $scope.toTimeString = function (time) {
            if (!time) {
                return '';
            }
            var d = new Date(time);
            return d.toLocaleString();
        };

        $scope.openManager = function () {
            if (!$scope.selected.community) {
                window.alert('Error: please select community.');
                return;
            }
            var id = $scope.selected.community._id;
            var url = 'communityeditor/' + id;
            $location.path(url);
        };

        $scope.saveOrder = function () {
            modifyObjects($scope.myRegistrations, function () {
                $state.reload();
            });
        };

        /* copied from community.service and changed a bit for here */
        var modifyObjects = function (objects, success, error) {
            var funcs = [];
            objects.forEach(function (object) {
                funcs.push(function (handler) {
                    modifyObject(object.communityId, object, handler, error);
                });
            });
            $community.waitFor(funcs, success);
        };

        /* copied from community.service and changed a bit for here */
        var modifyObject = function (communityId, object, success, error) {
            $http.put('/api/objects/' + communityId + '/' + object._id, object).success(function (newobject) {
                if (success) {
                    success(newobject);
                }
            }).error(function (data) {
                if (error) {
                    error(data);
                } else {
                    window.alert('error on modifyObject: ' + data);
                }
            });
        };

        $scope.$on('$destroy', function () { });
    });
