'use strict';
/**
 * Bridge annotator "safe":
 * - n'utilise PAS angular.element(...).annotator
 * - attend jQuery + plugin annotator avant d'initialiser
 * - ne casse rien si le plugin n'est pas prêt (retry léger)
 */
angular.module('kf6App')
  .directive('annotatable', function($timeout) {
    return {
      restrict: 'A',
      link: function($scope, $element) {
        function tryInit() {
          var $ = window.jQuery || window.$;
          if (!$ || !$.fn || !$.fn.annotator) {
            // plugin pas prêt -> on retente dans 200ms sans planter l'app
            return $timeout(tryInit, 200);
          }
          try {
            var inst = $( $element ).annotator();
            // mémorise l'instance sur l'élément (si le contrôleur en a besoin)
            $element.data('annotatorInstance', inst);
            if ($scope && typeof $scope.annotatorReady === 'function') {
              $scope.annotatorReady(inst);
            }
            // console.info('annotator initialisé');
          } catch (e) {
            console.error('annotator init error:', e);
          }
        }
        tryInit();
      }
    };
  });
