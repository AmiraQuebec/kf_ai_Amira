'use strict';

var _ = require('lodash');
var KLink = require('./KLink.model');
var KObject = require('../KObject/KObject.model');
var KRecordController = require('../KRecord/KRecord.controller.js');
var KHistoricalObject = require('../KHistoricalObject/KHistoricalObject.model.js');
var mongoose = require('mongoose');

const refDimension = {
    width: 80,
    height: 40
};
const canvasSize = 2000;

// Search free space that doesn't overlap with any element in refs
exports.getNewElementPosition = function (refs, startPos) {
    var pos = {
        x: startPos.x,
        y: startPos.y
    };
    var element = findOverlappedElement(refs, pos, refDimension);
    while (element) {
        pos.y = element.data.y + refDimension.height;
        if (pos.y >= canvasSize - refDimension.height) {
            pos.y = startPos.y;
            pos.x = pos.x + refDimension.width;
            if (pos.x >= canvasSize - refDimension.width) {
                // If no free space found, return original position
                return pos;
            }
        }
        element = findOverlappedElement(refs, pos, refDimension);
    }
    return pos;
}

function isLocked(ref) {
    if (!ref || !ref.data) {
        return false;
    }
    return ref.data.fixed;
}

//Search through all elements in refs, find element that overlap at position pos
function findOverlappedElement(refs, pos, dimension) {
    var len = refs.length;
    for (var i = 0; i < len; i++) {
        var element = refs[i];
        if (!isLocked(element) && overlap(element.data, pos, dimension)) {
            return element;
        }
    }
    return null;
}

// Return whether two elements with given dimension overlap or not
function overlap(pointA, pointB, dimension) {
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
}

exports.freeSpace = function (req, res) {
    KLink.find({
            from: req.params.id,
            type: 'contains',
            "_to.status": 'active'
        },
        function (err, links) {
            if (err) {
                return handleError(res, err);
            }
            var position = {
                x: 10,
                y: 10
            };
            position = exports.getNewElementPosition(links, position);
            return res.status(200).json(position);
        });
};

