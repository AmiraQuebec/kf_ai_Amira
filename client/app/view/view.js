'use strict';

angular.module('kf6App')
    .config(function($stateProvider) {
        $stateProvider
            .state('view', {
                url: '/view/:viewId',
                templateUrl: 'app/view/view.html',
                controller: 'ViewCtrl'
            });
        $stateProvider
            .state('viewWithMenuStatus', {
                url: '/view/:viewId/:menuStatus',
                templateUrl: 'app/view/view.html',
                controller: 'ViewCtrl'
            });
    });

angular.module('kf6App')
    .directive('viewlink', function($kfutil) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var $scope = scope.$parent;
                var el = element[0];
                el.draggable = true;
                el.addEventListener('dragstart', function(e) {
                    $scope.draggingViewlink = scope.view;
                    e.dataTransfer.setData('Text', el.id);
                });
                el.addEventListener('dragend', function() {
                    $scope.draggingViewlink = null;
                });


                /** touch support for ipad to move view links**/
                    var sp;
                    var state = 'IDLE';
                    var proxy;
                    el.addEventListener('touchstart', function(e) {
                    sp = $kfutil.getTouchPos(e);
                    state = 'PRESSED';
                    e.preventDefault();
                    });
                    el.addEventListener('touchmove', function(e) {
                        if(state === 'PRESSED'){
                            state = 'MOVING';
                        }
                        if(state === 'MOVING'){
                            state='MOVING';
                            $scope.draggingViewlink = scope.view;
                            e.dataTransfer.setData('Text', el.id);
                        }
                    e.preventDefault();
                    });
                    el.addEventListener('touchend', function(e) {
                        if(state === 'MOVING'){
                            state='IDLE';
                            $scope.drop(e, null);
                            $scope.draggingViewlink = null;
                            if (proxy) {
                                $('body').removeChild(proxy);
                                proxy = null;
                                }
                            e.preventDefault();
                            return;
                        }
                    });
                /* touchsupport end */
            }
        };
    });

