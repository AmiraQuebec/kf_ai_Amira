/* global jsPlumb */
/* jshint unused: false */

'use strict';

function onSvgDrawingInitialized() {
    var wnd = document.getElementById('svg-drawing').contentWindow;
    var doc = wnd.document;
    var mainButton = doc.getElementById('main_button');
    //Check if main button exists and apply style required
    if (mainButton) {
        mainButton.style.display = 'none';
    }
    var img = new Image();
    var imgSrc = $('#drawingEditor input[name="targetImage"]').val();


    var canvasPosition = {
        "x": 0,
        "y": 0
    };
    // Get Canvas Position to load the image at that position
    if (wnd.canvasBackground) {
        canvasPosition = {
            "x": wnd.canvasBackground.attributes.x.value,
            "y": wnd.canvasBackground.attributes.y.value
        };
    }

    $(img).load(function () {
        var h = img.height;
        var w = img.width;
        if (w > 300) {
            w = 300;
            h = (300 / img.width) * h;
        }
        // X,Y postitons of images added for draw on Image
        var svg = '<svg width="' + w + '" height="' + h + '" x="' + canvasPosition.x + '" y= "' + canvasPosition.y + '"  xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><g><title>Layer 1</title><image xlink:href="' + imgSrc + '" id="svg_1" height="' + h + '" width="' + w + '" y="0" x="0"/></g><g><title>Layer 2</title></g></svg>';
        wnd.svgCanvas.setSvgString(svg);
    }).error(function () {
        // image couldnt be loaded
        console.log('An error occurred and your image could not be loaded.  Please try again.');
    }).attr({ src: imgSrc });
    // wnd.svgEditor.showSaveWarning = false;
}

