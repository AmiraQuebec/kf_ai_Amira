(function(){
 'use strict';
 // Ajoute les handlers une fois Angular démarré
 function attach(){
   try{
     var inj = angular.element(document.body).injector();
     if(!inj) return;
     var $rootScope = inj.get('$rootScope');
     // Clic sur "Fermer" ou éléments avec data-dismiss="modal"
     document.addEventListener('click', function(e){
       var btn = e.target && (e.target.closest ? e.target.closest('button, a, .close') : null);
       if(!btn) return;
       var txt = (btn.textContent || '').trim().toLowerCase();
       var isClose = txt === 'fermer' || txt === 'close' || btn.classList.contains('close') ||
                     (btn.getAttribute && btn.getAttribute('data-dismiss') === 'modal');
       if(!isClose) return;
       e.preventDefault(); e.stopPropagation();
       try { inj.get('$uibModalStack').dismissAll('click-close'); } catch(_) {}
       // filet de sécurité si ce n'était pas une vraie modale
       try { document.querySelectorAll('.modal,.modal-backdrop').forEach(function(el){ el.remove(); }); } catch(_){}
       $rootScope.$applyAsync();
     });
     // ESC ferme tout
     document.addEventListener('keydown', function(evt){
       if(evt.key === 'Escape' || evt.keyCode === 27){
         try { inj.get('$uibModalStack').dismissAll('escape'); } catch(_){}
         try { document.querySelectorAll('.modal,.modal-backdrop').forEach(function(el){ el.remove(); }); } catch(_){}
         $rootScope.$applyAsync();
       }
     });
   }catch(_){}
 }
 if (window.angular) {
   if (document.readyState === 'complete') attach();
   else window.addEventListener('load', attach);
 }
})();
