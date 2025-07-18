'use strict';

/* global jsPlumb */
/* global vis */

angular.module('kf6App')
    .controller('TimemachineCtrl', function($scope, $http, $stateParams, $community, $compile, $timeout, socket, Auth, $location, $kfutil, $ac) {
        var viewId = $stateParams.viewId;
        $scope.menuStatus = $stateParams.menuStatus;
        if ($scope.menuStatus) {
            $('#maincanvas').addClass('KFViewMainCanvas0');
        }

        $kfutil.mixIn($scope);
        $scope.community = {};
        $scope.view = {};
        $scope.views = [];
        $scope.refs = [];

        $scope.status = {};
        $scope.setting = $community.makeDefaultViewSetting();
        $scope.dragging = 'none';

        $scope.initialize = function() {
            $community.getObject(viewId, function(view) {
                $scope.view = view;
                $ac.mixIn($scope, view);
                $community.enter(view.communityId, function() {
                    $scope.community = $community.getCommunityData();
                    $scope.views = $community.getViews();
                    $scope.updateCanvas();
                    $scope.updateViewSetting();

                    $scope.initializeReplaySystem();
                });
            }, function(msg) {
                $scope.status.error = true;
                $scope.status.errorMessage = msg;
            });
        };

        $scope.updateViewSetting = function() {
            //this is temporary code. coherent plan for context management would be expected.(Yoshiaki)
            $community.getContext(null, function(context) {
                $scope.context = context;
            });
            //temporary code end

            if ($scope.view.data && $scope.view.data.viewSetting) {
                $scope.setting = $scope.view.data.viewSetting;
            } else {
                $community.getContext(viewId, function(context) {
                    if (context.data.viewSetting) {
                        $scope.setting = context.data.viewSetting;
                    }
                });
            }
        };

        $scope.updateCanvas = function() {};

        $scope.settingChanged = function() {
            $scope.refreshAllConnections();
        };

        $scope.updateRef = function(ref) {

            // show only contains
            if (ref.type !== 'contains') {
                console.warn('item is not \'contains\'');
                return null;
            }

            // assure data
            if (!ref._to) {
                console.warn('ref._to not found');
                ref._to = {};
            }
            if (!ref.data) {
                ref.data = {};
            }

            // show only active
            if (ref._to.status !== 'active') {
                _.remove($scope.refs, function(obj) {
                    return obj === ref;
                });
                return null;
            }

            // show only readable
            if (!$ac.isReadable(ref._to)) {
                _.remove($scope.refs, function(obj) {
                    return obj === ref;
                });
                return null;
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

            return ref;
        };

        $scope.loadAsShowInPlace = function(ref) {
            $community.getObject(ref.to, function(contribution) {
                ref.contribution = contribution;
            });
        };

        $scope.loadAsIcon = function(ref) {
            ref.authorObjects = [];

            ref.getIcon = function() {
                var iconroot = 'manual_assets/kf4images/';
                return iconroot + ref.getIconFile();
            };

            ref.isRiseabove = function() {
                return ref._to.data && ref._to.data.riseabove;
            };

            ref.getIconFile = function() {
                if (ref._to.type === 'View') {
                    return 'icon-view.gif';
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
                    name += '.gif';
                    return name;
                }
            };

            if (ref._to.type === 'View') {
                return;
            }

            ref.getAuthorString = function() {
                return $community.makeAuthorString(ref.authorObjects);
            };
            ref.amIAuthor = function() {
                return $community.amIAuthor(ref);
            };
            if (ref._to.authors) {
                ref._to.authors.forEach(function(id) {
                    ref.authorObjects.push($community.getMember(id));
                });
            }
        };

        $scope.refreshReadStatus = function(ref) {
            $http.get('/api/records/myreadstatus/' + $scope.view.communityId + '/' + ref.to).success(function(readlink) {
                ref.readlink = readlink;
            });
        };

        $scope.refreshAllReadStatus = function() {
            var authorId = $scope.community.author._id;
            if (authorId === null) {
                return;
            }
            $http.get('/api/records/myreadstatusview/' + $scope.view.communityId + '/' + $scope.view._id).success(function(readlinks) {
                readlinks.forEach(function(readlink) {
                    $scope.updateRefRead(readlink);
                });
            });

            socket.socket.emit('subscribe', 'linkfrom:' + authorId);
            socket.socket.on('link:save', function(link) {
                if (link.type === 'read') {
                    $scope.updateRefRead(link);
                }
            });
            $scope.$on('$destroy', function() {
                socket.socket.emit('unsubscribe', 'linkfrom:' + authorId);
                socket.socket.removeAllListeners('link:save');
            });
        };

        $scope.updateRefRead = function(readlink) {
            var refs = _.filter($scope.refs, function(ref) {
                return ref.to === readlink.to;
            });
            refs.forEach(function(ref) {
                ref.readlink = readlink;
            });
        };

        $scope.refreshConnection = function(id) {
            $http.get('/api/links/either/' + id).success(function(links) {
                links.forEach(function(link) {
                    $scope.createConnection(link);
                });
            });
        };

        $scope.refreshAllConnections = function() {
            $scope.clearAllConnections();
            if ($scope.jsPlumb) {
                $http.get('/api/links/view/' + $scope.view._id).success(function(links) {
                    links.forEach(function(link) {
                        $scope.createConnection(link);
                    });
                });
            }
        };

        /* ----------- connections --------- */

        $scope.connectionIdCounter = 0;
        $scope.jsPlumb = undefined;
        $scope.repaintRequest = false;
        $scope.$watch('repaintRequest', function() {
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

        $scope.generateConnectionId = function() {
            $scope.connectionIdCounter++;
            return 'kfconnection' + $scope.connectionIdCounter;
        };

        $scope.repaintConnections = function() {
            $scope.repaintRequest = true;
        };

        $scope.createConnection = function(link) {
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

        $scope.createConnection0 = function(link, color, label) {
            var fromElements = $('.icon' + link.from);
            var toElements = $('.icon' + link.to);
            fromElements.each(function() {
                var fromElement = $(this);
                toElements.each(function() {
                    var toElement = $(this);
                    $scope.createConnection1(fromElement, toElement, color, label);
                });
            });
        };

        $scope.createConnection1 = function(fromElement, toElement, color, label) {
            var fromId = $scope.generateConnectionId();
            fromElement.attr('id', fromId);
            var toId = $scope.generateConnectionId();
            toElement.attr('id', toId);
            var conn = $scope.jsPlumb.connect({
                source: fromId,
                target: toId,
                type: 'kfarrow',
                data: {
                    color: color,
                    label: label
                }
            });
            if (conn) {
                $('#' + fromId).on('$destroy', function() {
                    if (conn.detached !== true && conn.endpoints) {
                        try {
                            $scope.jsPlumb.detach(conn);
                        } catch (e) {
                            console.error(e);
                        }
                        conn.detached = true;
                    }
                });
                $('#' + toId).on('$destroy', function() {
                    if (conn.detached !== true && conn.endpoints) {
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

        $scope.clearAllConnections = function() {
            if ($scope.jsPlumb) {
                $scope.jsPlumb.detachEveryConnection();
            }
        };

        jsPlumb.ready(function() {
            $scope.jsPlumb = jsPlumb.getInstance();
            $scope.jsPlumb.setContainer($('#maincanvas'));
            $scope.jsPlumb.importDefaults({
                Connector: ['Straight'],
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
                'kfarrow': {
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
                    paintStyle: {
                        stroke: '${color}',
                        strokeWidth: 1
                    }
                },
            });
            $scope.initialize();
        });

        /* ----------- creation --------- */
        //$scope.createContainsLink = function(toId, data, handler) {};
        $scope.createContainsLink = function() {};

        $scope.saveRef = function() {
            //$community.saveLink(ref);
            //for refresh
            $scope.refreshAllConnections();
        };

        /* ----------- open window --------- */

        $scope.openContribution = function(id, e, w) {
            if (e) {
                if (e.ctrlKey === true || e.button !== 0) {
                    return;
                }
            }
            var url = 'contribution/' + id + '/' + viewId;

            if (w) {
                w.location.href = url;
                return;
            }
            if (!$kfutil.isMobile()) {
                return $scope.openByInternalWindow(url);
            } else {
                window.open(url);
            }

        };

        $scope.openView = function(id) {
            var url = 'view/' + id;
            $scope.gotoURL(url);
        };

        $scope.mOpenContribution = function() {
            $scope.openContribution($scope.contextTarget.to);
        };

        $scope.mOpenContributionInTab = function() {
            var url = 'contribution/' + $scope.contextTarget.to + '/' + viewId;
            window.open(url, '_blank');
        };

        $scope.mOpenContributionInPopup = function() {
            var url = 'contribution/' + $scope.contextTarget.to + '/' + viewId;
            $scope.openInPopup(url);
        };

        $scope.mOpenView = function() {
            $scope.openView($scope.contextTarget.to);
        };

        $scope.mOpenViewInInternal = function() {
            var url = 'view/' + $scope.contextTarget.to;
            $scope.openByInternalWindow(url);
        };

        $scope.mOpenViewInPopup = function() {
            var url = 'view/' + $scope.contextTarget.to;
            $scope.openInPopup(url);
        };

        $scope.gotoURL = function(url) {
            $location.path(url);
        };

        $scope.openInPopup = function(url) {
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

        $scope.openByInternalWindow = function(url) {
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

        $scope.openByIFrame = function(url, width, height) {
            windowIdNum++;
            var wid = 'window' + windowIdNum;
            var str = '<iframe style="min-width: 100%;" id="' + wid + '" title="*" src="' + url + '"></iframe>';
            $('#windows').append(str);
            $('#' + wid).dialog({
                width: width,
                height: height,
                create: function() {
                    $(this).css('padding', '1px');
                    var contentWindow = document.getElementById(wid).contentWindow;
                    contentWindow.wid = wid;
                    contentWindow.openContribution = function(id) {
                        return $scope.openContribution(id);
                    };
                    contentWindow.setInternalWindowTitle = function(title) {
                        $('#' + wid).dialog('option', 'title', title);
                    };
                },
                open: function() {
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
                drag: function() {
                    _.remove(frames, function(n) {
                        return n === wid;
                    });
                },
                close: function() { /*we need to erase element*/
                    _.remove(frames, function(n) {
                        return n === wid;
                    });
                    $(this).remove();
                }
            });
            return wid;
        };

        /** replay system **/
        $scope.initializeReplaySystem = function() {
            $scope.initializeRecords(function(playlist) {
                $scope.initializeTimeline(playlist);
                $scope.player.reset(playlist);
            });
        };

        $scope.initializeRecords = function(handler) {
            $community.refreshMembers();
            $http.post('api/records/search/' + $scope.view.communityId, { query: { targetId: $scope.view._id } }).success(function(records) {
                var playlist = [];

                records.forEach(function(record) {
                    if (record.type === 'modified' && record.historicalVariableName === 'contains') {
                        playlist.push(record);
                    }
                });

                $scope.fillHistoricalObjects(playlist, function() {
                    $scope.checkAndComplement(playlist, function() {
                        playlist = $scope.prune(playlist);
                        handler(playlist);
                    });
                });
            });
        };

        var timeline;
        $scope.initializeTimeline = function(playlist) {
            var container = document.getElementById('timeline');

            // Create a DataSet (allows two way data-binding)
            var dataset = [];
            var id = 0;
            playlist.forEach(function(each) {
                dataset.push({
                    id: id,
                    content: each.historicalOperationType,
                    start: each.timestamp,
                    title: ''
                });
                id++;
            });
            var items = new vis.DataSet(dataset);

            // Configuration for the Timeline
            // var options = {};
            var options = { height: '100px', stack: false, showCurrentTime: false };

            // Create a Timeline
            timeline = new vis.Timeline(container, items, options);

            // bar
            if (playlist.length <= 0) {
                return;
            }

            timeline.addCustomTime(new Date(), 'currenttime');
            timeline.on('select', function(properties) {
                if (properties.items && properties.items.length > 0) {
                    var item = properties.items[0]; //id
                    $scope.player.gotoFrame(item);
                }
            });
        };

        $scope.scaleFit = function() {
            timeline.fit();
        };

        $scope.scaleUp = function() {
            $scope.scale(0.5);
        };
        $scope.scaleUpBig = function() {
            $scope.scale(0.1);
        };

        $scope.scaleDown = function() {
            $scope.scale(2.0);
        };
        $scope.scaleDownBig = function() {
            $scope.scale(5.0);
        };

        $scope.focus = function() {
            timeline.setSelection(timeline.getSelection(), { focus: true });
        };

        $scope.scale = function(scale) {
            var r = timeline.getWindow();
            var startTime = r.start.getTime();
            var endTime = r.end.getTime();
            var range = endTime - startTime;
            var newRange = range * scale;
            var center = (endTime + startTime) / 2;
            r.start = new Date(center - newRange / 2);
            r.end = new Date(center + (newRange / 2));
            timeline.setWindow(r);
        };

        $scope.fillHistoricalObjects = function(records, handler) {
            var ids = [];
            records.forEach(function(record) {
                if (record.historicalObjectId) {
                    ids.push(record.historicalObjectId);
                }
            });
            $community.searchHistoricalObjects({ pagesize: 100000, _id: { $in: ids } }, function(objects) {
                var catalog = {};
                objects.forEach(function(each) {
                    catalog[each._id] = each;
                });
                records.forEach(function(record) {
                    record.historicalObject = catalog[record.historicalObjectId];
                });
                handler();
            });
        };

        //To compliment missing ref record for builds-on
        $scope.checkAndComplement = function(records, handler) {
            var refs1 = [];
            records.forEach(function(each) {
                refs1.push(each.historicalObject.data);
            });
            $http.get('/api/links/from/' + viewId).success(function(refs) {
                //missing pattern 1 (missing builds-on exsiting)
                var refs2 = [];
                refs.forEach(function(each) {
                    if (each.type === 'contains') {
                        refs2.push(each);
                    }
                });
                refs1.forEach(function(each) {
                    _.remove(refs2, function(o) {
                        return o._id === each._id;
                    });
                });
                var missings = refs2;

                //missing pattern 2 (missing builds-on deleted)
                var created = {};
                records.forEach(function(r) {
                    if (r.historicalOperationType === 'created') {
                        created[r.historicalObject.data._id] = {};
                    }
                    if (r.historicalOperationType === 'modified' || r.historicalOperationType === 'deleted') {
                        if (!created[r.historicalObject.data._id]) {
                            var missingRef = r.historicalObject.data;
                            missings.push(missingRef);
                            created[r.historicalObject.data._id] = {};
                        }
                    }
                });

                //complementation
                missings.forEach(function(each) {
                    $scope.complement(records, each);
                });

                //callback
                handler();
            });
        };

        $scope.complement = function(records, missing) {
            var record = {
                authorId: missing._to.authors[0], //temporary, todo
                communityId: $scope.view.communityId,
                historicalObject: {
                    communityId: $scope.view.communityId,
                    data: missing,
                    dataId: missing._id,
                    dataType: missing.type,
                    type: 'Link'
                },
                historicalObjectId: missing._id,
                historicalObjectType: 'Link',
                historicalOperationType: 'modified',
                historicalVariableName: missing.type,
                targetId: $scope.view._id,
                timestamp: missing.created,
                type: 'modified'
            };
            var i = 0;
            var len = records.length;
            for (; i < len; i++) {
                if (records[i].timestamp > record.timestamp) {
                    break;
                }
            }
            records.splice(i, 0, record);
        };

        $scope.prune = function(playlist) {
            return playlist;
            // return _.filter(playlist, function(record) {
            //     var type = record.historicalOperationType
            //     var ref = record.historicalObject.data;
            //     return !(type === 'created' && ref._to.type === 'Note');
            // });
        };

        $scope.player = {};

        $scope.player.reset = function(playlist) {
            $scope.playlist = playlist;
            $scope.frame = -1;
            $scope.player.refreshCurrentTime();
        };

        $scope.player.togglePlay = function() {
            if ($scope.timer) {
                $scope.player.stop();
            } else {
                $scope.player.play();
            }
        };

        $scope.player.play = function() {
            $scope.timer = setInterval(function() {
                var len = $scope.playlist.length;
                if ($scope.frame + 1 >= len) {
                    if ($scope.timer) {
                        $scope.player.stop(true);
                    }
                    return;
                }
                $scope.player.step();
            }, 100);
        };

        $scope.player.stop = function(apply) {
            if ($scope.timer) {
                clearInterval($scope.timer);
                $scope.timer = null;
                if (apply) {
                    $scope.$apply();
                }
            }
        };

        $scope.player.step = function() {
            var updated = $scope.player.step0(true);
            if (updated === false) {
                return;
            }
            if (!updated) {
                $scope.player.step();
            }
        };

        $scope.player.backstep = function() {
            var ref = $scope.player.backstep0(true);
            if (ref === false) {
                return;
            }
            if (!ref) {
                $scope.player.backstep();
            }
        };

        $scope.player.step0 = function(refresh) {
            var len = $scope.playlist.length;
            if ($scope.frame + 1 >= len) {
                return false;
            }

            $scope.frame++;
            var record = $scope.playlist[$scope.frame];
            var type = record.historicalOperationType;
            var ref = record.historicalObject.data;
            $scope.player.refreshCurrentTime();

            var updated;
            if (type === 'created' || type === 'modified') {
                record.previous = $scope.player.upsert($scope.refs, ref);
                updated = $scope.updateRef(ref);
                if (updated && refresh) {
                    $scope.refreshConnection(updated.to);
                }
            } else if (type === 'deleted') {
                updated = remove($scope.refs, ref);
            }

            return updated;
        };

        $scope.player.backstep0 = function(refresh) {
            if ($scope.frame < 0) {
                return false;
            }

            var record = $scope.playlist[$scope.frame];
            var type = record.historicalOperationType;
            var ref = record.historicalObject.data;
            $scope.frame--;
            $scope.player.refreshCurrentTime();

            var updated;
            if (type === 'created' || type === 'modified') {
                if (record.previous) {
                    $scope.player.upsert($scope.refs, record.previous);
                    updated = $scope.updateRef(record.previous);
                    if (updated && refresh) {
                        $scope.refreshConnection(updated.to);
                    }
                } else {
                    updated = remove($scope.refs, ref);
                }
            } else if (type === 'deleted') {
                $scope.player.upsert($scope.refs, ref);
                updated = $scope.updateRef(ref);
                if (updated && refresh) {
                    $scope.refreshConnection(updated.to);
                }
            }

            return updated;
        };

        var remove = function(array, ref) {
            var lenA = $scope.refs.length;
            _.remove($scope.refs, function(obj) {
                return obj._id === ref._id;
            });
            var lenB = $scope.refs.length;
            return lenA - lenB;
        };

        $scope.player.gotoFrame = function(frameNo) {
            if ($scope.frame < frameNo) {
                var targetNoA = Math.min(frameNo, $scope.playlist.length - 1);
                while ($scope.frame < targetNoA) {
                    $scope.player.step0();
                }
                $scope.refreshAllConnections();
            } else if ($scope.frame > frameNo) {
                var targetNoB = Math.max(frameNo, 0);
                while ($scope.frame >= targetNoB) {
                    $scope.player.backstep0();
                }
                $scope.refreshAllConnections();
            } else {
                //do nothing
            }
        };

        $scope.player.toFirst = function() {
            $scope.player.gotoFrame(0);
        };

        $scope.player.toLast = function() {
            $scope.player.gotoFrame($scope.playlist.length - 1);
        };

        $scope.player.upsert = function(array, obj) {
            var index = _.findIndex(array, function(elem) {
                return elem._id === obj._id;
            });
            if (index === -1) {
                array.push(obj);
                return null;
            } else {
                var previous = array[index];
                array.splice(index, 1, obj);
                return previous;
            }
        };

        $scope.player.initialized = function() {
            return $scope.playlist;
        };

        $scope.player.refreshCurrentTime = function() {
            var time;

            var record = $scope.playlist[$scope.frame];
            if (record) {
                time = record.timestamp;
            } else {
                var firstRecord = $scope.playlist[0];
                var firstTime = new Date(firstRecord.timestamp);
                time = new Date(firstTime.getTime() - 6000);
            }
            timeline.setCustomTime(time, 'currenttime');

            if (record) {
                var selection = timeline.getSelection();
                if (selection.length <= 0 || selection[0] !== $scope.frame) {
                    var ids = [$scope.frame];
                    timeline.setSelection(ids, { focus: false });
                }
                $scope.player.currentRecordString =
                    record.type +
                    ' "' + record.historicalObject.data._to.title + '"' +
                    ' by ' + $community.getCommunityData().members[record.authorId].name +
                    ' at ' + $scope.getTimeString(time);
            } else {
                timeline.setSelection([], { focus: false });
                $scope.player.currentRecordString = '';
            }
        };

        $scope.player.isPlayingOrFirst = function() {
            return $scope.player.isPlaying() || $scope.frame < 0;
        };

        $scope.player.isPlayingOrLast = function() {
            return $scope.player.isPlaying() || ($scope.playlist && $scope.frame + 1 >= $scope.playlist.length);
        };

        $scope.player.isPlaying = function() {
            return $scope.timer;
        };

        $scope.player.playerButtonLabel = function() {
            if ($scope.player.isPlaying()) {
                return 'stop';
            } else {
                return 'play';
            }
        };

    });
