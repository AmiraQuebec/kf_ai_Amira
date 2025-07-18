'use strict';

var _ = require('lodash');
var KRecord = require('./KRecord.model');

var KObject = require('../KObject/KObject.model');
var KLink = require('../KLink/KLink.model');
var KLinkController = require('../KLink/KLink.controller');
var mongoose = require('mongoose');

function createReadmark(req, res) {
    var seed = {
        from: req.author._id,
        to: req.params.contributionId,
        type: 'read'
    };
    KLink.findOne(seed, function(err, link) {
        if (err) {
            return handleError(res, err);
        }
        if (!link) {
            KLinkController.checkAndCreate(req, seed, function(err, link) {
                if (err) {
                    return handleError(res, err);
                }
                createReadmark0(req, res, link);
            });
        } else {
            createReadmark0(req, res, link);
        }
    });
}

function createReadmark0(req, res, link) {
    link.modified = Date.now();
    link.save(function(err) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json({});
    });
}

exports.read = function(req, res) {
    exports.createInternal({
            communityId: req.author.communityId,
            authorId: req.author._id,
            targetId: req.params.contributionId,
            type: 'read'
        },
        function(err) {
            if (err) {
                return handleError(res, err);
            }
            createReadmark(req, res);
        });
};

exports.myReadStatus = function(req, res) {
    var seed = {
        from: req.author._id,
        to: req.params.contributionId,
        type: 'read'
    };
    KLink.findOne(seed, function(err, link) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(link);
    });
};

exports.myReadStatusView = function(req, res) {
    KLink.find({
        from: req.params.viewId,
        type: 'contains'
    }, function(err, refs) {
        if (err) {
            return handleError(res, err);
        }
        var ids = [];
        refs.forEach(function(ref) {
            return ids.push(ref.to);
        });
        KLink.find({
            from: req.author._id,
            to: {
                $in: ids
            }
        }, function(err, links) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(links);
        });
    });
};

exports.index = function(req, res) {
    KRecord.find({
        targetId: req.params.objectId
    }, function(err, records) {
        if (err) {
            return handleError(res, err);
        }
        if (!records) {
            return res.sendStatus(404);
        }
        return res.json(records);
    });
};

// Get a single record
exports.show = function(req, res) {
    KRecord.findById(req.params.id, function(err, record) {
        if (err) {
            return handleError(res, err);
        }
        if (!record) {
            return res.sendStatus(404);
        }
        return res.json(record);
    });
};

// deprecated use search
exports.mine = function(req, res) {
    var authorId = req.author._id; //mongoose.Types.ObjectId(req.author._id);
    KRecord.find({
        authorId: authorId
    }, function(err, records) {
        if (err) {
            return handleError(res, err);
        }
        if (!records) {
            return res.sendStatus(404);
        }
        return res.json(records);
    });
};

// Get records
exports.search = function(req, res) {
    var query = {};
    if (req.body.query) {
        query = req.body.query;
    }
    query.communityId = req.params.communityId;
    KRecord.find(query, function(err, records) {
        if (err) {
            return handleError(res, err);
        }
        if (!records) {
            return res.sendStatus(404);
        }
        return res.json(records);
    });
};

// Creates a new record in the DB.
exports.create = function(req, res) {
    var seed = req.body;
    seed = _.merge(req.body, {
        communityId: req.author.communityId,
        authorId: req.author._id
    });
    if (!seed.type) {
        return res.sendStatus(400); //Bad request
    }
    exports.createInternal(req.body, function(err, record) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(record);
    });
};

exports.createInternal = function(seed, handler) {
    if (seed.communityId) {
        KRecord.create(seed, handler);
    } else {
        KObject.findById(seed.targetId, function(err, object) {
            if (err) {
                if (handler) {
                    handler(err);
                }
                return;
            }
            seed.communityId = object.communityId;
            KRecord.create(seed, function(err, record) {
                if (err) {
                    if (handler) {
                        handler(err);
                    }
                    return;
                }
                if (handler) {
                    handler();
                }
            });
        });
    }
};

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
