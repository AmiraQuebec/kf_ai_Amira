#!/usr/bin/env bash
set -euo pipefail
cd /root/kf_ai

C=client/bower_components
mkdir -p "$C"

copy() { # copy <src> <dest>
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [ -f "$src" ]; then cp -f "$src" "$dest"; else echo "WARN: missing $src"; fi
}
copydir() { # copydir <srcdir> <destdir>
  local src="$1" dest="$2"
  if [ -d "$src" ]; then mkdir -p "$dest" && cp -rf "$src"/. "$dest"/; else echo "WARN: missing dir $src"; fi
}

# jQuery / Lodash
copy node_modules/jquery/dist/jquery.js                         $C/jquery/dist/jquery.js
copy node_modules/lodash/lodash.js                              $C/lodash/lodash.js

# Angular 1.x + modules
for m in angular angular-resource angular-cookies angular-sanitize; do
  copy node_modules/$m/$m.js                                    $C/$m/$m.js
done
copy node_modules/angular-ui-router/release/angular-ui-router.js $C/angular-ui-router/release/angular-ui-router.js

# Bootstrap + CSS
copy node_modules/bootstrap/dist/css/bootstrap.css              $C/bootstrap/dist/css/bootstrap.css

# jQuery-UI
copy node_modules/jquery-ui-dist/jquery-ui.js                   $C/jquery-ui/jquery-ui.js

# ui-select (angular-ui-select)
copydir node_modules/ui-select/dist                             $C/angular-ui-select/dist

# TinyMCE + angular-ui-tinymce
copy node_modules/tinymce/tinymce.min.js                        $C/tinymce/tinymce.min.js
copy node_modules/angular-ui-tinymce/src/tinymce.js             $C/angular-ui-tinymce/src/tinymce.js
copy node_modules/tinymce/themes/modern/theme.min.js            $C/tinymce/themes/modern/theme.min.js
for p in advlist autolink autosave link image lists charmap preview print hr anchor pagebreak spellchecker wordcount searchreplace visualchars code visualblocks fullscreen insertdatetime media nonbreaking table directionality emoticons template textcolor paste noneditable fullpage; do
  [ -f node_modules/tinymce/plugins/$p/plugin.min.js ] && \
  copy node_modules/tinymce/plugins/$p/plugin.min.js            $C/tinymce/plugins/$p/plugin.min.js
done

# ng-file-upload (nom historique angular-file-upload.js)
copy node_modules/ng-file-upload/dist/ng-file-upload.js         $C/ng-file-upload/angular-file-upload.js

# d3 + d3-cloud
copy node_modules/d3/d3.js                                      $C/d3/d3.js
copy node_modules/d3-cloud/build/d3.layout.cloud.js             $C/d3-cloud/build/d3.layout.cloud.js

# Crossfilter + DC.js (dcjs alias)
copy node_modules/crossfilter2/crossfilter.min.js               $C/crossfilter2/crossfilter.min.js
copy node_modules/dc/dc.js                                      $C/dcjs/dc.js
copy node_modules/dc/dc.css                                     $C/dcjs/dc.css

# Chart.js + angular-chart.js
copy node_modules/chart.js/dist/Chart.js                        $C/chart.js/dist/Chart.js
copy node_modules/angular-chart.js/dist/angular-chart.js        $C/angular-chart.js/dist/angular-chart.js

# vis.js
copy node_modules/vis/dist/vis.js                               $C/vis/dist/vis.js
copy node_modules/vis/dist/vis.css                              $C/vis/dist/vis.css

# angular-xeditable
copy node_modules/angular-xeditable/dist/js/xeditable.js        $C/angular-xeditable/dist/js/xeditable.js
copy node_modules/angular-xeditable/dist/css/xeditable.css      $C/angular-xeditable/dist/css/xeditable.css

# Highcharts (+ module exporting)
copy node_modules/highcharts/highcharts.js                      $C/highcharts/highcharts.js
copy node_modules/highcharts/modules/exporting.js               $C/highcharts/modules/exporting.js

# angular-bootstrap-colorpicker
copy node_modules/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js $C/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js
copy node_modules/angular-bootstrap-colorpicker/css/colorpicker.css                $C/angular-bootstrap-colorpicker/css/colorpicker.css

# angular-bootstrap (alias de angular-ui-bootstrap)
if [ -f client/bower_components/angular-ui-bootstrap/ui-bootstrap-tpls.js ]; then
  : # déjà présent via bower
else
  # fallback depuis npm
  if [ -f node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js ]; then
    copy node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js $C/angular-bootstrap/ui-bootstrap-tpls.js
  else
    copy node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js      $C/angular-bootstrap/ui-bootstrap-tpls.js
  fi
