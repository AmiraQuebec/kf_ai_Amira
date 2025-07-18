'use strict';

angular.module('kf6App')
    .controller('ContexteditorCtrl', function( $kfutil, $scope, $community) {
        $scope.initialize = function() {

        };
        $scope.viewSetting = {};
        $scope.languages=[];
        $scope.language={};
        $scope.languageCode={};

        $scope.lang ={};
        $scope.languages = $kfutil.getLanguages();
        $scope.languageNames = Object.keys($scope.languages);


        $scope.onSelected = function(){
            if($scope.contribution.data.languages.indexOf($scope.contribution.data.defaultLang) === -1){
                $scope.contribution.data.languages.push($scope.contribution.data.defaultLang);
            }
        };

        $scope.viewsettingEnabledChanged = function() {
            if ($scope.viewSetting.enabled) {
                $scope.contribution.data.viewSetting = $community.makeDefaultViewSetting();
            } else {
                $scope.contribution.data.viewSetting = null;
            }
        };

        $scope.update = function() {
            if (!$scope.contribution.data) {
                $scope.contribution.data = {};
            }
            if ($scope.contribution.data.viewSetting) {
                $scope.viewSetting.enabled = true;
            }
            if (!$scope.contribution.data.plugins) {
                $scope.contribution.data.plugins = {};
            }
            //Added for multi langugage notes : start
            if(!$scope.contribution.data.languages){
                $scope.contribution.data.languages = [];
            }
            if(!$scope.contribution.data.defaultLang){
                $scope.contribution.data.defaultLang = [];
            }

            //Added for multi langugage notes : end

        };

        if (!$scope.initializingHooks) {
            window.alert('error !$scope.initializingHooks');
        }
        $scope.initializingHooks.push(function() {
            $scope.update();

        });


        $scope.openScaffoldManager = function() {
            var url = '/scaffoldmanager/' + $scope.contribution.communityId;
            window.open(url, '_scaffoldmanager');
        };

    });
