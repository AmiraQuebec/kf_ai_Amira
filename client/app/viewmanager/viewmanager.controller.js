'use strict';

angular.module('kf6App')
    .controller('ViewmanagerCtrl', function($scope, $http, $community, $state, $stateParams, $ac,$window) {
        var communityId = $stateParams.communityId;
        $ac.mixIn($scope);

        if (!$scope.views) {
            $scope.views = [];
        }
        $scope.input = {};
        $scope.input.title = '';
        $scope.input.editMode = false;
        var viewModeDict = {
            false: "Hiérarchie",
            true: "liste"
        };
        $scope.input.viewMode = $window.localStorage.getItem("viewMode") === 'false' ? false : true;
        $scope.viewModeLable = viewModeDict[$scope.input.viewMode];
        $scope.editLable = "Éditer";

        $community.enter(communityId);
        // $community.refreshViews(function() {
        //     // $scope.views = $community.getViews();
        //     $scope.data = $community.getViewHierarchies();
        //     console.log($scope.data);
        // });



        //---------- Temp Object ----------------
        $scope.editModeToggle = function(){
            if($scope.input.editMode === true){
                $scope.editLable = "Éditer";
                $scope.input.editMode = false;
            }else{
                $scope.editLable = "Terminé";
                $scope.input.editMode = true;
            }
        };

        $scope.viewModeToggle = function(){
            if($scope.input.viewMode === true){
                $scope.input.viewMode = false;
            }else{
                $scope.input.viewMode = true;
            }
            $scope.viewModeLable = viewModeDict[$scope.input.viewMode];
            $window.localStorage.setItem("viewMode",$scope.input.viewMode.toString());
        };

        $scope.beofeToggle = function(scope) {
            var nodeData = scope.$modelValue;
            //View Handler for Enter Method in $Community
            $community.getViewToViewLinks(nodeData.id,function (nodeList) {
                nodeData.nodes = nodeList;

                scope.toggle();
            });
        };

        $scope.newSubItem = function(scope) {
            var nodeData = scope.$modelValue;
            nodeData.nodes.push({
                id: nodeData.id * 10 + nodeData.nodes.length,
                title: nodeData.title + '.' + (nodeData.nodes.length + 1),
                nodes: []
            });
        };




        $scope.treeOptions = {
            accept: function() {
                return true;
            },
            dropped: function(e) {
                //---------- Below Comments For Reference. ------------------------
                // console.log(e);
                // console.log ("item: ", e.source.nodeScope.$modelValue);
                // console.log ("Source: ",e.source.nodesScope.$parent.$modelValue);
                // console.log ("dest: ",e.dest.nodesScope.$parent.$modelValue);
                //------------------------------------------------------------------
                if ($community.getAuthor().role === 'manager') {
                    var movedView = e.source.nodeScope.$modelValue;
                    var viewId= movedView.id;
                    var destId= e.dest.nodesScope.$parent.$modelValue.id;
                    var sourceId = e.source.nodesScope.$parent.$modelValue.id;

                    if(destId !== sourceId){
                        $community.createLink(destId,viewId, 'contains', movedView.data, function (newLinkId) {
                            $community.deleteLink({_id:movedView.linkId},function () {
                                console.log("View Moved");
                                movedView.linkId = newLinkId._id;
                            });
                        });
                    }
                }
            },
            toggle:function () {
            }
        };

        $scope.moveLastToTheBeginning = function() {
            var a = $scope.data.pop();
            $scope.data.splice(0, 0, a);
        };


        $scope.saveViewToITM = function(view){
            if (!$scope.$parent.itmEnabled){
                return;
            }

            $community.getITMToken(function(token, db){
                var params = {
                    "token": token,
                    "database": db,
                    "viewid": view._id,
                    "title": view.title,
                    "authorid": $scope.$parent.community.author._id,
                    "vcreatetime": view.created
                };

                $http({ url: $community.itmServer + "/WSG/view/add",
                    method: 'POST',
                    data: params,
                    headers: {'Content-Type': 'application/json'}
                }).success(function(result){
                    if (result && result.code && result.code === 'success') {
                    } else {
                        console.error("Add view failed!");
                        console.error(result);
                    }
                }).error(function(error){
                    console.error("Add view failed!");
                    console.error(error);
                });
            });
        };

        $scope.addView = function() {
            if ($scope.input.title === '') {
                return;
            }
            $community.createView($scope.input.title, function(view) {
                $community.refreshViews(function() {
                    $scope.saveViewToITM(view);
                    $scope.views = $community.getViews();
                    if ($scope.viewAdded) {
                        $scope.viewAdded(view);
                    }
                });
                //$state.reload();
            });
            $scope.input.title = '';
        };

        $scope.removeView = function(view) {
            var confirmation = window.confirm('Are you sure to delete ' + view.title + '?');
            if (!confirmation) {
                return;
            }
            $community.removeView(view, function() {
                $community.refreshViews();
            });
        };

        $scope.$on('$destroy', function() {});
    });
