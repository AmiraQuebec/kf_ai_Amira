#!/usr/bin/env bash
set -euo pipefail
cd /root/kf_ai
C="client/bower_components"
mkdir -p "$C"

grab () { # grab <dest> <url1> [url2...]
  local dest="$1"; shift
  mkdir -p "$(dirname "$dest")"
  for u in "$@"; do
    if curl -fsSL "$u" -o "$dest"; then
      echo "ok  $dest  <= $u"
      return 0
    fi
  done
  echo "FAIL $dest" >&2
  return 1
}

# --- CORE JS/CSS demandés dans tes logs ---

# jQuery / jQuery UI
grab "$C/jquery/dist/jquery.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"
grab "$C/jquery-ui/jquery-ui.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"

# Angular 1.5.11 + modules
grab "$C/angular/angular.js" \
  "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.11/angular.min.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.11/angular.min.js"
grab "$C/angular-resource/angular-resource.js" \
  "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.11/angular-resource.min.js"
grab "$C/angular-cookies/angular-cookies.js" \
  "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.11/angular-cookies.min.js"
grab "$C/angular-sanitize/angular-sanitize.js" \
  "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.11/angular-sanitize.min.js"
grab "$C/angular-ui-router/release/angular-ui-router.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.3.2/angular-ui-router.min.js"
grab "$C/angular-socket-io/socket.js" \
  "https://unpkg.com/angular-socket-io@0.7.0/socket.js"

# Bootstrap + CSS
grab "$C/bootstrap/dist/css/bootstrap.css" \
  "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css"

# ui-select (angular-ui-select)
grab "$C/angular-ui-select/dist/select.css" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-select/0.19.8/select.min.css"
grab "$C/angular-ui-select/dist/select.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-select/0.19.8/select.min.js"

# TinyMCE 4.9.11 + angular-ui-tinymce
grab "$C/tinymce/tinymce.min.js" \
  "https://unpkg.com/tinymce@4.9.11/tinymce.min.js" \
  "https://unpkg.com/tinymce@4.9.11/tinymce/tinymce.min.js"
grab "$C/tinymce/themes/modern/theme.min.js" \
  "https://unpkg.com/tinymce@4.9.11/themes/modern/theme.min.js" \
  "https://unpkg.com/tinymce@4.9.11/tinymce/themes/modern/theme.min.js"
grab "$C/angular-ui-tinymce/src/tinymce.js" \
  "https://unpkg.com/angular-ui-tinymce@0.0.20/src/tinymce.js"
# Plugins (liste du log)
for p in advlist autolink autosave link image lists charmap preview print hr anchor pagebreak spellchecker wordcount searchreplace visualchars code visualblocks fullscreen insertdatetime media nonbreaking table directionality emoticons template textcolor paste noneditable fullpage; do
  grab "$C/tinymce/plugins/$p/plugin.min.js" \
    "https://unpkg.com/tinymce@4.9.11/plugins/$p/plugin.min.js" \
    "https://unpkg.com/tinymce@4.9.11/tinymce/plugins/$p/plugin.min.js" \
    || true
done

# d3 + d3-cloud
grab "$C/d3/d3.js" "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"
grab "$C/d3-cloud/build/d3.layout.cloud.js" \
  "https://unpkg.com/d3-cloud@1.2.5/build/d3.layout.cloud.js"

# Crossfilter + DC.js (dcjs alias)
grab "$C/crossfilter2/crossfilter.min.js" \
  "https://unpkg.com/crossfilter2@1.4.7/crossfilter.min.js"
grab "$C/dcjs/dc.js"  "https://cdnjs.cloudflare.com/ajax/libs/dc/2.1.11/dc.min.js"
grab "$C/dcjs/dc.css" "https://cdnjs.cloudflare.com/ajax/libs/dc/2.1.11/dc.min.css"

# Chart.js + angular-chart.js
grab "$C/chart.js/dist/Chart.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js"
grab "$C/angular-chart.js/dist/angular-chart.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-chart.js/1.1.1/angular-chart.min.js"

# vis.js
grab "$C/vis/dist/vis.js"  "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"
grab "$C/vis/dist/vis.css" "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css"

# angular-xeditable
grab "$C/angular-xeditable/dist/js/xeditable.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-xeditable/0.1.12/js/xeditable.min.js"
grab "$C/angular-xeditable/dist/css/xeditable.css" \
  "https://cdnjs.cloudflare.com/ajax/libs/angular-xeditable/0.1.12/css/xeditable.css"

# angular-bootstrap-colorpicker
grab "$C/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js" \
  "https://unpkg.com/angular-bootstrap-colorpicker@3.0.32/js/bootstrap-colorpicker-module.js"
