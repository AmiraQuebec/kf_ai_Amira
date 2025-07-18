'use strict';

angular.module('kf6App')
    .controller('UserRenameCtrl', function($scope, $http, $upload, $community) {
        $scope.showProcessing = false;
        $scope.exists = true;
        $scope.showResults = false;
        $scope.onFileSelect = function($files) {
            var file = $files[0].name;
            var sub = file.substring(file.length - 3);
            if(sub !== "csv"){
                window.alert("Please upload a csv file");
            }
            else{
                $scope.file = $files[0];
                $scope.exists = false;
            }
        };
        $scope.submit = function(){
            $scope.showProcessing = true;
            $scope.upload = $upload.upload({
                url: 'api/users/rename',
                method: 'POST',
                file: $scope.file,
                data: {communityId: $community.getCommunityData().community._id}
            }).success(function(result){
                $scope.showResults = true;
                $scope.showProcessing = false;
                $scope.result = result;
            });
            
        };
    });
