'use strict';

angular.module('kf6App')
    .controller('UserUploaderCtrl', function($scope, $http, $upload, $community) {
        $scope.show = true;
        $scope.exists = true;
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

        $scope.validate = function(){
            $scope.upload = $upload.upload({
                url: 'api/users/validate',
                method: 'POST',
                file: $scope.file,
                data: {community: $community.getCommunityData().community._id}
            }).success(function(users){
                $scope.res = true;
                if(users.length > 0){
                    $scope.message = "Following users are not valid. Please correct any errors and reupload the file";
                }
                else{
                    $scope.message = "All entries are valid. You may submit to database";
                    $scope.show = false;
                }
                $scope.users = users;
            });

        };

        $scope.submit = function(){
            $scope.upload = $upload.upload({
                url: 'api/users/users',
                method: 'POST',
                file: $scope.file,
                data: {community: $community.getCommunityData().community._id}
            }).success(function(users){
                $scope.res = true;
                if(users.length > 0){
                    $scope.message = "Following users were not uploaded to the database. Please submit a new excel file with the following corrected entries only.";
                }
                else{
                    $scope.message = "All users were added to the database except the existing users.";
                }
                $scope.users = users;
            });

        };
    });
