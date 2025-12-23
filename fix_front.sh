#!/usr/bin/env bash
set -euo pipefail
cd /root/kf_ai

echo "[1/8] Préparer Bower (dir=client/bower_components)"
npm i -g bower@1.8.8 >/dev/null
printf '{\n  "directory": "client/bower_components"\n}\n' > .bowerrc
git config --global url."https://".insteadOf git://

echo "[2/8] Retirer jsPlumb de bower.json (il bloque l'install)"
cp bower.json bower.json.bak.$(date +%F-%H%M%S)
node -e "const fs=require('fs');const f='bower.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));if(j.dependencies){delete j.dependencies.jsPlumb;}fs.writeFileSync(f,JSON.stringify(j,null,2));console.log('OK: jsPlumb retiré de',f)"

echo "[3/8] Installer paquets Bower indispensables (bower-only)"
mkdir -p client/bower_components
# Ces paquets correspondent exactement aux chemins de tes 404
bower cache clean >/dev/null 2>&1 || true
bower install --allow-root --config.interactive=false \
  ng-context-menu#0.1.5 \
  ngjs-color-picker#0.5.3 \
  annotator#1.2.9 \
  angular-ui-select#0.19.8 \
  angular-translate#2.18.4 \
  angular-translate-loader-static-files#2.18.4 \
  angular-translate-storage-cookie#2.18.4 || true

echo "[4/8] Installer via npm le reste (versions anciennes compatibles Node 6)"
npm install --no-audit --no-fund --save \
  jquery@3.4.1 \
  angular@1.5.11 angular-resource@1.5.11 angular-cookies@1.5.11 angular-sanitize@1.5.11 \
  angular-ui-router@0.3.2 \
  angular-ui-bootstrap@1.3.3 \
  bootstrap@3.4.1 \
  lodash@4.17.21 \
  jquery-ui-dist@1.12.1 \
  tinymce@4.9.11 angular-ui-tinymce@0.0.20 \
  ng-file-upload@12.2.13 \
  angular-bootstrap-colorpicker@3.0.32 \
  d3@3.5.17 d3-cloud@1.2.5 \
  crossfilter2@1.4.7 \
  dc@2.1.11 \
  chart.js@2.9.4 angular-chart.js@1.1.1 \
  vis@4.21.0 \
  angular-xeditable@0.1.12 \
  highcharts@5.0.14 \
  jszip@3.10.1 \
  pdfmake@0.1.70 \
  datatables.net@1.10.19 datatables.net-dt@1.10.19 datatables.net-buttons@1.5.6 datatables.net-buttons-dt@1.5.6 \
  file-saver@1.3.8 angular-file-saver@1.1.3 \
  blob-polyfill@1.0.20220106 \
  mark.js@8.11.1 \
  angular-recaptcha@4.2.0 \
  socket.io-client@1.7.4 angular-socket-io@0.7.0 \
  angular-ui-sortable@0.14.4 \
  angular-ui-tree@2.22.6 \
  ng-csv@0.3.6 \
  ng-showdown@1.1.0 showdown@1.9.1 \
  jsplumb@2.15.6 >/dev/null

echo "[5/8] Injecter jsPlumb à l'endroit exact attendu par l'app"
mkdir -p client/bower_components/jsPlumb/dist/js
cp -f node_modules/jsplumb/dist/js/jsplumb*.js client/bower_components/jsPlumb/dist/js/ || true

echo "[6/8] Créer les alias exactement comme dans tes 404"
link() { mkdir -p "$(dirname "$1")"; [ -e "$2" ] && ln -sfn "$2" "$1"; }
# jQuery / Lodash / D3 / jQuery UI
link client/bower_components/jquery/dist/jquery.js node_modules/jquery/dist/jquery.js
link client/bower_components/lodash/lodash.js       node_modules/lodash/lodash.js
link client/bower_components/d3/d3.js               node_modules/d3/d3.js
link client/bower_components/d3-cloud/build/d3.layout.cloud.js node_modules/d3-cloud/build/d3.layout.cloud.js
mkdir -p client/bower_components/jquery-ui
link client/bower_components/jquery-ui/jquery-ui.js node_modules/jquery-ui-dist/jquery-ui.js

