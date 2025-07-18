'use strict';

angular.module('kf6App')
    .controller('PromisingIdeasCtrl', function ($scope, $http, $community, $stateParams, $ac, $suresh, $kftag, $timeout) {
        var ids = ($stateParams.ids + '').split('§§§');
        var communityId = ids[0];
        var viewId = ids[1];
        var viewTitle = '';
        $scope.promisingIdeacolorobjsarr = [];
        $scope.queryString = '';
        $scope.currentCommunity = {};
        $community.enter(communityId, function () {
            $community.getObject(viewId, function (view) {
                viewTitle = view.title;
                $scope.queryString += ' -view:' + viewId;
                $scope.viewTitles.push(viewTitle);
                $scope.search();
                $community.refreshMembers();
                $scope.currentCommunity = $community.getCommunityData();
                $scope.communityMembers = $scope.currentCommunity.membersArray;
                $community.refreshPromisingcolorobjs(function () {
                    $scope.promisingIdeacolorobjsarr = $community.getPromisingcolorobjsArray();
                });
            });
        });
        $scope.searchkeyword = '';
        $scope.viewTitlescopy = '';

        //General Status
        $scope.contributions = [];
        $scope.viewTitles = [];
        $scope.hitdata = [];
        $scope.hitcounts = [];
        $scope.overlappeddata = [];
        $scope.overlappedpromising = [];
        $scope.colors = [];
        $scope.criteria = [];
        $scope.users = [];
        $scope.status = {};
        $scope.status.detailCollapsed = true;
        $scope.status.noPromisingCollapsed = true;
        $scope.show = true;
        $scope.status.communityCollapsed = true;
        $scope.status.isnewNoteCollapsed = true;
        $scope.status.selectedColorCollapsed = false;
        $scope.status.selectedHitCollapsed = true;
        $scope.status.selectedCriteriaCollapsed = true;
        $scope.status.selectedUserCollapsed = true;
        $scope.status.status = 'init';
        $scope.labels = [];
        $scope.promisngNotes = [];
        $scope.selectedColor = '';
        $scope.selectedHitCount = '';
        $scope.selectedCriteria = '';
        $scope.selectedUser = '';
        $scope.selectedtime = '';
        $scope.selectedpromisingideaIndex = -1;
        $scope.currentselected = {
            name: 'Sortedcolors'
        };
        //export to CSV
        $scope.tableData = [];
        $scope.selectedPromisingIdeas = [];
        $scope.promisingnoteTitle = '';
        $scope.selectedViewIds = [];

        $scope.getHeader = function () {
            return ['Promisingness Ideas', 'Reason', 'In Contribution Title', 'Authour', 'Created Date', 'Contribution', 'Colour', 'Colour Detail', ];
        };

        var checkedPromisingtLinkInNote = function (notes) {
            intilize(notes);
            notes.forEach(function (note, index) {
                var promisingnotefound = true;
                $http.get('/api/links/to/' + note._id).success(function (links) {
                    links.forEach(function (link, inx) {
                        if (link.type === 'promisings') {
                            $community.getObject(link.from, function (promisingIdeaobj) {
                                var pcolordetail = $scope.setPromisingIdeacolorobj(promisingIdeaobj.data.color);
                                var user = $community.getMember(promisingIdeaobj.authors).getName();
                                if (promisingIdeaobj.data.color === '') {
                                    pcolordetail = 'None' + pcolordetail;
                                }
                                if (promisingIdeaobj.data.reason === '') {
                                    promisingIdeaobj.data.reason = 'None';
                                }
                                $scope.tableData.push({
                                    promisingidea: promisingIdeaobj.data.idea.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' '),
                                    reason: promisingIdeaobj.data.reason.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' '),
                                    inContributionTitle: note.title,
                                    author: user,
                                    date: new Date(promisingIdeaobj.modified).toLocaleString(),
                                    contribution: note,
                                    color: promisingIdeaobj.data.color,
                                    colordetail: pcolordetail
                                });
                                if (!contains($scope.colors, pcolordetail)) {
                                    $scope.colors.push(pcolordetail);
                                }
                                if (!contains($scope.criteria, promisingIdeaobj.data.reason)) {
                                    $scope.criteria.push(promisingIdeaobj.data.reason);
                                }
                                if (!contains($scope.users, user)) {
                                    $scope.users.push(user);
                                }
                                if (inx === links.length - 1) {
                                    sortByTime();
                                }
                            });
                            if (promisingnotefound === true) {
                                $scope.promisngNotes.push(note);
                                promisingnotefound = false;
                            }
                            $scope.status.detailCollapsed = false;
                        }
                    });
                    setNopromising(index, notes);
                });
            });

            $scope.selectedColor = $scope.colors[0];
            $scope.selectedHitCount = $scope.hitcounts[0];
            $scope.selectedCriteria = $scope.criteria[0];
            $scope.selectedUser = $scope.users[0];
        };

        function setNopromising(index, notes) {
            if (index === notes.length - 1) {
                if ($scope.promisngNotes.length === 0) {
                    $scope.status.noPromisingCollapsed = false;
                }
            }
        }

        $scope.setpromisingoverlappedcounted = function () {
            $scope.overlappeddata.length = 0;
            $scope.overlappedpromising.length = 0;
            $scope.hitdata.length = 0;
            $scope.hitcounts.length = 0;
            $scope.hitcounts.push('All');
            $scope.tableData.forEach(function (promising, index, data) {
                if (!contains($scope.overlappedpromising, promising)) {
                    counted(promising, index, data);
                }
                if (index === $scope.tableData.length - 1) {
                    $scope.hitdata.sort(function (a, b) {
                        return parseInt(a.hitcount, 10) - parseInt(b.hitcount, 10);
                    }).reverse();
                    $scope.hitdata.forEach(function (hdata) {
                        if (!$scope.hasitoverlappedpromising(hdata.promising) && !contains($scope.hitcounts, hdata.hitcount)) {
                            $scope.hitcounts.push(hdata.hitcount);
                        }
                    });
                    $scope.hitcounts.sort().reverse();
                }
            });
        };

        function counted(promising, idx, data) {
            var hit = 1;
            $scope.tableData.forEach(function (promising_, index) {
                if (promising_.promisingidea.length <= promising.promisingidea.length) {
                    if (promising.promisingidea.replace(/\s/g, '').indexOf(promising_.promisingidea.replace(/\s/g, '')) !== -1 && index !== idx) {
                        hit++;
                        $scope.overlappeddata.push({
                            mainpromising: promising,
                            subpromising: promising_,
                        });
                        $scope.overlappedpromising.push(promising_);
                    }
                }
            });
            $scope.hitdata.push({
                promising: promising,
                hitcount: hit
            });
            data[idx].count = hit;
        }

        $scope.hasitoverlappedpromising = function (promising) {
            var hasit = false;
            if ($scope.overlappedpromising.indexOf(promising) !== -1) {
                hasit = true;
            }
            return hasit;
        };

        $scope.toggleSelection = function toggleSelection(promisingobj) {
            var original = promisingobj.promisingidea;
            var contrib = promisingobj.contribution;
            var html = $kftag.createNewReferenceTag(contrib._id, contrib.title, contrib.authors, original);

            var idx = $scope.selectedPromisingIdeas.indexOf(html + '<br />');
            // is currently selected
            if (idx > -1) {
                $scope.selectedPromisingIdeas.splice(idx, 1);
            }
            // is newly selected
            else {
                $scope.selectedPromisingIdeas.push(html + '<br />');
            }
        };

        function contains(a, obj) {
            var i = a.length;
            while (i--) {
                if (a[i] === obj) {
                    return true;
                }
            }
            return false;
        }

        function intilize(notes) {
            $scope.contributions = notes;
            $scope.tableData.length = 0;
            $scope.promisngNotes.length = 0;
            $scope.colors.length = 0;
            $scope.criteria.length = 0;
            $scope.users.length = 0;
            $scope.criteria.push('All');
            $scope.colors.push('All');
            $scope.users.push('All');
        }

        function sortByTime() {
            $scope.tableData.sort(function (a, b) {
                return new Date(a.date) - new Date(b.date);
            }).reverse();
        }

        $scope.viewSelected = function (view) {
            if ($scope.status.isnewNoteCollapsed) {
                $scope.viewTitlescopy = '';
                $scope.status.noPromisingCollapsed = true;
                $scope.viewTitles.push(view.title);
                $scope.queryString += ' -view:' + view._id;
                $scope.status.detailCollapsed = true;
                $scope.search();
            } else {
                if ($scope.promisingnoteTitle === '') {
                    window.alert('Note title is empty ');
                    return;
                }
                $scope.selectedViewIds.push(view._id);
                $timeout(function() {
                    $scope.makepromisingnote($scope.promisingnoteTitle,$scope.selectedPromisingIdeas.toString());
                }, 500);
            }
        };
        //results
        $scope.search = function () {
            $scope.viewTitlescopy = '';
            if ($scope.viewTitles.length !== 0) {
                $scope.viewTitles.forEach(function (title, index) {
                    $scope.viewTitlescopy += title;

                    if (index >= 0 && index !== $scope.viewTitles.length - 1) {
                        $scope.viewTitlescopy += ' , ';
                    }
                });

                $scope.viewTitles.length = 0;
                $scope.status.communityCollapsed = true;
            } else {
                $scope.status.communityCollapsed = false;
            }
            $suresh.searchprocess($scope.queryString, communityId, $scope.communityMembers, $community, $scope.status, checkedPromisingtLinkInNote);
            $scope.queryString = '';
        };

        $scope.getIcon = function (contribution) {
            if ($community.amIAuthor(contribution)) {
                return 'manual_assets/kf4images/icon-note-unknown-auth-.gif';
            } else {
                return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
            }
        };
        $scope.createnote = function () {
            if ($scope.selectedPromisingIdeas.length === 0) {
                window.alert('Promising Idea is not selected');
                return;
            }
            $('button.create').html('Create');
            $scope.promisingnoteTitle = 'PI Pool';
            $scope.status.isnewNoteCollapsed = false;
        };

        $scope.hastextinpromisingidea = function (searchtext, idea, criteria, author) {
            var hasit = false;
            if (searchtext !== '' && (idea.replace(/\s/g, '').toLowerCase().indexOf(searchtext.replace(/\s/g, '').toLowerCase()) !== -1 ||
                    criteria.replace(/\s/g, '').toLowerCase().indexOf(searchtext.replace(/\s/g, '').toLowerCase()) !== -1 ||
                    author.replace(/\s/g, '').toLowerCase().indexOf(searchtext.replace(/\s/g, '').toLowerCase()) !== -1)) {
                hasit = true;
            }
            return hasit;
        };

        $scope.progressselection = function () {
            if ($scope.currentselected.name === 'Sortedcolors') {
                $scope.status.selectedColorCollapsed = false;
                $scope.status.selectedHitCollapsed = true;
                $scope.status.selectedCriteriaCollapsed = true;
                $scope.status.selectedUserCollapsed = true;
            }
            if ($scope.currentselected.name === 'Sortedhits') {
                $scope.status.selectedColorCollapsed = true;
                $scope.status.selectedHitCollapsed = false;
                $scope.status.selectedCriteriaCollapsed = true;
                $scope.status.selectedUserCollapsed = true;
            }
            if ($scope.currentselected.name === 'Sortedcriteria') {
                $scope.status.selectedColorCollapsed = true;
                $scope.status.selectedHitCollapsed = true;
                $scope.status.selectedCriteriaCollapsed = false;
                $scope.status.selectedUserCollapsed = true;
            }
            if ($scope.currentselected.name === 'Sorteduser') {
                $scope.status.selectedColorCollapsed = true;
                $scope.status.selectedHitCollapsed = true;
                $scope.status.selectedCriteriaCollapsed = true;
                $scope.status.selectedUserCollapsed = false;
            }
        };

        $scope.$watch('currentselected.name', function () {
            $scope.setpromisingoverlappedcounted();
        });

        $scope.makepromisingnote = function (title, body) {
            $suresh.createnewnoteInMutipleView(title, $scope.selectedViewIds, $community, body, true);
            $scope.selectedViewIds.length = 0;
            $scope.status.isnewNoteCollapsed = true;
            $('button.create').html('Add');
        };

         $scope.cancelpromisingnote = function () {
             $scope.status.isnewNoteCollapsed = true;
             $('button.create').html('Add');
         };

        $scope.setPromisingIdeacolorobj = function (promisingcolor) {
            var msg = promisingcolor.charAt(0).toUpperCase() + promisingcolor.slice(1) + ' (Unassigned)';
            $scope.promisingIdeacolorobjsarr.forEach(function (pcolorobj) {
                var promisngcolorgroup = pcolorobj.data.data;
                if (promisngcolorgroup === '') {
                    promisngcolorgroup = 'Unassigned';
                }
                if (pcolorobj.data.color === promisingcolor) {
                    msg = promisingcolor.charAt(0).toUpperCase() + promisingcolor.slice(1) + ' (' + promisngcolorgroup + ')';
                    return msg;
                }
            });
            return msg;
        };

        $scope.setselectedpromisingideaIndex = function (index) {
            if ($scope.selectedpromisingideaIndex === index) {
                $scope.selectedpromisingideaIndex = -1;
            } else {
                $scope.selectedpromisingideaIndex = index;
            }
        };

        $('img.Exportview').on("dragstart", function (event) {
             if ($scope.selectedPromisingIdeas.length === 0) {
                window.alert('Promising Idea is not selected');
                return;
             }
              event.originalEvent.dataTransfer.setData('text/plain',$scope.selectedPromisingIdeas.toString()+'§§§pidata');

         });

    })

.filter('highlighted', function ($sce) {
    return function (text, phrase) {
        if (phrase) {
            text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>');

            // text = unescape(escape(text).replace(new RegExp(escape(phrase), 'gi'), '<span class="highlighted">$&</span>'));
        }
        return $sce.trustAsHtml(text);
    };
});

