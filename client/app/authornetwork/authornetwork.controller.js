/* global d3 */
'use strict';
angular.module('kf6App')
    .controller('AuthorNetworkCtrl', function($stateParams, $scope, $community, $http, Auth) {

        var viewId = $stateParams.viewId;
        $scope.selectedGroup = 'allGroups';
        $scope.selectedView = 'allViews';
        // @todo verify that the flag is useless and can be deleted.
        $scope.flag  = false;

        $community.getObject(viewId, function(view) {
            $scope.view = view;
            $scope.isAdmin = Auth.isAdmin;
            $community.enter($scope.view.communityId, null, function() {
                $scope.views = $community.getViews();
            });

            $community.refreshGroups(function(groups) {
                $scope.groups = groups;
            });

            $scope.communityMembers = $community.getMembersArray();
            $community.refreshMembers(function(){
                refresh();
            });
        });


        $scope.refreshByGroup = function(group) {
            refresh(group);
        };

        $scope.refreshByGroup2 = function() {
            $scope.selectedView = 'allViews';
            if ($scope.selectedGroup === 'allGroups') {
                refresh();
                return;
            }
            for (var i = 0; i < $scope.groups.length; ++i) {
                if ($scope.groups[i]._id === $scope.selectedGroup) {
                    refresh($scope.groups[i]);
                    return;
                }
            }
        };

        $scope.refreshByView = function() {
            $scope.selectedGroup = 'allGroups';
            if ($scope.selectedView === 'allViews') {
                refresh();
                return;
            }

            $community.getLinksFrom($scope.selectedView, 'contains', function(links){
                var authors = {};
                var filters = {};
                links.forEach(function(link){
                    filters[link.from] = 1;
                    filters[link.to] = 1;
                    link._to.authors.forEach(function(author){
                        if (!authors[author]) {
                            authors[author] = 1;
                        }
                    });
                });
                var group = {members: []};
                for (var authorId in authors) {
                    if (authors.hasOwnProperty(authorId)) {
                        group.members.push(authorId);
                    }
                }
                refresh(group, filters);
            }, function(){
                console.log("Get links for view: " + $scope.selectedView + ' failed!');
            });
        };

        //----------------------------- Added By Karan Sheth, UAlbany ----------------
        // Time Filter Functions
        $scope.refreshByTime = function () {
            if($scope.selectedGroup !== 'allGroups'){
                $scope.refreshByGroup2();
            } else{
                $scope.refreshByView();
            }

        };

        $scope.mytime = new Date();

        $scope.hstep = 1;
        $scope.mstep = 15;

        $scope.options = {
            hstep: [1, 2, 3],
            mstep: [1, 5, 10, 15, 25, 30]
        };

        $scope.ismeridian = true;
        $scope.toggleMode = function() {
            $scope.ismeridian = ! $scope.ismeridian;
        };

        $scope.update = function() {
            var d = new Date();
            d.setHours( 14 );
            d.setMinutes( 0 );
            $scope.mytime = d;
        };

        $scope.changed = function () {
            //CB Function
        };

        $scope.clear = function() {
            $scope.mytime = null;
        };
        //------------------------------- RD2 -----------
        $scope.today = function() {
            //$scope.fromDate = new Date();
            //$scope.toDate = new Date();
        };
        $scope.today();

        $scope.clear = function() {
            $scope.fromDate = null;
            $scope.toDate = null;
        };

        // Disable weekend selection
        $scope.disabled = function(date, mode) {
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        };

        $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date();
        };

        $scope.toggleMin();
        $scope.maxDate = new Date(2020, 5, 22);

        $scope.open1 = function() {
            $scope.popup1.opened = true;
        };

        $scope.open2 = function() {
            $scope.popup2.opened = true;
        };

        $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.formats = ['MMMM dd, yyyy','dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.popup1 = {
            opened: false
        };

        $scope.popup2 = {
            opened: false
        };

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events =
            [
                {
                    date: tomorrow,
                    status: 'full'
                },
                {
                    date: afterTomorrow,
                    status: 'partially'
                }
            ];

        $scope.getDayClass = function(date, mode) {
            if (mode === 'day') {
                var dayToCheck = new Date(date).setHours(0,0,0,0);

                for (var i = 0; i < $scope.events.length; i++) {
                    var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                    if (dayToCheck === currentDay) {
                        return $scope.events[i].status;
                    }
                }
            }

            return '';
        };

        //------------------------------- Date & Time Filtering  -----------
        var DateFiltering = function (contributions) {
            var contributionsProcessed = [];
            var ccreatedUTC, ccreated = null;
            if ($scope.fromDate !== undefined || $scope.toDate !== undefined) {
                var fromData = new Date($scope.fromDate);
                var toData = new Date($scope.toDate);
                contributions.forEach(function (c) {
                    if (c.created !== null) {
                        ccreatedUTC = Date.UTC(parseInt(c.created.substr(0, 4), 10), parseInt(c.created.substr(5, 2), 10) - 1, parseInt(c.created.substr(8, 2), 10) + 1);
                        ccreated = new Date(ccreatedUTC);
                        if (ccreated > fromData && ccreated < toData) {
                            contributionsProcessed.push(c);
                        }
                    }
                });
                return contributionsProcessed;

            } else {
                return contributions;
            }
        };

        //------------------------------- Date & Time Filtering  -----------

        //-------------- END ---------------- Karan Sheth -----------------------------------------
        var refresh = function(group, filters) {
            $http.post('/api/contributions/' + $scope.view.communityId + '/search', {
                query: {
                    communityId: $scope.view.communityId,
                    status: 'active',
                    pagesize: 1000
                }
            }).success(function(contributions) {
                $http.get('/api/links/buildson/' + $scope.view.communityId).success(function(links) {
                    contributions = new DateFiltering(contributions);
                    var data = processData(contributions, links, group, filters);
                    refreshView(data);
                });
            });
        };

        var processData = function(notes, links, group, filters) {
            var authors = {};
            var buildsonkey = [];
            var buildson = [];
            var privateNames = new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO', 'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'YY', 'ZZ');
            var i = 0;
            notes.forEach(function(note) {
                if (!filters || filters[note._id] ) {
                    note.authors.forEach(function(author){
                        if (typeof authors[author] !== 'undefined') {
                            authors[author].size++;
                        }
                        else{
                            if ((typeof group !== 'undefined' && group.members.indexOf(author) >= 0) || typeof group === 'undefined'){
                                if ($scope.isAdmin() || $community.getAuthor().role === 'manager'){
                                    authors[author] = {name: $community.getMember(author).getName(), size: 1}; // version avec les noms
                                }
                                else{ // anonyme
                                    // version anonymisée sauf l'auteur (le bloc if/else avec le tableau privateNames)
                                    if (author === $community.getAuthor()._id){
                                        authors[author] = {name: $community.getMember(author).getName(), size: 1} ;
                                    }
                                    else{
                                        authors[author] = {name: privateNames[i], size: 1} ; // version anonymisée
                                        i++;
                                    }
                                }
                            }
                        }
                    });
                }
            });

            links.forEach(function(link) {
                if (!filters || (filters[link.from] && filters[link.to])) {
                    if (link.type === "buildson") {
                        link._from.authors.forEach(function (source) {
                            link._to.authors.forEach(function (target) {
                                if (typeof buildsonkey[source + target] !== 'undefined') {
                                    buildsonkey[source + target].weight++;
                                }
                                else {
                                    buildsonkey[source + target] = {
                                        source: source,
                                        target: target,
                                        type: "buildson",
                                        weight: 1
                                    };
                                }
                            });
                        });
                    }
                }
            });

            // remove key
            for (var key in buildsonkey) {
               buildson.push(buildsonkey[key]);
            }

            return [authors, buildson];
        };

        var refreshView = function(data) {
            var tick = function () {
                path.attr("d", function(d) {
                    if (d.source.name !== d.target.name){
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                    }
                    else{ // self link
                        return "M" + d.source.x + "," + d.source.y + "A20,40 270,1,1 " + (d.target.x - 1) + "," + (d.target.y - 1);
                    }
                });
                markerPath.attr("d", function(d) {
                    if (d.source.name !== d.target.name){
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        var endX = (d.target.x + d.source.x) / 2;
                        var endY = (d.target.y + d.source.y) / 2;
                        var len = dr - ((dr/2) * Math.sqrt(3));

                        endX = endX + (dy * len/dr);
                        endY = endY + (-dx * len/dr);
                        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + endX + "," + endY;
                    }
                });

                circle.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

                text.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            };

            var normalizeNodeSize = function(s){
                return ((s - minsize) / maxsize * 20) + 8;
            };

            var normalizeLinkWidth = function(w){
                return ((w - minweight) / maxweight * 5) + 2;
            };

            var showInfos = function() {
                var currentName = $(d3.select(this)[0][0]).attr("name");
                var currentSize = $(d3.select(this)[0][0]).attr("size");
                var nbbuildsonothers = 0;
                var nbothersbuildson = 0;
                var buildsonothers = "";
                var othersbuildson = "";
                var currentClass = "";
                var txt = "";

                if (lastshown === currentName && $('#infos').html() !== ''){
                    hideInfos();
                }
                else{
                    lastshown = currentName;

                    $("path").attr('style', 'stroke: #eee');
                    $("path.marker_only").attr("marker-end", "url("+window.location.href+"#flecheinactif)");
                    $("circle").attr('style', "fill: #f0f0f0; stroke: #ccc");
                    $(d3.select(this)[0][0]).attr("style", "fill: #008; stroke: #ccc");
                    $(links).each(function() {
                        if (this.source.name === currentName){
                            if (this.source.name !== currentName){
                                $('circle[name="' + this.target.name + '"]').attr('style', 'fill: #080');
                            }
                            currentClass = $('path[name="' + this.source.name + this.target.name + '"]').attr('class');
                            $('path[name="' + this.source.name + this.target.name + '"]').attr('style', 'stroke: #080');
                            $('path[name="' + this.source.name + this.target.name + '"].marker_only').attr("marker-end", "url("+window.location.href+"#flecheverte)");
                            buildsonothers += "<li>" + this.weight + ' by ' + this.target.name + "</li>"; // traduire
                            nbbuildsonothers += this.weight;
                        }
                        else if (this.target.name === currentName){
                            //$('circle[name="' + this.source.name + '"]').attr('style', 'stroke: #800');
                            $('circle[name="' + this.source.name + '"]').attr('style', 'stroke: #000');
                            $('circle[name="' + this.source.name + '"]').attr('style', 'stroke-width: 3');
                            currentClass = $('path[name="' + this.source.name + this.target.name + '"]').attr('class');
                            $('path[name="' + this.source.name + this.target.name + '"]').attr('style', 'stroke: #800');
                            $('path[name="' + this.source.name + this.target.name + '"].marker_only').attr("marker-end","url("+window.location.href+"#flecherouge)");
                            othersbuildson += "<li>" + this.weight + ' by ' + this.source.name + "</li>"; // traduire
                            nbothersbuildson += this.weight;
                        }
                    });

                    txt = currentName + ' wrote ' + currentSize + ' note' + (currentSize > 1 ? 's' : '') + '.<br>'; // traduire
                    if (nbbuildsonothers > 0){
                        txt += currentName + " built onto " + nbbuildsonothers + " note" + (nbbuildsonothers > 1 ? 's' : '') +  "&nbsp;: <ul>" + buildsonothers + "</ul>" ; // traduire
                    }
                    if (nbothersbuildson > 0){
                        txt += nbothersbuildson + " note" + (nbothersbuildson > 1 ? 's were built' : ' was built') + "  onto notes written by " + currentName + "&nbsp;: <ul>" + othersbuildson + "</ul>" ; // traduire
                    }
                    $('#infos').html(txt);
                }
            };

            var hideInfos = function() {
                $("path").attr('style', 'stroke: #666');
                $("path.marker_only").attr("marker-end", "url("+window.location.href+"#flechenoire)");
                $("marker").attr('style', "fill-opacity: 1;");
                $("circle").attr('style', "fill: #ccc").attr('style', "stroke: #000");
                $("#infos").html('');
            };


            var minweight = null;
            var maxweight = null;
            var minsize = null;
            var maxsize = null;
            var lastshown = null;


            var nodes = data[0];
            var links = data[1];
            var cleanlinks = [];

            // for normalize node size
            for (var key in nodes) {
                var s = nodes[key].size;
                minsize = (minsize === null || s < minsize ? s : minsize);
                maxsize = (maxsize === null || s > maxsize ? s : maxsize);
            }

            // Compute the distinct nodes from the links + normalize link width
            links.forEach(function(link) {
                if (nodes[link.source] && nodes[link.target]){
                    link.source = nodes[link.source];
                    link.target = nodes[link.target];
                    minweight = (minweight === null || link.weight < minweight ? link.weight : minweight);
                    maxweight = (maxweight === null || link.weight > maxweight ? link.weight : maxweight);
                    cleanlinks.push(link);
                }
            });
            links = cleanlinks;

            var width = $("#network").width() - 20,
            height =600;

            var force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(260)
                .charge(-300)
                .on("tick", tick)
                .start();

            d3.select("#network svg").remove();
            $('#infos').html('');

            var svg = d3.select("#network").append("svg:svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id","network_svg").call(function () {

                });

            svg.append("svg:defs").selectAll("marker")
                .data(["flechenoire", "flecherouge", "flecheverte", "flecheinactif"])
                .enter().append("svg:marker")
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("markerWidth", 16)
                .attr("markerHeight", 16)
                .attr("orient", "auto")
                .attr("markerUnit", "strokeWidth")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

            var path = svg.append("svg:g").selectAll("path.link")
                .data(force.links())
                .enter().append("svg:path")
                .attr("stroke-width", function(d) { return normalizeLinkWidth(d.weight);})
                .attr("name", function(d) { return d.source.name + d.target.name;})
                .attr("class", function(d) { return "link " + d.type; });

            var markerPath = svg.append("svg:g").selectAll("path.marker")
                .data(force.links())
                .enter().append("svg:path")
                .attr("class", function(d) { return "marker_only " + d.type; })
                .attr("name", function(d) { return d.source.name + d.target.name;})
                .attr("marker-end", function() { return "url("+window.location.href+"#flechenoire)"; });

            var circle = svg.append("svg:g").selectAll("circle")
                .data(force.nodes())
                .enter().append("svg:circle")
                .on("click", showInfos)
                .attr("r", function(d) { return normalizeNodeSize(d.size); })
                .attr("name", function(d) { return d.name; })
                .attr("size", function(d) { return d.size; })
                .call(force.drag);

            var text = svg.append("svg:g").selectAll("g")
                .data(force.nodes())
                .enter().append("svg:g");

            text.append("svg:text")
                .attr("x", 8)
                .attr("y", ".31em")
                .attr("class", "shadow")
                .text(function(d) { return d.name; });

            text.append("svg:text")
                .attr("x", 8)
                .attr("y", ".31em")
                .text(function(d) { return d.name; });

        };


    });

