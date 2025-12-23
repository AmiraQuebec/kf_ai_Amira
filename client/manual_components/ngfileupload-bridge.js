;(function (angular) {
  'use strict';

  // Recrée l'ancien module et s'appuie sur ngFileUpload moderne
  try {
    angular.module('angularFileUpload', ['ngFileUpload'])
      // Bridge de service : $upload.upload(...) -> Upload.upload(...)
      .factory('$upload', ['Upload', function (Upload) {
        function adapt(cfg) {
          cfg = cfg || {};
          // L'ancien code mettait souvent {file: file} à la racine
          if (cfg.file && !cfg.data) cfg.data = { file: cfg.file };
          // Sécurise l'URL: la plupart du code avait "api/upload" (relative)
          if (cfg.url && cfg.url.charAt(0) !== '/') cfg.url = '/' + cfg.url;
          return Upload.upload(cfg);
        }
        return { upload: adapt };
      }])

      // Alias de directives pour l'ancien markup ng-file-*
      // ng-file-select="onFileSelect($files)"
      .directive('ngFileSelect', ['$parse', function ($parse) {
        return {
          restrict: 'A',
          link: function (scope, elem, attrs) {
            var fn = $parse(attrs.ngFileSelect);
            // Attache un listener change simple
            elem.on('change', function (evt) {
              var files = (evt.target && evt.target.files) ?
                Array.prototype.slice.call(evt.target.files) : [];
              scope.$apply(function () {
                fn(scope, { $files: files, $event: evt });
              });
            });
          }
        };
      }])

      // ng-file-drop="onFileSelect($files)"
      .directive('ngFileDrop', ['$parse', function ($parse) {
        return {
          restrict: 'A',
          link: function (scope, elem, attrs) {
            var fn = $parse(attrs.ngFileDrop);
            elem.on('dragover', function (e) { e.preventDefault(); });
            elem.on('drop', function (e) {
              e.preventDefault();
              var dt = (e.originalEvent && e.originalEvent.dataTransfer) || e.dataTransfer;
              var files = dt ? Array.prototype.slice.call(dt.files || []) : [];
              scope.$apply(function () {
                fn(scope, { $files: files, $event: e });
              });
            });
          }
        };
      }])

      // ng-file-drop-available="dropSupported=true"
      .directive('ngFileDropAvailable', function () {
        return {
          restrict: 'A',
          link: function (scope, elem, attrs) {
            // très simple détection
            var ok = ('draggable' in document.createElement('span'));
            // évalue l'expression fournie par le template
            try { scope.$eval(attrs.ngFileDropAvailable); } catch (e) {}
            scope.$applyAsync(function () {
              scope.dropSupported = ok;
            });
          }
        };
      });

  } catch (e) { /* ignore */ }

})(window.angular);
