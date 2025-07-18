'use strict';

/* global d3 */
/* global crossfilter */
/* global dc */
/* global vis */

angular.module('kf6App')
    .controller('S2vizCtrl', function($scope, $stateParams, $http, $community, $chord) {
        var communityId = $stateParams.communityId;
        $scope.status = {};
        $scope.status.graphCollapsed = false;
        $scope.status.directional = false;
        $scope.status.nodesize = 10;
        $scope.status.edgewidth = 10;

        $community.enter(communityId, function() {
            $community.getSocialInteractions(function(interactions) {
                init(interactions);
            });
        });

        var init = function(interactions) {

            var ndx = crossfilter(interactions);

            var dateDim = ndx.dimension(function(d) {
                return d.day;
            });
            var typeDim = ndx.dimension(function(d) {
                return d.type;
            });

            var minDate = dateDim.bottom(1)[0].date;
            var maxDate = dateDim.top(1)[0].date;

            var readGroup = dateDim.group().reduceSum(function(d) {
                return d.read;
            });

            var hitslineChart = dc.barChart('#chart-line-hitsperday');
            hitslineChart
                .width(700).height(200)
                .dimension(dateDim)
                .group(readGroup, 'Lecture')
                //.renderArea(true)//for line chart
                .centerBar(true) //for line chart
                .x(d3.time.scale().domain([minDate, maxDate]))
                .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
                .yAxisLabel('Visites par jour');

            var readingChord = $chord.init($scope, $('#reading-chord'));
            var beingReadChord = $chord.init($scope, $('#beingread-chord'));

            var refreshChords = function() {
                var filteredInteractions = typeDim.filter('read').top(Infinity);
                var data;

                data = [];
                filteredInteractions.forEach(function(i) {
                    var d = {};
                    d.importer1 = i.from;
                    d.importer2 = i.to;
                    d.flow1 = 0.1;
                    d.flow2 = 1;
                    data.push(d);
                });
                readingChord.drawChords(data);

                data = [];
                filteredInteractions.forEach(function(i) {
                    var d = {};
                    d.importer1 = i.from;
                    d.importer2 = i.to;
                    d.flow1 = 1;
                    d.flow2 = 0.1;
                    data.push(d);
                });
                beingReadChord.drawChords(data);
            };

            // network
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            {
                // create a network
                var container = document.getElementById('socialnetwork');
                var data = {
                    nodes: nodes,
                    edges: edges
                };
                var options = {
                    nodes: {
                        shape: 'dot'
                    },
                    physics: {
                        barnesHut: {
                            "gravitationalConstant": -3900,
                            "centralGravity": 0
                        },
                        minVelocity: 1
                    },

                };
                /*var network = */
                new vis.Network(container, data, options);
            }

            var gid = 1;
            var getId = function(table, tag) {
                if (!table[tag]) {
                    table[tag] = gid;
                    gid++;
                }
                return table[tag];
            };
            var toNodesArray = function(table) {
                var array = [];
                Object.keys(table).forEach(function(key) {
                    array.push({ id: table[key], label: key, size: $scope.status.nodesize, font: { size: 10 } });
                });
                return array;
            };
            var toEdgesArray = function(table) {
                var array = [];
                Object.keys(table).forEach(function(key) {
                    var edge = table[key];
                    edge.title = edge.value;
                    edge.value = edge.value * ($scope.status.edgewidth / 10);
                    if (edge.value < 1) {
                        edge.value = 1;
                    }
                    array.push(edge);
                });
                return array;
            };

            var refreshGraphs = function() {
                var nodesTable = {};
                var edgesTable = [];
                var filteredInteractions = typeDim.filter('read').top(Infinity);
                filteredInteractions.forEach(function(i) {
                    var fromId = getId(nodesTable, i.from);
                    var toId = getId(nodesTable, i.to);
                    if (fromId === toId) {
                        return;
                    }
                    var key = fromId + 'to' + toId;
                    if ($scope.status.directional) {
                        if (!edgesTable[key]) {
                            edgesTable[key] = { from: fromId, to: toId, value: 0, arrows: 'to' };
                        }
                        var edge = edgesTable[key];
                        edge.value++;
                    } else { //bi-directional
                        var key2 = toId + 'to' + fromId;
                        var edge1 = edgesTable[key];
                        var edge2 = edgesTable[key2];
                        if (!edge1 && !edge2) {
                            edgesTable[key] = { from: fromId, to: toId, value: 0 };
                        } else if (edge1) {
                            edge1.value++;
                        } else if (edge2) {
                            edge2.value++;
                        } else {
                            console.error('never come this state');
                        }
                    }
                });
                nodes.clear();
                nodes.add(toNodesArray(nodesTable));

                // create an array with edges
                edges.clear();
                edges.add(toEdgesArray(edgesTable));
            };

            var refreshNetworks = function() {
                refreshChords();
                refreshGraphs();
            };

            $scope.graphSettingChanged = function() {
                refreshNetworks();
            };

            // dummy for update
            var hits = dateDim.group().reduceSum(function(d) {
                return d.total;
            });
            var dummy = dc.pieChart('#dummy');
            dummy
                .width(200).height(200)
                .dimension(dateDim)
                .group(hits)
                .innerRadius(30);
            dummy.doRedraw = function() {
                refreshNetworks();
            };
            dummy.doRender = function() {
                refreshNetworks();
            };
            // dummy end

            dc.renderAll();
        };

        //// Thinking Usability
        // $scope.mode = 'Selecting';
        // var hitslineChart;
        // $scope.changeMode = function() {
        //     if ($scope.mode === 'Selecting') {
        //         $scope.mode = 'Zooming';
        //         hitslineChart.mouseZoomable(true);
        //         hitslineChart.brushOn(false);
        //         dc.renderAll();
        //     } else {
        //         $scope.mode = 'Selecting';
        //         hitslineChart.mouseZoomable(false);
        //         hitslineChart.brushOn(true);
        //         dc.renderAll();
        //     }
        // };

    });
