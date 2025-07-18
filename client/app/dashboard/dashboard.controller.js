'use strict';

/* global d3 */
/* global crossfilter */
/* global dc */

angular.module('kf6App')
    .controller('DashboardCtrl', function ($scope, $stateParams, $http, $community, Auth, FileSaver, $filter) {

        var communityId = $stateParams.communityId;

        // Added Auth Parameter & getUserName function
        var currentUser = Auth.getCurrentUser();
        currentUser = currentUser.firstName + ' ' + currentUser.lastName;

        $community.enter(communityId, function () {
            $community.getSocialInteractions(function (interactions) {
                init(interactions);
            });
        });

        //Data Holders
        var labelCounter=0;
        var labels = [];
        // var ofs = 0, pag = 20;

        var colorArrList = [
            '#e6550d',
            '#c75d44',
            '#f88098',
            '#ff9900',
            '#dc8a94',
            '#ffcc00',
            '#f4c81e',
            '#f6d44f',
            '#fae698',
            '#31a354'
        ];

        //---- Statics Total ----------



        var init = function (data) {

            var ndx = crossfilter(data);

            var all = ndx.groupAll();

            var dateDimension = ndx.dimension(function (d) {
                return d.date;
            });
            var dayDimension = ndx.dimension(function (d) {
                return d.day;
            });
            var typeDimension = ndx.dimension(function (d) {
                return d.type;
            });
            var authorDimension = ndx.dimension(function (d) {
                return d.from;
            });
            var viewDimension = ndx.dimension(function (d) {
                if(d.view===undefined){
                    return "Deleted";
                }
                return d.view;
            });







            var minDate = dateDimension.bottom(1)[0].date;
            var maxDate = dateDimension.top(1)[0].date;

            //TODO: DELETE
            // var maxDateTrimmed = new Date();
            // var minDateTrimmed = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

            // console.log(minDate);




            // var domainTrimmed = [minDateTrimmed, maxDateTrimmed];
            var domain = [minDate, maxDate];

            // console.log(d3.time.scale().domain(domain));


            var readGroup = dayDimension.group().reduceSum(function (d) {
                return d.read;
            });
            var modifyGroup = dayDimension.group().reduceSum(function (d) {
                if(d.hasOwnProperty('modified')){
                    return d.modified;
                }
                return 0;
            });
            var typeGroup = typeDimension.group().reduceSum(function (d) {
                return d.value;
            });
            var authorGroup = authorDimension.group().reduceSum(function (d) {
                return d.value;
            });
            var viewGroup = viewDimension.group().reduceSum(function (d) {
                return d.value;
            });



            authorGroup.all().forEach(function (d) {
                labels[d.key] = isCurrentUser(d);
            });


            // Color Ranging
            var maxAuthor = authorGroup.top(1)[0].value;
            var quantize = d3.scale.quantile().domain([0, maxAuthor]).range(d3.range(10));

            authorGroup.all().forEach(function (d) {
                labels[d.key] = isCurrentUser(d);
            });

            var typeChart = dc.pieChart('#type-chart');
            var authorChart = dc.rowChart('#author-chart');
            var lineChart = dc.lineChart('#line-chart');
            var rangeChart = dc.barChart('#range-chart');
            var recordCount = dc.dataCount('.dc-data-count');
            var recordTable = dc.dataTable('.dc-data-table');
            var staticsTable = dc.dataTable('.dc-statics-table');
            var viewSelect = dc.selectMenu('#viewSelect');


            //Custom Functions

            //TODO: DELETE
            //Anonymise Label
            // function anonymiseLabelGenerator(limit) {
            //     var count = 0;
            //     limit = limit-1;
            //     var labels = [];
            //     var alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            //     while (count<=limit){
            //         var x='';
            //         for (var i = 0; i <= Math.floor(count/26); i++) {
            //             x=x+alphabets[count%26];
            //         }
            //         count=count+1;
            //         labels.push(x);
            //     }
            //     return labels;
            // }

            //=====================================================

            function isCurrentUser(d) {
                if ($community.getAuthor().role === 'writer') {
                    if (d.key === $community.getAuthor().getName()) {

                        return d.key;
                        // return d.from + ' (' + d.value + ')';
                        // return d.key.charAt(0) + ' (' + d.value + ')';
                    }
                    //  Some Other Option
                    //  return d.key + " : " + d.value + " - " +(d.value / totalAuthorGroup.value() * 100).toFixed(2) + "%";
                    else {
                        var alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                        var x='';
                        for (var i = 0; i <= Math.floor(labelCounter/26); i++) {
                            x=x+alphabets[labelCounter%26];
                        }
                        labelCounter=labelCounter+1;
                        return x;
                    }
                }
                else {
                    return d.key;
                }

            }


            //TypeChart
            typeChart
                .width(180)
                .height(180)
                .radius(80)
                .innerRadius(0)
                .dimension(typeDimension)
                .group(typeGroup)
                .label(function (d) {
                    // console.log(d)
                    var label = d.key;
                    if (typeChart.hasFilter() && !typeChart.hasFilter(label)) {
                        return label + '(0)';
                    }
                    if (all.value()) {
                        // label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
                        label += "("+d.value+")";
                    }
                    return label;
                });

            // TODO: DELETE
            // var authorLabels = anonymiseLabelGenerator(authorGroup.all().length);
            // console.log(authorGroup.size())
            var heightRowChart = 0;
            heightRowChart = (authorGroup.all().length) * 25;
            if (heightRowChart <= 125) {
                heightRowChart = (authorGroup.all().length) * 50;
            }

            //TODO: NEW UI - Row Chart (Authors) Dynamic Width
            // var authorChartWidth = document.getElementById("authorsChart").offsetWidth;
            //AuthorChart
            authorChart
                .width(900)
                .height(heightRowChart)
                .margins({top: 20, left: 0, right: 0, bottom: 20})
                .dimension(authorDimension)
                .group(authorGroup)
                .label(function (d) {
                    // return d.key + " : " + d.value + " - " +(d.value / totalAuthorGroup.value() * 100).toFixed(2) + "%";
                    return labels[d.key]+' (' + d.value + ')';
                })
                .title(function (d) {
                    return labels[d.key]+' (' + d.value + ')';
                })
                .elasticX(true)
                .colors(function (d) {
                    // console.log(d);
                    return colorArrList[d];
                })
                .colorAccessor(function (d) {
                    // console.log(d);
                        return quantize(d.value);
                })
                .xAxis().ticks(4);


            // TODO: NEW UI - Line Chanrt Height
            //var lineChartWidth = document.getElementById("rd").offsetWidth;

            // var piChartHeight = document.getElementById("type-chart").style.height;

            // console.log(dayDimension.top(Infinity));
            // console.log(readGroup.all());
            // console.log(modifyGroup.all());





            //LineChart
            lineChart
                .renderArea(true)
                .width(900)
                .height(180)
                .transitionDuration(1000)
                .margins({top: 30, right: 50, bottom: 25, left: 40})
                .dimension(dayDimension)
                .group(modifyGroup, 'Modify')
                .valueAccessor(function (d) {
                    return d.value;
                })
                .stack(readGroup, 'Read')
                .title(function (d) {
                    var value = d.value;
                    if (isNaN(value)) {
                        value = 0;
                    }
                    return d.key + '\n' + value;
                })
                .mouseZoomable(true)
                .rangeChart(rangeChart)
                // .gap(1)
                .x(d3.time.scale().domain(domain))
                .round(d3.time.month.round)
                .xUnits(d3.time.month)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                // TODO: NEW UI - Line Chanrt Height
                // .legend(dc.legend().x(lineChartWidth-100).y(30).itemHeight(13).gap(1))
                .legend(dc.legend().x(800).y(30).itemHeight(13).gap(1))
                .brushOn(false);

            //Range Chart
            rangeChart.width(900)
                .height(40)
                .margins({top: 0, right: 50, bottom: 20, left: 40})
                .dimension(dayDimension)
                .group(readGroup)
                .centerBar(true)
                .gap(1)
                .x(d3.time.scale().domain(domain))
                .round(d3.time.days.round)
                .alwaysUseRounding(true)
                .xUnits(d3.time.days)
                .yAxis().ticks(0);


                // .width(lineChartWidth)
                // .height(40)
                // .margins({top: 0, right: 50, bottom: 20, left: 40})
                // .dimension(dayDimension)
                // .group(readGroup, 'Read')
                // // .stack(modifyGroup, 'Modify')
                // .centerBar(true)
                // .gap(1)
                // .x(d3.time.scale().domain(domain))
                // .round(d3.time.days.round)
                // //.alwaysUseRounding(true)
                // .xUnits(d3.time.days);


            //TODO: Reference - Chart Filter Call Back Function
            // authorChart.on('filtered', function(chart) {
            //     if(chart.filters().length) staticsDimension.filterFunction(function(k) {return chart.filters().indexOf(k) !== -1; });
            //     else {
            //         staticsDimension.filter(null);
            //     }
            //     dc.redrawAll()
            // });


            //---- Activity Statics: Step-1 (Aggrigate Data) ----
            var groupedDimension = authorDimension.group().reduce(
                function (p, v) {
                    // console.log("Add:"+JSON.stringify(p)+"& Value:"+JSON.stringify(v));
                    p[v.type] += 1;
                    p.total += 1;

                    return p;
                },
                function (p, v) {
                    //console.log("Remove:"+JSON.stringify(p));
                    p[v.type] -= 1;
                    p.total -= 1;
                    return p;
                },
                function () {
                    // return {number: 0, total: 0, avg: 0}
                    return {read: 0, modified: 0, created:0, total:0 };
                });


            // var temp = [];
            //---- Activity Statics: Step-2 ----
            function removeEmptyBins(sourceGroup) {
                function nonZeroPred(d) {
                    return d.value.total !== 0;
                }
                return {
                    accessor: function () {
                        return "x";
                    },
                    top: function(n) {
                        return sourceGroup.top(Infinity)
                            .filter(nonZeroPred)
                            .slice(0, n);
                    },
                    bottom: function(n) {
                        var data;

                        var totalCounter = function(group){
                            // console.log(group.length);
                            var totalActions = {read: 0, modified: 0, created:0, total:0 };
                            angular.forEach(group, function(value) {
                                totalActions.read +=  value.value.read;
                                totalActions.created +=  value.value.created;
                                totalActions.modified +=  value.value.modified;
                                totalActions.total +=  value.value.total;
                            });
                            //-------- Total Counts ---------------
                            $("#tRead").html(totalActions.read);
                            $("#tCreated").html(totalActions.created);
                            $("#tModified").html(totalActions.modified);
                            $("#tTotal").html(totalActions.total);

                            //------ Avarage Counts ---------------
                            $("#aRead").html((totalActions.read/group.length).toFixed(2));
                            $("#aCreated").html((totalActions.created/group.length).toFixed(2));
                            $("#aModified").html((totalActions.modified/group.length).toFixed(2));
                            $("#aTotal").html((totalActions.total/group.length).toFixed(2));

                            // $scope.totalStatics = totalActions;

                        };


                        if(authorChart.filters().length !== 0){
                            data = sourceGroup.top(Infinity).filter(function(k){
                                return authorChart.filters().indexOf(k.key) !== -1;
                            });
                        }
                        else{
                            data = sourceGroup.top(Infinity)
                                .filter(nonZeroPred)
                                .slice(-n).reverse();
                        }

                        totalCounter(data);
                        return data;
                    }
                    //TODO: Reference - Activity Statics
                    // filter: function(d) {
                    //     console.log(d)
                    //     return source_group.top(Infinity).filter(function(k){
                    //         console.log(d.indexOf(k.key) !== -1)
                    //         return d.indexOf(k.key) !== -1;
                    //     });
                    //     // return  {read: 0, modified: 0, created:0, total:0 }
                    // }
                };
            }




            //--- General CSV Download Function ----
            var downloadCSV =function (data) {
                var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
                // console.log($community.getCommunityData().community.title)
                FileSaver.saveAs(blob, "Activity_Dashboard_Statics_"+$community.getCommunityData().community.title+".csv");


            };

            //--- Activity Statics Download Function ---
            $scope.staticsTableDownload = function () {
                var data = [];
                var rawData = $filter('orderBy')(statDim.bottom(0), 'key');
                angular.forEach(rawData, function(value) {
                    var dataHolder = {
                        "User Name":labels[value.key],
                        "# of Reads":value.value.read,
                        "# of Modified":value.value.modified,
                        "# of created":value.value.created,
                        "Total": value.value.total
                    };
                    data.push(dataHolder);
                });
                downloadCSV(data);
            };



            //---- Activity Statics: Step-0 (Fake Dimension) ----
            var statDim = removeEmptyBins(groupedDimension);

            //--------------------------------------------------
            //--------------------
            // var StaticsAuthorGroup = authorDimension.group().reduceSum(function (d) {
            //     return d.value;
            // });
            //
            // var reducer = reductio()
            //     .avg(function(d) {
            //         // console.log(d);
            //         return +d.read; });

           //  var x = groupedDimension;
           //
           // var  y=  reducer(x);


            // console.log(y);

            // console.log(groupedDimension.top(Infinity));
            //--------------------




            //--- Statics Table ---
            staticsTable
                .dimension(statDim)
                .columns(["Date","","",""])
                .group(function () {
                    // console.log(authorDimension.top(Infinity))
                    // console.log(dim.top(Infinity))
                    // var format = d3.format('02d');
                    // return d.year.getFullYear() + '/' + format(d.month.getMonth() + 1);
                    return " ";
                })
                .size(1000)
                .columns([{
                    label: "User",
                    format: function (d) {
                        return labels[d.key];
                    }},
                    {
                        label: "Read",
                        format: function (d) {
                            return d.value.read;
                        }},
                    {
                        label: "Modified",
                        format: function (d) {
                            return d.value.modified;
                        }},
                    {
                        label: "Created",
                        format: function (d) {
                            // return labels[d.from];
                            return d.value.created;

                        }},
                    {
                        label: "Total",
                        format: function (d) {
                            // return labels[d.from];
                            return d.value.total;

                        }}
                ])
                .sortBy(function (d) {
                    return d.key;
                })
                .order(d3.ascending)
                .showGroups(false)
                .on('renderlet', function (table) {
                    table.selectAll('.dc-table-label').classed('info', true);
                    // Clear jQuery DataTable if already created
                    if ( $.fn.dataTable.isDataTable('#dc-statics-table') ) {
                        $('#dc-statics-table').dataTable().fnDestroy();
                    }
                    // create jQuery DataTable
                    var title = 'User Activity Statistics ',
                        filename =  "KF6-AD";

                    $('#dc-statics-table').dataTable({
                        dom: 'lTf<"html5buttons"B>gitp',
                        buttons: [
                            {extend: 'csv',
                                title: title,
                                filename:filename},
                            {extend: 'excel',
                                title: title,
                                filename:filename},
                            {extend: 'pdf',
                                title: title,
                                filename:filename,
                                pageSize: "LETTER",
                                footer: true,
                                customize: function(doc) {
                                    doc.defaultStyle.alignment = 'right';
                                    doc.styles.tableHeader.alignment = 'right';
                                }
                            }
                        ]

                    });
                });

            //className: 'btn btn-default'
            $scope.reset = function () {
                lineChart.filterAll();
                rangeChart.filterAll();
                dc.renderAll();
            };


            //Count
            recordCount
                .dimension(ndx)
                .group(all);

            //Table
            recordTable
                .dimension(dateDimension)
                .columns(["Date","","",""])
                .group(function (d) {
                    //console.log(authorDimension.top(Infinity))
                    //console.log(all.reduceCount());
                    //console.log(staticsDimension.top(Infinity))
                    var format = d3.format('02d');
                    return d.year.getFullYear() + '/' + format(d.month.getMonth() + 1);
                })
                .size(1000)
                .columns([{
                    label: "Change",
                    format: function (d) {
                        return d.date;
                    }},
                    {
                        label: "Action",
                        format: function (d) {
                        return d.type;
                    }},
                    {
                        label: "Title",
                        format: function (d) {
                            var str = "";
                            str += '<a target="_blank" href="/contribution/' + d.ID + ' ">';
                            str += d.title;
                            str += '</a>';
                        return str;
                    }},
                    {
                        label: "User",
                        format: function (d) {
                        return labels[d.from];
                    }}
                ])
                .sortBy(function (d) {
                    return d.date;
                })
                .order(d3.ascending)
                .on('renderlet', function (table) {
                    table.selectAll('.dc-table-group').classed('info', true);
                });

            $scope.reset = function () {
                lineChart.filterAll();
                rangeChart.filterAll();
                dc.renderAll();
            };
            //TODO: NEW UI - Pagination
            // use odd page size to show the effect better


            viewSelect
                .dimension(viewDimension)
                .group(viewGroup)
                .title(function (d) {
                    return d.key;
                })
                // .multiple(true)
                // .numberVisible(10)
                .controlsUseVisibility(true);
            /*
            function display() {
                d3.select('#begin')
                    .text(ofs);
                d3.select('#end')
                    .text(ofs+pag-1);
                d3.select('#last')
                    .attr('disabled', ofs-pag<0 ? 'true' : null);
                d3.select('#next')
                    .attr('disabled', ofs+pag>=ndx.size() ? 'true' : null);
                d3.select('#size').text(ndx.size());
            }
            function update() {
                recordTable.beginSlice(ofs);
                recordTable.endSlice(ofs+pag);
                display();
            }
            $scope.next = function () {
                ofs += pag;
                update();
                recordTable.redraw();
            };
            $scope.last=function () {
                ofs -= pag;
                update();
                recordTable.redraw();
            };
            update();
            */

            // rendering

            dc.renderAll();

        };

    });


