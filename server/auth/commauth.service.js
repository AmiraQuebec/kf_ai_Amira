'use strict';

var compose = require('composable-middleware');
var auth = require('./auth.service');

var KAuthor = require('../api/KAuthor/KAuthor.model');
var KObject = require('../api/KObject/KObject.model');
var KLink = require('../api/KLink/KLink.model');

var kfac = require('./kfac')();

function checkPermissionById(requiredPermission) {
    return compose()
        .use(setObjectById)
        .use(isAuthenticated())
        .use(function(req, res, next) {
            if (kfac.fullfillRequirement(req.object, req.author, requiredPermission)) {
                next();
            } else {
                return res.sendStatus(403);
            }
        });
}

function setObjectById(req, res, next) {
    if (!req.params.id) {
        console.error('error in commauth.js, id param not found');
        return res.send(500, 'id param not found');
    }
    KObject.findById(req.params.id, function(err, object) {
        if (err) {
            console.error('error in commauth.js' + err);
            return res.send(500, err);
        }
        if (!object) {
            console.error('error in commauth.js, object not found');
            return res.send(500, 'object not found');
        }
        req.object = object;
        req.params.communityId = req.object.communityId;
        next();
    });
}

function isLinkAuthenticatedById() {
    return compose()
        .use(setLinkById)
        .use(isLinkAuthenticated());
}

function setLinkById(req, res, next) {
    if (!req.params.id) {
        console.error('error in commauth.js, id param not found');
        return res.send(500, 'id param not found');
    }
    KLink.findById(req.params.id, function(err, link) {
        if (err) {
            console.error('error in commauth.js' + err);
            return res.send(500, err);
        }
        if (!link) {
            console.error('error in commauth.js, link not found');
            return res.send(500, 'link not found');
        }
        if (!req.body) {
            req.body = {};
        }
        req.body.from = link.from;
        req.body.to = link.to;
        next();
    });
}

function isLinkAuthenticated() {
    return compose()
        .use(function(req, res, next) {
            if (!req.body.from) {
                console.error('error in commauth.js, from field not found');
                return res.send(500, 'from field not found');
            }
            KObject.findById(req.body.from, function(err, obj) {
                if (err) {
                    console.error('error in commauth.js' + err);
                    return res.send(500, err);
                }
                if (!obj) {
                    console.error('error in commauth.js, object was not found');
                    return res.send(500, 'object was not found');
                }
                req.from = obj;
                req.params.communityId = obj.communityId;
                next();
            });
        })
        .use(function(req, res, next) {
            if (!req.body.to) {
                console.error('error in commauth.js, to field not found');
                return res.send(500, 'to field not found');
            }
            KObject.findById(req.body.to, function(err, obj) {
                if (err) {
                    console.error('error in commauth.js' + err);
                    return res.send(500, err);
                }
                req.to = obj;
                next();
            });
        })
        .use(isAuthenticated());
}

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 401
 */
function isAuthenticated() {
    return compose()
        .use(auth.isAuthenticated())
        .use(function(req, res, next) {
            var user = req.user;
            /* assert user is not null */
            var communityId = req.params.communityId;
            if (!communityId) {
                return res.send(401, 'communityId not found.');
            }

            KAuthor.findOne({
                communityId: communityId,
                userId: user._id
            }, function(err, author) {

                if (err) {
                    console.error('error in commauth.js' + err);
                    return res.send(500, err);
                }
                if (!author) {
                    return res.send(401, 'author not found.');
                }

                req.author = author;
                next();
            });
        });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
    if (!roleRequired) throw new Error('Required role needs to be set');

    return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req, res, next) {
            if (req.author.role === roleRequired) {
                next();
            } else {
                res.sendStatus(403);
            }
        });
}

exports.checkPermissionById = checkPermissionById;
exports.isLinkAuthenticatedById = isLinkAuthenticatedById;
exports.isLinkAuthenticated = isLinkAuthenticated;
exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