angular.module('kf6App')
    .directive('kfViewRef', function($kfutil, $kftag) {
        return {
            restrict: 'C',
            link: function(scope, element) {
                var ref = scope.ref;
                var $scope = scope.$parent;
                var el = element[0];

                scope.$watch('ref.data.x', function() {
                    $scope.repaintConnections(ref);
                });
                scope.$watch('ref.data.y', function() {
                    $scope.repaintConnections(ref);
                });

                ref.refreshFixedStatus = function() {
                    if (ref.data.fixed === true) {
                        element.css('z-index', -1);
                        el.draggable = false;
                    }
                    else {
                        if(ref._to.type === 'Note' || ref._to.type === 'View' ){
                            element.css('z-index',10);
                            el.draggable = true;

                    }

                    else if (ref._to.type === 'Attachment' || ref._to.type === 'Drawing'){

                        element.css('z-index',5);
                        el.draggable = true;

                    }

                        else{
                            element.css('z-index', 5);
                            el.draggable = true;

                        }

                    }
                };
                ref.refreshFixedStatus();
                element.on('mousedown', function(e) {
                    var pid = ref._id;
                    var selected = $scope.isSelected(pid);
                    if (e.shiftKey) {
                        if (selected) {
                            $scope.unselect(pid);
                        } else {
                            $scope.select(pid);
                        }
                    } else {
                        if (selected) {
                            // do nothing
                        } else {
                            $scope.clearSelection();
                            $scope.select(pid);
                        }
                    }
                });

                /** touch support **/
                var timer;
                var sp;
                var state = 'IDLE';
                var contextOpened = false;
                var proxy;
                el.addEventListener('touchstart', function(e) {
                    if (!$scope.isSelected(ref._id)) {
                        $scope.singleSelect(ref._id);
                    }
                    sp = $kfutil.getTouchPos(e);
                    state = 'PRESSED';
                    if ($kfutil.isiOS()) {
                        timer = setTimeout(function() {
                            if (state === 'PRESSED') {
                                state = 'CONTEXTMENUOPENED';
                                showHelo(e);
                            }
                        }, 700);
                    }
                });
                el.addEventListener('touchmove', function(e) {
                    if (ref.data.draggable !== undefined && !ref.data.draggable) {
                        return;
                    }
                    if (state === 'MOVING') {
                        var d = calcDelta(e);
                        $('#kf6-touch-proxy').css({
                            left: ref.data.x + d.x,
                            top: ref.data.y + d.y
                        });
                    }
                    if (state === 'PRESSED') {
                        state = 'MOVING';
                        //Add proxy image here.
                        proxy = el.cloneNode(true);
                        proxy.id = 'kf6-touch-proxy';
                        $('#maincanvas').get(0).appendChild(proxy);
                        $('#kf6-touch-proxy').css({
                            opacity: '0.5'
                        });
                    }
                    e.preventDefault();
                });
                el.addEventListener('touchend', function(e) {
                    handleEnd(e);
                });
                el.addEventListener('touchcancel', function(e) {
                    handleEnd(e);
                });

                function handleEnd(e) {
                    clearTimeout(timer);
                    if (state === 'MOVING') {
                        e.preventDefault();
                        if (proxy) {
                            $('#maincanvas').get(0).removeChild(proxy);
                            proxy = null;
                        }
                        var delta = calcDelta(e);
                        $scope.moveRefs(delta);
                        return;
                    }
                    if (state === 'CONTEXTMENUOPENED') {
                        e.preventDefault();
                        e.stopPropagation();
                        contextOpened = true;
                    }
                    state = 'IDLE';
                    return;
                }
                el.addEventListener('click', function(e) {
                    if (contextOpened === true) {
                        //e.preventDefault();
                        e.stopPropagation();
                        contextOpened = false;
                    }
                });

                function calcDelta(e) {
                    var p = $kfutil.getTouchPos(e);
                    var delta = {
                        x: p.x - sp.x,
                        y: p.y - sp.y
                    };
                    return delta;
                }

                function showHelo(e) {
                    $kfutil.fireContextMenuEvent(e, element);
                }

                /** touch support end **/

                el.addEventListener('dragstart', function(e) {
                    var offset = $kfutil.getOffset(e);
                    if ($kfutil.isSafari() /*|| (chrome && $scope.selected.length >= 2)*/ ) {
                        var imgX = element.position().left + offset.x;
                        var imgY = element.position().top + offset.y;
                        var selImg = $('#selectioncanvas').get(0);
                        e.dataTransfer.setDragImage(selImg, imgX, imgY);
                    }

                    var models = $scope.getSelectedModels();
                    models.forEach(function(each) {
                        each.offsetX = each.data.x - ref.data.x;
                        each.offsetY = each.data.y - ref.data.y;
                    });
                    e.dataTransfer.setData('text', 'postref:' + JSON.stringify(models));
                    var hrefs = '';
                    models.forEach(function(each) {
                        var tag = $kftag.createNewReferenceTag(each.to, each._to.title, each._to.authors, "");
                        hrefs += tag;
                    });
                    if (!$kfutil.isIE()) {
                        e.dataTransfer.setData('text/html', hrefs);
                    }

                    $scope.dragging = ref;
                    $scope.dragpoint = offset;
                });
                el.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    $scope.dragover(e);
                });
                el.addEventListener('drop', function(e) {
                    e.preventDefault();
                    $scope.drop(e, ref);
                });
                el.addEventListener('dragend', function() {
                    $scope.dragging = 'none';
                });
            }
        };
    });

