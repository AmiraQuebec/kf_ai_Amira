'use strict';

angular.module('kf6App')
    .controller('ScaffoldCtrl', function($scope, $community,$compile) {

        $scope.scaffolds = $community.getScaffolds();
        $scope.current = $scope.scaffolds[0];

        $scope.initializingHooks.push(function() {
            $community.refreshScaffolds(function(scaffolds) {
                $scope.scaffolds = scaffolds;
                $scope.current = $scope.scaffolds[0];
            });
        });

        $scope.allClicked = function(scaffold) {
            if (!$scope.addSupport) {
                window.alert('no $scope.addSupport(supportLink) defined.');
                return;
            }
            if (!$scope.insertText) {
                window.alert('no $scope.insertText(text) defined.');
                return;
            }
            if (!$scope.current) {
                console.alert('Error scaffold wasn\'t selected');
                return;
            }
            var title = '<h1>' + $scope.current.title + '</h1>\n<br>';
            $scope.insertText(title);
            scaffold.supports.forEach(function(support) {
                $scope.addSupportInternal($scope.current, support, false);
            });
        };

        $scope.supportClicked = function(supportLink) {
            if (!$scope.addSupport) {
                window.alert('no $scope.addSupport(supportLink) defined.');
                return;
            }
            if (!$scope.current) {
                console.alert('Error scaffold wasn\'t selected');
                return;
            }
            $scope.addSupportInternal($scope.current, supportLink, true);
        };

        $scope.addSupportInternal = function(scaffold, support, selection) {
            var isTemplate = scaffold && scaffold.data && scaffold.data.isTemplate;
            var addhyphen = true;
            var initialText = '';
            if (isTemplate) {
                addhyphen = false;
                initialText = '<br><br>';
            }
            $scope.addSupport(support, selection, addhyphen, initialText, isTemplate);
        };

        $scope.onContextOpen = function(childScope) {
            $scope.contextTarget = childScope.s;
        };

        $scope.openInWindow = function() {
            var url = '/contribution/' + $scope.contextTarget.to;
            window.open(url, '_blank');
        };

        $scope.scaffoldOpenInWindow = function() {
            var url = '/contribution/' + $scope.current._id;
            window.open(url, '_blank');
        };

        $scope.annotatorScaffoldInit = function(annotatorEditorID){
            $compile($('#annoSide').contents())($scope);
            $community.annotatorEditorId = annotatorEditorID;
            console.log($community.annotatorEditorId);
        };

        $scope.annotatorScaffoldClose = function(){
            $community.annotatorEditorId = null;
        };

    });
