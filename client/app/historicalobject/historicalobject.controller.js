'use strict';

angular.module('kf6App')
    .controller('HistoricalobjectCtrl', function($scope, $http, $stateParams) {
        $scope.historicalId = $stateParams.id;
        $scope.dataVariables = [];
        $http.get('api/historicalobjects/' + $scope.historicalId)
            .success(function(historical) {
                $scope.historical = historical;
                $scope.dataVariables = getVariables(historical);
            });

        function getVariables(historical) {
            var variables = [];
            if (!historical.data) {
                return variables;
            }
            var data = $scope.historical.data;
            var keys = Object.keys(data);
            keys.forEach(function(key) {
                variables.push({
                    key: key,
                    value: data[key]
                });
            });
            return variables;
        }
    });