angular.module('kf6App')
    .directive('kfViewMarqueeCanvas', function($kfutil) {
        return {
            restrict: 'C',
            link: function(scope, element) {
                var $scope = scope;
                element.bind('contextmenu', function(e) {
                    if (!$scope.isEditable || !$scope.isEditable()) {
                        return;
                    }
                    var found = findObject(e);
                    if (!found) {
                        return; //not found
                    }

                    e.preventDefault();
                    //e.stopPropagation();
                    e.stopImmediatePropagation();
                    //found
                    var model = $scope.searchById($scope.refs, found.id);
                    if (!model) {
                        window.alert('model not found for ' + found.id);
                        return;
                    }
                    if (!$scope.isUnfixable(model)) {
                        window.alert('You cannot edit this object on your privilege.');
                        return;
                    }
                    var confirmation = window.confirm('here is a locked object, would you like to unlock?');
                    //var confirmation = window.confirm('here is a fixed object, would you like to unfix?');
                    if (!confirmation) {
                        return;
                    }

                    $scope.unfix(model);
                });

                function findObject(e) {
                    var mousePos = $kfutil.getOffset(e);
                    var result = null;
                    $('#viewcanvas').children().each(function(index, child) {
                        if (contains(child, mousePos)) {
                            result = child;
                        }
                    });
                    return result;
                }

                function contains(element, p) {
                    //var r = element.getBoundingClientRect();//this does not work
                    var r = {
                        left: element.offsetLeft,
                        right: element.offsetLeft + element.offsetWidth,
                        top: element.offsetTop,
                        bottom: element.offsetTop + element.offsetHeight
                    };
                    return (r.left <= p.x && p.x <= r.right && r.top <= p.y && p.y <= r.bottom);
                }

                /*********   for touch interface ************/

                var el = element[0];
                var timer;
                el.addEventListener('touchstart', function(e) {
                    timer = setTimeout(function() {
                        openContextMenu(e);
                    }, 700);
                });
                el.addEventListener('touchmove', function() {
                    clearTimeout(timer);
                });
                el.addEventListener('touchend', function() {
                    clearTimeout(timer);
                });
                el.addEventListener('touchcancel', function() {
                    clearTimeout(timer);
                });

                function openContextMenu(e) {
                    $kfutil.fireContextMenuEvent(e, element);
                }

                /*********   for touch interface end ************/
            }
        };
    });


angular.module('kf6App')
    .directive('kfViewDropCanvas', function() {
        return {
            restrict: 'C',
            link: function(scope) {
                var $scope = scope;
                $scope.selected = [];

                $scope.remove = function(arr, item) {
                    for (var i = arr.length; i--;) {
                        if (arr[i] === item) {
                            arr.splice(i, 1);
                        }
                    }
                };

                $scope.searchById = function(array, id) {
                    for (var i = 0; i < array.length; i++) {
                        if (array[i]._id === id) {
                            return array[i];
                        }
                    }
                    return null;
                };

                $scope.getSelectedModels = function() {
                    var models = [];
                    $scope.selected.forEach(function(eachId) {
                        var model = $scope.searchById($scope.refs, eachId);
                        if (model !== null) {
                            models.push(model);
                        }
                    });
                    return models;
                };

                $scope.getSelectedElements = function() {
                    var models = [];
                    $scope.selected.forEach(function(eachId) {
                        var model = $('#' + eachId);
                        if (model.size() > 0) {
                            models.push(model.get(0));
                        }
                    });
                    return models;
                };

                $scope.isSelected = function(id) {
                    return $scope.selected.indexOf(id) >= 0;
                };

                $scope.singleSelect = function(id) {
                    $scope.clearSelection();
                    $scope.select(id);
                };

                $scope.select = function(id) {
                    if ($scope.isSelected(id)) {
                        return;
                    }
                    var ref = $scope.searchById($scope.refs, id);
                    if (ref.data.fixed === true) {
                        return;
                    }
                    $scope.selected.push(id);
                    var target = $('#' + id);
                    var handles = '<div class="ui-resizable-handle ui-resizable-nw" id="nwgrip"></div><div class="ui-resizable-handle ui-resizable-ne" id="negrip"></div><div class="ui-resizable-handle ui-resizable-sw" id="swgrip"></div><div class="ui-resizable-handle ui-resizable-se" id="segrip"></div>';
                    target.append(handles);
                    target.resizable({
                        handles: {
                            'ne': '#negrip',
                            'se': '#segrip',
                            'sw': '#swgrip',
                            'nw': '#nwgrip'
                        },
                        stop: function() {
                            $scope.getSelectedModels().forEach(function(ref) {
                                if (ref._id === id) {
                                    ref.data.width = target.width();
                                    ref.data.height = target.height();
                                    $scope.saveRef(ref);
                                }
                            });
                        }
                    });
                    target.resizable();
                    $('#selectioncanvas').append(target);
                };

                $scope.unselect = function(id) {
                    if ($scope.isSelected(id) === false) {
                        return;
                    }
                    $scope.remove($scope.selected, id);
                    var target = $('#' + id);
                    $('#viewcanvas').append(target);
                    target.resizable('destroy');
                };

                $scope.clearSelection = function() {
                    var copy = $scope.selected.concat();
                    copy.forEach(function(each) {
                        $scope.unselect(each);
                    });
                };
            }
        };
    });

