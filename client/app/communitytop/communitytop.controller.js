'use strict';

angular.module('kf6App')
    .controller('CommunitytopCtrl', function($scope, $community, $stateParams, $location) {
        var communityId = $stateParams.communityId;

        $community.enter(communityId);

        $scope.handler = function() {
            var views = $community.getViews();
            if (views.length <= 0) {
                window.alert('view not found.');
                return;
            }
          // TODO improve view sorting to select a default view instead of relying on created datetime
          // using created allows to temporarily play with its value to change the default view
          views.sort(function(a, b){
            if (a.created < b.created) {
              return -1;
            }
            if (a.created > b.created) {
              return 1;
            }
              return 0;
          });
            //var url = './view/' + views[0]._id;
            //window.location = url;
            var url = '/view/' + views[0]._id;
            $location.path(url).replace();
        };

        $community.refreshViews($scope.handler);
    });
