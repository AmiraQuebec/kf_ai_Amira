'use strict';

var _ = require('lodash');
var KHistoricalObject = require('./KHistoricalObject.model');

// Get a single KHistoricalObject
exports.show = function(req, res) {
    KHistoricalObject.findById(req.params.id, function(err, KHistoricalObject) {
        if (err) {
            return handleError(res, err);
        }
        if (!KHistoricalObject) {
            return res.sendStatus(404);
        }
        return res.json(KHistoricalObject);
    });
};

exports.search = function(req, res) {
    if (!req.body.query) {
        console.error('search parameter error: ' + req.body);
        return res.sendStatus(400);
    }

    var query = req.body.query;

    //assure communityId
    if (!query.communityId) {
        if (!req.author) {
            console.error('search query error: ' + query);
            return res.sendStatus(400);
        } else {
            query.communityId = req.author.communityId;
        }
    }

    var pagesize = query.pagesize ? query.pagesize : 50;
    var page = query.page ? query.page : 1;
    var skip = pagesize * (page - 1);

    delete(query.pagesize);
    delete(query.page);

    KHistoricalObject.find(query).skip(skip).
    limit(pagesize).
    exec(function(err, contributions) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(contributions);
    });
};

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