exports.search = function (req, res) {
    var query = req.body.query;
    var projection = {};
    var communityId = req.params.communityId;

    if (req.body.projection) {
        projection = req.body.projection;
    }

    var mongoQuery = {
        $and: []
    };
    mongoQuery.$and.push({
        communityId: communityId
    });
    for (var n in query) {
        var obj = {};
        obj[n] = query[n];
        mongoQuery.$and.push(obj);
    }
    KLink.find(mongoQuery, projection, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

exports.index = function (req, res) {
    //this should not be used
    res.status(200).json([]);
};

exports.fromIndex = function (req, res) {
    KLink.find({
        from: req.params.id
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};


// To get Child Views of Given view, also provides sub child count.
exports.getChildView = function (req, res) {
    KLink.find({
        from: req.params.id,
        "_to.type": "View"
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }

        //Generate List of Child View IDs

        var childViewIdList = links.map(i => i.to);


        KLink.aggregate([{
                $match: {
                    $and: [
                        {from: {$in: childViewIdList}}, {"_to.type": "View"}
                    ]
                }
            },
                {
                    $group: {_id: {from: "$from"}, child: {$sum: 1}}
                }
            ]
        ).exec(function (err, childCount) {
            if (err) {
                return handleError(res, err);
            }

            var newObject = {};


            childCount.forEach(function (e) {
                newObject[e._id.from] = e.child;
            });

            var retrunObject = [];
            links.forEach(function (l) {
                var obj = {
                    id: l.to,
                    title: l._to.title,
                    nodes: [],
                    data: l.data,
                    linkId: l.id
                };
                if (newObject[l.to] === undefined) {
                    obj.child = 0;
                } else {
                    obj.child = newObject[l.to]
                }
                retrunObject.push(obj);
            });
            return res.status(200).json(retrunObject);
        });


    });
};

exports.fromIndexArray = function (req, res) {
    var data = req.body.views;
    var query = {
        from: {$in: data},
        "_to.type": "Note"
    };

    if (req.body.toLinksType !== undefined) {
        var attribute = "_to.type";
        query[attribute] = req.body.toLinksType;
    }

    KLink.find(query, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

exports.toIndex = function (req, res) {
    KLink.find({
        to: req.params.id
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

exports.eitherIndex = function (req, res) {
    KLink.find({
        $or: [{
            from: req.params.id
        }, {
            to: req.params.id
        }]
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

exports.fromtoIndex = function (req, res) {
    KLink.find({
        from: req.params.fromId,
        to: req.params.toId
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

// Get links between contributions on view
exports.viewIndex = function (req, res) {
    // Check if req.params.id is defined
    if (!req.params.id) {
        return handleError(res, {
            message: 'Missing required parameter: id',
            status: 400
        });
    }
    
    // Convert id to ObjectId or validate it
    let fromId;
    try {
        fromId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(fromId)) {
            return handleError(res, {
                message: 'Invalid id format',
                status: 400
            });
        }
    } catch (err) {
        return handleError(res, {
            message: 'Error processing id parameter',
            status: 400,
            error: err
        });
    }
    
    KLink.find({
        from: fromId,
        type: 'contains'
    }, function (err, refs) {
        if (err) {
            return handleError(res, err);
        }
        var ids = [];
        refs.forEach(function (ref) {
            return ids.push(ref.to);
        });
        KLink.find({
            $or: [{
                from: {
                    $in: ids
                }
            }, {
                to: {
                    $in: ids
                }
            }]
        }, function (err, links) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(links);
        });
    });
};

// ajout michelle janvier 2016
// Get "buildson" links in commununity (every views)
exports.buildsonIndex = function (req, res) {
    KLink.find({
        communityId: req.params.id,
        type: 'buildson',
        '_from.status': 'active',
        '_to.status': 'active'
    }, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};

// Get a single link
exports.show = function (req, res) {
    KLink.findById(req.params.id, function (err, link) {
        if (err) {
            return handleError(res, err);
        }
        if (!link) {
            return res.sendStatus(404);
        }
        return res.json(link);
    });
};

exports.create = function (req, res) {
    var seed = req.body;

    if (seed.data !== undefined && seed.data.x !== undefined) {
        KLink.find({
                from: seed.from,
                type: 'contains'
            }, {data: 1},
            function (err, refs) {
                if (err) {
                    console.error(err);
                    return;
                }

                var overlapFlag = false;
                refs.forEach(function (ref) {
                    if (seed.data.x === ref.data.x && seed.data.y === ref.data.y) {
                        overlapFlag = true;
                    }
                });

                if (overlapFlag) {
                    seed.data = {
                        x: seed.data.x + 50,
                        y: seed.data.y + 50
                    };
                    seed.data = exports.getNewElementPosition(refs, seed.data);
                }
                exports.checkAndCreate(req, seed, function (err, link) {
                    if (err) {
                        return handleError(res, err);
                    }
                    return res.status(201).json(link);
                });
            });
    } else {
        exports.checkAndCreate(req, seed, function (err, link) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(201).json(link);
        });
    }
};

exports.checkAndCreate = function (req, seed, handler) {
    checkAndPrepareSeed(seed, function (err) {
        if (err) {
            if (handler) {
                handler(err);
            }
            return;
        }
        KLink.create(seed, function (err, link) {
            record(req, link, 'created');
            if (handler) {
                handler(err, link);
            }
            return;
        });
    });
};

exports.createGNoteLink = function (req, res) {
    var seed = req.body;
    exports.checkAndCreate(req, seed, function (err, link) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(link);
    });
};

function checkAndPrepareSeed(seed, handler) {
    getFromToContributions(seed.from, seed.to, function (from, to) {
        if (!seed.type) {
            return handler("no seed type." + seed);
        }
        if (!from || !to) {
            return handler("missing link in seed: " + JSON.stringify(seed));
        }
        if (!seed.communityId) {
            seed.communityId = from.communityId;
            console.info('communityId missing automatically complimented:' + seed.communityId);
        }
        if (from.communityId.toString() !== to.communityId.toString()) {
            console.error('from.communityId' + from.communityId + ' !== to.communityId' + to.communityId);
            return handler('from.communityId !== to.communityId');
        }
        if (seed.communityId.toString() !== from.communityId.toString()) {
            return handler('seed.communityId !== from.communityId');
        }
        if (seed.communityId.toString() !== to.communityId.toString()) {
            return handler('seed.communityId !== from.communityId');
        }
        seed._from = KLink.createCashObj(from);
        seed._to = KLink.createCashObj(to);
        return handler(); //OK
    });
}

function getFromToContributions(fromId, toId, handler) {
    KObject.findById(fromId, function (err, from) {
        KObject.findById(toId, function (err, to) {
            handler(from, to);
        });
    });
}

// Updates an existing link in the DB.
exports.update = function (req, res) {

    if (req.body._id) {
        delete req.body._id;
    }
    if (req.body.data) {
        if (req.body.data.x > 1950 || req.body.data.y > 1950) {
            return res.sendStatus(403);
        }
    }
    KLink.findById(req.params.id, function (err, link) {
        if (err) {
            return handleError(res, err);
        }
        if (!link) {
            return res.sendStatus(404);
        }

        console.log(req.params.id)

        var updated = _.merge(link, req.body);
        updated.modified = Date.now();
        if (req.body.data) {
            updated.markModified('data');
        }
        updated.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            record(req, link, 'modified');
            return res.status(200).json(link);
        });
    });
};

// Deletes a link from the DB.
exports.destroy = function (req, res) {
        KLink.findById(req.params.id, function (err, link) {
            if (err) {
                return handleError(res, err);
            }
            if (!link) {
                return res.sendStatus(404);
            }
            var to;
            var from;
            var ra = link._to;
            var query = {};
            query.communityId = link.communityId;
            query.type = "contains";
            if (ra.data) {
                if (ra.data.riseabove) {
                    to = link.to.toString();
                    from = link.from.toString();
                    KLink.find(query, function (err, links) {
                        var listNotes = [];
                        links.forEach(function (lk, x, arr) {
                            if (lk.from.toString().slice(0, -1) === to.slice(0, -1)) {
                                listNotes.push(lk);
                            }
                        });
                        link.remove(function (err) {
                            if (err) {
                                return handleError(res, err);
                            }
                            record(req, link, 'deleted');
                            return res.status(201).json(listNotes);
                        });
                    });
                } else { // Hotfix to delete Promissing ideas
                    link.remove(function (err) {
                        if (err) {
                            return handleError(res, err);
                        }
                        record(req, link, 'deleted');
                        return res.sendStatus(204);
                    });
                }
            } else {
                link.remove(function (err) {
                    if (err) {
                        return handleError(res, err);
                    }
                    record(req, link, 'deleted');
                    return res.sendStatus(204);
                });
            }
        });

};

function record(req, link, operationType) {
    if (!req.author) {
        console.error('req.author not found.');
        return;
    }
    KHistoricalObject.createByLink(link, function (err, historical) {
        if (err) {
            console.error(err);
            return;
        }
        KRecordController.createInternal({
            authorId: req.author._id,
            targetId: link.from,
            type: 'modified',
            historicalObjectType: 'Link',
            historicalVariableName: link.type,
            historicalOperationType: operationType,
            historicalObjectId: historical._id
        });
    });
}

// ----- cache remaking function ------
// ----- cache remaking is unnecessary in normal usage ------

exports.updateCash = function (req, res) {
    KLink.findById(req.linkId, function (err, link) {
        if (err) {
            return handleError(res, err);
        }
        if (!link) {
            return res.sendStatus(404);
        }
        updateCash0(link, function (err, link) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(link);
        });
    });
}


// Get a single link
exports.updateAllCash = function (req, res) {
    KLink.update({
        communityId: req.params.communityId,
    }, {
        $set: {
            _to: null
        }
    }, {
        upsert: false,
        multi: true
    }, function (err, x) {
        if (err) {
            return handleError(res, err);
        }
        exports.updateAllCashRec(req, res);
    });
}

exports.updateAllCashRec = function (req, res) {
    var query = KLink.find({
        communityId: req.params.communityId,
        _to: null
    }).limit(5000);
    query.exec(function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        var len = links.length;
        console.info(len + ' links to update!');
        if (len <= 0) {
            console.info('no links to update!');
            return res.sendStatus(200);
        }
        var numFinished = 0;
        links.forEach(function (link) {
            updateCash0(link, function () {
                numFinished++;
                if (numFinished >= len) {
                    exports.updateAllCashRec(req, res);
                }
            });
        });
    });
};

function updateCash0(link, handler) {
    getFromToContributions(link.from, link.to, function (from, to) {
        if (from === null || to === null) {
            showMissingLinkMsg(link, from, to);
            link._from = 'missing';
            link._to = 'missing';
            return link.save(handler);
        }
        link._from = KLink.createCashObj(from);
        link.markModified('_from');
        link._to = KLink.createCashObj(to);
        link.markModified('_to');
        return link.save(handler);
    });
}

function showMissingLinkMsg(link, fromObj, toObj) {
    var msg = 'missinglink';
    msg += ', type=' + link.type;
    msg += ', from=' + link.from;
    if (fromObj) {
        msg += ', fromType=' + fromObj.type;
    }
    msg += ', to=' + link.to;
    if (toObj) {
        msg += ', toType=' + toObj.type;
    }
    console.warn(msg);
}

exports.studentProfileSearch = function (req, res) {

    var query = req.body.query;
    var communityId = req.params.communityId;

    var mongoQuery = {
        $and: []
    };
    mongoQuery.$and.push({
        communityId: communityId
    });
    for (var n in query) {
        var obj = {};
        obj[n] = query[n];
        mongoQuery.$and.push(obj);
    }
    KLink.find(mongoQuery, function (err, links) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(links);
    });
};


exports.notesCount = function (req, res) {
    var viewId = req.params.viewId;
    KLink.count({
        from: viewId,
        type: "contains",
        "_from.type": "View",
        "_to.type": "Note",
        "_to.status": "active"
    }, function (err, notesCount) {
        if (err) {
            return handleError(res, err);
        }

        KLink.count({
            from: viewId,
            type: "contains",
            "_from.type": "View",
            "_to.type": "Note",
            "_to.status": "active",
            "_to.data.riseabove": "riseabove"
        }, function (err, riseaboveCount) {
            if (err) {
                return handleError(res, err);
            }

            var data = {notesCount: notesCount, riseaboveCount: riseaboveCount};
            return res.status(200).json(data);
        });
    });
};

//--------------------------------------------
function handleError(res, err) {
    console.error(err);
    // If the error has a status property, use it, otherwise default to 500
    var status = err.status || 500;
    return res.status(status).json(err);
}


