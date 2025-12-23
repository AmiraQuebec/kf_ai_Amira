'use strict';
angular.module('kf6App')
  .factory('Modal', function ($rootScope, $uibModal) {
    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';
      angular.extend(modalScope, scope);
      var inst = $uibModal.open({
        templateUrl: 'components/modal/modal.html',
        windowClass: modalClass,
        scope: modalScope
      });
      modalScope.$close   = inst.close;
      modalScope.$dismiss = inst.dismiss;
      return inst;
    }
    return {
      confirm: {
        delete: function (del) {
          del = del || angular.noop;
          return function () {
            var args = Array.prototype.slice.call(arguments),
                name = args.shift(),
                ref  = openModal({
                  modal: {
                    dismissable: true,
                    title: 'Confirm Delete',
                    html: '<p>Are you sure you want to delete <strong>'+ name +'</strong> ?</p>',
                    buttons: [
                      { classes:'btn-danger',  text:'Delete', click:function(e){ ref.close(e);   } },
                      { classes:'btn-default', text:'Cancel', click:function(e){ ref.dismiss(e); } }
                    ]
                  }
                }, 'modal-danger');
            ref.result.then(function (event) { del.apply(event, args); });
          };
        }
      }
    };
  });
