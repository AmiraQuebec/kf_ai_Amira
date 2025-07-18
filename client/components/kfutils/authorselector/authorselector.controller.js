'use strict';

angular.module('kf6App')
    .controller('AuthorSelectorCtrl', function ($scope, $community) {

        $scope.selected = {};
        $scope.authors = $community.getMembersArray();
        $scope.hideUserNameInAuthorSelector = false;

        var initialize = function () {
            $scope.community = $community.getCommunityData();

            setTimeout(function(){
                $community.getContext(null, function(context){
                    // if userNames are to be hidden is set true in community settings.
                    $scope.context = context;
                    $scope.hideUserNameInAuthorSelector = context.data.hideUserNameInAuthorSelector;
                });
            }, 1000);

            $scope.authors = $scope.community.membersArray;
        };

        if ($scope.initializingHooks) {
            $scope.initializingHooks.push(function () {
                initialize();
            });
        } else {
            initialize();
        }

        $scope.addAuthor = function () {
            if (!$scope.selected.author) {
                window.alert('aucun auteur sélectionné.');
                return;
            }

            if (!$scope.authorSelected) {
                window.alert('no $scope.authorSelected defined.');
                return;
            }

            $scope.authorSelected($scope.selected.author);
        };
    });
