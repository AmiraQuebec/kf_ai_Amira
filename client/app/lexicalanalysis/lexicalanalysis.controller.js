'use strict';

angular.module('kf6App')
    .controller('LexicalAnalysisCtrl', function ($scope, $http, $community, $stateParams, $suresh) {
        var communityId = $stateParams.communityId;
        $community.enter(communityId);
        $community.refreshMembers();
        $scope.communityMembers = $community.getCommunityData().membersArray;
        $scope.currentCommunity = {};
        $scope.currentCommunity = $community.getCommunityData();
        //Query String
        $scope.queryString = '';
        $scope.textareaText = '';

        //General Status
        $scope.contributions = [];
        $scope.status = {};
        $scope.status.detailCollapsed = true;
        $scope.status.barchartCollapsed = true;
        $scope.status.radarchartCollapsed = true;
        $scope.status.detailsCollapsed = true;
        $scope.status.status = 'init';
        $scope.labels = [];
        $scope.lexiconsInfo = [];
        $scope.count = [];
        $scope.data = [$scope.count];
        $scope.selectedItems = [];
        $scope.lexicons = [];


        //export to CSV
        $scope.getHeader = function () {
            return ['Lexicon', 'Frequency', 'In Contribution'];
        };

        var checkedWordInNote = function (notes) {
            $scope.lexiconsInfo.length = 0;
            var lexiconCountInnote = 0;
            $scope.textareaText = $scope.textareaText.replace(/[\(\)\+\.,\/#!$%\^&\*{}=_`~]/g, '').replace(/[\r\n\t\u00A0\u3000]/g, ' ').replace(/;$/, "");
            $scope.lexicons = $scope.textareaText.replace(/\s\s+/g, ' ').replace(/['"]+/g, '').toLowerCase().split(';').map(function(item) {return item.trim();});//processedText.split(' ');
            $scope.lexicons = uniqBy($scope.lexicons, JSON.stringify);
            notes.forEach(function (note) {
                var body = strip(note.data.body.replace(/&nbsp;|(<([^>]+)>)/ig, ' ')).replace(/[\(\)\+\.,\/#!$%\^&\*{}=_`~]/g, '');
                body = body.replace(/[\r\n\t\u00A0\u3000]/g, ' ').replace(/['"]+/g, '').replace(/\s\s+/g, ' ').replace(/&nbsp;|(<([^>]+)>)/ig, ' ');
                body = body.toLowerCase();
                $scope.lexicons.forEach(function (lexicon) {
                    lexiconCountInnote = 0;
                    var regex = new RegExp(lexicon, 'g');
                    lexiconCountInnote = (body.match(regex) || []).length;
                    if (lexiconCountInnote !== 0) {
                        $scope.lexiconsInfo.push({
                            note: note,
                            word: lexicon,
                            count: lexiconCountInnote
                        });
                    }
                });
            });
            $scope.addCoordinateData();
        };

        function uniqBy(a, key) {
            var seen = {};
            return a.filter(function (item) {
                var k = key(item);
                return seen.hasOwnProperty(k) ? false : (seen[k] = true);
            });
        }

        function strip(html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return (tmp.textContent || tmp.innerText || "");
        }

        $scope.addCoordinateData = function () {
            $scope.count.length = 0;
            $scope.labels.length = 0;
            $scope.lexicons.forEach(function (word, index) {
                var maxcount = 0;
                var frequencyDetails = ' ';
                $scope.lexiconsInfo.forEach(function (item) {
                    if (word === item.word) {
                        maxcount += item.count;
                        frequencyDetails += item.note.title + ' -- ' + item.count + ', ';
                    }
                });
                $scope.lexicons[index] = {
                    word: word,
                    maxcount: maxcount,
                    inContribution: frequencyDetails
                };

                if (index === $scope.lexicons.length - 1) {
                    $scope.lexicons.sort(function (a, b) {
                        return parseInt(a.maxcount, 10) - parseInt(b.maxcount, 10);
                    }).reverse();
                    $scope.lexicons.forEach(function (data) {
                        $scope.count.push(data.maxcount);
                        $scope.labels.push(data.word);
                    });
                }
            });
        };

        $scope.setSelectedData = function (queryString, selectedItems, views, authors, todate, fromdate) {
            $scope.selectedItems = selectedItems;
            $scope.queryString = queryString;
            $scope.views = views;
            $scope.authors = authors;
            $scope.todate = todate;
            $scope.fromdate = fromdate;
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
        //  $scope.getIcon = function(contribution) {$suresh.getIcon(contribution, $community); };

        //results
        $scope.search = function () {
            if ($scope.textareaText.length === 0) {
                window.alert('Le lexique est vide:');
            } else {
                $suresh.searchprocess($scope.queryString, communityId, $scope.communityMembers, $community, $scope.status, checkedWordInNote);
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
    });
