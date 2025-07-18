'use strict';

/* global Highcharts */

angular.module('kf6App')
    .controller('StatsCtrl', function($scope, $http, $community, $stateParams, Auth, $kfutil, $ac, $translate) {
        var communityId = $stateParams.communityId;
        $community.enter(communityId);
        $community.refreshMembers();
        $community.refreshViews(function() {
            $scope.views = $community.getViews();
        });

        $scope.communityMembers = $community.getCommunityData().membersArray;
        $scope.isAdmin = Auth.isAdmin;

        $kfutil.mixIn($scope);


        //Query String
        $scope.queryString = '';
        $scope.selected = {}; //currently using only for views
        $scope.selected.views = [];

        //General Status
        $scope.status = {};
        $scope.status.detailCollapsed = true;
        $scope.status.status = 'init';

        //Pager Status
        $scope.pager = {};


        // vérifier si c'est possible de ne pas utiliser le pager, sinon ajuster 50000
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
        $scope.pager.pagesize = 50000;

        //results
        $scope.contributions = [];


        $scope.search = function() {
            $scope.pager.query = makeQuery($scope.queryString);
            $scope.status.detailCollapsed = true;
            showCharts();
        };

        $scope.reset = function() {
            $scope.queryString = "";
        };

        function showCharts() {

            var dates = getDates();

            $scope.status.status = 'searching';
            var byDateAll = [];
            var byDateAuthor = [];
            var byWeekAll = [];
            var byWeekAuthor = [];
            var byAuthors = [];
            var byAuthorsDisplay = [];
            var byScaffoldAuthor = [];
            var ccreated, ccreatedUTC = null;
            var pendingrqt = 0;

            // initialize array (missing values)
            var day = 86400000;
            for (var i = dates.from; i <= dates.to; i+=day){
                byDateAll.push(new Array(i, 0));
                byDateAuthor.push(new Array(i, 0));
            }
            for (i = 0; i <= 6; i++){
                byWeekAll[i] = 0;
                byWeekAuthor[i] = 0;
            }

            $community.refreshRegisteredScaffolds(function(){
                $scope.scaffolds = $community.getCommunityData().registeredScaffolds;
            });

            $scope.pager.query.pagesize = $scope.pager.pagesize;
            $scope.pager.query.page = $scope.pager.page;
            $http.post('/api/contributions/' + communityId + '/search', {
                query: $scope.pager.query
            }).success(function(contributions) {
                contributions.forEach(function(c) {
                    if (!$ac.isReadable(c)) {
                        c.title = 'forbidden';
                        c.authors = [];
                        c.data.body = '(forbidden)';
                        c.created = null;
                    }
                    $scope.status.status = 'searched';

                    ccreatedUTC = Date.UTC(parseInt(c.created.substr(0, 4), 10), parseInt(c.created.substr(5, 2), 10) - 1, parseInt(c.created.substr(8, 2), 10) + 1);
                    ccreated = new Date(ccreatedUTC);


                    if (byDateAll[parseInt((ccreatedUTC-(dates.from))/day, 10)] !== undefined){
                        byDateAll[parseInt((ccreatedUTC-(dates.from))/day, 10)][1]++;
                        byWeekAll[ccreated.getDay()]++;
                        c.authors.forEach(function(author){
                            if (byAuthors[author] === undefined){
                                byAuthors[author] = 0;
                            }
                            byAuthors[author]++;
                        });
                    }


                    if ($.inArray($community.getAuthor()._id, c.authors) >= 0){
                        if (byDateAuthor[parseInt((ccreatedUTC-(dates.from))/day, 10)] !== undefined){
                            byDateAuthor[parseInt((ccreatedUTC-(dates.from))/day, 10)][1]++;
                            byWeekAuthor[ccreated.getDay()]++;
                        }

                        pendingrqt++;
                        $http.get('/api/links/to/' + c._id).success(function(links) {
                            links.forEach(function(link){
                                if (link.type === "supports"){
                                    if (typeof byScaffoldAuthor[link._from.title] !== 'undefined') {
                                        byScaffoldAuthor[link._from.title]++;
                                    }
                                    else{
                                        byScaffoldAuthor[link._from.title] = 1;
                                    }
                                }
                            });
                            pendingrqt--;
                            if (pendingrqt === 0){
                                refreshViewScaffolds(byScaffoldAuthor);
                            }
                        });


                    }

                });

              // TODO i18n

              Highcharts.setOptions({
                lang: {
                  loading: 'Chargement...',
                  months: ['January', 'February', 'Mars', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                  shortMonths: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
                  exportButtonTitle: "Export",
                  printButtonTitle: "Import",
                  rangeSelectorFrom: "from",
                  rangeSelectorTo: "to",
                  rangeSelectorZoom: "Period",
                  downloadPNG: 'Export PNG',
                  downloadJPEG: 'Export JPEG',
                  downloadPDF: 'Export PDF',
                  downloadSVG: 'Export SVG',
                  resetZoom: "Reset zoom",
                  resetZoomTitle: "Reset zoom",
                  thousandsSep: " ",
                  decimalPoint: ','
                }
              });

                $translate(['student',
                            'chartTitleContributions',
                            'chartTitleDistribution',
                            'chartUxZoom',
                            'chartUxZoomMobile',
                            'chartLegendBy',
                            'chartLegendTheCommunity',
                            'chartPercentage',
                            'by',
                            'author']).then(function (translations) {


                    $scope.communityMembers.forEach(function(author){
                        byAuthorsDisplay.push(
                            {name: ($community.getAuthor()._id === author._id ? author.getName() : translations.student),
                            y : (typeof byAuthors[author._id] !== 'undefined' ? byAuthors[author._id] : 0),
                            color: ($community.getAuthor()._id === author._id ? "#7cb5ec" : "#aaa")
                        });
                    });

                    // chart #1
                    $('#notesyear').highcharts({
                        chart: {zoomType: 'x'},
                        credits: {enabled: false},
                        title: {text: translations.chartTitleContributions},
                        subtitle: { text: document.ontouchstart === undefined ? translations.chartUxZoom : translations.chartUxZoomMobile},
                        xAxis: {type: 'datetime'},
                        yAxis: {title: {text: translations.chartTitleContributions}},
                        legend: {enabled: true},
                        rangeSelector : {
                            selected : 4
                        },series: [{
                            type: 'line',
                            name: translations.chartTitleContributions + ' ' + translations.by + ' ' + translations.chartLegendTheCommunity,
                            color: "#aaa",
                            data: byDateAll
                        },{
                            type: 'line',
                            name: translations.chartTitleContributions + ' ' + translations.by + ' ' + $community.getAuthor().getName(),
                            color: "#7cb5ec",
                            data: byDateAuthor
                        }]
                    });

                    $('#notesweek').highcharts({
                        title: {text: translations.chartTitleDistribution},
                        credits: {enabled: false},
                        xAxis: {categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']}, // traduire
                        yAxis: {title: {text: translations.chartPercentage}},
                        legend: {enabled: true},
                        series: [{
                            type: 'column',
                            name: translations.chartPercentage + ' ' + translations.by + ' ' + translations.chartLegendTheCommunity,
                            color: "#aaa",
                            data: byWeekAll
                        },{
                            type: 'column',
                            name: translations.chartPercentage + ' ' + translations.by + ' ' + $community.getAuthor().getName(),
                            color: "#7cb5ec",
                            data: byWeekAuthor
                        }]
                    });


                    $('#notesauthors').highcharts({
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie'
                        },
                        credits: {enabled: false},
                        title: {
                            text: translations.chartTitleContributions + ' ' + translations.by + ' ' + translations.author
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: false,
                                    format: '<b>{point.percentage:.1f} %'
                                },
                                showInLegend: false
                            }
                        },
                        series: [{
                            name: translations.chartTitleContributions,
                            colorByPoint: true,
                            data: byAuthorsDisplay
                        }]
                    });


                });

            }).error(function() {
                $scope.status.status = 'error';
            });
        }


        var refreshViewScaffolds = function(data) {
            $translate(['chartTitleScaffold']).then(function (translations) {
                var supportUsed = [];
                $scope.scaffolds.forEach(function(scaffold){
                    scaffold.supports.forEach(function(support){
                        supportUsed.push({name: support._to.title, y : (typeof data[support._to.title] !== 'undefined' ? data[support._to.title] : 0)});
                    });

                    $('#scaffoldsused').append('<div></div>').highcharts({
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie'
                        },
                        credits: {enabled: false},
                        title: {
                            text: translations.chartTitleScaffold // traduire
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                                },
                                showInLegend: false
                            }
                        },
                        series: [{
                            name: 'Supports',
                            colorByPoint: true,
                            data: supportUsed
                        }]
                    });
                });
            });
        };

        function makeQuery(queryString) {
            var query = {
                communityId: communityId,
                words: [],
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
                query.words.push(token);
            });
            return query;
        }

        $scope.openFrom = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.fromOpened = true;
        };

        $scope.openTo = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.toOpened = true;
        };

        $scope.$watch('from', function() {
            if ($scope.from !== undefined) {
                $scope.queryString += ' -from:' + $scope.from.toISOString();
                $('#from').html($scope.from.toISOString().substr(0, 10));
            }
            else{
                $('#from').html("");
            }
        });
        $scope.$watch('to', function() {
            if ($scope.to !== undefined) {
                $scope.queryString += ' -to:' + $scope.to.toISOString();
                $('#to').html($scope.to.toISOString().substr(0, 10));
            }
            else{
                $('#to').html("");
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

        $scope.addPrivateMode = function() {
            $scope.queryString += ' -private';
        };

        $scope.authorSelected = function(author) {
            $scope.queryString += ' -author:' + author.userName;
        };

        $scope.makeAuthorString = function(obj) {
            return $community.makeAuthorStringByIds(obj.authors);
        };

        $scope.getIcon = function(contribution) {
            if ($community.amIAuthor(contribution)) {
                return 'manual_assets/kf4images/icon-note-unknown-auth-.gif';
            } else {
                return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
            }
        };

        /* Return objects with two parameters for the charts (from and to)
           If values are set by the users, it takes that values. Else, it takes dates from school year (August 15 to June 30 of current scholar year, changing the July 1st) */
        function getDates(){
            var f, t;
            var d = new Date();
            if ($scope.pager.query.from === undefined){
                f = (d.getMonth() >= 7 ? Date.UTC(d.getFullYear(), 7, 15) : Date.UTC(d.getFullYear() - 1, 7, 15));
            }
            else{
                f = Date.UTC(parseInt($scope.pager.query.from.substr(0, 4), 10), parseInt($scope.pager.query.from.substr(5, 2), 10) - 1, parseInt($scope.pager.query.from.substr(8, 2), 10) + 1) - 86400000;
            }
            if ($scope.pager.query.to === undefined){
                t = (d.getMonth() < 7 ? Date.UTC(d.getFullYear(), 5, 30) : Date.UTC(d.getFullYear() + 1, 5, 30));
            }
            else{
                t = Date.UTC(parseInt($scope.pager.query.to.substr(0, 4), 10), parseInt($scope.pager.query.to.substr(5, 2), 10) - 1, parseInt($scope.pager.query.to.substr(8, 2), 10) + 1) - 86400000;
            }
            return {"from": f, "to": t};
        }
    });
