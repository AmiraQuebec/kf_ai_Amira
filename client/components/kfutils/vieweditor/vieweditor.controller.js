'use strict';

angular.module('kf6App')
    .controller('VieweditorCtrl', function($scope, $community) {
        $scope.setting = {
            notificationSettingEnabled: false,
            receiveNotification: true
        };
        $scope.notification = null;

        $scope.notificationSettingEnabledChanged = function() {
            //do nothing
        };

        $scope.notificationSettingChanged = function() {
            //do nothing
        };

        $scope.viewsettingEnabledChanged = function() {
            if ($scope.setting.viewSettingEnabled) {
                $scope.contribution.data.viewSetting = $community.makeDefaultViewSetting();
            } else {
                $scope.contribution.data.viewSetting = null;
            }
        };

        $scope.update = function() {
            if ($scope.contribution.data && $scope.contribution.data.viewSetting) {
                $scope.setting.viewSettingEnabled = true;
            }
            $community.getContext($scope.contribution._id, function(context) {
                $scope.rootContext = context;
            });
            $community.getLinksFromTo($scope.contribution._id, $community.getAuthor()._id, 'notifies', function(links) {
                console.log(links);
                if (links.length > 0) {
                    $scope.notification = links[0];
                    $scope.setting.notificationSettingEnabled = $scope.notification.data.notificationSettingEnabled;
                    $scope.setting.receiveNotification = $scope.notification.data.receiveNotification;
                }
            });
        };

        if (!$scope.initializingHooks) {
            window.alert('error !$scope.initializingHooks');
        }
        $scope.initializingHooks.push(function() {
            $scope.update();
        });

        $scope.preContributeHooks.push(function() {
            var data = {};
            if ($scope.notification) {
                data = $scope.notification.data;
            }

            data.notificationSettingEnabled = $scope.setting.notificationSettingEnabled;
            data.receiveNotification = $scope.setting.receiveNotification;
            if ($scope.notification) {
                $community.saveLink($scope.notification);
            } else {
                $community.createLink($scope.contribution._id, $community.getAuthor()._id, 'notifies', data, function() {});
            }
        });

        $scope.openRootContext = function() {
            var url = '/contribution/' + $scope.rootContext._id;
            window.open(url, '_rootcontext');
        };

    });