angular.module('kf6App')
    .directive('kfViewDropCanvas', function($suresh, $community,$http) {
        return {
            restrict: 'C',
            link: function(scope, element) {
                var $scope = scope;

                $scope.dragover = function(e) {
                    if (!$scope.isEditable || !$scope.isEditable()) {
                        e.dataTransfer.dropEffect = 'none';
                        return;
                    }

                    if ($scope.dragging !== 'none') {
                        e.dataTransfer.dropEffect = 'move';
                    } else {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                };

                $scope.drop = function(e, ref) {
                    if (!$scope.isEditable || !$scope.isEditable()) {
                        return;
                    }

                    var firefox = (e.offsetX === undefined);
                    var newX = firefox ? e.layerX : e.offsetX;
                    var newY = firefox ? e.layerY : e.offsetY;
                    if (ref) {
                        newX = newX + ref.data.x;
                        newY = newY + ref.data.y;
                    }

                    if ($scope.dragging !== 'none') { //Internal DnD
                        var postref = $scope.dragging;
                        if (postref.data.draggable !== undefined && !postref.data.draggable) {
                            return;
                        }
                        var dx = newX - postref.data.x - $scope.dragpoint.x;
                        var dy = newY - postref.data.y - $scope.dragpoint.y;
                        $scope.moveRefs({
                            x: dx,
                            y: dy
                        });

                    } else if ($scope.draggingViewlink) {
                        var view = $scope.draggingViewlink;
                        $scope.createContainsLink(view._id, {
                            x: newX,
                            y: newY
                        });
                    } else { //External DnD
                        var data = e.dataTransfer.getData('text');

                        //Droped by Search Result
                        if (data.indexOf('objectIds:') === 0) {
                            var text = '';
                            text = data.replace('objectIds:', '');
                            var ids = JSON.parse(text);
                            ids.forEach(function(each) {
                                $scope.createContainsLink(each, {
                                    x: newX,
                                    y: newY
                                });
                            });
                        }

                        //Promising Ideas Tools by Suresh (remaking needed).
                        else if (data.indexOf('pidata') !== -1) {
                            var d = data.split('§§§');
                            var body = d[0];
                            $suresh.setCordinate(newX, newY);
                            var viewIds = [];
                            viewIds.push(scope.view);
                            $suresh.createnewnoteInMutipleView('PI Pool', viewIds, $community, body, true);
                        }
                        //Create new note button dropped here.
                        else if ( data === "newNoteButton" ){
                            // Pass the location of drop to create new note
                            $scope.createNote({x : newX , y : newY});
                        }

                        //URL dropped
                        else if (data.indexOf('http:') === 0 || data.indexOf('https:') === 0) {
                            $scope.urlDropped(data, newX, newY);
                        }


                        //File dropped
                        else if (!data && e.dataTransfer && e.dataTransfer.files) {
                            $scope.uploadFiles(e.dataTransfer.files, newX, newY);
                        }

                        //Postref dropped
                        else if (data.indexOf('postref:') === 0) {
                            var text2 = data.replace('postref:', '');
                            var models = JSON.parse(text2);
                            models.forEach(function(each) {
                                var dt = {};
                                dt.x = newX + each.offsetX;
                                dt.y = newY + each.offsetY;
                                if (each.data) {
                                    if (each.data.width) {
                                        dt.width = each.data.width;
                                    }
                                    if (each.data.height) {
                                        dt.height = each.data.height;
                                    }
                                    if (each.data.showInPlace) {
                                        dt.showInPlace = each.data.showInPlace;
                                    }
                                }
                                $scope.createContainsLink(each.to, dt);
                                $http.delete('/api/links/' + each._id);
                            });
                        } else {
                            console.log(data);
                            console.log("file drop not supported");
                            window.alert('the file drop is not supported.');
                        }
                    }
                    $scope.draggingViewlink = null;
                    $scope.dragging = 'none';
                };

                $scope.findOverlappedElementInArray = function(elements, moveDistance, dimension) {
                    for (var i = 0; i < elements.length; i++) {
                        var element = elements[i];
                        var newPosition = {
                            x: element.data.x + moveDistance.dx,
                            y: element.data.y + moveDistance.dy
                        };
                    ///Avoid overlapping in drawings are shown in place
                    if(element.data.width && element.data.height && element.data.showInPlace){
                        dimension.height=element.data.height;
                        dimension.width=element.data.width;
                    }
                        var overlappedElement = $scope.findOverlappedElement(newPosition, elements, dimension);
                        if (overlappedElement) {
                            return overlappedElement;
                        }
                    }
                    return null;
                };

                $scope.moveRefs = function(delta) {
                    var moveDistance = {
                        dx: delta.x,
                        dy: delta.y
                    };
                    var orgMoveDistance = {
                        dx: delta.x,
                        dy: delta.y
                    };
                    // Protected area
                    var dimension = {
                        width: 80,
                        height: 40
                    };
                    var baseStepSize = 10;
                    // how many baseStepSize pixel steps notes are moving, count maximum of x and y
                    var numSteps = Math.round(Math.max(Math.abs(moveDistance.dx), Math.abs(moveDistance.dy)) / baseStepSize);

                    // how far and what direction we try to move the note each step
                    var searchStep = {
                        x: - (moveDistance.dx / numSteps),
                        y: - (moveDistance.dy / numSteps)
                    };

                    if ($community.isFeatureEnabled('preventOverlap')) {
                        var selectedElements = $scope.getSelectedModels();
                        var overlappedElement = $scope.findOverlappedElementInArray(selectedElements, moveDistance, dimension);
                        var step = 0;
                        // Try from drop point to original point to find free space
                        while (overlappedElement) {
                            step++;
                            // If there is no free space for all moving notes, cancel drag and drop
                            if (step >= numSteps) {
                                return;
                            }
                            moveDistance.dx =  Math.round(orgMoveDistance.dx + step * searchStep.x);
                            moveDistance.dy =  Math.round(orgMoveDistance.dy + step * searchStep.y);

                            overlappedElement = $scope.findOverlappedElementInArray(selectedElements, moveDistance, dimension);
                        }
                    }

                    $scope.getSelectedModels().forEach(function(ref) {
                        ref.data.x += moveDistance.dx;
                        ref.data.y += moveDistance.dy;
                        $scope.saveRef(ref);
                    });
                };

                var el = element[0];
                el.droppable = true;
                el.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    $scope.dragover(e);
                });
                el.addEventListener('drop', function(e) {
                    e.preventDefault();
                    $scope.drop(e, null);
                });
            }
        };
    });