angular.module('kf6App')
    .controller('ViewCtrl', function ($scope, $rootScope, $http, $stateParams, $community, $compile, $timeout, socket, Auth, $location, $kfutil, $ac, $modal, $sce, $kftag, $q) {
        var viewId = $stateParams.viewId;
        $scope.menuStatus = $stateParams.menuStatus;
        if ($scope.menuStatus) {
            $('#maincanvas').addClass('KFViewMainCanvas0');
        }

        $kfutil.mixIn($scope);
        $scope.community = {};
        $scope.view = {};
        $scope.views = [];
        $scope.authors = [];
        $scope.scaffolds = [];
        $scope.scaffoldCurrent = {};
        $scope.refs = [];
        $scope.mdiv = { x: 70, y: 50 };

        $scope.status = {};
        $scope.status.googleOAuth = false;
        $scope.status.error = false;
        $scope.status.isViewlinkCollapsed = true;
        $scope.status.isViewManagerCollapsed = true;
        $scope.status.isAttachmentCollapsed = true;
        $scope.status.isAnalyticsCollapsed = true;
        $scope.status.isSettingCollapsed = true;
        $scope.status.isHelpCollapsed = true;
        /// Filter variable for the notes
        $scope.status.isFilterCollapsed = true;
        $scope.status.isNoteViewCollapsed = true;
        $scope.filter = {};
        $scope.filter.textSearch = "";
        $scope.contributionTypes = ["Note", "Dessin", "Vue", "Attachement", "Élaborations", "Élever-le-propos"];
        //Get each note on the view for favourites and filtering
        $scope.notesInView = {};
        $scope.selectedNotesinHirerachyView={};

        $scope.scaffoldLinks=[];
        $scope.buildsonLinks=[];
        $scope.scaffoldReferences=[];
        $scope.hireachyKeywords="";
        $scope.hirerachy={
            'KeywordInput':""
        };

        $scope.setting = $community.makeDefaultViewSetting();
        $scope.dragging = 'none';
        $scope.isDeletable = true;
        $scope.dirtyContribution = {};
        $scope.tabsInNotesTab = []; // Stores the Contrbution ids of notes currently having tabs in bar.

        $scope.$on('update-dirty-contribution', function (event, status) {
            $scope.dirtyContribution[status.id] = status.dirty;
        });

        var itmServer = $community.itmServer;
        $scope.kbdacEntry = $sce.trustAsResourceUrl($community.kbdacServer);
        $scope.kbdexEntry = $sce.trustAsResourceUrl($community.kbdexServer);
        $scope.itmEntry = $sce.trustAsResourceUrl(itmServer + "/ITM3/kf_project");

        $http.get('/api/users/me').success(function (me) {
            $scope.user = me;
        });

        $scope.onSelected = function () {
            $community.modifyObject($scope.author);
            $scope.getContributionTitle();
        };

        $scope.token = Auth.getToken();
        $scope.notesWithAttachments = {};
        $scope.initialize = function () {
            $community.getObject(viewId, function (view) {
                $scope.view = view;
                $ac.mixIn($scope, view);
                $community.enter(view.communityId,
                    function () {
                        $community.refreshGroups();
                        $community.refreshScaffolds(function () { });
                        $scope.community = $community.getCommunityData();
                        $scope.views = $community.getViews();
                        $scope.communityId = $scope.community.community._id;
                        // $scope.views = $community.getViews();
                        // $scope.deletedView = $community.getdeletedView();
                        $scope.author = $community.getAuthor();
                        //Added for multilanguage notes : starts
                        if ($scope.author !== undefined && $scope.author !== null && $scope.community.community.lang !== undefined && ($scope.author.lang === "" || $scope.author.lang === undefined)) {
                            $scope.author.lang = $scope.community.community.lang;
                            console.log('$scope.author.lang', $scope.author.lang);
                            $community.modifyObject($scope.author);

                        }
                        //Added for multilanguage notes : ends
                        $scope.authors = $community.getMembersArray();
                        $scope.scaffolds = $community.getScaffolds();
                        $scope.checkGoogleOAuth();
                        $scope.updateCanvas();
                        $scope.updateViewSetting();

                    }, function () {
                    }, function (result) {
                        // View Handler for Enter Method in $Community
                        $community.getViewToViewLinks(result[0]._id, function (nodeList) {
                            $scope.viewTreeData = [
                                {
                                    "id": result[0]._id,
                                    "title": result[0].title,
                                    "nodes": nodeList
                                }
                            ];
                        });
                    });
            }, function (msg, status) {
                $scope.status.error = true;
                $scope.status.errorMessage = msg;
            });
        };



        /**
         * @description Logs out the user and redirects to /login
         */
        $scope.logout = function () {
            Auth.logout();
            $location.path('/login');
        };
        $scope.checkGoogleOAuth = function () {

            $http.post('/auth/googleOAuth/checkStatus', {
                userName: $scope.community.author.userName
            }).success(function (result) {
                $scope.status.googleOAuth = result.data;
            });
        };

        $scope.updateViewSetting = function () {
            //this is temporary code. coherent plan for context management would be expected.(Yoshiaki)
            $community.getContext(null, function (context) {
                $scope.context = context;

                $scope.itmEnabled = $community.isPluginEnabled('itm');
                $scope.googleDocsEnabled = $community.isPluginEnabled('googledocs');
                //temporary code end
            //Added for multilangue notes
            $scope.multilanuageEnabled = $community.isPluginEnabled('multilanguage');
            if ($scope.multilanuageEnabled) {
                $scope.languageEnabled = $community.getLanguageEnabled();
                $scope.allLanguageCode = $kfutil.getLanguages();
                if ($scope.languageEnabled === false || $scope.languageEnabled === undefined) {
                    $scope.languageEnabled = [];
                }
                if ($scope.languageEnabled.indexOf($scope.author.lang) === -1) {

                }
                $scope.langCode = [];
                angular.forEach($scope.languageEnabled, function (value, key) {
                    $scope.langCode.push($scope.allLanguageCode[value]);
                });
            }
            if ($scope.view.data && $scope.view.data.viewSetting) {
                $scope.setting = $scope.view.data.viewSetting;
            } else {
                $community.getContext(viewId, function (context) {
                    if (context.data.viewSetting) {
                        $scope.setting = context.data.viewSetting;
                    }
                });
            }
            });



        };

        $scope.popupGAuthorizationNotice = function () {
            var message = '<div id="google_authorization_notice"><label style="font-size:14px;margin-top:5px;">Vous êtes sur le point d\'accéder au site Web de Google pour obtenir une autorisation.</label>';
            message += '<div style="text-align:center;"><button class="btn btn-primary btn-dialog" id="go2G4Authorization">Ok</button><button class="btn btn-primary btn-dialog" id="notice_cancel">Annuler</button></div></div>';
            $('#windows').append(message);
            $("#google_authorization_notice").dialog({
                modal: true,
                open: function () {
                    $('#go2G4Authorization').bind('click', function () {
                        var un = $scope.community.author.userName;
                        var data = {};
                        data.userName = un;
                        data.viewId = viewId;
                        $http.post('/auth/googleOAuth/getOAuthUrl', data)
                            .success(function (result) {
                                window.location.href = result.data;
                            }).error(function () {
                            });
                    });
                    $('#notice_cancel').bind('click', function () {
                        $("#google_authorization_notice").dialog('close');
                    });
                },
                close: function () {
                    $(this).remove();
                }
            });
        };
        $scope.openAIJournal = function () {
            $location.path('/ai-logs'); // navigate to the new page
        };
        $scope.openITMWindow = function () {
            var params = [
                'height=' + screen.height,
                'width=' + screen.width,
                'fullscreen=yes' // only works in IE, but here for completeness
            ].join(',');
            //var itmWindow = window.open('about:blank', "itm-window", params);
            var itmWindow = window.open('about:blank', "itm-window");
            itmWindow.focus();
        };

        $scope.openKBDexWindow = function () {
            $scope.status.isAnalyticsCollapsed = true;
            var kbdexWindow = window.open('about:blank', "kbdex-window");
            kbdexWindow.focus();
        };

        $scope.openKBDACWindow = function () {
            $scope.status.isAnalyticsCollapsed = true;
            var kbdacWindow = window.open('about:blank', "kbdac-window", "status=yes,menubar=yes,toolbar=yes,scrollbars=yes, resizable=yes");
            kbdacWindow.focus();
        };

        $scope.hostURL = $community.hostURL;

        $scope.openGoogleDocSetting = function (fromId) {

            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                //pop up confirm window
                $scope.popupGAuthorizationNotice();
            }
            else {
                if ($('#googleDoc_dialog').length) {
                    return;
                }
                var width = 600;
                var height = 350;
                var wmax = window.innerWidth * 0.8;
                if (width > wmax) {
                    width = wmax;
                }
                var hmax = window.innerHeight * 0.8;
                if (height > hmax) {
                    height = hmax;
                }
                var to = fromId;
                if (to === undefined) {
                    to = '';
                }
                $scope.scaffoldCurrent = $scope.scaffolds[0];
                var str = '<div id="googleDoc_dialog"><div class="head_area"><label>Google Document Settings</label></div>';
                str += '<div class="title_area"><label>Title</label><input id="gdoc_title" type="text" value=""/></div>';
                str += '<div class="setting_area"><fieldset><legend>Co-authors</legend>';
                str += '<div class="author_data">';
                str += '<div ng-repeat="a in authors" ><input type="checkbox" value="{{a._id}}" name="coauthors">{{a.name}}</div>';
                str += '</div>';
                str += '</fieldset>';
                str += '<fieldset>';
                str += '<legend style="width:70px;">Scaffolds</legend>';
                str += '<div><select class="KFScaffoldMenu" ng-model="scaffoldCurrent" ng-options="s.title for s in scaffolds"></select></div>';
                str += '<div style="height: 20px;"><input type="checkbox" value="Select All" id="scaffoldSelectAll" name="selectAll"> Select All</div>';
                str += '<div ng-repeat="s in scaffoldCurrent.supports"><input type="checkbox" value="{{s._to.title}}" name="scaffolds"> {{s._to.title}}</div>';
                str += '</fieldset>';
                str += '</div>';
                str += '<div class="button_area">';
                str += '<div ng-show="gstatusShow" class="gstatus_area"><img src="manual_assets/kf6images/loading_small.gif"/>Creating your note ...</div><div ng-show="gmsgShow" class="gmsg_area">{{gmsg}}</div><button class="btn btn-primary kfbutton" ng-click="createGoogleDoc(\'' + to + '\')">Create Google Doc</button>';
                str += '</div></div>';
                $('#windows').append(str);
                $compile($('#googleDoc_dialog').contents())($scope);
                $("#scaffoldSelectAll").change(function () {
                    $("input:checkbox[name=scaffolds]").prop('checked', this.checked);
                });
                // $('#scaffoldSelectAll').bind('click', function(){
                //     if ($(this).is(':checked')) {

                //     }
                //     else{

                //     }
                // });
                $('#googleDoc_dialog').dialog({
                    width: width,
                    height: height,
                    modal: true,
                    create: function () {
                        $(this).css('padding', '1px');
                    },
                    open: function () {
                        // var iwnd = $(this).parent();
                        // var x = iwnd.offset().left;
                        // var y = iwnd.offset().top;
                        // var offset = frames.length * 20;
                        // iwnd.offset({
                        //     left: x + offset,
                        //     top: y + offset
                        // });
                    },
                    drag: function () {
                        // _.remove(frames, function(n) {
                        //     return n === wid;
                        // });
                    },
                    close: function () { /*we need to erase element*/
                        $scope.gmsgShow = false;
                        $scope.gstatusShow = false;
                        $(this).remove();
                    }
                });
            }
        };

        $scope.updateCanvas = function () {
            $http.get('/api/links/from/' + viewId).success(function (refs) {
                //temporary get rid of others from contains
                var onviewrefs = [];
                $scope.notesInView = {};
                refs.forEach(function (ref) {
                    if (ref.type === 'contains') {
                        //Multilanguage notes : Added to show flag of community's default lang( as default) for older notes
                        if ($scope.author !== undefined && $scope.author.lang !== undefined && ref._to !== undefined && (ref._to.langInNote === undefined || ref._to.langInNote.length === 0)) {
                            $scope.allLanguageCode = $kfutil.getLanguages();
                            ref._to.langInNote = [];
                            ref._to.langInNote.push($scope.allLanguageCode[$scope.author.lang]);
                        }
                        $scope.getNoteData(ref.to).then(function (data) {
                            if(data.type==="Note")
                            {
                            $scope.notesInView[data._id] = data;
                            $scope.notesInView[data._id].view=ref;
                            }
                        });
                        onviewrefs.push(ref);
                    }
                });
                $scope.refs = onviewrefs;

                $scope.refreshAttachments(onviewrefs);
                socket.socket.emit('subscribe', 'linkfrom:' + viewId);
                socket.socket.emit('subscribe', 'noteCount:' + viewId);
                $scope.$on('$destroy', function () {
                    socket.unsyncUpdates('link');
                    socket.socket.emit('unsubscribe', 'linkfrom:' + viewId);
                });
                socket.syncUpdates('link', function (item) {
                    return item.type === 'contains';
                }, $scope.refs, function (event, item) {
                    if (event === 'created') {
                        $scope.updateRef(item);
                        $scope.refreshConnection(item.to);
                        $scope.refreshReadStatus(item);
                    }
                    if (event === 'updated') {
                        $scope.updateRef(item);
                    }
                });
                //authors info
                var refscopy = _.clone($scope.refs);
                refscopy.forEach(function (ref) {
                    $scope.updateRef(ref);
                });
                $community.refreshMembers();

                //update links
                $scope.refreshAllConnections();

                //read
                $scope.refreshAllReadStatus();

                //title
                $scope.getContributionTitle();

                //Get all scaffold links for the view for filtering
                $scope.getScaffoldLinks();

                // Get all buildsons for the view for filtering
                $scope.getBuildSonLinks();

            });
        };

        $scope.getNoteData = function (noteID) {
            var deferred = $q.defer();
            $http.get('/api/objects/' + noteID)
                .success(function (data) {
                    deferred.resolve(data);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
            return deferred.promise;
        };

        $scope.isFavouriteNote = function (noteId) {
            var currentNote = $scope.notesInView[noteId];
            if (currentNote && currentNote.type === "Note") {
                if (currentNote.favAuthors.length > 0 && currentNote.favAuthors.includes($scope.community.author.userId)) {
                    return true;
                }
            }
            return false;
        };

        $scope.addNoteToFavourite = function () {
            $http.post('/api/objects/addTofav/' + $scope.community.community._id + '/' + $scope.contextTarget.to)
                .success(function (result) {
                    $scope.updateCanvas();
                }).error(function () {
                    window.alert('Could not add note to your favourites, please try later');
                });
        };


        $scope.remNoteFromFavourite = function () {
            $http.post('/api/objects/remFromfav/' + $scope.community.community._id + '/' + $scope.contextTarget.to)
                .success(function (result) {
                    $scope.updateCanvas();
                }).error(function () {
                    window.alert('Could not add note to your favourites, please try later');
                });
        };


        $scope.getScaffoldLinks = function () {
            $http.post('/api/links/' + $scope.view.communityId + '/search', { query: { type: 'supports' } }).success(function (links) {
                $scope.scaffoldLinks = links;
            });

            var query = { $or: [{ type: 'supports' }, { type: 'references' }] };
            $http.post('/api/links/' + $scope.view.communityId  + '/search', { query: query }).success(function(links) {

                $scope.scaffoldReferences=links;
            });


        };


        $scope.getBuildSonLinks = function () {
            $http.post('/api/links/' + $scope.view.communityId + '/search', { query: { type: 'buildson' } }).success(function (links) {
                $scope.buildsonLinks = links;
                $scope.sortNotes();
            });
        };

        $scope.filterFormSubmite = function (form) {
            console.log(form);
            console.log($scope.filter);
        };
        $scope.filterByTextSearch = function (ref) {
            var textTemp = true;
            if ($scope.filter.textSearch === "") {
                return textTemp;
            } else {
                if (ref._to.title.toUpperCase().includes($scope.filter.textSearch.toUpperCase())) {
                    return textTemp || true;
                }
                else if (ref.type === "contains" && ref._to.type === "Note") {
                    if ($scope.notesInView[ref.to] && $scope.notesInView[ref.to].data.body.toUpperCase().includes($scope.filter.textSearch.toUpperCase())) { return textTemp || true; }
                }

                return false;
            }
        };


        $scope.filterByScaffold = function (ref) {
            var key;
            var typeSelected = false;
            for (key in $scope.filter.selectedScaffolds) {
                typeSelected = typeSelected || $scope.filter.selectedScaffolds[key];
            }
            if ($scope.filter.selectedScaffolds && typeSelected) {
                for (key in $scope.filter.selectedScaffolds) {
                    if ($scope.filter.selectedScaffolds[key] === true) {
                        var temp = false;
                        for ( var supportRef in $scope.scaffoldLinks){
                            if ($scope.scaffoldLinks[supportRef]._from.title === $scope.scaffolds[0].supports[parseInt(key)]._to.title && $scope.scaffoldLinks[supportRef].to === ref.to) {
                                temp = temp || true;

                            } else {
                                temp = temp || false;
                            }

                        }

                        return temp;
                    }

                }
            }
            return true;
        };

        $scope.checkScaffold = function (key){

        };
        $scope.filterByType = function (ref) {
            var key;
            var typeSelected = false;
            var tempType = false;
            for (key in $scope.filter.selectedContributionTypes) {
                typeSelected = typeSelected || $scope.filter.selectedContributionTypes[key];
            }

            if ($scope.filter.selectedContributionTypes && typeSelected) {
                for (key in $scope.filter.selectedContributionTypes) {
                    if ($scope.filter.selectedContributionTypes[key] === true && ref._to.type === $scope.contributionTypes[key]) { tempType = tempType || true; }
                    else if ($scope.filter.selectedContributionTypes[key] === true && $scope.contributionTypes[key] === "Riseabove") {
                        if (ref._to.data && ref._to.data.riseabove) {
                            tempType = tempType || true;
                        } else {
                            tempType = tempType || false;
                            $scope.clearAllConnections();
                        }

                    }
                    else if ($scope.filter.selectedContributionTypes[key] === true && $scope.contributionTypes[key] === "Buildson") {
                        for (var buildsonLink in   $scope.buildsonLinks){
                            if ($scope.buildsonLinks[buildsonLink].from === ref.to) { tempType = tempType || true; }
                            else {
                                tempType = tempType || false;
                            }
                        }

                        $scope.clearAllConnections();

                    }
                    else {
                        tempType = tempType || false;
                    }
                }
                return tempType;
            }

            return true;
        };


        $scope.$watch("filter", function () {
            $scope.refreshAllConnections();
        }, true);


        $scope.filterByDate = function (ref) {
            if ($scope.filter.fromDate && $scope.filter.toDate) {
                var refCreated = new Date(ref.created);
                if (refCreated > $scope.filter.fromDate && refCreated < $scope.filter.toDate) {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            return true;
        };


        // $scope.addWordsHirerachyFilter= function(word){
        //     if($scope.hireachyKeywords.includes(word)){
        //         $scope.hirerachyKeywordInput=undefined;
        //     }else{
        //         $scope.hireachyKeywords.push(word);
        //         $scope.hirerachy.KeywordInput=undefined;
        //     }
        // };

        // $scope.remWordsHirerachyFilter = function( index){
        //     $scope.hireachyKeywords.splice(index, 1);
        // };

        $scope.sortNotes = function () {
            $scope.sortedNotesDes = [];
            var tempNote = {};
            var noteKeys = Object.keys($scope.notesInView);
            var buildsonChildrenIds=[];
            var buildsonParentNoteIds=[];
            var parents=[];
            for( var j=0;j<$scope.buildsonLinks.length;j++){
                if($scope.buildsonLinks[j]._from.status==="active"){
                parents.push({"noteId":$scope.buildsonLinks[j].to,"modified":$scope.buildsonLinks[j].modified,"children":[]});
                }
            }

            for( var i=0;i<$scope.buildsonLinks.length;i++){
                if($scope.buildsonLinks[i]._from.status==="active" && $scope.buildsonLinks[i]._to.status==="active" && $scope.buildsonLinks[i]._from.type=== "Note" && $scope.buildsonLinks[i]._to.type=== "Note")
                {
                for(j=0;j<parents.length;j++){
                    if($scope.buildsonLinks[i].to===parents[j].noteId){
                        parents[j].children.push({"noteId":$scope.buildsonLinks[i].from,"modified":$scope.buildsonLinks[j].modified,"children":[]});
                        buildsonChildrenIds.push($scope.buildsonLinks[i].from);
                    }
                }

                if(buildsonParentNoteIds[$scope.buildsonLinks[i].to])
                {
                    buildsonParentNoteIds[$scope.buildsonLinks[i].to].push($scope.buildsonLinks[i].from);
                }else{
                buildsonParentNoteIds[$scope.buildsonLinks[i].to]=[];
                buildsonParentNoteIds[$scope.buildsonLinks[i].to].push($scope.buildsonLinks[i].from);
                }
            }

            }
            var newparents=parents;
            var hireachymap=[];
            for(j=0;j<parents.length;j++){
                parents[j]=$scope.addChildren(newparents,parents[j],buildsonParentNoteIds);
                hireachymap[parents[j].noteId]=parents[j];

            }


            noteKeys.forEach(function (key) {
                tempNote = {};
                if($scope.notesInView[key].status==='active' && !$scope.checkifChild(key,buildsonChildrenIds)){
                tempNote.noteId = $scope.notesInView[key]._id;
                tempNote.modified = $scope.notesInView[key].modified;
                if(hireachymap[key]){
                    tempNote.children=hireachymap[key].children;
                }
                $scope.sortedNotesDes.push(tempNote);
                }
            });
            $scope.sortedNotesDes=$scope.sortedNotesDes.sort($scope.sortByModifiedDate);
        };

        $scope.remNoteFromSelNotesHirerachyView= function(noteid){
            if($scope.selectedNotesinHirerachyView[noteid]){
                delete $scope.selectedNotesinHirerachyView[noteid];
            }
        };

        $scope.onHirerachySelectedView= function(view){
            $scope.selectedView=view;
        };


        $scope.createViewLinksforHirerachyNotes = function(selectedview) {
            var topleft = {
                x: 10000,
                y: 10000
            };
            var selectednotes = [];
            Object.keys($scope.selectedNotesinHirerachyView).forEach(function (key) {

                selectednotes.push($scope.selectedNotesinHirerachyView[key]);

            });
            if (!selectedview) {
                window.alert("Please select a View");
                return;
            }
            if (selectednotes.length === 0) {
                window.alert("Please Select Notes");
                return;
            }
            selectednotes.forEach(function (ref) {
                topleft.x = Math.min(topleft.x, ref.view.data.x);
                topleft.y = Math.min(topleft.y, ref.view.data.y);
            });
            selectednotes.forEach(function (each, index) {
                $scope.createContainsLink0(selectedview._id, each._id, {
                    x: each.view.data.x - topleft.x + 20,
                    y: each.view.data.y - topleft.y + 20
                }, function () {
                    if (index === selectednotes.length - 1) {
                        $scope.selectedNotesinHirerachyView = {};
                    }
                });
            });

        };

        $scope.createRiseabovetoviewfromHirerachyNotes = function (selectedview) {
            var topleft = {
                x: 10000,
                y: 10000
            };
            var selectednotes=[];
            Object.keys($scope.selectedNotesinHirerachyView).forEach(function(key){

                    selectednotes.push($scope.selectedNotesinHirerachyView[key]);

            });
            if(!selectedview){
                window.alert("Please select a View");
                return;
            }
            if(selectednotes.length===0){
                window.alert("Please Select Notes");
                return;
            }
            selectednotes.forEach(function (ref) {
                topleft.x = Math.min(topleft.x, ref.view.data.x);
                topleft.y = Math.min(topleft.y, ref.view.data.y);
            });
            var mode = {};
            mode.permission = selectedview.permission;
            mode.group = selectedview.group;
            mode._groupMembers = selectedview._groupMembers;
            $community.createView('riseabove:', function (view) {
                $community.createNote(mode, function (note) {
                    note.title = 'Riseabove';
                    $community.makeRiseabove(note, view._id, function (note) {
                        $scope.createContainsLink0(selectedview._id,note._id, {
                            x: topleft.x + 50,
                            y: topleft.y + 50
                        }, function () {
                            selectednotes.forEach(function (each,index) {
                                $scope.createContainsLink0(view._id, each._id, {
                                    x: each.view.data.x - topleft.x + 20,
                                    y: each.view.data.y - topleft.y + 20
                                }, function () {
                                    if(index===selectednotes.length-1){
                                        $scope.selectedNotesinHirerachyView={};
                                      }
                                });
                            });
                        });
                    });
                });
            }, true, mode);
        };



        $scope.checkifChild= function (id,idlist){
            for(var i=0;i<idlist.length;i++){
                if(idlist[i]===id)
                {
                return true;
                }
            }
            return false;
        };

        $scope.sortByModifiedDate = function (a, b) {
            var aDate = new Date(a.modified);
            var bDate = new Date(b.modified);

            if (aDate < bDate) {
                return 1;
            } else if (aDate > bDate) {
                return -1;
            } else {
                return 0;
            }

        };

        // hirerachy buildson recursion function to add chidren
        $scope.addChildren = function (hireachy,current,buildsonparent){
            if(current.children.length>0){
                for(var k=0;k<current.children.length;k++){
                    if(buildsonparent[current.children[k].noteId]){
                        for(var eachchild in buildsonparent[current.children[k].noteId]){

                            if($scope.notesInView[buildsonparent[current.children[k].noteId][eachchild]]){
                            current.children[k].children.push($scope.addChildren(hireachy,{"noteId":buildsonparent[current.children[k].noteId][eachchild],"modified":$scope.notesInView[buildsonparent[current.children[k].noteId][eachchild]].modified,"children":[]},buildsonparent));
                            }
                        }
                    }
                }

            }
            return current;
        };


        $scope.getContributionTitle = function () {
            $community.getContributionTitles(function (contributionTitles) {
                contributionTitles.find(function (x) {
                    $scope.refs.forEach(function (ref) {
                        if (ref.type === 'contains') {
                            if (x._id === ref.to) {
                                if ($scope.multilanuageEnabled && $scope.author.lang !== undefined && x.data[$scope.author.lang + '_title'] !== undefined) {
                                    ref._to.title = x.data[$scope.author.lang + '_title'];
                                }
                                else {
                                    if (x.data[$scope.community.community.lang + '_title'] !== undefined) {
                                        ref._to.title = x.data[$scope.community.community.lang + '_title'];
                                    }
                                }
                            }

                        }
                    });

                });
            });
        };

        $scope.settingChanged = function () {
            $scope.refreshAllConnections();
        };

        $scope.updateRef = function (ref) {

            // show only contains
            if (ref.type !== 'contains') {
                console.warn('item is not \'contains\'');
                return;
            }

            // assure data
            if (!ref._to) {
                console.warn('ref._to not found');
                ref._to = {};
            }
            if (!ref.data) {
                ref.data = {};
            }

            /// Load drawings on view after creating
            if (ref._to.type === "Drawing" && (ref.data.showInPlace === undefined || ref.data.showInPlace === null)) {
                ref.data.showInPlace = true;
            }

            // show only active
            if (ref._to.status !== 'active') {
                _.remove($scope.refs, function (obj) {
                    return obj === ref;
                });
                return;
            }

            // show only readable
            if (!$ac.isReadable(ref._to)) {
                _.remove($scope.refs, function (obj) {
                    return obj === ref;
                });
                return;
            }

            // adjust location
            if (ref.data) {
                if (ref.data.x < 2) {
                    ref.data.x = 2;
                }
                if (ref.data.y < 2) {
                    ref.data.y = 2;
                }
            }

            if (ref.refreshFixedStatus) {
                ref.refreshFixedStatus();
            }
            if (ref.data.showInPlace === true) {
                $scope.loadAsShowInPlace(ref);
            } else {
                $scope.loadAsIcon(ref);
            }
        };

        $scope.loadAsShowInPlace = function (ref) {
            $community.getObject(ref.to, function (contribution) {
                //Add scaling  for svg/drawings
                if (contribution.data.svg) {
                    // creating a svg html object from string to edit its attributes
                    var htmlObject = document.createElement('div');
                    htmlObject.innerHTML = contribution.data.svg;
                    var svgobject = htmlObject.firstElementChild;

                    // changing the width and height to 100% of parent div
                    // adding viewbox attribute to scale to fit the available space
                    // save svg string to data

                    var w = svgobject.attributes.width.value;
                    var h = svgobject.attributes.height.value;
                    var viewboxValue = "0 0 " + w + " " + h + "";
                    svgobject.setAttribute("viewbox", viewboxValue);
                    svgobject.attributes.width.value = "100%";
                    svgobject.attributes.height.value = "100%";
                    contribution.data.svg = htmlObject.innerHTML;

                    ///// Assigning height and width to the ref of a new drawing created
                    if (ref.data.height === undefined) {
                        ref.data.height = h;
                    }
                    if (ref.data.width === undefined) {
                        ref.data.width = w;
                    }
                }
                ref.contribution = contribution;
            });
        };

        $scope.refreshAttachments = function (refs) {
            var url = "/api/links/" + $scope.community.community._id + "/search";
            var noteIds = [];
            for (var i = 0; i < refs.length; i++) {
                noteIds.push(refs[i].to);
            }
            var data = {
                query: {
                    type: "attach",
                    from: { "$in": noteIds }
                }
            };
            $http.post(url, data).success(function (links) {
                $scope.notesWithAttachments = {};
                for (var i = 0; i < links.length; i++) {
                    $scope.notesWithAttachments[links[i].from] = true;
                }

            }).error(function (err) {
                console.log(err);
            });

        };

        $scope.loadAsIcon = function (ref) {

            ref.authorObjects = [];
            ref.getIcon = function () {
                var iconroot = 'manual_assets/kf4images/';
                return iconroot + ref.getIconFile();
            };

            ref.isRiseabove = function () {
                return ref._to.data && ref._to.data.riseabove;
            };

            ref.isPromisingContains = function () {
                return ref._to.data && ref._to.data.promisingContains;
            };

            ref.getIconFile = function () {
                if (ref._to.type === 'View') {
                    return 'icon-view.png';
                }
                if (ref._to.type === 'Attachment') {
                    return 'icon-attachment.gif';
                }
                if (ref._to.type === 'Drawing') {
                    return 'icon-drawing.gif';
                }
                if (ref._to.type === 'Note') {
                    var name = 'icon-note-';
                    if (ref.readlink) {
                        if (ref._to.modified < ref.readlink.modified) {
                            name += 'read-';
                        } else {
                            name += 'mod-';
                        }
                    } else {
                        name += 'unread-';
                    }
                    if (ref.amIAuthor()) {
                        name += 'auth-';
                    } else {
                        name += 'othr-';
                    }
                    if (ref.isRiseabove()) {
                        name += 'rise';
                    }
                    if (ref.isPromisingContains()) {
                        name += 'promising';
                    }
                    name += '.gif';
                    return name;
                }
            };

            if (ref._to.type === 'View') {
                return;
            }

            ref.getGroupString = function () {
                if (ref._to.group && $scope.community.groups[ref._to.group]) {
                    var group = $scope.community.groups[ref._to.group];
                    if (group) {
                        return group.title + ': ';
                    }
                }
                return '';
            };

            ref.getAuthorString = function () {
                if ($scope.setting.showGroup && ref.getGroupString().length > 0) {
                    return '';
                }
                return $community.makeAuthorString(ref.authorObjects);
            };

            ref.amIAuthor = function () {
                return $community.amIAuthor(ref);
            };

            if (ref._to.authors) {
                ref._to.authors.forEach(function (id) {
                    ref.authorObjects.push($community.getMember(id));
                });
            }
        };

        $scope.refreshReadStatus = function (ref) {
            $http.get('/api/records/myreadstatus/' + $scope.view.communityId + '/' + ref.to).success(function (readlink) {
                ref.readlink = readlink;
            });
        };

        $scope.refreshAllReadStatus = function () {
            var authorId = $scope.community.author._id;
            if (authorId === null) {
                return;
            }
            $http.get('/api/records/myreadstatusview/' + $scope.view.communityId + '/' + $scope.view._id).success(function (readlinks) {
                readlinks.forEach(function (readlink) {
                    $scope.updateRefRead(readlink);
                });
            });

            socket.socket.emit('subscribe', 'linkfrom:' + authorId);
            socket.socket.on('link:save', function (link) {
                if (link.type === 'read') {
                    $scope.updateRefRead(link);
                }
            });
            $scope.$on('$destroy', function () {
                socket.socket.emit('unsubscribe', 'linkfrom:' + authorId);
                socket.socket.removeAllListeners('link:save');
            });
        };

        $scope.updateRefRead = function (readlink) {
            var refs = _.filter($scope.refs, function (ref) {
                return ref.to === readlink.to;
            });
            refs.forEach(function (ref) {
                ref.readlink = readlink;
            });
        };

        $scope.refreshConnection = function (id) {
            $http.get('/api/links/either/' + id).success(function (links) {
                links.forEach(function (link) {
                    $scope.createConnection(link);
                });
            });
        };

        $scope.refreshAllConnections = function () {
            $scope.clearAllConnections();
            // Only proceed with getting links if jsPlumb is initialized
            if ($scope.jsPlumb) {
                $http.get('/api/links/view/' + $scope.view._id).success(function (links) {
                    links.forEach(function (link) {
                        $scope.createConnection(link);
                    });
                });
            }
        };

        /* ----------- connections --------- */

        $scope.connectionIdCounter = 0;
        $scope.jsPlumb = undefined;
        $scope.repaintRequest = false;
        $scope.$watch('repaintRequest', function () {
            if ($scope.repaintRequest === false) {
                return;
            }
            if ($scope.jsPlumb) {
                try {
                    $scope.jsPlumb.repaintEverything();
                } catch (e) {
                    console.error(e);
                }
            }
            $scope.repaintRequest = false;
        });

        $scope.generateConnectionId = function () {
            $scope.connectionIdCounter++;
            return 'kfconnection' + $scope.connectionIdCounter;
        };

        $scope.repaintConnections = function (ref) {
            $scope.repaintRequest = true;
        };

        $scope.createConnection = function (link) {
            if (link.type === 'buildson' && $scope.setting.buildson) {
                $scope.createConnection0(link, 'blue', '');
            }
            if (link.type === 'references' && $scope.setting.references) {
                var text = '';
                // TODO: negotiate if and how reference links should be display by default, because views can become quickly loaded.

                //if (link.data && link.data.text && link.data.text.length > 0) {
                //    text = link.data.text;
                //    if (text.length > 24) {
                //        text = text.substring(0, 24) + '...';
                //    }
                //    text = '"' + text + '"';
                //}
                $scope.createConnection0(link, 'black', text);
            }
        };

        $scope.createConnection0 = function (link, color, label) {
            var fromElements = $('.icon' + link.from);
            var toElements = $('.icon' + link.to);
            fromElements.each(function () {
                var fromElement = $(this);
                toElements.each(function () {
                    var toElement = $(this);
                    $scope.createConnection1(fromElement, toElement, color, label);
                });
            });
        };

        $scope.createConnection1 = function (fromElement, toElement, color, label) {
            var fromId = $scope.generateConnectionId();
            fromElement.attr('id', fromId);
            var toId = $scope.generateConnectionId();
            toElement.attr('id', toId);
            var conn = $scope.jsPlumb.connect({
                source: fromId,
                target: toId,
                type: "kfarrow",
                data: {
                    color: color,
                    label: label
                }
            });
            if (conn) {
                $('#' + fromId).on('$destroy', function () {
                    if (conn.detached !== true) {
                        try {
                            $scope.jsPlumb.detach(conn);
                        } catch (e) {
                            console.error(e);
                        }
                        conn.detached = true;
                    }
                });
                $('#' + toId).on('$destroy', function () {
                    if (conn.detached !== true) {
                        try {
                            $scope.jsPlumb.detach(conn);
                        } catch (e) {
                            console.error(e);
                        }
                        conn.detached = true;
                    }
                });
            }
        };

        $scope.clearAllConnections = function () {
            if ($scope.jsPlumb) {
                $scope.jsPlumb.detachEveryConnection();
            }
        };

        jsPlumb.ready(function () {
            $scope.jsPlumb = jsPlumb.getInstance();
            $scope.jsPlumb.setContainer($('#maincanvas'));


            $scope.jsPlumb.importDefaults({
                Connector: "Straight",
                Endpoints: ['Blank', 'Blank'],
                Overlays: [
                    ['Arrow', {
                        width: 7,
                        length: 7,
                        location: 1
                    }]
                ],
                Anchor: ['Perimeter', {
                    shape: 'Rectangle'
                }],
                PaintStyle: {
                    strokeWidth: 1,
                    stroke: 'rgba(180,180,180,0.7)'
                }
            });

            $scope.jsPlumb.registerConnectionTypes({
                "kfarrow": {
                    connector: "Straight",
                    endpoint: "Blank",
                    overlays: [
                        ['Arrow', {
                            width: 7,
                            length: 7,
                            location: 1
                        }],
                        ['Label', {
                            label: '${label}'
                        }]
                    ],
                    anchor: ['Perimeter', {
                        shape: 'Rectangle'
                    }],
                    paintStyle: {
                        stroke: "${color}",
                        strokeWidth: 1
                    }
                }
            });
            $scope.initialize();
        });

        /* ----------- creation --------- */


        /*
            This function
            - Creates a new note at given position.
            - If pos is not given, calls 'getNewElementPosition' to get new position of note
            - Opens the same for user to add content

            @params pos: object with x & y values for position of new note.
        */
        $scope.createNote = function (pos) {
            if (typeof (pos) === 'undefined') {
                pos = $scope.getNewElementPosition();
            }
            if (!$scope.isEditable()) {
                window.alert('You have no permission to edit this view.');
                return;
            }

            var w = null;
            if ($scope.isMobile()) {
                w = window.open('');
            }
            var mode = {};
            mode.permission = $scope.view.permission;
            mode.group = $scope.view.group;
            mode._groupMembers = $scope.view._groupMembers;

            $community.createNote(mode, function (note) {
                $scope.createContainsLink(note._id, pos);
                $scope.openContribution(note._id, null, w);
                $community.saveContainsLinktoITM($scope.view._id, note._id);
            });
        };

        /*
            This function is called when user calls create note from the right click menu
            It calls createNote with position of the right click
            @params $event : click event
        */
        $scope.createNoteFromRightClick = function ($event) {
            $scope.createNote({ x: $event.clientX - 100, y: $event.clientY - 100 });
        };

        $scope.createGoogleDoc = function (fromId) {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                //create google document
                var title = $('#gdoc_title').val();
                if (title === undefined || title === null || title.trim() === '') {
                    $scope.gmsgShow = true;
                    $scope.gstatusShow = false;
                    $scope.gmsg = "Title field cannot be left blank.";
                    return;
                }
                $scope.gmsgShow = false;
                $scope.gstatusShow = true;
                var coauthors = "";
                $('input[name="coauthors"]:checked').each(function () {
                    // if($(this).attr("valid") == 'yes'){
                    //     coauthors = coauthors + $(this).val() + ",";
                    // }
                    coauthors = coauthors + $(this).val() + ",";
                });
                if (coauthors !== "") {
                    coauthors = coauthors.substring(0, coauthors.length - 1);
                }
                var scaffolds = "";
                $('input[name="scaffolds"]:checked').each(function () {
                    scaffolds = scaffolds + $(this).val() + ",";
                });
                var dt = {};
                dt.title = title;
                dt.coauthors = coauthors;
                dt.scaffolds = scaffolds;
                dt.userName = $scope.community.author.userName;
                $http.post('/auth/googleFile/create', dt)
                    .success(function (result) {
                        $scope.gmsgShow = false;
                        $scope.gstatusShow = false;
                        $('#googleDoc_dialog').remove();
                        var docId = result.data.docId;
                        var w = null;
                        if ($scope.isMobile()) {
                            w = window.open('');
                        }
                        var mode = {};
                        mode.permission = $scope.view.permission;
                        mode.group = $scope.view.group;
                        mode.title = title;
                        mode.status = 'active';
                        mode.docId = docId;
                        mode.coauthors = dt.coauthors;
                        mode.createdBy = dt.userName;
                        mode.text4search = '( ' + title + ' )  (  )';
                        if (fromId !== '') {
                            $community.createNoteOn(mode, fromId, function (note) {
                                $scope.openContribution(note._id, null, w, function () {
                                });
                            });
                        }
                        else {
                            $community.createNote(mode, function (note) {
                                $scope.createGNoteContainsLink(note._id);
                                $scope.openContribution(note._id, null, w, function () {
                                });
                            });
                        }
                    }).error(function () {
                    });

            }
        };

        $scope.createGNoteContainsLink = function (noteId) {
            var link = {};
            link.from = viewId;
            link.to = noteId;
            link.type = "contains";
            link.data = $scope.getNewElementPosition();
            $http.post('/api/links/createGNoteLink', link).success(function (arg) {
            }).error(function (arg) {
            });
        };

        $scope.createDrawing = function () {
            if (!$scope.isEditable()) {
                window.alert('You have no permission to edit this view.');
                return;
            }

            var w = null;
            if ($scope.isMobile()) {
                w = window.open('');
            }
            $community.createDrawing(function (drawing) {
                $scope.createContainsLink(drawing._id, {
                    x: 100,
                    y: 100,
                    //width: 100,
                    //height: 100,
                    showInPlace: true
                });
                $scope.openContribution(drawing._id, null, w);
            });
        };

        $scope.viewAdded = function (view) {
            $scope.createContainsLink(view._id, $scope.getNewElementPosition());
            $scope.status.isViewManagerCollapsed = true;
        };

        $scope.createRiseabove = function (title) {
            var mode = {};
            mode.permission = $scope.view.permission;
            mode.group = $scope.view.group;
            mode._groupMembers = $scope.view._groupMembers;
            $community.createView('riseabove:', function (view) {
                $community.createNote(mode, function (note) {
                    note.title = title;
                    $community.makeRiseabove(note, view._id, function (note) {
                        $scope.createContainsLink(note._id, $scope.getNewElementPosition(), function () { });
                    });
                });
            }, true, mode);
        };

        $scope.getNewElementPosition = function () {
            var canvas = $('#maincanvas');
            var pos = {
                x: canvas.scrollLeft() + 10,
                y: canvas.scrollTop() + 10

            };
            var dimension = {
                width: 80,
                height: 40
            };
            var element = $scope.findOverlappedElement(pos, [], dimension);
            while (element) {
                pos.y = element.data.y + dimension.height;
                if (pos.y >= canvas.scrollTop() + window.innerHeight - 28 - dimension.height) {
                    pos.y = canvas.scrollTop() + 10;
                    pos.x = pos.x + dimension.width;
                    // If no free space found, return upper left corner of current window
                    if (pos.x >= canvas.scrollLeft() + window.innerWidth - 28 - dimension.width) {
                        return {
                            x: canvas.scrollLeft() + 10,
                            y: canvas.scrollTop() + 10
                        };
                    }
                }
                element = $scope.findOverlappedElement(pos, [], dimension);
            }
            return pos;
        };

        //Search through all elements in $scope.refs, find element that overlap at position pos
        //Ignore source elements
        $scope.findOverlappedElement = function (pos, sources, dimension) {
            var len = $scope.refs.length;
            for (var i = 0; i < len; i++) {
                var element = $scope.refs[i];
                if (sources.indexOf(element) === -1 && !$scope.isLocked(element) && $scope.overlap(element.data, pos, dimension)) {
                    return element;
                }
            }
            return null;
        };

        // Return whether two elements with dimension overlap or not
        $scope.overlap = function (pointA, pointB, dimension) {
            var upperLeftA = pointA;
            var upperLeftB = pointB;
            var bottomRightA = {
                x: upperLeftA.x + dimension.width,
                y: upperLeftA.y + dimension.height
            };
            var bottomRightB = {
                x: upperLeftB.x + dimension.width,
                y: upperLeftB.y + dimension.height
            };
            if (upperLeftA.x >= bottomRightB.x || bottomRightA.x <= upperLeftB.x) {
                return false;
            }
            if (upperLeftA.y >= bottomRightB.y || bottomRightA.y <= upperLeftB.y) {
                return false;
            }
            return true;
        };

        $scope.openModal = function () {

            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'RiseaboveCreationModal.html',
                controller: 'RiseaboveCreationCtrl',
                size: 'lg',
                appendTo: document
            });

            modalInstance.result.then(function (name) {
                $scope.createRiseabove(name);
            }, function () {
                //dismiss
            });
        };

        $scope.createViewlink = function () {
            if (!$scope.isEditable()) {
                window.alert('You have no permission to edit this view.');
                return;
            }
            $scope.status.isViewlinkCollapsed = !$scope.status.isViewlinkCollapsed;
        };

        $scope.createContainsLink = function (toId, data, handler) {
            $scope.createContainsLink0($scope.view._id, toId, data, handler);
        };

        $scope.createContainsLink0 = function (viewId, toId, data, handler) {
            $community.createLink(viewId, toId, 'contains', data, handler);
            $community.saveContainsLinktoITM(viewId, toId);
        };

        $scope.saveRef = function (ref) {
            $community.saveLink(ref);
        };

        $scope.openAttachment = function () {
            if (!$scope.isEditable()) {
                window.alert('You have no permission to edit this view.');
                return;
            }
            $scope.status.isAttachmentCollapsed = !$scope.status.isAttachmentCollapsed;
        };

        $scope.uploadFiles = function (files, x, y) {
            $scope.status.isAttachmentCollapsed = false;
            $scope.$apply();
            var $files = [];
            for (var i = 0; i < files.length; i++) {
                $files.push(files[i]);
            }
            if ($scope.status.onFileSelect) {
                $scope.status.onFileSelect($files, x, y);
            } else {
                //ERROR
            }
        };

        $scope.attachmentUploaded = function (attachment, x, y) {
            var newX = x ? x : 200;
            var newY = y ? y : 200;

            var w = 200,
                h = 200;
            if (attachment.data.type.indexOf("image/") >= 0) {
                w = attachment.data.width;
                h = attachment.data.height;
                if (w > 200) {
                    w = 200;
                }
                h = (w * h) / attachment.data.width;
            }

            $http.post('/api/links', {
                from: $scope.view._id,
                to: attachment._id,
                type: 'contains',
                data: {
                    x: newX,
                    y: newY,
                    width: w,
                    height: h
                }
            }).success(function (link) {
                $timeout(function () {
                    $scope.status.isAttachmentCollapsed = true;
                    $scope.$digest($scope.status.isAttachmentCollapsed);
                    if (attachment.data.type.indexOf("image/") >= 0) {
                        var ref = $scope.searchById($scope.refs, link._id);
                        $scope.contextTarget = ref;
                        $scope.contextTarget.data.showInPlace = true;
                        $scope.saveRef($scope.contextTarget);
                    }
                }, 500);
            });
        };

        $scope.urlDropped = function (url, x, y) {
            var mode = {};
            mode.permission = $scope.view.permission;
            mode.group = $scope.view.group;
            mode._groupMembers = $scope.view._groupMembers;
            mode.status = '';
            $community.createNote(mode, function (note) {
                note.title = url;
                note.status = 'active';
                note.data.body = '<html><head></head><body>';
                note.data.body += '<iframe style="width: 100%; height: 90%;" src="' + url + '"></iframe>';
                note.data.body += '<br>';
                note.data.body += '<p style="text-align: right;">' + '<a href="' + url + '" target="_blank">original page</a></p>';
                note.data.body += '</body></html>';
                $community.modifyObject(note, function (note) {
                    $scope.createContainsLink(note._id, { x: x, y: y });
                });
            });
        };

        $scope.openSearch = function () {
            var url = '/search/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.openHelp = function () {
            var url = '/help/';
            window.open(url, '_blank');
        };

        // $scope.openViewProperty = function() {
        //     var url = './contribution/' + viewId;
        //     window.open(url, '_blank');
        // };

        $scope.openWorkspace = function () {
            var author = $scope.community.author;
            if (!author) {
                window.alert('author has not loaded yet.');
                return;
            }
            if (author.data && author.data.workspaces) {
                $scope.openWorkspace0(author.data.workspaces[0]);
            } else {
                $scope.createWorkspace(author, function (workspace) {
                    $scope.openWorkspace0(workspace._id);
                });
            }
        };

        $scope.openScaffolds = function () {
            var url = '/scaffoldmanager/' + $scope.view.communityId;
            $scope.openInPopup(url)
        };

        $scope.openViewSetting = function () {
            var url = '/contribution/' + $scope.view._id;
            window.open(url, '_blank');
            $scope.status.isSettingCollapsed = true;
        };

        $scope.openCommunitySetting = function () {
            $community.getContext(null, function (context) {
                var url = '/contribution/' + context._id;
                window.open(url, '_blank');
                $scope.status.isSettingCollapsed = true;
            });
        };

        $scope.openAuthors = function () {
            var url = '/authormanager/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.openGroups = function () {
            var url = '/groupmanager/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.createWorkspace = function (author, handler) {
            var title = 'Espace de travail de ' + author.getName() ;
            $community.createView(title, function (view) {
                if (!author.data) {
                    author.data = {};
                }
                if (!author.data.workspaces) {
                    author.data.workspaces = [];
                }
                author.data.workspaces.push(view._id);
                $community.modifyObject(author, function () {
                    /* success */
                    if (handler) {
                        handler(view);
                    }
                }, function (err) {
                    /* error */
                    window.alert(JSON.stringify(err));
                    author.data.workspaces = undefined; /* roll back */
                });
            }, true, {
                    permission: 'private'
                });
        };

        $scope.openWorkspace0 = function (viewId) {
            var url = './view/' + viewId;
            $scope.openInPopup(url);
        };

        $scope.openAnalytics = function () {
            $scope.status.isAnalyticsCollapsed = !$scope.status.isAnalyticsCollapsed;
        };

        $scope.openPromisingIdeas = function () {
            var url = 'promisingideas/' + $scope.view.communityId + '§§§' + viewId;
            $scope.openInPopup(url);
        };

        $scope.openTagCloud = function () {
            $scope.openAnalytics();
            var url = 'wcloud/' + $scope.view._id;
            $scope.openInPopup(url);
        };

        $scope.openActivityDashboard = function () {
            $scope.openAnalytics();
            var url = 'dashboard/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.openNoteDashboard = function () {
            $scope.openAnalytics();
            var url = 'dashboard2/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.openS2viz = function () {
            $scope.openAnalytics();
            var url = 's2viz/' + $scope.view.communityId;
            window.open(url, '_blank');
        };

        $scope.openTimemachine = function () {
            $scope.openAnalytics();
            var url = 'timemachine/' + $scope.view._id;
            window.open(url, '_blank');
        };

        $scope.openLexicalAnalysis = function () {
            $scope.openAnalytics();
            var url = 'lexicalanalysis/' + $scope.view.communityId;
            $scope.openInPopup(url);
        };

        $scope.openScafoldSupportTracker = function () {
            $scope.openAnalytics();
            var url = 'scaffoldsupporttracker/' + $scope.view.communityId;
            $scope.openInPopup(url);
        };

        $scope.openStudentDictionary=function(){
            $scope.openAnalytics();
            var url = '/studentdictionary/' + $scope.view.communityId;
            window.open(url, '_blank');
        };


        $scope.openStats = function () {
            var url = '/stats/' + $scope.view.communityId;
            window.open(url, '_blank');
        };
        $scope.openAuthorNetwork = function () {
            $scope.openAnalytics();
            var url = 'authornetwork/' + $scope.view._id;
            window.open(url, '_blank');
        };

        $scope.doExit = function () {
            var url = '';
            $scope.gotoURL(url);
        };

        /* ----------- open window --------- */
        var openedContributions = [];
        $scope.openContribution = function (id, e, w, cb) {
            if (e) {
                if (e.ctrlKey === true || e.button !== 0) {
                    return;
                }
            }
            if (openedContributions[id] === true) {
                return;
            }
            $scope.modalIds = {};

            $scope.modalIds[id] = 'spelling-modal-' + new Date().getTime().toString();




            var url = 'contribution/' + id + '/' + viewId;
            $rootScope.contributionId = id;
            $rootScope.contextId = viewId;
            $rootScope.communityContext = $scope.context;
            if (w) {
                w.location.href = url;
                return;
            }
            if (!$kfutil.isMobile()) {
                openedContributions[id] = true;
                var availScreenWidth = window.innerWidth;
                var availScreenheight = window.innerHeight;

                var height = 530;
                var width = 900;
                if (availScreenWidth <= 960) {
                    width = 640;
                }
                else if (availScreenWidth < 1366 && availScreenWidth > 960) {
                    width = 750;
                }
                else if (availScreenWidth <= 1920 && availScreenWidth > 1366) {
                    width = 850;
                }
                else if (availScreenWidth > 1920) {
                    width = 1080;
                }
                var wmax = window.innerWidth * 0.8;
                if (width > wmax) {
                    width = wmax;
                }
                //Increasing height of tab from 0.8 to 0.9 times to view svgeditor witout scrolling
                var hmax = window.innerHeight * 0.9;
                if (height > hmax) {
                    height = hmax;
                }
                var wid = 'ctrb_window_' + id;
                var str = '<div id="' + wid + '"></div>';
                var str1 = '<div style="height: 100%;display:block; width:100%;float:left;" ng-include="\'app/contribution/contribution.html\'" ng-controller="ContributionCtrl"></div>';
                $('#windows').append(str);
                if (cb) {
                    $('#' + wid).append('<input type="hidden" id="openGEditor_' + id + '" value=""/>');
                }
                $('#' + wid).append(str1);
                $compile($('#' + wid).contents())($scope);
                $('#' + wid).dialog({
                    width: width,
                    height: height,
                    create: function () {
                        $(this).css('padding', '1px');
                        //var contentWindow = document.getElementById(wid).contentWindow;
                        // contentWindow.wid = wid;
                        window.openContribution = function (id) {
                            return $scope.openContribution(id);
                        };
                        window.setInternalWindowTitle = function (title) {
                            $('#' + wid).dialog('option', 'title', title);
                        };
                    },
                    open: function () {
                        var iwnd = $(this).parent();
                        var x = iwnd.offset().left;
                        var y = iwnd.offset().top;
                        var offsetLeft = frames.length * 20;
                        var offsetTop = frames.length * 20;
                        var sideToSideNotePosition = $community.isPluginEnabled("sideToSideNotePosition");
                        if (sideToSideNotePosition) {
                            var reduceTop = 55;
                            y = iwnd.offset().top - reduceTop;
                            offsetLeft = frames.length * 0;
                            offsetTop = (frames.length * (90 + reduceTop));
                        }
                        iwnd.offset({
                            left: x + offsetLeft,
                            top: y + offsetTop
                        });
                        frames.push(wid);
                    },
                    drag: function () {
                        _.remove(frames, function (n) {
                            return n === wid;
                        });
                    },
                    beforeClose: function (e, ui) {
                        if ($scope.dirtyContribution[id]) {
                            var r = window.confirm("Vous avez des changements non enregistrés!\nLes modifications seront perdues si vous ne les contribuez pas!\nÊtes-vous sûr de partir? (Vous perdrez tous les changements!)");
                            if (r !== true) {
                                e.preventDefault();
                            }
                        }
                    },
                    close: function () { /*we need to erase element*/
                        _.remove(frames, function (n) {

                            return n === wid;
                        });
                        delete openedContributions[id];
                        $(this).remove();
                        $("div.mce-tinymce.mce-tinymce-inline.mce-container").css("display", "none");
                        // $scope.updateCanvas();
                    }
                });
            } else {
                window.open(url);
            }
        };

        $scope.openView = function (id) {
            var url = 'view/' + id;
            $scope.gotoURL(url);
        };

        $scope.mOpenContribution = function () {
            $scope.openContribution($scope.contextTarget.to);
        };

        $scope.mOpenContributionInTab = function () {
            var url = 'contribution/' + $scope.contextTarget.to + '/' + viewId;
            window.open(url, '_blank');
        };

        $scope.mOpenContributionInPopup = function () {
            var url = 'contribution/' + $scope.contextTarget.to + '/' + viewId;
            $scope.openInPopup(url);
        };

        $scope.mOpenView = function () {
            $scope.openView($scope.contextTarget.to);
        };

        $scope.mOpenViewInInternal = function () {
            var url = 'view/' + $scope.contextTarget.to;
            $scope.openByInternalWindow(url);
        };

        $scope.mOpenViewInPopup = function () {
            var url = 'view/' + $scope.contextTarget.to;
            $scope.openInPopup(url);
        };

        $scope.gotoURL = function (url) {
            $location.path(url);
        };

        $scope.openInPopup = function (url) {
            var width = screen.width * 0.5;
            var height = screen.height * 0.8;
            var w = window.open(url, '_blank', 'width=' + width + ',height=' + height);
            if (w) {
                w.moveTo(100, 100);
            } else {
                window.alert('Failed to open popup on your browser. (You may open the second time on safari.)');
            }
        };

        var windowIdNum = 1;

        $scope.openByInternalWindow = function (url) {
            var width = 650;
            var height = 410;
            var wmax = window.innerWidth * 0.8;
            if (width > wmax) {
                width = wmax;
            }
            var hmax = window.innerHeight * 0.8;
            if (height > hmax) {
                height = hmax;
            }
            return $scope.openByIFrame(url, width, height);
            //$scope.openInternally(url, width, height);
        };

        // now investigating
        // $scope.openInternally = function(url, width, height) {
        //     windowIdNum++;
        //     var wid = 'window' + windowIdNum;
        //     var str = '<div id="' + wid + '">CONTENT</div>';
        //     var content = '<ng-include src="\'app/contribution/contribution.html\'" ng-controller="ContributionCtrl"></ng-include>';
        //     str = str.replace('CONTENT', content);
        //     $('#windows').append(str);
        //     $('#' + wid).css('position', 'absolute');
        //     $('#' + wid).css('width', '200px');
        //     $('#' + wid).css('height', '200px');
        //     $('#' + wid).css('border', '1px solid black');
        //     $('#' + wid).css('pointer-events', 'auto');
        //     $compile($('#' + wid).contents());
        //     $('#' + wid).resizable();
        // }

        var frames = [];

        $scope.openByIFrame = function (url, width, height) {
            windowIdNum++;
            var wid = 'window' + windowIdNum;
            var str = '<iframe style="min-width: 100%;" id="' + wid + '" title="*" src="' + url + '"></iframe>';
            $('#windows').append(str);
            $('#' + wid).dialog({
                width: width,
                height: height,
                create: function () {
                    $(this).css('padding', '1px');
                    var contentWindow = document.getElementById(wid).contentWindow;
                    contentWindow.wid = wid;
                    contentWindow.openContribution = function (id) {
                        return $scope.openContribution(id);
                    };
                    contentWindow.setInternalWindowTitle = function (title) {
                        $('#' + wid).dialog('option', 'title', title);
                    };
                },
                open: function () {
                    var iwnd = $(this).parent();
                    var x = iwnd.offset().left;
                    var y = iwnd.offset().top;
                    var offset = frames.length * 20;
                    iwnd.offset({
                        left: x + offset,
                        top: y + offset
                    });
                    frames.push(wid);
                },
                drag: function () {
                    _.remove(frames, function (n) {
                        return n === wid;
                    });
                },
                close: function () { /*we need to erase element*/
                    _.remove(frames, function (n) {
                        return n === wid;
                    });
                    $(this).remove();
                }
            });
            return wid;
        };

        /* ----------- context menu --------- */

        $scope.canvasMenuOpen = function () {
            if ($rootScope.clipboardData !== undefined) {
                $scope.canvasMenu = true;
            } else {
                $scope.canvasMenu = false;
            }
        };

        $scope.onContextOpen = function (childScope) {
            $scope.contextTarget = childScope.ref;

            if ($scope.context.data.freemode) {
                $scope.isDeletable = true;
                return;
            }

            var selected = $scope.getSelectedModels();
            var result = true;
            var author = $scope.community.author._id;
            if ($scope.community.author.role === 'manager') {
                result = true;
            } else {
                selected.some(function (ref) {
                    if (ref._to.authors.indexOf(author) < 0) {
                        result = false;
                        return true;
                    }
                });
            }
            $scope.isDeletable = result;
        };

        //added by Yoshiaki for note reference
        //this code should be incorporated with the code of datatransfer (view.js:193)
        window.addEventListener("copy", function (e) {
            if ($kfutil.isIE()) {// does not support
                return;
            }

            if ($kfutil.isiOS()) {
                //do nothing
            } else {
                var hrefs = createNoteReferenceString();
                var dt = (e.clipboardData) || (window.clipboardData);
                dt.setData('text/html', hrefs);
                //dt.setData('text/plain', hrefs);
                e.stopPropagation();
                e.preventDefault();
            }
        });

        function createNoteReferenceString() {
            var models = $scope.getSelectedModels();
            var hrefs = '';
            models.forEach(function (each) {
                var tag = $kftag.createNewReferenceTag(each.to, each._to.title, each._to.authors, "");
                hrefs += tag;
            });
            return hrefs;
        }

        $scope.copy2Clipboard = function () {
            if ($kfutil.isiOS()) {//added by Yoshiaki for ios
                var noteRefStr = createNoteReferenceString();
                $kfutil.copyClipboardOniOS(noteRefStr);
            }
            document.execCommand("copy");//added by Yoshiaki for note reference

            $rootScope.clipboardData = $scope.contextTarget._id;
            window.alert("La note a été copiée dans le presse-papiers.");
        };

        $scope.pasteNote = function (e) {
            //get noteid from copy board and then create a new note from this note
            var clipboardData = $rootScope.clipboardData;
            $http.get('/api/links/' + clipboardData).success(function (link) {
                var data = {};
                data.x = e.clientX - 30;
                data.y = e.clientY - 34;
                if (link.data) {
                    if (link.data.width) {
                        data.width = link.data.width;
                    }
                    if (link.data.height) {
                        data.height = link.data.height;
                    }
                    if (link.data.showInPlace) {
                        data.showInPlace = link.data.showInPlace;
                    }
                }
                $scope.createContainsLink(link.to, data);
            });
        };

        $scope.importNoteFromGoogle = function (e) {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                //get document list from google drive folder "kf6"
                if ($('#importGoogleDoc_dialog').length) {
                    return;
                }
                var pos = {};
                pos.x = e.clientX - 30;
                pos.y = e.clientY - 34;
                var dt = {};
                dt.userName = $scope.community.author.userName;
                $http.post('/auth/googleFile/list', dt)
                    .success(function (result) {
                        var str = '<div id="importGoogleDoc_dialog"><div class="head_area"><label>Import note From Google Drive</label></div>';
                        str += '<div class="table_head"><div class="column_op"></div><div class="column_ct">Create Time</div><div class="column_fn">File Name</label></div></div>';
                        str += '<div id="file_list_area">';
                        var files = result.data.files;
                        for (var i = 0; i < files.length; i++) {
                            str += '<div class="table_row"><div class="column_op"><input type="radio" name="driveFile" value="' + files[i].id + '"></div><div class="column_ct" >' + files[i].createdTime.substring(0, 16).replace('T', ' ') + '</div><div class="column_fn" id="fileTitle_' + files[i].id + '">' + files[i].name + '</div></div>';
                        }
                        str += '</div>';
                        if (result.data.nextPageToken) {
                            str += '<div id="page_area" class="page_area"><button class="btn btn-primary kfbutton" ng-click="nextPage(\'' + result.data.nextPageToken + '\')">Next Page</button></div>';
                        }
                        str += '<div class="button_area" style="width:70%; float:right;">';
                        str += '<div ng-show="iptstatusShow" class="gstatus_area"><img src="manual_assets/kf6images/loading_small.gif"/>Creating your note ...</div><div ng-show="iptmsgShow" class="gmsg_area">{{iptmsg}}</div><button class="btn btn-primary kfbutton" ng-click="createNoteFromGoogleDoc(' + pos.x + ',' + pos.y + ')">Import</button>';
                        str += '</div></div>';
                        $('#windows').append(str);
                        $compile($('#importGoogleDoc_dialog').contents())($scope);
                        $('#importGoogleDoc_dialog').dialog({
                            width: 500,
                            modal: true,
                            //height: 400,
                            create: function () {
                                $(this).css('padding', '1px');
                            },
                            open: function () {
                            },
                            drag: function () {
                            },
                            close: function () { /*we need to erase element*/
                                $scope.iptmsgShow = false;
                                $scope.iptstatusShow = false;
                                $(this).remove();
                            }
                        });
                    })
                    .error(function () {
                    });
            }
        };

        $scope.createNoteFromGoogleDoc = function (x, y) {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                //create google document
                var docId = $('#importGoogleDoc_dialog input[name="driveFile"]:checked:enabled').val();
                if (docId === undefined || docId === null) {
                    $scope.iptmsgShow = true;
                    $scope.iptstatusShow = false;
                    $scope.iptmsg = "Please select one of your documents.";
                    return;
                }
                var title = $('#importGoogleDoc_dialog #fileTitle_' + docId).html();
                $scope.iptmsgShow = false;
                $scope.iptstatusShow = true;
                var dt = {};
                dt.docId = docId;
                dt.userName = $scope.community.author.userName;
                $http.post('/auth/googleFile/importFromDrive', dt)
                    .success(function (result) {
                        $scope.iptmsgShow = false;
                        $scope.iptstatusShow = false;
                        $('#importGoogleDoc_dialog').remove();
                        var mode = {};
                        mode.permission = $scope.view.permission;
                        mode.group = $scope.view.group;
                        mode.title = title;
                        mode.status = 'active';
                        mode.docId = dt.docId;
                        mode.body = result.data.body;
                        mode.createdBy = dt.userName;
                        mode.text4search = '( ' + title + ' )  (  )';

                        $community.createNote(mode, function (note) {
                            var pos = {};
                            pos.x = x;
                            pos.y = (y <= 50 ? 55 : y);
                            $scope.createContainsLink(note._id, pos);
                        });

                    }).error(function () {
                    });
            }

        };

        $scope.nextPage = function (nextPageToken) {
            var dt = {};
            dt.userName = $scope.community.author.userName;
            dt.pageToken = nextPageToken;
            $http.post('/auth/googleFile/list', dt)
                .success(function (result) {
                    $('#importGoogleDoc_dialog #file_list_area').html("");
                    var files = result.data.files;
                    for (var i = 0; i < files.length; i++) {
                        $('#importGoogleDoc_dialog #file_list_area').append('<div class="table_row"><div class="column_op"><input type="radio" name="driveFile" value="' + files[i].id + '"></div><div class="column_ct" >' + files[i].createdTime.substring(0, 16).replace('T', ' ') + '</div><div class="column_fn" id="fileTitle_' + files[i].id + '">' + files[i].name + '</div></div>');
                    }
                    if (result.data.nextPageToken) {
                        if ($('#importGoogleDoc_dialog #page_area').length) {
                            $('#importGoogleDoc_dialog #page_area').html('<button class="btn btn-primary kfbutton" ng-click="nextPage(\'' + result.data.nextPageToken + '\')">Next Page</button>');
                        }
                        else {
                            $('#importGoogleDoc_dialog').append('<div id="page_area" class="page_area"><button class="btn btn-primary kfbutton" ng-click="nextPage(\'' + result.data.nextPageToken + '\')">Next Page</button></div>');
                        }

                        $compile($('#importGoogleDoc_dialog').contents())($scope);
                    }
                })
                .error(function () {
                });
        };

        $scope.drawOnImage = function () {
            if (!$('#drawingEditor').length) {
                //create new equatio Editor
                var str = '<div id="drawingEditor" class="drawingEditor">';
                str += '<input type="hidden" name="targetImage" value=""/>';
                str += '<iframe style="display: block;" id="svg-drawing" height="500px" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgDrawingInitialized();"></iframe>';
                str += '<div class="drawing-btn-area"><span id="drawing_cancel" class="drawing-btn" title="Close">Cancel</span>';
                str += '<span id="drawing_save" class="drawing-btn" title="Save as image">Save</span></div>';
                str += '</div>';
                str += '<canvas id="export_canvas"></canvas>';
                str += '<div id="drawing_overlay" class="ui-widget-overlay ui-front" style="z-index: 102;"></div>';
                $('body').append(str);
                $('#drawing_cancel').bind("click", function () {
                    $('#drawingEditor').css("display", "none");
                    $('#drawing_overlay').css("display", "none");
                    // Hide the canvas used to save the new image after saving
                    $("#export_canvas").css("display", "none");
                });
                $('#drawingEditor input[name=targetImage]').val($scope.contextTarget.contribution.data.url);
            } else {
                $('#drawingEditor input[name=targetImage]').val($scope.contextTarget.contribution.data.url);
                onSvgDrawingInitialized();
            }
            $('#drawing_save').unbind("click");
            $('#drawing_save').bind("click", function () {
                //save new image to contribution
                //Create the new image using canvas
                var svgCanvas = document.getElementById('svg-drawing').contentWindow.svgCanvas;
                var c = document.getElementById('export_canvas');
                c.width = svgCanvas.contentW;
                c.height = svgCanvas.contentH;
                var str = svgCanvas.svgCanvasToString();
                canvg(c, str, {
                    renderCallback: function () {
                        var canvas = document.getElementById("export_canvas");
                        var img = canvas.toDataURL($scope.contextTarget.contribution.data.type);
                        var file = {};
                        file.communityId = $scope.contextTarget.communityId;
                        file._id = $scope.contextTarget.contribution._id;
                        file.name = $scope.contextTarget.contribution.data.filename;
                        file.version = $scope.contextTarget.contribution.data.version + 1;
                        file.type = $scope.contextTarget.contribution.data.type;
                        $http.post('/api/upload/newImage', {
                            data: img,
                            file: file
                        }).success(function (result) {
                            $scope.contextTarget.contribution = result;
                            $('#drawing_cancel').trigger("click");
                        });

                    }
                });
            });
            $('#drawing_overlay').css("display", "block");
            $('#drawingEditor').css("display", "block");

        };


        $scope.showAsIcon = function () {
            $scope.contextTarget.data.showInPlace = false;
            $scope.saveRef($scope.contextTarget);
        };

        $scope.showInPlace = function () {
            $scope.contextTarget.data.showInPlace = true;
            $scope.saveRef($scope.contextTarget);
        };

        $scope.softfix = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                window.alert('ERROR: no reference on fix/unfix');
                return;
            }
            if (!$scope.isSoftfixable(ref)) {
                window.alert('You are not able to fix this object.');
                return;
            }

            ref.data.draggable = false;
            $scope.saveRef(ref);
            $scope.clearSelection();
        };
        $scope.unSoftfix = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                window.alert('ERROR: no reference on fix/unfix');
                return;
            }
            if (!$scope.isUnSoftfixable(ref)) {
                window.alert('You are not able to unfix this object.');
                return;
            }
            ref.data.draggable = true;
            $scope.saveRef(ref);
        };
        $scope.isSoftfixable = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                return false;
            }
            return (ref.data.draggable === undefined || ref.data.draggable) && $scope.isEditable();
        };
        $scope.isUnSoftfixable = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                return false;
            }

            var locked = ref.data.draggable;
            return locked !== undefined && !locked;
        };
        $scope.fix = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                window.alert('ERROR: no reference on lock/unlock');
                return;
            }
            if (!$scope.isFixable(ref)) {
                window.alert('You are not able to lock this object.');
                return;
            }
            ref.data.fixed = true;
            ref.data.draggable = false;
            $scope.saveRef(ref);
            $scope.clearSelection();
        };
        $scope.unfix = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                window.alert('ERROR: no reference on lock/unlock');
                return;
            }
            if (!$scope.isUnfixable(ref)) {
                window.alert('You are not able to unlock this object.');
                return;
            }
            ref.data.fixed = false;
            ref.data.draggable = true;
            $scope.saveRef(ref);
        };
        $scope.isFixable = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                return false;
            }

            if ($community.amIAuthor(ref) || $community.getAuthor().role === 'manager') {
                return (ref.data.draggable === undefined || ref.data.draggable) && $scope.isEditable();
            } else {
                return false;
            }
        };
        $scope.isUnfixable = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                return false;
            }
            if (!ref.data.fixed) {
                return false;
            }
            return !$scope.isLocked(ref) || $scope.hasLockControl();
        };
        $scope.fixAndLock = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                window.alert('ERROR: no reference on fix/unfix');
                return;
            }
            if (!$scope.isFixable(ref)) {
                window.alert('You are not able to fix this object.');
                return;
            }
            if (!$scope.isLockable(ref)) {
                window.alert('You are not able to lock this object.');
                return;
            }
            ref.data.fixed = true;
            ref.data.locked = true;
            $scope.saveRef(ref);
            $scope.clearSelection();
        };
        $scope.isLockable = function () {
            return $scope.hasLockControl();
        };
        $scope.hasLockControl = function () {
            return $ac.isManager() || $community.amIAuthor($scope.view);
        };
        $scope.newRefClass = function (ref) {
            var newRefInterval = 1000 * 60; // 60 seconds
            var now = new Date();
            var created = new Date(ref.created);
            if (created.valueOf() > now.valueOf() - newRefInterval) {
                return 'kfNewRef';
            } else {
                return '';
            }
        };

        $scope.isLocked = function (ref) {
            if (!ref) {
                ref = $scope.contextTarget;
            }
            if (!ref) {
                return false;
            }
            return ref.data.fixed;
        };

        $scope.newRefClass = function (ref) {
            var newRefInterval = 1000 * 60; // 60 seconds
            var now = new Date();
            var created = new Date(ref.created);
            if (created.valueOf() > now.valueOf() - newRefInterval) {
                return 'kfNewRef';
            } else {
                return '';
            }
        };

        // $scope.hasLockControl = function () {
        //     return $community.amIAuthor($scope.view);

        // };

        $scope.delete = function (ref) {
            var selected = $scope.getSelectedModels();
            var confirmation = window.confirm('Êtes-vous sûr de supprimer' + selected.length + ' objet(s)?');
            if (!confirmation) {
                return;
            }

            selected.forEach(function (each) {
                $http.delete('/api/links/' + each._id+"?userAction=true").success(function (results) {
                    if (results) {
                        results.forEach(function (result) {
                            console.log(result);
                            $scope.createContainsLink(result.to,
                                {
                                    x: each.data.x + result.data.x - 70,
                                    y: each.data.y + result.data.y - 70
                                }, function () { });
                        });
                    }
                });
            });
        };

        $scope.createRiseaboveFromContextMenu = function () {
            var selected = $scope.getSelectedModels();
            var confirmation = window.confirm('Etes-vous sûr de créer des risea-dessus en utilisant le ' + selected.length + ' objet(s)?');
            if (!confirmation) {
                return;
            }
            var topleft = {
                x: 10000,
                y: 10000
            };
            selected.forEach(function (ref) {
                topleft.x = Math.min(topleft.x, ref.data.x);
                topleft.y = Math.min(topleft.y, ref.data.y);
            });
            var mode = {};
            mode.permission = $scope.view.permission;
            mode.group = $scope.view.group;
            mode._groupMembers = $scope.view._groupMembers;
            $community.createView('riseabove:', function (view) {
                $community.createNote(mode, function (note) {
                    note.title = 'Élever-le-propos ';
                    $community.makeRiseabove(note, view._id, function (note) {
                        $scope.createContainsLink(note._id, {
                            x: topleft.x + 50,
                            y: topleft.y + 50
                        }, function () {
                            selected.forEach(function (each) {
                                $scope.createContainsLink0(view._id, each.to, {
                                    x: each.data.x - topleft.x + 20,
                                    y: each.data.y - topleft.y + 20
                                }, function () {
                                    $http.delete('/api/links/' + each._id);
                                });
                            });
                        });
                    });
                });
            }, true, mode);
        };

    });


function closeDialog(wid) {
    $('#' + wid).dialog('close');
}

angular.module('kf6App')
    .controller('RiseaboveCreationCtrl', function ($scope, $modalInstance) {
        $scope.name = '';
        $scope.ok = function () {
            if (!$scope.name || $scope.name.length === 0) {
                window.alert('Veuillez saisir un nom..');
                return;
            }
            $modalInstance.close($scope.name);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
