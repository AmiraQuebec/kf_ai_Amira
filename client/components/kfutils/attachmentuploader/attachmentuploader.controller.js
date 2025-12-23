'use strict';

angular.module('kf6App')
.controller('AttachmentUploaderCtrl', function ($scope, $http, $upload, $community, $timeout) {
  // Affichage de la barre : -1 = masquée
  $scope.progress = -1;

  $scope.onFileSelect = function ($files, x, y) {
    var hasVideo = false;
    ($files || []).forEach(function (file) {
      if ((file.type || '').indexOf('video') === 0) hasVideo = true;
    });

    // Récupère googleOAuth sans jamais appeler currentViewId()
    var googleOAuth = true, parentScope = $scope.$parent || $scope;
    try {
      if ($scope.$parent && $scope.$parent.$parent && $scope.$parent.$parent.status) {
        googleOAuth = ($scope.$parent.$parent.status.googleOAuth !== undefined)
          ? $scope.$parent.$parent.status.googleOAuth : true;
        parentScope = $scope.$parent.$parent;
      } else if ($scope.$parent && $scope.$parent.$parent && $scope.$parent.$parent.$parent && $scope.$parent.$parent.$parent.$parent) {
        googleOAuth = $scope.$parent.$parent.$parent.$parent.status.googleOAuth;
        parentScope = $scope.$parent.$parent.$parent;
      }
    } catch (e) { /* ignore */ }

    if (!googleOAuth && hasVideo && $community.isPluginEnabled('googledrive')) {
      if (parentScope.popupGAuthorizationNotice) parentScope.popupGAuthorizationNotice();
      return;
    }

    ($files || []).forEach(function (file) {
      if ((file.type || '').indexOf('image/') >= 0) {
        var _URL = window.URL || window.webkitURL;
        var img = document.createElement('img');
        img.onload = function () {
          file.width  = img.naturalWidth  || img.width;
          file.height = img.naturalHeight || img.height;
          $scope.createAttachment(file, x, y);
        };
        img.src = _URL.createObjectURL(file);
      } else {
        $scope.createAttachment(file, x, y);
      }
    });
  };

  // Exposé pour l’ancien appel depuis la vue
  $scope.status.onFileSelect = $scope.onFileSelect;

  $scope.createAttachment = function (file, x, y) {
    $community.createAttachment(function (attachment) {
      var userName = $scope.$parent.community.author.userName;

      // Démarre la barre
      $scope.progress = 0;

      $upload.upload({ url: 'api/upload', method: 'POST', file: file })
        .progress(function (evt) {
          var percent = Math.min(99, Math.max(0, parseInt(100.0 * evt.loaded / evt.total, 10)));
          $scope.$applyAsync(function () { $scope.progress = percent; });
        })
        .success(function (data) {
          $scope.$applyAsync(function () { $scope.progress = 100; });

          attachment.title  = data.filename;
          attachment.status = 'active';
          data.version      = attachment.data.version + 1;
          attachment.data   = data;
          attachment.tmpFilename = data.tmpFilename;

          $community.modifyObject(attachment, function (newAttachment) {
            newAttachment.data.width  = file.width;
            newAttachment.data.height = file.height;
            $scope.notifyAttachmentUploaded(newAttachment, x, y);

            if (newAttachment.data.type.indexOf('video') === 0 && $community.isPluginEnabled('googledrive')) {
              $scope.save2GoogleDrive(userName, newAttachment);
            }
            // Laisse “100 %” visible puis masque
            $timeout(function () { $scope.progress = -1; }, 1200);
          });
        })
        .error(function () {
          window.alert('error on uploading');
          $scope.$applyAsync(function () { $scope.progress = -1; });
        });
    });
  };

  $scope.save2GoogleDrive = function (userName, attachment) {
    var data = {
      userName: userName,
      objId: attachment._id,
      url: attachment.data.url,
      originalFilename: attachment.title
    };
    $http.post('/auth/googleOAuth/message/send', data);
  };

  $scope.notifyAttachmentUploaded = function (attachment, x, y) {
    if (!$scope.attachmentUploaded) {
      window.alert('$scope.attachmentUploaded is not defined.');
      return;
    }
    $scope.attachmentUploaded(attachment, x, y);
  };
});