grab "$C/angular-bootstrap-colorpicker/css/colorpicker.css" \
  "https://unpkg.com/angular-bootstrap-colorpicker@3.0.32/css/colorpicker.css"

# angular-ui-tree
grab "$C/angular-ui-tree/dist/angular-ui-tree.js"  "https://unpkg.com/angular-ui-tree@2.22.6/dist/angular-ui-tree.js"
grab "$C/angular-ui-tree/dist/angular-ui-tree.css" "https://unpkg.com/angular-ui-tree@2.22.6/dist/angular-ui-tree.css"

# DataTables (+ Buttons) CSS/JS
grab "$C/datatables.net/js/jquery.dataTables.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.19/js/jquery.dataTables.min.js"
grab "$C/datatables.net-dt/css/jquery.dataTables.css" \
  "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.19/css/jquery.dataTables.min.css"
grab "$C/datatables.net-buttons/js/dataTables.buttons.js" \
  "https://cdn.datatables.net/buttons/1.5.6/js/dataTables.buttons.min.js"
grab "$C/datatables.net-buttons/js/buttons.colVis.js" \
  "https://cdn.datatables.net/buttons/1.5.6/js/buttons.colVis.min.js"
grab "$C/datatables.net-buttons/js/buttons.flash.js" \
  "https://cdn.datatables.net/buttons/1.5.6/js/buttons.flash.min.js"
grab "$C/datatables.net-buttons/js/buttons.html5.js" \
  "https://cdn.datatables.net/buttons/1.5.6/js/buttons.html5.min.js"
grab "$C/datatables.net-buttons/js/buttons.print.js" \
  "https://cdn.datatables.net/buttons/1.5.6/js/buttons.print.min.js"
grab "$C/datatables.net-buttons-dt/css/buttons.dataTables.css" \
  "https://cdn.datatables.net/buttons/1.5.6/css/buttons.dataTables.min.css"

# angular-bootstrap (alias ui-bootstrap)
mkdir -p "$C/angular-bootstrap"
grab "$C/angular-bootstrap/ui-bootstrap-tpls.js" \
  "https://unpkg.com/angular-ui-bootstrap@1.3.3/dist/ui-bootstrap-tpls.js"

# lodash (déjà OK chez toi mais on assure)
grab "$C/lodash/lodash.js" "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"

# socket.io-client (le front l’attend souvent)
grab "$C/socket.io-client/dist/socket.io.js" \
  "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.4/socket.io.min.js"

# FileSaver & co (pour éviter Teleborder)
grab "$C/file-saver.js/FileSaver.js" "https://unpkg.com/file-saver@1.3.8/FileSaver.min.js"
grab "$C/jszip/dist/jszip.js"        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
grab "$C/pdfmake/build/pdfmake.js"   "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/pdfmake.min.js"
grab "$C/pdfmake/build/vfs_fonts.js" "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/vfs_fonts.js"
grab "$C/blob-polyfill/Blob.js"      "https://cdnjs.cloudflare.com/ajax/libs/blob-polyfill/5.0.20220126/Blob.min.js"

# ng-csv / showdown / ng-showdown / ngStorage
grab "$C/ng-csv/build/ng-csv.min.js"         "https://cdnjs.cloudflare.com/ajax/libs/ng-csv/0.3.6/ng-csv.min.js"
grab "$C/showdown/dist/showdown.js"          "https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"
grab "$C/ng-showdown/dist/ng-showdown.js"    "https://unpkg.com/ng-showdown@1.1.0/dist/ng-showdown.js"
grab "$C/ngstorage/ngStorage.js"             "https://cdnjs.cloudflare.com/ajax/libs/ngStorage/0.3.11/ngStorage.min.js"

# annotator (JS + CSS)
grab "$C/annotator/annotator.min.js"      "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator.min.js"
grab "$C/annotator/annotator-full.min.js" "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator-full.min.js"
grab "$C/annotator/annotator.min.css"     "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator.min.css"

# angular-bootstrap-contextmenu
grab "$C/angular-bootstrap-contextmenu/contextMenu.js" \
  "https://unpkg.com/angular-bootstrap-contextmenu@0.10.0/contextMenu.js"

# jsPlumb (chemin attendu avec majuscule)
grab "$C/jsPlumb/dist/js/jsplumb.js"     "https://cdnjs.cloudflare.com/ajax/libs/jsPlumb/2.15.6/js/jsplumb.min.js"
cp -f "$C/jsPlumb/dist/js/jsplumb.js" "$C/jsPlumb/dist/js/jsplumb.min.js" || true

# favicon placeholder
mkdir -p public; [ -f public/favicon.ico ] || : > public/favicon.ico

echo "DONE. Relance: PORT=3000 NODE_ENV=development node server/app.js"
