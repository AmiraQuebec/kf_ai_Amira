#!/usr/bin/env bash
set -euo pipefail
C="client/bower_components"
mkdir -p "$C"

fetch(){ # fetch <dest> <url1> [url2]
  mkdir -p "$(dirname "$1")"
  if [ -f "$1" ]; then echo "OK    $1 (déjà)"; return 0; fi
  curl -fsSL "${2}" -o "$1" || { [ -n "${3:-}" ] && curl -fsSL "${3}" -o "$1"; }
  echo "fetch $1"
}

# --- Tinymce (plugins + angular-ui-tinymce) ---
fetch "$C/angular-ui-tinymce/src/tinymce.js" "https://unpkg.com/angular-ui-tinymce@0.0.20/src/tinymce.js"
for p in advlist autolink autosave link image lists charmap preview print hr anchor pagebreak spellchecker wordcount searchreplace visualchars code visualblocks fullscreen insertdatetime media nonbreaking table directionality emoticons template textcolor paste noneditable fullpage; do
  fetch "$C/tinymce/plugins/$p/plugin.min.js" \
    "https://unpkg.com/tinymce@4.9.11/plugins/$p/plugin.min.js" \
    "https://unpkg.com/tinymce@4.9.11/tinymce/plugins/$p/plugin.min.js"
done

# --- Annotator ---
fetch "$C/annotator/annotator.min.css"      "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator.min.css"
fetch "$C/annotator/annotator.min.js"       "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator.min.js"
fetch "$C/annotator/annotator-full.min.js"  "https://cdnjs.cloudflare.com/ajax/libs/annotator/1.2.10/annotator-full.min.js"

# --- D3 / cloud / Crossfilter / DC.js ---
fetch "$C/d3/d3.js"                         "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"
fetch "$C/d3-cloud/build/d3.layout.cloud.js" "https://unpkg.com/d3-cloud@1.2.5/build/d3.layout.cloud.js"
fetch "$C/crossfilter2/crossfilter.min.js"  "https://unpkg.com/crossfilter2@1.4.7/crossfilter.min.js"
fetch "$C/dcjs/dc.js"                       "https://cdnjs.cloudflare.com/ajax/libs/dc/2.1.11/dc.min.js"

# --- Angular translate ---
fetch "$C/angular-translate/angular-translate.js" "https://cdnjs.cloudflare.com/ajax/libs/angular-translate/2.18.4/angular-translate.min.js"
fetch "$C/angular-translate-loader-static-files/angular-translate-loader-static-files.js" \
      "https://cdnjs.cloudflare.com/ajax/libs/angular-translate-loader-static-files/2.18.4/angular-translate-loader-static-files.min.js"
fetch "$C/angular-translate-storage-cookie/angular-translate-storage-cookie.js" \
      "https://cdnjs.cloudflare.com/ajax/libs/angular-translate-storage-cookie/2.18.4/angular-translate-storage-cookie.min.js"

# --- Colorpicker JS ---
fetch "$C/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js" \
      "https://unpkg.com/angular-bootstrap-colorpicker@3.0.32/js/bootstrap-colorpicker-module.js"

# --- Charts & vis ---
fetch "$C/chart.js/dist/Chart.js"           "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js"
fetch "$C/angular-chart.js/dist/angular-chart.js" "https://cdnjs.cloudflare.com/ajax/libs/angular-chart.js/1.1.1/angular-chart.min.js"
fetch "$C/vis/dist/vis.js"                  "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"
fetch "$C/angular-xeditable/dist/js/xeditable.js" "https://cdnjs.cloudflare.com/ajax/libs/angular-xeditable/0.1.12/js/xeditable.min.js"
fetch "$C/highcharts/highcharts.js"         "https://cdnjs.cloudflare.com/ajax/libs/highcharts/5.0.14/highcharts.js"
fetch "$C/highcharts/modules/exporting.js"  "https://cdnjs.cloudflare.com/ajax/libs/highcharts/5.0.14/modules/exporting.js"

# --- Context menu (deux paquets différents)
# Le projet attend ng-context-menu ; on mappe vers angular-bootstrap-contextmenu si besoin
mkdir -p "$C/ng-context-menu/dist"
fetch "$C/angular-bootstrap-contextmenu/contextMenu.js" \
      "https://unpkg.com/angular-bootstrap-contextmenu@0.10.0/contextMenu.js"
cp -f "$C/angular-bootstrap-contextmenu/contextMenu.js" "$C/ng-context-menu/dist/ng-context-menu.js" || true

# --- Divers Angular libs ---
fetch "$C/ng-csv/build/ng-csv.min.js"      "https://cdnjs.cloudflare.com/ajax/libs/ng-csv/0.3.6/ng-csv.min.js"
fetch "$C/angular-recaptcha/release/angular-recaptcha.js" "https://unpkg.com/angular-recaptcha@4.2.0/release/angular-recaptcha.js"
fetch "$C/mark.js/dist/mark.js"            "https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js"
fetch "$C/ng-showdown/dist/ng-showdown.js" "https://unpkg.com/ng-showdown@1.1.0/dist/ng-showdown.js"
fetch "$C/showdown/dist/showdown.js"       "https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"
fetch "$C/ngstorage/ngStorage.js"          "https://cdnjs.cloudflare.com/ajax/libs/ngStorage/0.3.11/ngStorage.min.js"
fetch "$C/angular-ui-sortable/sortable.js" "https://unpkg.com/angular-ui-sortable@0.14.4/sortable.js"
fetch "$C/ng-file-upload/angular-file-upload.js" "https://unpkg.com/ng-file-upload@12.2.13/dist/ng-file-upload.js"
fetch "$C/angular-ui-tree/dist/angular-ui-tree.js" "https://unpkg.com/angular-ui-tree@2.22.6/dist/angular-ui-tree.js"
fetch "$C/socket.io-client/dist/socket.io.js" "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.4/socket.io.min.js"

# --- FileSaver & annexes (évite Teleborder) ---
fetch "$C/file-saver.js/FileSaver.js"      "https://unpkg.com/file-saver@1.3.8/FileSaver.min.js"
fetch "$C/jszip/dist/jszip.js"             "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
fetch "$C/pdfmake/build/pdfmake.js"        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/pdfmake.min.js"
fetch "$C/pdfmake/build/vfs_fonts.js"      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/vfs_fonts.js"
fetch "$C/blob-polyfill/Blob.js"           "https://cdnjs.cloudflare.com/ajax/libs/blob-polyfill/5.0.20220126/Blob.min.js"

# --- DataTables JS manquants ---
fetch "$C/datatables.net/js/jquery.dataTables.js"         "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.19/js/jquery.dataTables.min.js"
fetch "$C/datatables.net-buttons/js/buttons.colVis.js"    "https://cdn.datatables.net/buttons/1.5.6/js/buttons.colVis.min.js"
fetch "$C/datatables.net-buttons/js/buttons.flash.js"     "https://cdn.datatables.net/buttons/1.5.6/js/buttons.flash.min.js"
fetch "$C/datatables.net-buttons/js/buttons.print.js"     "https://cdn.datatables.net/buttons/1.5.6/js/buttons.print.min.js"
# déjà pris: buttons.html5.js dans étape précédente, mais on l’assure
fetch "$C/datatables.net-buttons/js/buttons.html5.js"     "https://cdn.datatables.net/buttons/1.5.6/js/buttons.html5.min.js"

echo "Tous les fichiers critiques ont été récupérés."
