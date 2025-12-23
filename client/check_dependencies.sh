#!/bin/bash
echo "=== VÉRIFICATION DES DÉPENDANCES KF6 ==="
echo ""

echo "1. jQuery:"
[ -f "bower_components/jquery/dist/jquery.js" ] && echo "✓ Présent" || echo "✗ MANQUANT"

echo "2. Bootstrap CSS:"
[ -f "bower_components/bootstrap/dist/css/bootstrap.css" ] && echo "✓ Présent" || echo "✗ MANQUANT"

echo "3. Angular:"
[ -f "bower_components/angular/angular.js" ] && echo "✓ Présent" || echo "✗ MANQUANT"

echo "4. Angular Bootstrap:"
[ -f "bower_components/angular-bootstrap/ui-bootstrap-tpls.js" ] && echo "✓ Présent" || echo "✗ MANQUANT"

echo "5. TinyMCE:"
[ -f "bower_components/tinymce/tinymce.min.js" ] && echo "✓ Présent" || echo "✗ MANQUANT"

echo ""
echo "=== VERSIONS ==="
grep -o "Angular v[0-9.]*" bower_components/angular/angular.js | head -1
grep -o "Version: [0-9.]*" bower_components/angular-bootstrap/ui-bootstrap-tpls.js | head -1
grep -o "Bootstrap v[0-9.]*" bower_components/bootstrap/dist/css/bootstrap.css | head -1
