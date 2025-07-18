'use strict';

var _ = require('lodash');
var KBContext = require('./KBContext.model');

// Get a single KBContext
exports.show = function(req, res) {
    KBContext.findById(req.params.id, function(err, KBContext) {
        if (err) {
            return handleError(res, err);
        }
        if (!KBContext) {
            return res.sendStatus(404);
        }
        return res.json(KBContext);
    });
};

// Creates a new KBContext in the DB.
exports.create = function(req, res){
    req.body.communityId = req.params.communityId;
    KBContext.create(req.body, function(err, context) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(201, context);
    });
};

function handleError(res, err) {
    return res.send(500, err);
}
