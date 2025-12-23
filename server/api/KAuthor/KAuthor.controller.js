'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
function oid(id){ try { return mongoose.Types.ObjectId(id); } catch(e){ return null; }}
var KAuthor = require('./KAuthor.model');

var mongoose = require('mongoose');
var KCommunity = require('../KCommunity/KCommunity.model');
var User = require('../user/user.model');
var auth = require('../../auth/auth.service');

/**
 * Get my info
 */
exports.me = function(req, res) {
    return res.json(req.author);
};

// Creates a new registration in the DB.
exports.create = function(req, res) {
    var communityId = mongoose.Types.ObjectId(req.body.communityId);
    var userId = mongoose.Types.ObjectId(req.body.userId);

    // If not admin, prevent an authenticated user having a different id than the requested user id to register
    if ((userId.toString() !== req.user._id.toString()) && (!auth.meetsRoleRequirement(req.user.role, 'admin'))) {
        return res.status(200).send('Illegal Authentication: userId and userIdByAuth are different and ' +
          'the authenticated user does not have enough permission to bypass this verification.');
    }

    //check key
    KCommunity.findById(communityId, function(err, community) {
        if (err) {
            return handleError(res, err);
        }

        var role = '';
        if (community.registrationKey === req.body.registrationKey) {
            role = 'writer';
        } else if (community.managerRegistrationKey === req.body.registrationKey) {
            role = 'manager';
        } else {
            return res.status(400).send('Le code ne correspond pas.');
        }

        //check if already registered
        KAuthor.find({
            communityId: communityId,
            userId: userId
        }, function(err, authors) {
            if (err) {
                return handleError(res, err);
            }
            if (authors.length > 0) {
                return res.status(400).send('Vous êtes déjà inscrit.'); //already exists
            }

            User.findById(userId, function(err, user) {
              if (err) return handleError(res, err);

              if (!user) {
                return res.status(400).send('L\'utilisateur n\'existe pas.');
              }

              KAuthor.createAuthor(community, role, user,
                function (author) {
                  return res.status(201).json(author);
                },
                function (err) {
                  return handleError(res, err);
                });
            })
        });
    });
};


exports.searchCount = function(req, res) {
    var query = makeQuery(req);
    var communityId = req.body.communityId;
    KAuthor.count(query, function(err, count) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json({
            count: count
        });
    });
};

exports.searchWriters = function(req, res) {
    var query = makeQuery(req);
    var pagesize = req.body.pagesize ? req.body.pagesize : 10;
    var page = req.body.page ? req.body.page : 1;
    var communityId = req.params.communityId;
    var skip = pagesize * (page - 1);
    KAuthor.find(query).skip(skip).
    limit(pagesize).exec(function(err, authors) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(authors);
    });
};

function makeQuery(req) {
    var queryStr = req.body.query ? req.body.query : '';
    var communityId = req.params.communityId;
    var regexpstr = '(?=.*' + queryStr + ').*';
    var regexp = new RegExp(regexpstr, 'i');
    var role ="writer"
    return {
        $or: [
            { firstName: regexp },
            { lastName: regexp },
            { userName: regexp },
            { email: regexp }
        ],
        $and:[
            { communityId: communityId },
            {role: role}
        ]
    };
}

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