# Angular 1.x + modules
for m in angular angular-resource angular-cookies angular-sanitize; do
  link client/bower_components/$m/$m.js node_modules/$m/$m.js
done
link client/bower_components/angular-ui-router/release/angular-ui-router.js node_modules/angular-ui-router/release/angular-ui-router.js
# angular-ui-bootstrap (alias angular-bootstrap)
mkdir -p client/bower_components/angular-bootstrap
if [ -f client/bower_components/angular-ui-bootstrap/ui-bootstrap-tpls.js ]; then
  ln -sfn ../angular-ui-bootstrap/ui-bootstrap-tpls.js client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js
else
  link client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js
fi

# socket.io + angular-socket-io
link client/bower_components/socket.io-client/dist/socket.io.js node_modules/socket.io-client/dist/socket.io.js
link client/bower_components/angular-socket-io/socket.js        node_modules/angular-socket-io/socket.js

# angular-ui-select (si Bower a mis ui-select)
[ -d client/bower_components/ui-select ] && {
  mkdir -p client/bower_components/angular-ui-select
  ln -sfn ../ui-select/dist client/bower_components/angular-ui-select/dist
}
# sinon, map depuis npm
link client/bower_components/angular-ui-select/dist/select.js  node_modules/ui-select/dist/select.js
link client/bower_components/angular-ui-select/dist/select.css node_modules/ui-select/dist/select.css

# angular-ui-sortable / ui-tree
link client/bower_components/angular-ui-sortable/sortable.js node_modules/angular-ui-sortable/sortable.js
link client/bower_components/angular-ui-tree/dist/angular-ui-tree.js  node_modules/angular-ui-tree/dist/angular-ui-tree.js
link client/bower_components/angular-ui-tree/dist/angular-ui-tree.css node_modules/angular-ui-tree/dist/angular-ui-tree.css

# angular-xeditable
link client/bower_components/angular-xeditable/dist/js/xeditable.js   node_modules/angular-xeditable/dist/js/xeditable.js
link client/bower_components/angular-xeditable/dist/css/xeditable.css node_modules/angular-xeditable/dist/css/xeditable.css

# angular-translate (+ loaders Bower a normalement installé ceux-ci)
link client/bower_components/angular-translate/angular-translate.js node_modules/angular-translate/dist/angular-translate.js || true
link client/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.js || true
link client/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.js node_modules/angular-translate-storage-cookie/angular-translate-storage-cookie.js || true

# Bootstrap + CSS
link client/bower_components/bootstrap/dist/css/bootstrap.css node_modules/bootstrap/dist/css/bootstrap.css

# Color pickers
link client/bower_components/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js node_modules/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js
link client/bower_components/angular-bootstrap-colorpicker/css/colorpicker.css node_modules/angular-bootstrap-colorpicker/css/colorpicker.css

# TinyMCE 4.x + angular-ui-tinymce
link client/bower_components/tinymce/tinymce.min.js node_modules/tinymce/tinymce.min.js
link client/bower_components/angular-ui-tinymce/src/tinymce.js node_modules/angular-ui-tinymce/src/tinymce.js
for p in modern; do
  [ -f node_modules/tinymce/themes/$p/theme.min.js ] && \
  link client/bower_components/tinymce/themes/$p/theme.min.js node_modules/tinymce/themes/$p/theme.min.js
done
for p in advlist autolink autosave link image lists charmap preview print hr anchor pagebreak spellchecker wordcount searchreplace visualchars code visualblocks fullscreen insertdatetime media nonbreaking table directionality emoticons template textcolor paste noneditable fullpage; do
  [ -f node_modules/tinymce/plugins/$p/plugin.min.js ] && \
  link client/bower_components/tinymce/plugins/$p/plugin.min.js node_modules/tinymce/plugins/$p/plugin.min.js
done

# Crossfilter + DC.js (alias dcjs)
link client/bower_components/crossfilter2/crossfilter.min.js node_modules/crossfilter2/crossfilter.min.js
mkdir -p client/bower_components/dcjs
[ -f client/bower_components/dc/dc.js ]  && ln -sfn ../dc/dc.js  client/bower_components/dcjs/dc.js || link client/bower_components/dcjs/dc.js  node_modules/dc/dc.js
[ -f client/bower_components/dc/dc.css ] && ln -sfn ../dc/dc.css client/bower_components/dcjs/dc.css || link client/bower_components/dcjs/dc.css node_modules/dc/dc.css