fi

# angular-socket-io + socket.io-client
copy node_modules/socket.io-client/dist/socket.io.js            $C/socket.io-client/dist/socket.io.js
copy node_modules/angular-socket-io/socket.js                   $C/angular-socket-io/socket.js

# angular-translate (si bower ne l’a pas mis)
copy node_modules/angular-translate/dist/angular-translate.js   $C/angular-translate/angular-translate.js || true
copy node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.js $C/angular-translate-loader-static-files/angular-translate-loader-static-files.js || true
copy node_modules/angular-translate-storage-cookie/angular-translate-storage-cookie.js $C/angular-translate-storage-cookie/angular-translate-storage-cookie.js || true

# DataTables (+ Buttons)
copy node_modules/datatables.net/js/jquery.dataTables.js        $C/datatables.net/js/jquery.dataTables.js
copy node_modules/datatables.net-dt/css/jquery.dataTables.css   $C/datatables.net-dt/css/jquery.dataTables.css
copy node_modules/datatables.net-buttons/js/dataTables.buttons.js $C/datatables.net-buttons/js/dataTables.buttons.js
copy node_modules/datatables.net-buttons/js/buttons.colVis.js   $C/datatables.net-buttons/js/buttons.colVis.js
copy node_modules/datatables.net-buttons/js/buttons.flash.js    $C/datatables.net-buttons/js/buttons.flash.js
copy node_modules/datatables.net-buttons/js/buttons.html5.js    $C/datatables.net-buttons/js/buttons.html5.js
copy node_modules/datatables.net-buttons/js/buttons.print.js    $C/datatables.net-buttons/js/buttons.print.js
copy node_modules/datatables.net-buttons-dt/css/buttons.dataTables.css $C/datatables.net-buttons-dt/css/buttons.dataTables.css

# Fichiers annexes (JSZip, pdfmake, FileSaver, Blob polyfill)
copy node_modules/jszip/dist/jszip.js                           $C/jszip/dist/jszip.js
copy node_modules/pdfmake/build/pdfmake.js                      $C/pdfmake/build/pdfmake.js
copy node_modules/pdfmake/build/vfs_fonts.js                    $C/pdfmake/build/vfs_fonts.js
mkdir -p $C/file-saver.js
if   [ -f node_modules/file-saver/dist/FileSaver.js ]; then
  copy node_modules/file-saver/dist/FileSaver.js                $C/file-saver.js/FileSaver.js
elif [ -f node_modules/file-saver/FileSaver.js ]; then
  copy node_modules/file-saver/FileSaver.js                     $C/file-saver.js/FileSaver.js
fi
copy node_modules/blob-polyfill/Blob.js                         $C/blob-polyfill/Blob.js

# Mark.js
copy node_modules/mark.js/dist/mark.js                          $C/mark.js/dist/mark.js

# ng-csv / ng-showdown / showdown / ngStorage
copy node_modules/ng-csv/build/ng-csv.min.js                    $C/ng-csv/build/ng-csv.min.js
copy node_modules/showdown/dist/showdown.js                     $C/showdown/dist/showdown.js
copy node_modules/ng-showdown/dist/ng-showdown.js               $C/ng-showdown/dist/ng-showdown.js
copy node_modules/ngstorage/ngStorage.js                        $C/ngstorage/ngStorage.js

# angular-ui-tree (JS + CSS)
copy node_modules/angular-ui-tree/dist/angular-ui-tree.js       $C/angular-ui-tree/dist/angular-ui-tree.js
copy node_modules/angular-ui-tree/dist/angular-ui-tree.css      $C/angular-ui-tree/dist/angular-ui-tree.css

# angular-bootstrap-contextmenu
copy node_modules/angular-bootstrap-contextmenu/contextMenu.js  $C/angular-bootstrap-contextmenu/contextMenu.js

# annotator & ng-context-menu & ngjs-color-picker : installés via Bower à l'étape 3
# (si bower a raté, réessaie: bower install annotator#1.2.9 ng-context-menu#0.1.5 ngjs-color-picker#0.5.3)

# jsPlumb (copié déjà via npm)
copy node_modules/jsplumb/dist/js/jsplumb.js                    $C/jsPlumb/dist/js/jsplumb.js
copy node_modules/jsplumb/dist/js/jsplumb.min.js                $C/jsPlumb/dist/js/jsplumb.min.js

# Favicon pour éviter ENOENT
mkdir -p public; [ -f public/favicon.ico ] || : > public/favicon.ico

echo "OK: assets copiés. Relance maintenant: PORT=3000 NODE_ENV=development node server/app.js"
