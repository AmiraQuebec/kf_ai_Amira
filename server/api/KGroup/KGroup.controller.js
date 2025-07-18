'use strict';

var _ = require('lodash');
var KGroup = require('./KGroup.model');

// Creates a new KGroup in the DB.
exports.create = function(req, res) {
    KGroup.create(req.body, function(err, KGroup) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(KGroup);
    });
};


function handleError(res, err) {
    return res.send(500, err);
}