angular.module('kf6App')
    .directive('kfViewMarqueeCanvas', function() {
        return {
            restrict: 'C',
            link: function(scope, element) {
                var marquee = null;
                var pressX;
                var pressY;

                element.on('mousedown', function(e) {
                    if (e.which === 1) {
                        if (e.ctrlKey) {
                            return;
                        }
                        if (marquee !== null) {
                            marquee.remove();
                            marquee = null;
                        }
                        element.css('zIndex', 100);
                        pressX = e.clientX - element.offset().left;
                        pressY = e.clientY - element.offset().top;
                        element.append('<div id="marquee" style="position: absolute; width: 1px; height: 1px; border-style: dashed; border-width: 1pt; border-color: #000000;"></div>');
                        marquee = $('#marquee');
                    }
                });

                element.on('mousemove', function(e) {
                    if (marquee === null) {
                        return;
                    }
                    var px = pressX + element.offset().left;
                    var py = pressY + element.offset().top;
                    var x = Math.min(e.clientX, px);
                    var y = Math.min(e.clientY, py);
                    var w = Math.abs(e.clientX - px);
                    var h = Math.abs(e.clientY - py);
                    marquee.offset({
                        left: x,
                        top: y
                    });
                    marquee.width(w);
                    marquee.height(h);
                });

                element.on('mouseup', function() {
                    if (marquee === null) {
                        return;
                    }
                    var marqueeRect = j2rect(marquee);
                    $('.kfViewRef').each(function() {
                        if (intersects(marqueeRect, j2rect($(this)))) {
                            scope.select($(this).attr('id'));
                        } else {
                            scope.unselect($(this).attr('id'));
                        }
                    });
                    marquee.remove();
                    marquee = null;
                    element.css('zIndex', 2);
                });

                function intersects(r1, r2) {
                    return !(r2.left > r1.right ||
                        r2.right < r1.left ||
                        r2.top > r1.bottom ||
                        r2.bottom < r1.top);
                }

                function j2rect(j) {
                    return {
                        left: j.offset().left,
                        top: j.offset().top,
                        right: j.offset().left + j.width(),
                        bottom: j.offset().top + j.height()
                    };
                }
            }
        };
    });
    /*
        This directive is for the draggable create new button.
        -makes the element draggable
        -Adds info about the button on drag start.

        #Future work : Make it modular. So that user can drag any button on toolbar.(new drawing etc.)
    */
    angular.module('kf6App')
    .directive('kfCreateNoteButton', function() {
        return {
            restrict: 'C',
            link:function(scope,element){
               element.attr("draggable", "true"); // Set the element as HTML draggable

               // On Drag start, set the info about item -> We need to catch this info on drop.
               element.on('dragstart', function(event) {
                    event.originalEvent.dataTransfer.setData('text/plain', 'newNoteButton');
                    scope.$apply();
               });
            }
         };
    });


    angular.module('kf6App')
    .directive('parentnote', function() {
        return {
            restrict: "E",
            replace: true,
            scope: {
                sortednotes: '=',
                notemap:'=',
                scaffoldref:'=',
                selectednotesinhirerachyview:'=',
                hireachykeywords:'='
            },
            template: "<div ><member ng-repeat='member in sortednotes' member='member' notemap='notemap' selectednotesinhirerachyview='selectednotesinhirerachyview'  scaffoldref='scaffoldref' hireachykeywords='hireachykeywords'></member></div>"
        };
    })
    .directive('member',function ($compile,$community,$kftag,$kfutil,$http) {
        return {
            restrict: "E",
            replace: true,
            scope: {
                member: '=',
                notemap:'=',
                scaffoldref:'=',
                selectednotesinhirerachyview:'=',
                hireachykeywords:'='
            },
            template: "<div class='hirerachy-note row' ng-class='{removeBorder:!filterHirerachy(notemap[member.noteId])}'><div ng-class='{filterHirerachy:!filterHirerachy(notemap[member.noteId])}'><div class='row'><span class='col-lg-8 col-md-8 col-sm-8' style='padding-left:0px' ><h5>{{notemap[member.noteId].title}}</h5></span><span class='col-lg-4 col-md-4 col-sm-4'><span class='glyphicon glyphicon-unchecked hirerachyNoteIcon' ng-if='!checkToadd(member.noteId)'  ng-click='addnotes(member.noteId)'></span><span class='glyphicon glyphicon-check hirerachyNoteIcon' ng-if='checkToadd(member.noteId)'  ng-click='remnotes(member.noteId)'></span></span></div><div class='row'><p class='col-lg-9 col-md-9 col-sm-12' style='padding:0px' >{{getauthor(notemap[member.noteId].authors)}}<span style='font-size:10px;padding-left:5px'>{{member.modified}}</span></p> <button class='btn btn-primary col-lg-2 col-md-2 col-sm-12' style='padding:0px'  ng-click='buildson(member.noteId)'>Élever</button></div></div></div>",
               // "<div><button class='btn btn-primary'  ng-click='readnote(member.noteId)'>Read Note</button><button class='btn btn-primary' style='margin-left:10px' ng-click='buildson(member.noteId)'>BuildOn</button></div>   <div class='row' id={{member.noteId+'hirerachyText'}}></div> </div>",
            link: function (scope, element) {
                var collectionSt = '<div ><parentnote sortednotes="member.children" notemap="notemap" selectednotesinhirerachyview="selectednotesinhirerachyview" hireachykeywords="hireachykeywords" scaffoldref="scaffoldref"></parentnote></div>';
                if (angular.isArray(scope.member.children)) {

                    $compile(collectionSt)(scope, function(cloned)   {
                               element.append(cloned);
                              });
                }

                scope.filterHirerachy= function(note){
                    var returnFlag=false;
                    if(scope.hireachykeywords.length===0){
                        return true;
                    }
                    if(note){
                    var notedata = $kftag.preProcess(note.data.body, scope.scaffoldref, scope.scaffoldref);
                    var regex = new RegExp(scope.hireachykeywords.toLowerCase().replace(/[^a-zA-Z ]/g, ""), 'g');
                    if ((notedata.toLowerCase().match(regex) || []).length > 0) {
                        returnFlag = returnFlag || true;
                    }
                    return returnFlag;
                    }

                };
                scope.getauthor= function(authorsarray){
                    if(authorsarray && authorsarray.length>0){
                    return $community.getMember(authorsarray[0]).name;
                    }
                    else
                    {
                    return "  ";
                    }
                };
                scope.checkToadd=function (noteid){
                    if( scope.selectednotesinhirerachyview[noteid]){
                        return true;
                    }else{
                        return false;
                    }
                };

                scope.addnotes= function (noteid){
                    var scafoldprocesseddata=$kftag.preProcess(scope.notemap[noteid].data.body,scope.scaffoldref,scope.scaffoldref);
                   scope.selectednotesinhirerachyview[noteid]=scope.notemap[noteid];
                   scope.selectednotesinhirerachyview[noteid].processeddata=scafoldprocesseddata;
                };

                scope.remnotes= function(noteid){
                    delete scope.selectednotesinhirerachyview[noteid];
                };
                scope.readnote = function (noteid){
                    if($kfutil.isMobile()){
                    document.getElementById(noteid+"hirerachyText").innerHTML=$kftag.preProcess(scope.notemap[noteid].data.body,scope.scaffoldref,scope.scaffoldref);
                    }else{
                    document.getElementById("hirerachyText").innerHTML=$kftag.preProcess(scope.notemap[noteid].data.body,scope.scaffoldref,scope.scaffoldref);
                    document.getElementById("hirerachyTextTitle").innerHTML=scope.notemap[noteid].title;
                    }
                };

                scope.buildson = function (noteid) {
                    var w;
                    if ($kfutil.isMobile()) {
                        w = window.open('');
                    }
                    var mode = {};
                    var contribution=scope.notemap[noteid];
                    mode.permission = contribution.permission;
                    mode.group = contribution.group;

                    $community.createNoteOn(mode,contribution._id, function(newContribution) {
                        scope.saveBuildonToITM(newContribution._id, contribution._id);
                        $community.getLinksTo(contribution._id, "contains", function(links){
                            links.forEach(function(link) {
                                $community.saveContainsLinktoITM(link.from, newContribution._id);
                            });
                        },
                        function(){
                            console.error("Can't get Views that contains note: " + contribution._id);
                        });

                        var url = './contribution/' + newContribution._id;
                        if (w) {
                            w.location.href = url;
                        } else if (window.openContribution) {
                            window.openContribution(newContribution._id);
                        } else {
                            window.open(url, '_blank');
                        }
                    });
                };

                scope.saveBuildonToITM = function(fromId, toId){
                    if (!$community.isPluginEnabled('itm')) {
                        return;
                    }

                    $community.getITMToken(function(token, db){
                        var params = {
                            "token": token,
                            "database": db,
                            "fromnoteid": fromId,
                            "tonoteid": toId,
                            "linktype": 'buildson'
                        };

                        $http({ url:  $community.itmServer + "/WSG/note_note/add",
                            method: 'POST',
                            data: params,
                            headers: {'Content-Type': 'application/json'}
                        }).success(function(result){
                            if (result && result.code && result.code === 'success') {
                            } else {
                                console.error("Add buildon failed!");
                                console.error(result);
                            }
                        }).error(function(error){
                            console.error("Add buildon failed!");
                            console.error(error);
                        });
                    });
                };
            }
        };
    });

