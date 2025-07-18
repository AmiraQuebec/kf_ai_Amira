'use strict';

angular.module('kf6App')
    .controller('SearchCtrl', function($scope, $http, $community, $stateParams, $kfutil, $ac, $kftag) {
        var communityId = $stateParams.communityId;

        $community.enter(communityId, function () {}, function () {
            $community.refreshMembers();
            $community.refreshRegisteredScaffolds(function () {
                $scope.scaffolds = $community.getCommunityData().registeredScaffolds;
                $scope.memberList = $community.getMembers();
            });
            // Get the status of user anonymous plugin
            $community.getContext(null, function(context){
                // if userNames are to be hidden is set true in community settings.
                $scope.context = context;
                $scope.hideUserNameInAuthorSelector = context.data.hideUserNameInAuthorSelector;
                initQuerySearchWrapperForAnonymousPlugin(); // make sure the usernames are hidden in querysearch too
            });
        });
        // $community.refreshMembers();
        $community.refreshViews(function() {
            $scope.views = $community.getViews();
        });
        $scope.community = $community.getCommunityData();
        $scope.communityMembers = $scope.community.membersArray;

        $kfutil.mixIn($scope);
        $ac.mixIn($scope);

        //Query String
        $scope.queryString = '';
        $scope.selected = {}; //currently using only for views
        $scope.selected.views = [];

        //General Status
        $scope.status = {};
        $scope.status.detailCollapsed = true;
        $scope.status.status = 'init';
        $scope.markFlag = true;
        $scope.selected.scaffoldsupports=[];
        $scope.showScaffoldClicked=false;
        $scope.filterNotesByScaffold = function (selectedSupports) {
        $scope.filteredNotedIds=[];
        selectedSupports.forEach (function (support){
            if($scope.scaffoldTypesMap[support._to.title]){
                $scope.scaffoldTypesMap[support._to.title].forEach(function(noteId){
                    $scope.filteredNotedIds.push(noteId);
                });
            }
        });
        $scope.showScaffold();
        };

        $scope.hideNoteByScaffold = function (noteId){
            if($scope.selected.searchType.type === 'notes'){
            if( $scope.filteredNotedIds &&  $scope.selected.scaffoldsupports.length >0){
                return !$scope.filteredNotedIds.includes(noteId);
            }else{
                return false;
            }
        }
            return false;
        };

        $scope.getscaffoldlinOnly = function(flag,notedata){
            if(flag)
            {
            return notedata;
            }
            else{
            var tempScaffoldNames=[];
            $scope.selected.scaffoldsupports.forEach(function (element) {
                tempScaffoldNames.push(element._to.title);
            });
            var wrapper= document.createElement('div');
            wrapper.innerHTML=notedata;
            var mynote=wrapper.innerHTML;
            var formatedNoteBody="";
            var tempNoteBody;
            tempScaffoldNames.forEach(function(support){
                tempNoteBody=[];
                if(mynote.indexOf(support)>0){
                   tempNoteBody[support]='<p><br>&nbsp;&nbsp;<span class="KFSupportStart mceNonEditable"> <span class="kfSupportStartMark"> &nbsp; </span> <span class="kfSupportStartLabel">'+mynote.slice(mynote.indexOf(support),mynote.length);
                }
                if(tempNoteBody[support] && tempNoteBody[support].length>formatedNoteBody.length){
                    formatedNoteBody=tempNoteBody[support];
                }
            });
            return formatedNoteBody;
        }
        };

        $scope.filterNotesByScaffold = function (selectedSupports) {
        $scope.filteredNotedIds=[];
        selectedSupports.forEach (function (support){
            if($scope.scaffoldTypesMap[support._to.title]){
                $scope.scaffoldTypesMap[support._to.title].forEach(function(noteId){
                    $scope.filteredNotedIds.push(noteId);
                });
            }
        });
        };

        $scope.hideNoteByScaffold = function (noteId){
            if($scope.selected.searchType.type === 'notes'){
            if( $scope.filteredNotedIds &&  $scope.selected.scaffoldsupports.length >0){
                return !$scope.filteredNotedIds.includes(noteId);
            }else{
                return false;
            }
        }
            return false;
        };


        $scope.reset = function(){
            $scope.queryString = '';
            $scope.markFlag = true;
            if($scope.status.status !== 'init'){
                // $scope.selected = {}; //currently using only for views
                $scope.selected.views = [];
            }


            //General Status
            $scope.status = {};
            $scope.status.detailCollapsed = true;
            $scope.status.status = 'init';
            $scope.selected.scaffoldsupports=[];
        };

        //Pager Status
        $scope.pager = {};
        $scope.pager.getStart = function() {
            return (($scope.pager.page - 1) * $scope.pager.pagesize) + 1;
        };
        $scope.pager.getEnd = function() {
            var end = $scope.pager.getStart() + $scope.pager.pagesize - 1;
            if (end > $scope.pager.total) {
                end = $scope.pager.total;
            }
            return end;
        };
        $scope.pager.pagesize = 50;

        //results
        $scope.contributions = [];
        $scope.displayExtraInfo = false;

        $http.post('/api/links/' + communityId + '/search', { query: { type: 'supports' } }).success(function(links) {
            $scope.scaffoldLinks = links;
            createTableData();
            $scope.scaffoldTypesMap = [];

            $scope.scaffoldLinks.forEach(function (link) {
                if(link._to.status ==='active'){
                if ($scope.scaffoldTypesMap[link._from.title]) {
                    $scope.scaffoldTypesMap[link._from.title].push(link.to);
                } else {
                    $scope.scaffoldTypesMap[link._from.title] = [];
                    $scope.scaffoldTypesMap[link._from.title].push(link.to);
                }
            }
            });


        });

        $http.post('/api/links/' + communityId + '/search', { query: { type: 'contains' } }).success(function(links) {
            $scope.viewLinks = links;
            createTableData();
        });

        $http.post('/api/links/' + communityId + '/search', { query: { type: 'buildson' } }).success(function(links) {
            $scope.buildonLinks = links;
            createTableData();
        });

        $http.post('/api/links/' + communityId + '/search', { query: { type: 'read' } }).success(function(links) {
            $scope.readLinks = links;
            createTableData();
        });


        //Search Type
        $scope.searchTypeList=[
            {
                title:"Everything",
                type:"main_search"
            },
            {
                title:"Notes",
                type:"notes"
            },
            {
                title:"Annotation",
                type:"annotation"
            },
            {
                title:"Views",
                type:"view"
            }
        ];

        $scope.selected.searchType = $scope.searchTypeList[1];


        //Search Input Press Enter Function.
        $scope.searchWithEnterKey = function(keyEvent) {
            if (keyEvent.which === 13)
            { $scope.search();}
        };

        $scope.search = function() {
            $scope.showScaffoldClicked=false;
            /* ------------------------------ To filter the searched author --------------------------- */
            if($scope.selected.searchType.type === 'students')
            {
                $scope.filteredAuthList = [];
                $scope.queryStringForStudent = $scope.queryString;
                $scope.memberList = [];
                $scope.memberList = $community.getMembers();
                var tokens = $scope.queryStringForStudent.split(' ');
                tokens.forEach(function(token) {
                    if (token.indexOf('-author:') >= 0) {
                        token = token.replace('-author:', '');
                        var author = _.find($scope.communityMembers, {
                            userName: token
                        });
                        if (author) {
                            $scope.filteredAuthList.push(author._id);
                        } else {
                            window.alert('author:' + token + ' not found');
                        }
                    }
                });
                $scope.queryString = '';
                $scope.addPrivateMode();

            }
            /* ------------------------------ To filter the searched author --------------------------- */
            $scope.pager.query = makeQuery($scope.queryString);
            $scope.queryStringHolder = $scope.pager.query.words;
            $scope.status.detailCollapsed = true;
            count();
        };

        $scope.pageChanged = function() {
            openPage();

        };
        function count() {
            $scope.status.status = 'searching';
            $http.post('/api/contributions/' + communityId + '/search/count', {
                query: $scope.pager.query,
                searchType: $scope.selected.searchType
            }).success(function(result) {
                $scope.filteredObjectIDs = result.filteredObjectIDs;
                var count = result.filteredObjectIDs.length;
                $scope.pager.total = count;
                $scope.pager.page = 1;
                openPage();

            }).error(function() {
                $scope.status.status = 'error';
            });
        }

        /// Hide scaffold show in the body of the notes when show scaffold is clicked
        $scope.hidescaffold = function () {
            $scope.showScaffoldClicked = false;
            createTableData();
            createStudentTable();
        };

        // highlight searched Terms in Results. Used mark.js
        // This function is called on each Page.
        $scope.highlighter = function (e) {
            $scope.markFlag = e;
            var lighterSettings = {
                // options : {},
                options : {"separateWordSearch": false},
                keywords: $scope.queryStringHolder,
                context : document.querySelectorAll(".search_body")
                };
            var instance;

            // This line is ignored in Jhint.
            instance =  new Mark(lighterSettings.context);// jshint ignore:line

            instance.unmark({
                done: function () {
                    if(e) {
                    instance.mark(lighterSettings.keywords, lighterSettings.options);
                    }
                }
            });
        };


        function openPage() {
            $scope.status.status = 'searching';
            $scope.pager.query.pagesize = $scope.pager.pagesize;
            $scope.pager.query.page = $scope.pager.page;
            var startPoint = ($scope.pager.pagesize * ($scope.pager.page - 1));
            var endPoint = ($scope.pager.pagesize * $scope.pager.page );
            var rangeOfID = $scope.filteredObjectIDs.slice(startPoint,endPoint);
            $scope.pager.query.rangeOfID = rangeOfID;

            $http.post('/api/contributions/' + communityId + '/search', {
                query: $scope.pager.query
            }).success(function(contributions) {
                var ids = [];
                contributions.forEach(function(c) {
                    ids.push(c._id);
                    if (!$ac.isReadable(c)) {
                        c.title = 'forbidden';
                        c.authors = [];
                        c.data.body = '(forbidden)';
                        c.created = null;
                    }
                });
                $scope.contributions = contributions;
                if (contributions.length > 0) {
                    $scope.status.status = 'searched';

                } else {
                    $scope.status.status = 'noresult';
                }
                $http.post('/api/records/search/' + communityId , { query: {targetId:{$in:ids}, type: 'modified' } }).success(function(links) {
                    $scope.modifiedLinks = links;
                    createTableData();
                    createStudentTable();
                });
            }).error(function() {
                $scope.status.status = 'error';
            });

        }

        function getNotesCreated(author){
            $scope.notesCreated = [];
            $scope.contributions.forEach(function(each) {
                each.authors.forEach(function (auth) {
                    if(auth === author){
                        if(each.type === 'Note'){
                            $scope.notesCreated.push(each._id);
                        }
                    }

                });
            });
            return $scope.notesCreated;
        }

        function getNotesModified(author){
            $scope.notesModified = {};
            $scope.modifiedLinks.forEach(function(link) {
                if(link.authorId ===  author  && $scope.contributionsMap[link.targetId].type === 'Note' && $scope.contributionsMap[link.targetId].authors.indexOf(link.authorId) === -1 ){
                    $scope.noteIdList = [];
                    if($scope.contributionsMap[link.targetId].authors[0] in $scope.notesModified){
                        $scope.noteIdList = $scope.notesModified[$scope.contributionsMap[link.targetId].authors[0]];
                    }
                    if($scope.noteIdList.indexOf(link.targetId) === -1){
                        $scope.noteIdList.push(link.targetId);
                    }

                    $scope.notesModified[$scope.contributionsMap[link.targetId].authors[0]] = $scope.noteIdList;
                }
            });
            return $scope.notesModified;
        }
        function getNotesRead(author){
            $scope.notesRead = {};
            $scope.readLinks.forEach(function(link) {
                if(link._to.type === 'Note' && link.from === author){
                    link._to.authors.forEach(function (auth) {
                        if(auth !== author){
                            $scope.noteIdList = [];
                            if(auth in $scope.notesRead){
                                $scope.noteIdList = $scope.notesRead[auth];
                            }
                            $scope.noteIdList.push(link.to);
                            $scope.notesRead[auth]=$scope.noteIdList;
                        }
                    });

                }

            });
            return $scope.notesRead;
        }

        function getNotesBuildOn(key) {
            $scope.notesBuildOn = {};
            $scope.buildonLinks.forEach(function(link) {
               if(link._from.status === 'active' && link._to.status === 'active' && link._from.authors.indexOf(key) > -1){
                   link._to.authors.forEach(function (auth) {
                       $scope.noteIdList = [];
                       if(auth in $scope.notesBuildOn){
                           $scope.noteIdList = $scope.notesBuildOn[auth];
                       }
                       $scope.noteIdList.push(link.to);
                       $scope.notesBuildOn[auth] = $scope.noteIdList;
                   });
               }
            });
            return $scope.notesBuildOn;
        }

        function getNotesAnnotatedOn(key) {
            $scope.notesAnnotatedOn = {};

            $scope.annotatesLink.forEach(function(link) {
            if(link._from.authors.indexOf(key) > -1){
                link._to.authors.forEach(function (auth) {
                    $scope.annotIdList = [];
                    $scope.noteQuotesMap = {};
                    if(auth in $scope.notesAnnotatedOn){
                        $scope.noteQuotesMap = $scope.notesAnnotatedOn[auth];
                        if(link.to in $scope.noteQuotesMap){
                            $scope.annotIdList = $scope.noteQuotesMap[link.to];
                        }
                    }
                    $scope.annotIdList.push(link.from);
                    $scope.noteQuotesMap[link.to] = $scope.annotIdList;
                    $scope.notesAnnotatedOn[auth] = $scope.noteQuotesMap;
                });
            }
            });
            return $scope.notesAnnotatedOn;
        }

        function getCoAuthorNotes(key) {
            $scope.coAuthNotes = [];
            $scope.contributions.forEach(function(each) {
                if(each.authors.indexOf(key) > -1 && each.type === 'Note' && each.authors.length > 1){
                    $scope.coAuthNotes.push(each._id);
                }
            });
            return $scope.coAuthNotes;

        }

        function createStudentTable() {
            $scope.studentTableData = [];
            Object.keys($scope.memberList).forEach(function(key) {
                if($scope.filteredAuthList.length > 0 && $scope.filteredAuthList.indexOf(key) === -1){
                    return;
                }
                $scope.studentTableData.push({
                    _id: $scope.memberList[key]._id,
                    authName: $scope.memberList[key].name,
                    notesCreated : getNotesCreated(key),
                    notesRead:getNotesRead(key),
                    notesModified:getNotesModified(key),
                    notesBuildOn:getNotesBuildOn(key),
                    notesAnnotatedOn:getNotesAnnotatedOn(key),
                    coAuthoredNotes:getCoAuthorNotes(key),
                });
            });
        }

        function createTableData() {
            if (!$scope.scaffoldLinks || !$scope.viewLinks || !$scope.buildonLinks || !$scope.readLinks || !$scope.modifiedLinks || !$scope.contributions) {
                return;
            }

            $scope.simpleTableData = [];
            $scope.detailedTableData = [];
            $scope.contributionsMap = {};
            $scope.contributions.forEach(function(each) {
                var content = '';
                if (each.type === 'Note' || each.type === 'View') {
                    if (each.data && each.data.body) {
                        content = html2PlainText(each.data.body);
                        // console.log("Before:",content);

                        // console.log("After:",content);
                    }
                    $scope.simpleTableData.push({
                        _id: each._id,
                        title: each.title,
                        authors: $scope.makeAuthorString(each),
                        body: content,
                        comments: each.comments,
                        created: $scope.getTimeString(each.created),
                    });
                    $scope.detailedTableData.push({
                        _id: each._id,
                        title: each.title,
                        authors: $scope.makeAuthorString(each),
                        body: content,
                        scaffolds: getScaffolds(each),
                        keywords: getKeywords(each),
                        created: $scope.getTimeString(each.created),
                        comments: each.comments,
                        views: getViews(each),
                        buildson: getBuildson(each),
                        editBy: getEditBy(each),
                        readBy: getReadBy(each),
                        scaffoldFlag:false
                    });
                    $scope.contributionsMap[each._id] = each;

                }

                if($scope.selected.scaffoldsupports.length >0){
                    $scope.showScaffold();
                }
                //---------If it's Annotation--------
                if (each.type === "Annotation") {
                    content = '';
                    if (each.data && each.data.text) {
                        content = html2PlainText(each.data.text);
                    }

                    $scope.detailedTableData.push({
                        _id: each._id,
                        title: each.data.quote,
                        authors: $scope.makeAuthorString(each),
                        body: content,
                        created: $scope.getTimeString(each.created),
                    });
                    $scope.contributionsMap[each._id] = each;

                }
            });
        }


        /**
         * This method will save comments for a particular note.
         * **/
        $scope.saveComments = function(contribution){
            var commnityId = $community.getCommunityData().community._id;
            var authors = [];
            authors.push($community.getAuthor().userId);
            var saveComments = {
                authors : authors,
                comments : contribution.comments
            };
            $http.put('/api/objects/' + commnityId + '/' + contribution._id+'/savecomments', saveComments);
        };

        $scope.isManager = function () {

            var author = $community.getCommunityData().author;
            console.log(author.role);
            if (!author) {
                return false;
            }
            return author.role === 'manager';
        };

        function makeQuery(queryString) {

            var query = {
                communityId: communityId,
                words:[],
                authors: []
            };
            var tokens = queryString.split(' ');

            tokens.forEach(function(token) {
                if (token.length === 0) {
                    return;
                }

                if (token.indexOf('-private') >= 0) {
                    query.privateMode = $community.getAuthor()._id;
                    return;
                }

                if (token.indexOf('-view:') >= 0) {
                    token = token.replace('-view:', '');
                    if (!query.viewIds) {
                        query.viewIds = [];
                    }
                    query.viewIds.push(token);
                    return;
                }
                if (token.indexOf('-from:') >= 0) {
                    token = token.replace('-from:', '');
                    query.from = token;
                    return;
                }
                if (token.indexOf('-to:') >= 0) {
                    token = token.replace('-to:', '');
                    query.to = token;
                    return;
                }
                if (token.indexOf('-author:') >= 0) {
                    token = token.replace('-author:', '');
                    var author = _.find($scope.communityMembers, {
                        userName: token
                    });
                    if (author) {
                        query.authors.push(author._id);
                    } else {
                        window.alert('author:' + token + ' not found');
                    }
                    return;
                }
                if (token.indexOf('-searchMode:') >= 0) {
                    token = token.replace('-searchMode:', '');
                    query.searchMode = token;
                    return;
                }
                if (token.indexOf('-type:') >= 0) {
                    token = token.replace('-type:', '');
                    query.type = token;
                    return;
                }
                if(token.indexOf('-scaffold:')>=0){
                    token = token.replace('-scaffold:', '');
                    if (!query.scaffold) {
                        query.scaffold = [];
                    }
                    query.scaffold.push(token);
                    return;

                }
                query.words.push(token);
            });
            query.words = query.words.join(' ');
            console.log(query);
            return query;
        }

        $scope.openFrom = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.fromOpened = true;
        };

        /**
         * This method will save comments for a particular note.
         * **/
        $scope.saveComments = function(contribution){
            var commnityId = $community.getCommunityData().community._id;
            var authors = [];
            authors.push($community.getAuthor().userId);
            var saveComments = {
                authors : authors,
                comments : contribution.comments
            };
            $http.put('/api/objects/' + commnityId + '/' + contribution._id+'/savecomments', saveComments);
        };

        $scope.openTo = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.toOpened = true;
        };

        $scope.$watch('from', function() {
            if ($scope.from !== undefined) {
                $scope.queryString += ' -from:' + $scope.from.toISOString();
            }
        });
        $scope.$watch('to', function() {
            if ($scope.to !== undefined) {
                $scope.queryString += ' -to:' + $scope.to.toISOString();
            }
        });

        $scope.addViews = function() {
            if ($scope.selected.views && $scope.selected.views.length >= 1) {
                $scope.selected.views.forEach(function(each) {
                    $scope.queryString += ' -view:' + each._id;
                });
                $scope.selected.views = [];
            }
        };

        $scope.addScaffoldSupport= function (){
            if($scope.selected.scaffoldsupports && $scope.selected.scaffoldsupports.length >0){
                $scope.selected.scaffoldsupports.forEach(function(each){
                    $scope.queryString += ' -scaffold:'+each._to.title.replace(/\s+/g, '');
                });
            }
        };

        $scope.addPrivateMode = function() {
            $scope.queryString += ' -private';
        };

        $scope.addSearchView = function() {
            $scope.queryString += ' -searchMode:title -type:View';
            $scope.status.detailCollapsed = !$scope.status.detailCollapsed;
        };

        $scope.authorSelected = function(author) {
            $scope.queryString += ' -author:' + author.userName;
        };

        $scope.makeAuthorString = function(obj) {
            return $community.makeAuthorStringByIds(obj.authors);
        };

        $scope.getIcon = function(contribution) {
            if(contribution!== undefined){
                if (contribution.type === 'View') {
                    return 'manual_assets/kf4images/icon-view.gif';
                }
                if ($community.amIAuthor(contribution)) {
                    return 'manual_assets/kf4images/icon-note-unknown-auth-.gif';
                } else {
                    return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
                }
            }else{
                return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
            }

        };

        $scope.isManager = function () {
            var author = $community.getCommunityData().author;
            if (!author) {
                return false;
            }
            return author.role === 'manager';
        };

        $scope.showScaffold = function() {
            $scope.showScaffoldClicked = true;
            var query = { $or: [{ type: 'supports' }, { type: 'references' }] };
            $http.post('/api/links/' + communityId + '/search', { query: query }).success(function(links) {


                $scope.detailedTableData.forEach(function(note) {
                    if($scope.contributionsMap[note._id].data){
                    var data  = $scope.contributionsMap[note._id].data.body;
                    if($scope.contributionsMap[note._id].type === "Annotation"){
                        data = $scope.contributionsMap[note._id].data.text;
                        links = "Annotation";
                    }
                    if ($scope.contributionsMap[note._id] && $scope.contributionsMap[note._id].type !== "View") {
                        var newBody = $kftag.preProcess(data, links, links);
                        note.body = newBody;
                    }
                }
                });
                $scope.simpleTableData.forEach(function(note) {
                    if($scope.contributionsMap[note._id].data){
                    var data  = $scope.contributionsMap[note._id].data.body;
                    if($scope.contributionsMap[note._id].type === "Annotation"){
                        data = $scope.contributionsMap[note._id].data.text;
                    }
                    if ($scope.contributionsMap[note._id] && $scope.contributionsMap[note._id].type !== "View") {
                        var newBody = $kftag.preProcess(data, links, links);
                        note.body = newBody;
                    }
                }
                });
                $scope.$emit('ngRepeatFinished');
            });
        };

        /* for csv */
        /***
         * New array has been introduced to push the data without ID (Fix for Jira ID - KD-1)
         * */
        $scope.getTable = function() {
            var modifiedTable = [];
            if ($scope.displayExtraInfo || $scope.selected.searchType.title === "Annotation") {
                $scope.detailedTableData.forEach(function (item) {
                    var modifiedOutput = {
                        title: item.title,
                        authors: item.authors,
                        body: html2PlainText(item.body),
                        scaffolds: getScaffolds(item),
                        keywords: getKeywords(item),
                        created: $scope.getTimeString(item.created),
                        views: getViews(item),
                        buildson: getBuildson(item),
                        editBy: getEditBy(item),
                        readBy: getReadBy(item)
                    };
                    modifiedTable.push(modifiedOutput);
                });
                return modifiedTable;
            } else {
                $scope.simpleTableData.forEach(function (item) {
                    var modifiedOutput = {
                        title: item.title,
                        authors: item.authors,
                        body: html2PlainText(item.body),
                        created : item.created
                    };

                    modifiedTable.push(modifiedOutput);
                });


                return modifiedTable;
            }
        };

        function getScaffolds(note){
            var scaffolds = "";
            if (!note) {
                return "";
            }
            $scope.scaffoldLinks.forEach(function(link) {
                if (link.to === note._id) {
                    if (scaffolds.length === 0) {
                        scaffolds = "[" + link._from.title;
                    } else {
                        scaffolds += ", " + link._from.title;
                    }
                }
            });
            if (scaffolds.length > 0) {
                scaffolds += "]";
            }
            return scaffolds;
        }

        function getKeywords(note) {
            var keywords = '';
            if (!note) {
                return '';
            }

            for (var i = 0; i < note.keywords.length; ++i) {
                if (keywords.length > 0) {
                    keywords += ' ;';
                }
                keywords += note.keywords[i];
            }
            return keywords;
        }

        function getViews(note){
            var views = "";
            if (!note) {
                return "";
            }
            $scope.viewLinks.forEach(function(link) {
                if (link.to === note._id) {
                    if (views.length > 0) {
                        views += ", " + link._from.title;
                    } else {
                        views += link._from.title;
                    }
                }
            });
            return views;
        }

        function getBuildson(note){
            if (!note) {
                return "";
            }
            for (var i = 0; i < $scope.buildonLinks.length; i++){
                var link = $scope.buildonLinks[i];
                if (link.from === note._id) {
                    return link._to.title;
                }
            }
            return "";
        }

        function getReadBy(note){

            var readBy = [];
            if (!note) {
                return "";
            }
            $scope.readLinks.forEach(function(link) {
                if (link.to === note._id) {
                    if (readBy.indexOf(link.from) === -1) {
                        readBy.push(link.from);
                    }
                }
            });

            if (!readBy) {
                return "";
            }
            return $community.makeAuthorStringByIds(readBy);
        }

        function getEditBy(note){
            var modifiedBy = [];
            if (!note) {
                return "";
            }
            $scope.modifiedLinks.forEach(function(record) {
                if (record.targetId === note._id) {
                    if (modifiedBy.indexOf(record.authorId) === -1) {
                        modifiedBy.push(record.authorId);
                    }
                }
            });

            if (!modifiedBy) {
                return "";
            }
            return $community.makeAuthorStringByIds(modifiedBy);
        }

        function html2PlainText(html){
            var text = "";
            if(html.trim() ===""){
                return text;
            }

            html = html.replace(/&nbsp;/g, "");
            html = html.replace(/<span([^>]*)class="KFSupportStart mceNonEditable"([^>]*)>/g, "[");
            html = html.replace(/<span\s*([^>]*)\s*class="KFSupportEnd mceNonEditable"\s*([^>]*)>/g, "]");
            html = html.replace(/<span class="katex">/g, "");
            html = html.replace(/<input type="hidden"\s*([^>]*)\s*value="(.*?)"\s*([^>]*)>/gi, "Equation -> $2<br>");
            html = html.replace(/<span class="katex-html"[^>]*>(.(?!<label>))*<\/span><label><\/label>/g,"");
            html = html.replace(/<\/?span[^>]*>/g,"");
            html = html.replace(/<\/?em[^>]*>/g,"");
            html = html.replace(/<\/?strong[^>]*>/g,"");
            html = html.replace(/<\/?div[^>]*>/g,"");
            html = html.replace(/<\/?h[1-9][^>]*>/g,"");
            html = html.replace(/<\/?ul[^>]*>/g,"");
            html = html.replace(/<\/?ol[^>]*>/g,"");
            html = html.replace(/<\/?li[^>]*>/g,"<br>");
            html = html.replace(/<\/?p[^>]*>/g,"<br>");
            html = html.replace(/<a\s*([^>]*)\s*href="(.*?)"\s*([^>]*)>(.*?)<\/a>/gi, "$4 (Link->$2)<br>");
            html = html.replace(/<img\s*([^>]*)\s*src="(.*?)"\s*([^>]*)>/gi, function(match,p1,p2){
                return p2.startsWith("http") ? "<br>Image -> "+p2+"<br>" : "<br>Image -> "+window.location.origin +"/"+p2+"<br>";
            });
            html = html.replace(/(<br[^>]*>\s*){1,}/g, "\n");
            html = html.trim();
            return html;
        }

        $scope.getTableHeader = function() {
            if ($scope.displayExtraInfo) {
                return ['Title', 'Authors', 'Body', 'Scaffold(s)', 'Keyword(s)', 'Created', 'Views', 'Buildson', 'Edit By', 'Read By'];
            } else {
                return ['Title', 'Authors', 'Body', 'Created'];
            }
        };


        $scope.showExtraInfo = function(){
            $scope.displayExtraInfo = true;
        };

        $scope.hideExtraInfo = function(){
            $scope.displayExtraInfo = false;
        };

        $scope.$on('ngRepeatFinished', function() {
            //you also get the actual event object
            //do stuff, execute functions -- whatever...
            $scope.highlighter($scope.markFlag);
        });

        $scope.$watch('selected.searchType', function() {
            $scope.reset();
        });

        // Function to watch queryString to update theh queryStringWrapper.
        function initQuerySearchWrapperForAnonymousPlugin(){
            $scope.$watch('queryString', function(qs){ //watch queryString for changes and update the wrapper/
                // Break the query String into tokens
                var tokens = qs.split(' ');
                    tokens.forEach(function(token, index) {
                        // For each author : userName in query string,
                        if (token.indexOf('-author:') >= 0) {
                            var authorUserName = token.replace('-author:', '');
                            // find the author
                            var author = _.find($scope.communityMembers, {
                                userName: authorUserName
                            });
                            if (author) {
                                // Replace the old "-author:userName" to "-author:firstName"
                                var newToken='-author:' + author.firstName;
                                tokens[index] = newToken;
                            } else {
                                window.alert('author:' + authorUserName + ' not found');
                            }
                        }
                    });
                    // Rejoin the tokens and update the wrapper.
                    $scope.queryStringWrapper = tokens.join(' ');
            });
        }
    })
    .directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit(attr.onFinishRender);
                    });
                }
            }
        };
    });
