'use strict';

angular.module('kf6App')
    .controller('ScaffoldsupporttrackerCtrl', function ($scope, $http, $community, $stateParams, $suresh, $kfutil) {
        var communityId = $stateParams.communityId;
        $scope.currentCommunity = {};
        $scope.selectedNotesforRiseabove=[];
        $scope.showViewsforRiseabove=false;
        if (communityId) {
            $community.enter(communityId, function () {}, function () {
                $community.refreshMembers();
                $scope.currentCommunity = $community.getCommunityData();
                $scope.communityMembers = $community.getCommunityData().membersArray;
                $scope.scaffolds = $community.getCommunityData().registeredScaffolds;
                $community.refreshRegisteredScaffolds(function () {
                    $scope.current = $scope.scaffolds[0];
                    $scope.scaffolds.forEach(function (scaffold) {
                        (scaffold.supports).forEach(function (support) {
                            $scope.selectedSupports.push(support);
                        });
                    });
                    $scope.search();
                });
            });
        }
        $community.refreshViews(function () {
            $scope.viewsforRiseabove = $community.getViews();
        });

        //Query String
        $scope.queryString = '';

        $kfutil.mixIn($scope);
        $scope.hostURL = $community.hostURL;

        //General Status
        $scope.contributions = [];
        $scope.status = {};
        $scope.status.detailCollapsed = true;
        $scope.status.barchartCollapsed = true;
        $scope.status.radarchartCollapsed = true;
        $scope.status.detailsCollapsed = true;
        $scope.status.extraInfoCollapsed = true;
        $scope.status.status = 'init';
        $scope.selectedSupports = [];
        $scope.labels = [];
        $scope.supportsCountInNote = {};
        $scope.count = [];
        $scope.data = [$scope.count];
        $scope.selectedItems = [];
        $scope.noteInViews = {};
        $scope.radarOptions = {    
            scale: {
                ticks: { 
                    stepSize: 1,
                    min: 0
                }
            },
            title: {
                display: true,
                text: ""
            }
        };
        $scope.barOptions = {    
            scales: {
                yAxes: [{
                    ticks: { 
                        stepSize: 1,
                        min: 0
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: ""
                    }
                }]
            },
            legend: {

            }
        };

        $scope.radarOptions = {
            scale: {
                ticks: {
                    stepSize: 1,
                    min: 0
                }
            },
            title: {
                display: true,
                text: ""
            }
        };
        $scope.barOptions = {
            scales: {
                yAxes: [{
                    ticks: {
                        stepSize: 1,
                        min: 0
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: ""
                    }
                }]
            },
            legend: {

            }
        };

        // toggle selection for a given support Item by title
        $scope.toggleSelection = function toggleSelection(support) {
            var idx = $scope.selectedSupports.indexOf(support);
            // is currently selected
            if (idx > -1) {
                $scope.selectedSupports.splice(idx, 1);
            }
            // is newly selected
            else {
                $scope.selectedSupports.push(support);
            }
        };

        //export to CSV
        $scope.tableData = [];
        $scope.getHeader = function () {
            return ['Support', 'Frequency', 'In Contribution'];
        };

        $scope.notesOfSupport = {};
        $scope.detailedTableData = [];
        $scope.getDetailedHeader = function () {
            return ['Support', 'Frequency', 'User_Name_Author', 'Creation_Date', 'View_Name', 'Link to content', 'In Contribution'];
        };

        var checkedSupportLinkInNote = function (notes) {
            $scope.supportsCountInNote = {};
            $scope.tableData.length = 0;
            $scope.detailedTableData = [];
            notes.forEach(function (note, index) {
                var supportfound = false;
                $http.get('/api/links/to/' + note._id).success(function (links) {
                    links.forEach(function(link){
                        if (link.type === 'contains' && link._from.type === 'View') {
                            if (!$scope.noteInViews[note._id]) {
                                $scope.noteInViews[note._id] = [link];
                            } else {
                                $scope.noteInViews[note._id].push(link);
                            }
                        }
                    });
                    $scope.selectedSupports.forEach(function (support) {
                        var linkCount = 0;
                        links.forEach(function (link) {
                            if (support.to === link.from) {
                                linkCount++;
                            }
                        });
                        if (linkCount !== 0) {
                            supportfound = true;
                            if (!$scope.supportsCountInNote[support._to.title]){
                                $scope.supportsCountInNote[support._to.title] = [];
                            }
                            $scope.supportsCountInNote[support._to.title].push({
                                note: note,
                                count: linkCount,
                                views: $scope.noteInViews[note._id],
                                selectContribution:false
                            });
                        }
                    });
                    if (index === notes.length - 1) {
                        $scope.addCoordinateData();
                    }
                });

            });

        };
        $scope.addCoordinateData = function () {
            $scope.count.length = 0;
            $scope.labels.length = 0;
            $scope.radarOptions.scale.ticks.stepSize = 1;
            $scope.barOptions.scales.yAxes[0].ticks.stepSize = 1; 
            $scope.selectedSupports.forEach(function (support) {
                var maxcount = 0;
                var frequencyDetails = '  ';
                $scope.notesOfSupport[support._to.title] = [];
                if (!$scope.supportsCountInNote[support._to.title]) {
                    return;
                }
                $scope.supportsCountInNote[support._to.title].forEach(function (item) {
                    maxcount += item.count;
                    frequencyDetails += item.note.title + ' -- ' + item.count + ', ';

                    var obj = {
                        'Support': '',
                        'Frequency': '',
                        'UserIDAuthor': item.note.authors[0],
                        'UserNameAuthor': $scope.getNameString(item.note.authors[0]),
                        'CreationDate': $scope.getDateString(item.note.created),
                        'ViewID':  '',
                        'ViewName': '',
                        'Link to content': $kfutil.hostURL + '/contribution/' + item.note._id,
                        'In Contribution': item.note.title
                    };
                    if ($scope.noteInViews[item.note._id]) {
                        obj.ViewID  =  $scope.noteInViews[item.note._id][0].from;
                        obj.ViewName = $scope.noteInViews[item.note._id][0]._from.title;
                    }
                    $scope.notesOfSupport[support._to.title].push(obj);
                });

                $scope.tableData.push({
                    supportTitle: support._to.title,
                    frequency: maxcount,
                    inContribution: frequencyDetails
                });

                if ($scope.notesOfSupport[support._to.title]) {
                    $scope.notesOfSupport[support._to.title][0].Support = support._to.title;
                    $scope.notesOfSupport[support._to.title][0].Frequency = maxcount;
                }

                // Use default options for large data set
                if (maxcount > 10) {
                    $scope.radarOptions.scale.ticks.stepSize = 0;
                    $scope.barOptions.scales.yAxes[0].ticks.stepSize = 0; 
                }
            });

            $scope.tableData.sort(function (a, b) {
                return parseInt(b.frequency, 10) - parseInt(a.frequency, 10);
            });

            /**
             * Changes done in content which is downloaded as CSV (Jira ID KD-2)
             * */
            $scope.tableData.forEach(function (data) {
                $scope.count.push(data.frequency);
                $scope.labels.push(data.supportTitle);
                $scope.notesOfSupport[data.supportTitle].forEach(function(note){
                    var dataToPush = {
                        'Support' : note.Support,
                        'Frequency': note.Frequency,
                        'User_Name_Author' : note.UserNameAuthor,
                        'Creation_Date' : note.CreationDate,
                        'view_name' : note.ViewName,
                        'Link to content': $kfutil.hostURL + '/contribution/' + note.ViewID,
                        'In Contribution': data.inContribution

                    };
                    $scope.detailedTableData.push(dataToPush);
                });
            });
        };

        $scope.setSelectedData = function (queryString, selectedItems, views, authors, todate, fromdate) {
            $scope.selectedItems = selectedItems;
            $scope.queryString = queryString;
            $scope.views = views;
            $scope.authors = authors;
            if (authors === "Author(s): ") {
                $scope.authors = "";
            } 
            $scope.todate = todate;
            $scope.fromdate = fromdate;
            $scope.barOptions.scales.xAxes[0].scaleLabel.labelString = $scope.authors; 
            $scope.radarOptions.title.text = $scope.authors;
        };

        $scope.barchartControl = function () {
            $suresh.barchartControl($scope.status);
        };
        $scope.radarchartControl = function () {
            $suresh.radarchartControl($scope.status);
        };
        $scope.detailsControl = function () {
            $suresh.detailsControl($scope.status);
        };
        // $scope.getIcon = function(contribution) {$suresh.getIcon(contribution, $community); };

        //results
        $scope.search = function () {
            if ($scope.selectedSupports.length === 0) {
                window.alert('Select Support Items:');
            } else {
                $suresh.searchprocess($scope.queryString, communityId, $scope.communityMembers, $community, $scope.status, checkedSupportLinkInNote);
                $scope.status.detailCollapsed = true;
                $scope.detailsControl();
            }
        };

        $scope.getIcon = function (contribution) {
            if ($community.amIAuthor(contribution)) {
                return 'manual_assets/kf4images/icon-note-unknown-auth-.gif';
            } else {
                return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
            }
        };

        $scope.getNameString = function(memberId) {
            var member = $community.getMember(memberId);
            return member.firstName + ' ' + member.lastName;
        };

        $scope.getDateString = function(date) {
            var d = new Date(date);
            return d.toLocaleDateString();
        };

        $scope.createRiseabove =function( supportsCountInNote){
            var selectedNotes=[];
            Object.keys(supportsCountInNote).forEach(function(key){
            supportsCountInNote[key].forEach(function(supportNote){
                if(supportNote.selectContribution){
                    selectedNotes.push({"note":supportNote.note,"view":supportNote.views});
                }
            });
            });
            $scope.selectedNotesforRiseabove=selectedNotes;
            if(  $scope.selectedNotesforRiseabove.length>0){
                $scope.showViewsforRiseabove=true;
            }else{
                window.alert("Select notes to create riseabove.");
            }
            
        };

        $scope.createRiseaboveFromSelectedContributions = function (selectednotes,selectedview) {
            var topleft = {
                x: 10000,
                y: 10000
            };
            selectednotes.forEach(function (ref) {
                topleft.x = Math.min(topleft.x, ref.view[0].data.x);
                topleft.y = Math.min(topleft.y, ref.view[0].data.y);
            });
            var mode = {};
            mode.permission = selectedview.permission;
            mode.group = selectedview.group;
            mode._groupMembers = selectedview._groupMembers;
            $community.createView('riseabove:', function (view) {
                $community.createNote(mode, function (note) {
                    note.title = 'Riseabove';
                    $community.makeRiseabove(note, view._id, function (note) {
                        $scope.createContainsLink(note._id, {
                            x: topleft.x + 50,
                            y: topleft.y + 50
                        }, function () {
                            selectednotes.forEach(function (each,index) {
                                $scope.createContainsLink0(view._id, each.note._id, {
                                    x: each.view[0].data.x - topleft.x + 20,
                                    y: each.view[0].data.y - topleft.y + 20
                                }, function () {
                                  //selection of view reset
                                  if(index===selectednotes.length-1){
                                    $scope.selectedView=undefined;
                                  }
                                });
                            });
                        });
                    });
                });
            }, true, mode);
        };

        $scope.createContainsLink0 = function (viewId, toId, data, handler) {
            $community.createLink(viewId, toId, 'contains', data, handler);
            $community.saveContainsLinktoITM(viewId, toId);
        };

        $scope.createContainsLink = function (toId, data, handler) {
            $scope.createContainsLink0($scope.selectedView._id, toId, data, handler);
        };

        $scope.onSelectedView= function(view){
            $scope.selectedView=view;
        };

        $scope.addNotestoview = function(selectednotes, selectedview) {
            var topleft = {
                x: 10000,
                y: 10000
            };
            selectednotes.forEach(function (ref) {
                topleft.x = Math.min(topleft.x, ref.view[0].data.x);
                topleft.y = Math.min(topleft.y, ref.view[0].data.y);
            });
            selectednotes.forEach(function (each,index) {
                $scope.createContainsLink0(selectedview._id, each.note._id, {
                    x: each.view[0].data.x - topleft.x + 20,
                    y: each.view[0].data.y - topleft.y + 20
                }, function () {
                    //selection of view reset
                    if(index===selectednotes.length-1){
                        $scope.selectedView=undefined;
                      }
                });
            });

        };


        $scope.createViewLinksforNotes= function () {
            if ($scope.selectedNotesforRiseabove.length > 0) {
                $scope.addNotestoview($scope.selectedNotesforRiseabove, $scope.selectedView);
            } else {
                window.alert("Select notes to create riseabove.");
            }
            $scope.showViewsforRiseabove = false;
        };


        $scope.createRiseabovetoview = function () {
            if ($scope.selectedNotesforRiseabove.length > 0) {
                $scope.createRiseaboveFromSelectedContributions($scope.selectedNotesforRiseabove, $scope.selectedView);
            } else {
                window.alert("Select notes to create riseabove.");
            }
            $scope.showViewsforRiseabove = false;
        };
    });
