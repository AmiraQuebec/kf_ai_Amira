angular.module('kf6App')
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('aiLogs', {
                url: '/ai-logs',
                templateUrl: 'app/ai-logs/ai-logs.html',
                controller: 'AILogsCtrl'
            });
    }]);
