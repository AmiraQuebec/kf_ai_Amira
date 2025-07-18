'use strict';

angular.module('kf6App')
    .controller('ViewSelectorCtrl', function ($scope, $community) {
        $scope.community = $community.getCommunityData();
        $scope.authors = $scope.community.membersArray;
        $community.refreshViews(function () {
            $scope.views = $community.getViews();
        });
        $scope.selected = {};
        $scope.selected.views = [];

        $scope.addViews = function () {
            if ($scope.selected.views && $scope.selected.views.length >= 1) {
                $scope.selected.views.forEach(function (each) {
                    $scope.viewSelected(each);
                });
                $scope.selected.views = [];
            }else{
                window.alert('La perspective n\'est pas sélectionnée');
                return;
            }
        };
    });

