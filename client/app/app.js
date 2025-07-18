'use strict';

angular.module('kf6App', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'btford.socket-io',
        'ui.router',
        'ui.bootstrap',
        'ui.tinymce',
        'ui.sortable',
        'angularFileUpload',
        'ng-context-menu',
        'ui.select',
        'pascalprecht.translate',
        'colorpicker.module',
        'ngCookies',
        'chart.js',
        'ngCsv',
        'ngjsColorPicker',
        'xeditable',
        'vcRecaptcha',
        'ngFileSaver',
        'ui.tree',
        'ng-showdown',
        'ngStorage'
    ])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/');

        /* handling url */
        $urlRouterProvider.when('/uploads/:xxx', function($urlRouter, $state, $location) {
            window.location = $location.url();
            return true;
        });

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('authInterceptor');
    })
    .config(['$translateProvider', function($translateProvider) {
        $translateProvider
          .useStaticFilesLoader({
            prefix: '../assets/translations/',
            suffix: '.json'
          })
          .registerAvailableLanguageKeys(['fr', 'es', 'en', 'it', 'fi', 'pt', 'cn', 'ja', 'zh_CN'])
          .determinePreferredLanguage() // position before fallbackLanguage() seems crucial
          .preferredLanguage('fr')
          .fallbackLanguage('fr')
          .useSanitizeValueStrategy('escape')
          .useCookieStorage();
    }])
  .controller('LanguageCtrl', function ($scope, $translate) {
    $scope.changeLanguage = function (key) {
      console.log('proposedLanguage', $translate.proposedLanguage());
      console.log('new language', key);
      $translate.use(key);
  };
  })
  .config(function(vcRecaptchaServiceProvider) {
    $.get('/api/recaptcha/config', function(data) {
      console.info(data.publicKey);
      vcRecaptchaServiceProvider.setSiteKey(data.publicKey);
    });
  })
  .config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain. **.
        'https://drive.google.com/**',
        'https://docs.google.com/**']
    );
  })



.factory('authInterceptor', function($rootScope, $q, $cookieStore, $location) {
    return {
        // Add authorization token to headers
        request: function(config) {
            config.headers = config.headers || {};
            if ($cookieStore.get('token')) {
                config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
            }
            return config;
        },

        // Intercept 401s and redirect you to login
        responseError: function(response) {
            if (response.status === 401) {

              if ($location.path() !== '/login') {

                if ($location.path() === '/') {
                  $location.path('/login');
                } else {
                  $location.url('/login?redirect=' + encodeURI($location.path()));
                }
              }

                // remove any stale tokens
                $cookieStore.remove('token');
                return $q.reject(response);
            } else {
                return $q.reject(response);
            }
        }
    };
})

.run(function($rootScope, $location, Auth, editableOptions) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function(event, next) {
        Auth.isLoggedInAsync(function(loggedIn) {
            if (next.authenticate && !loggedIn) {
                $location.path('/login');
            }
        });
    });
    editableOptions.theme = 'bs3';
});