# Chart.js + angular-chart.js
link client/bower_components/chart.js/dist/Chart.js                node_modules/chart.js/dist/Chart.js
link client/bower_components/angular-chart.js/dist/angular-chart.js node_modules/angular-chart.js/dist/angular-chart.js

# Vis.js
link client/bower_components/vis/dist/vis.js  node_modules/vis/dist/vis.js
link client/bower_components/vis/dist/vis.css node_modules/vis/dist/vis.css

# Highcharts
link client/bower_components/highcharts/highcharts.js node_modules/highcharts/highcharts.js
link client/bower_components/highcharts/modules/exporting.js node_modules/highcharts/modules/exporting.js

# DataTables (core + buttons + thèmes)
link client/bower_components/datatables.net/js/jquery.dataTables.js                     node_modules/datatables.net/js/jquery.dataTables.js
link client/bower_components/datatables.net-dt/css/jquery.dataTables.css               node_modules/datatables.net-dt/css/jquery.dataTables.css
link client/bower_components/datatables.net-buttons/js/dataTables.buttons.js           node_modules/datatables.net-buttons/js/dataTables.buttons.js
link client/bower_components/datatables.net-buttons/js/buttons.colVis.js               node_modules/datatables.net-buttons/js/buttons.colVis.js
link client/bower_components/datatables.net-buttons/js/buttons.flash.js                node_modules/datatables.net-buttons/js/buttons.flash.js
link client/bower_components/datatables.net-buttons/js/buttons.html5.js                node_modules/datatables.net-buttons/js/buttons.html5.js
link client/bower_components/datatables.net-buttons/js/buttons.print.js                node_modules/datatables.net-buttons/js/buttons.print.js
link client/bower_components/datatables.net-buttons-dt/css/buttons.dataTables.css      node_modules/datatables.net-buttons-dt/css/buttons.dataTables.css

# Fichiers annexes (JSZip, pdfmake, FileSaver, Blob polyfill)
link client/bower_components/jszip/dist/jszip.js             node_modules/jszip/dist/jszip.js
link client/bower_components/pdfmake/build/pdfmake.js        node_modules/pdfmake/build/pdfmake.js
link client/bower_components/pdfmake/build/vfs_fonts.js      node_modules/pdfmake/build/vfs_fonts.js
mkdir -p client/bower_components/file-saver.js
if   [ -f node_modules/file-saver/dist/FileSaver.js ]; then
  link client/bower_components/file-saver.js/FileSaver.js node_modules/file-saver/dist/FileSaver.js
elif [ -f node_modules/file-saver/FileSaver.js ]; then
  link client/bower_components/file-saver.js/FileSaver.js node_modules/file-saver/FileSaver.js
fi
link client/bower_components/blob-polyfill/Blob.js           node_modules/blob-polyfill/Blob.js

# Mark.js
link client/bower_components/mark.js/dist/mark.js node_modules/mark.js/dist/mark.js

# ng-csv / ng-showdown / ngStorage
link client/bower_components/ng-csv/build/ng-csv.min.js      node_modules/ng-csv/build/ng-csv.min.js
link client/bower_components/showdown/dist/showdown.js        node_modules/showdown/dist/showdown.js
link client/bower_components/ng-showdown/dist/ng-showdown.js  node_modules/ng-showdown/dist/ng-showdown.js
link client/bower_components/ngstorage/ngStorage.js           node_modules/ngstorage/ngStorage.js

# angular-bootstrap-contextmenu (pour contextMenu.js attendu)
link client/bower_components/angular-bootstrap-contextmenu/contextMenu.js node_modules/angular-bootstrap-contextmenu/contextMenu.js

echo "[7/8] Favicon placeholder (évite ENOENT)"
mkdir -p public; [ -f public/favicon.ico ] || : > public/favicon.ico

echo "[8/8] Lancer le serveur (ou grunt local si présent)"
# Grunt local compatible Node 6 (si Gruntfile existe)
npm i -D grunt@1.0.4 grunt-cli@1.2.0 phantomjs-prebuilt@2.1.16 >/dev/null 2>&1 || true
echo "OK. Relance maintenant: PORT=3000 NODE_ENV=development node server/app.js"
