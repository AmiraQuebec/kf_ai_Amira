// Fix pour les panneaux bloquÃ©s dans KF6
(function() {
 'use strict';
 console.log('Panel fix loading...');
 // Attendre qu'Angular soit prÃªt
 function initPanelFix() {
   if (!window.angular) {
     setTimeout(initPanelFix, 100);
     return;
   }
   // Fix au dÃ©marrage de l'app
   angular.element(document).ready(function() {
     // Forcer la fermeture initiale de tous les panneaux
     setTimeout(function() {
       var scope = angular.element(document.body).scope();
       if (scope && scope.status) {
         scope.status.isFilterCollapsed = true;
         scope.status.isNoteViewCollapsed = true;
         scope.$apply();
       }
       // Cacher physiquement les panneaux
       var panels = document.querySelectorAll('.notelistViewmodal, .well[collapse]');
       panels.forEach(function(panel) {
         panel.style.display = 'none';
       });
       console.log('â Panel fix applied - panneaux fermÃ©s');
     }, 500);
     // Override du click sur les boutons Fermer
     document.addEventListener('click', function(e) {
       var target = e.target;
       // Si c'est un bouton Fermer
       if (target.tagName === 'BUTTON' &&
           (target.textContent.trim() === 'Fermer' ||
            target.textContent.trim() === 'Close')) {
         // Forcer la fermeture du panneau parent
         var panel = target.closest('.notelistViewmodal, .well, .modal-content, [collapse]');
         if (panel) {
           panel.style.display = 'none';
           panel.remove();
           e.preventDefault();
           e.stopPropagation();
           console.log('Panel fermÃ© via bouton');
         }
         // Mettre Ã  jour Angular
         var scope = angular.element(document.body).scope();
         if (scope && scope.status) {
           scope.status.isFilterCollapsed = true;
           scope.status.isNoteViewCollapsed = true;
           scope.$applyAsync();
         }
       }
     }, true);
     // Fermeture avec ESC
     document.addEventListener('keydown', function(e) {
       if (e.key === 'Escape' || e.keyCode === 27) {
         // Fermer tous les panneaux
         document.querySelectorAll('.notelistViewmodal, .well[collapse]').forEach(function(el) {
           el.style.display = 'none';
         });
         var scope = angular.element(document.body).scope();
         if (scope && scope.status) {
           scope.status.isFilterCollapsed = true;
           scope.status.isNoteViewCollapsed = true;
           scope.$applyAsync();
         }
         console.log('Panneaux fermÃ©s avec ESC');
       }
     });
   });
 }
 // Lancer l'initialisation
 initPanelFix();
})();
