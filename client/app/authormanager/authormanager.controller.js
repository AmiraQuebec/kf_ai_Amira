'use strict';

angular.module('kf6App')
    .controller('AuthormanagerCtrl', function ($scope, $community, $stateParams, $state, $http, User) {
        $scope.user = User.get();
        $scope.communityId = $stateParams.communityId;
        $scope.simpleTableData = [];

        $scope.adminUser = [];
        $scope.renameUser = {};
        $scope.getManagers = function () {
            var authors = $community.getCommunityData().membersArray;
            $scope.simpleTableData = [];
            authors.forEach(function (each) {
                if (each.role === 'writer') {
                    $scope.simpleTableData.push({
                        firstname: each.firstName,
                        lastname: each.lastName,
                        username: each.userName,
                        email: each.email
                    });
                }
            });

            return _.filter(authors, function (elem) {
                return elem.role === 'manager';
            });
        };

        /*Added to render datatable*/
        $scope.renderDataTable = function(){
            var table = $('#authorManagerTable').DataTable();
            table.MakeCellsEditable({
                "onUpdate": myCallbackFunction,
                "columns": [0,1],     /*Allows only specified col number to be modifies*/
            });
        };


        function myCallbackFunction(updatedCell, updatedRow, oldValue) {

            if(updatedCell.data() !== oldValue) {
                $(window).bind('beforeunload',function() {
                    return "sure?";
                });
                var rowArray = updatedRow.data();   /*Get the value for each cell in that row */
                var updatedData = {
                    FirstName: rowArray[0],
                    LastName: rowArray[1]
                };
                $scope.renameUser[rowArray[2]] = updatedData;    /*Create dictionary with username and firstname & lastname values*/
            }
        }

        // window.onbeforeunload =  function(e){
        //     return 'sure?';
        // };
        $scope.renameAllUser = function(){

            var r = window.confirm("Are you sure you want to rename the user(s)? \nNote: You won't be able to revert back the existing name(s).");
            if (r === true) {
                if((Object.keys($scope.renameUser).length)>0) {
                    $http.post('/api/users/renameAllUser/' + $scope.communityId, {
                        userData: $scope.renameUser
                    }).success(function (result) {
                        $scope.renameUserResult = result.recordsModified;
                        window.alert($scope.renameUserResult+ " FirstName/LastName renamed successfully!");
                        $(window).unbind('beforeunload');
                    }).error(function (err) {
                        console.error(err);
                    });
                }
            }
        };



        $scope.getAdminUsers = function () {
            $http.get('/api/users/search/role/').success(function (result) {
                result.forEach(function (each) {
                    $scope.adminUser.push(each.userName);
                });
            }).error(function (err) {
                console.error(err);
            });
        };

        $scope.getAdminUsers();

        if ($stateParams.communityId) {
            $community.enter($stateParams.communityId, function () {
                $community.refreshMembers(function () {});
            });
        }

        $scope.checkManager = function() {
            return $scope.user.role === 'manager' || $scope.user.role === 'admin';
        };

        $scope.authorSelected = function (author) {
            $scope.addToManager(author);
        };

        $scope.addToManager = function (author) {
            if (author.role === 'manager') {
                window.alert('The author is already manager.');
                return;
            }

            var seed = _.extend({}, author);
            seed.role = 'manager';
            $community.modifyObject(seed, function () {
                $state.reload();
            }, function (err) {
                window.alert(err);
            });
        };

        $scope.removeFromManager = function (author) {
            if (author.role !== 'manager') {
                window.alert('The author is not a manager.');
                return;
            }

            if (author._id === $community.getCommunityData().author._id) {
                window.alert('You cannot make yourself a writer.');
                return;
            }

            var seed = _.extend({}, author);
            seed.role = 'manager';
            seed.role = 'writer';
            $community.modifyObject(seed, function () {
                $state.reload();
            }, function (err) {
                window.alert(err);
            });
            $scope.count();
        };

        $scope.pager = {};
        $scope.pager.getStart = function () {
            return (($scope.pager.page - 1) * $scope.pager.pagesize) + 1;
        };
        $scope.pager.getEnd = function () {
            var end = $scope.pager.getStart() + $scope.pager.pagesize - 1;
            if (end > $scope.pager.total) {
                end = $scope.pager.total;
            }
            return end;
        };
        $scope.pager.pagesize = 50;


        $scope.count = function () {
            $http.post('/api/authors/search/count/' + $scope.communityId, {
                query: $scope.queryString,
            }).success(function (result) {
                $scope.pager.total = result.count;
                $scope.pager.page = 1;
                $scope.search();
            }).error(function () {});

        };
        $scope.search = function () {
            $http.post('api/authors/search/writer/' + $scope.communityId, {
                query: $scope.queryString,
                pagesize: $scope.pager.total,
                page: $scope.pager.page,
            }).success(function (authors) {
                $scope.authors = authors;
            });
        };

        $scope.pageChanged = function () {
            $scope.search();
        };
        $scope.count();
        $scope.getTable = function () {
            return $scope.simpleTableData;
        };
        $scope.getTableHeader = function () {
            return ['firstname', 'lastname', 'username', 'email'];
        };
        $scope.resetPassword = function (author) {
            $http.patch('api/users/' + author.userId, {
                password: author.password
            }).success(function () {
                window.alert('Password changed successfully.');
                author.password = null;
            }).error(function (err) {
                console.error(err);
                window.alert(err.message);
            });
        };
    })
    .directive('onFinishRender',['$timeout', '$parse', function ($timeout, $parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                    if(!!attr.onFinishRender){
                        $parse(attr.onFinishRender)(scope);
                    }
                });
            }
        }
    };
}]);

