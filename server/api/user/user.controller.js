'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var csv = require('csv');
var fs = require('fs');
var path = require('path');

var KAuthor = require('../KAuthor/KAuthor.model');
var KCommunity = require('../KCommunity/KCommunity.model');

var validationError = function (res, err) {
    console.error(err);
    return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
    res.status(200).json([]);
    // User.find({}, '-salt -hashedPassword', function (err, users) {
    //   if(err) return res.send(500, err);
    //   res.json(200, users);
    // });
};

function makeQuery(req) {
    var queryStr = req.body.query ? req.body.query : '';
    var regexpstr = '(?=.*' + queryStr + ').*';
    var regexp = new RegExp(regexpstr, 'i');
    return {
        $or: [
            { firstName: regexp },
            { lastName: regexp },
            { userName: regexp },
            { email: regexp }
        ]
    };
}

function adminRoleQuery(req) {
    var role = 'admin';
    return {
        $or: [
            { role: role }
        ]
    };
}

exports.searchCount = function (req, res) {
    var query = makeQuery(req);
    User.count(query, function (err, count) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json({
            count: count
        });
    });
};

exports.search = function (req, res) {
    var query = makeQuery(req);
    var pagesize = req.body.pagesize ? req.body.pagesize : 10;
    var page = req.body.page ? req.body.page : 1;
    var skip = pagesize * (page - 1);
    User.find(query).skip(skip).
        limit(pagesize).exec(function (err, users) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(users);
        });
};

exports.searchForAdmin = function (req, res) {
    var query = adminRoleQuery(req);
    User.find(query).exec(function (err, users) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(users);
    });
};

exports.myRegistrations = function (req, res) {
    var key = {
        userId: req.user._id
    };
    if (req.user.role !== 'admin') {
        key.blockLogin = { $ne: true };
        key['_community.archived'] = { $ne: true };
    }

    KAuthor.find(key, null, {
        sort: { order: 'asc' }
    }, function (err, authors) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(authors);
    });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {

    var newUser = new User(req.body);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.save(function (err, user) {
        if (err) {
            return validationError(res, err);
        }
        var token = jwt.sign({
            _id: user._id
        }, config.secrets.session, {
            expiresIn: "5h"
        });
        res.json({
            token: token
        });
    });
};

var validateUser = function (user, listOfUserName) {
    var validate = "";
    if (user.firstName === '')
        validate += "First name not filled in, ";
    if (user.lastName === '')
        validate += "Last name not filled in, ";
    if (user.email === '')
        validate += "Email not filled in, ";
    if (user.userName.length < 2)
        validate += "Username is too short, ";
    else if (user.userName.length > 50)
        validate += "Username is too long, ";
    if (!user.userName.match("^[a-zA-Z][.0-9a-zA-Z@_-]{1,100}$"))
        validate += "Username must only contain alphabetic characters, numbers, or '._@-'";
    /*added check to see if excel has any duplicate username : start*/
    if (listOfUserName.indexOf(user.userName) === -1) {
        listOfUserName.push(user.userName);
    }
    else {
        validate += 'Username must be unique. Repeated username : ' + user.userName + ", ";
    }
    /*added check to see if excel has any duplicate username : end*/
    if (user.password.length < 4)
        validate += "Password is too short, ";
    if (validate === "")
        validate = "valid";
    else
        validate = validate.substring(0, validate.length - 2);

    return validate;
};

exports.validate = function (req, res, next) {
    var file = req.files.file;
    fs.readFile(file.path, function (err, fileData) {
        csv.parse(fileData, function (err, data) {
            var newUsers = [];
            var listOfErr = [];
            var listOfUserName = [];
            for (var x = 1; x < data.length; x++) {
                var user = {};
                user.provider = 'local';
                user.firstName = data[x][0];
                user.lastName = data[x][1];
                user.email = data[x][2];
                user.userName = data[x][3];
                user.password = data[x][4];
                user.role = 'user';
                var validate = validateUser(user, listOfUserName);
                if (validate !== "valid")
                    listOfErr.push({ index: x + 1, msg: validate });
            }
            fs.unlink(file.path, function () {
                res.json(listOfErr);
            });
        });
    });
};
/*
    Used by the api to rename users.
    Finds the user by username and update's its firstName and lastName in KAuthors
    in the communityId provided.
*/
var updateUserbyUsername = function (user, communityId) {
    return new Promise(function (resolve, reject) {
        var query = {
            'communityId': communityId,
            'userName': user.userName
        };
        var updateValues = {
            'firstName': user.firstName,
            'lastName': user.lastName
        };
        var options = { multi: false };
        KAuthor.update(query, updateValues, options, function (err, updateResult) {
            if (err) {
                reject(updateResult);
            } else {
                resolve(updateResult);
            }
        });
    });
};

exports.renameAllUser = function (req, res) {

    var communityId = req.params.id;
    var userData = req.body.userData;

    var updatePromises = [];

    var count = 0;
    for (var key in userData) {
        count += 1;
        var user = {};
        user.firstName = userData[key].FirstName;
        user.lastName = userData[key].LastName;
        user.userName = key;
        updatePromises.push(updateUserbyUsername(user, communityId));
    }
    Promise.all(updatePromises).then(function (updatedValues) {
        var countUpdatedValue = 0;
        updatedValues.forEach(function (updatedValue) {
            countUpdatedValue += updatedValue.nModified;
            if (count === countUpdatedValue) {
                res.json({
                    'recordsModified': countUpdatedValue
                })
            }
        })
    });
};

/*
    Accepts CSV file downloaded from all authors.
    Finds all users from the file by userName and updates the firstName and lastName as mentioned in CSV.
*/
exports.renameUsers = function(req, res, next){
    var communityId = req.body.communityId;
    var file = req.files.file;
    var updatePromises = [];
    fs.readFile(file.path, function(err, fileData){
        csv.parse(fileData, function(err, data){
            var updatedUsers = [];
            for(var x = 1; x < data.length; x++){
                var user = {};
                user.firstName = data[x][0];
                user.lastName = data[x][1];
                user.userName = data[x][2];
                updatePromises.push(updateUserbyUsername(user, communityId));
            }
            Promise.all(updatePromises).then(function(updatedValues){
                var nModified = 0;
                var ok = 0;
                updatedValues.forEach(function(updatedValue){
                    nModified += updatedValue.nModified.valueOf();
                    ok += updatedValue.ok.valueOf();
                });
                res.json({
                    'nModified': nModified,
                    'ok': ok
                });
            });
        });
    });
};

exports.createManyUsers = function (req, res, next) {
    var file = req.files.file;
    fs.readFile(file.path, function (err, fileData) {
        csv.parse(fileData, function (err, data) {
            var newUsers = [];
            for (var x = 1; x < data.length; x++) {
                var user = {};
                user.provider = 'local';
                user.firstName = data[x][0];
                user.lastName = data[x][1];
                user.email = data[x][2];
                user.userName = data[x][3];
                user.password = data[x][4];
                user.role = 'user';
                newUsers.push(new User(user));
            }

            KCommunity.findById(req.body.community, function (err, community) {
                if (err) {
                    return handleError(res, err);
                }
                var listOfErr = [];
                var numProcessed = 0;
                newUsers.forEach(function (curr) {
                    curr.save(function (err, userObj) {
                        if (err) {
                            var key = Object.keys(err.errors)[0];
                            /* Condition checks if username already exist in the community, else will add new Author for particular community */
                            if (err.errors[key].message !== undefined && err.errors[key].message === 'Le nom d\'utilisateur spécifié est déjà utilisé.') {
                                User.findOne({
                                    userName: curr.userName
                                }, function (err, user) {
                                    if (err) {
                                        return next(err);
                                    }
                                    if (!user) {
                                        return res.sendStatus(401);
                                    }
                                    if (user) {
                                        KAuthor.find({
                                            communityId: community._id,
                                            userId: user._id,
                                        }, function (err, author) {
                                            if (author.length > 0) {            //author already in this community
                                                if (++numProcessed === newUsers.length) {
                                                    res.json(listOfErr);
                                                }

                                            }
                                            if (author.length === 0) {           //author exist in KF but not in this community
                                                KAuthor.createAuthor(community, 'writer', user,
                                                    function (auth) {
                                                        if (++numProcessed === newUsers.length) {
                                                            res.json(listOfErr);
                                                        }
                                                    },
                                                    function (err) {
                                                        listOfErr.push({ index: numProcessed + 1, msg: err.message });
                                                        if (++numProcessed === newUsers.length) {
                                                            res.json(listOfErr);
                                                        }
                                                    });
                                            }
                                            if (err) {
                                                listOfErr.push({ index: numProcessed + 1, msg: err.message });
                                                if (++numProcessed === newUsers.length) {
                                                    res.json(listOfErr);
                                                }
                                            }

                                        });
                                    }

                                });
                            }
                            else {

                                listOfErr.push({ index: numProcessed + 1, msg: err.errors[key].value + ": " + err.errors[key].message });
                                if (++numProcessed === newUsers.length) {
                                    res.json(listOfErr);
                                }
                            }
                        }
                        else {
                            KAuthor.find({
                                communityId: community,
                                userId: userObj._id
                            }, function (err, authors) {
                                if (authors.length === 0) {
                                    KAuthor.createAuthor(community, 'writer', userObj,
                                        function (author) {
                                            if (++numProcessed === newUsers.length) {
                                                res.json(listOfErr);
                                            }
                                        },
                                        function (err) {
                                            listOfErr.push({ index: numProcessed + 1, msg: err.message });
                                            if (++numProcessed === newUsers.length) {
                                                res.json(listOfErr);
                                            }
                                        });
                                }
                            });

                        }

                    });
                });
            });
        });
    });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
    var userId = req.params.id;

    User.findById(userId, function (err, user) {
        if (err) return next(err);
        if (!user) return res.sendStatus(401);
        res.json(user.profile);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.send(500, err);
        return res.sendStatus(204);
    });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    User.findById(userId, function (err, user) {
        if (user.authenticate(oldPass)) {
            user.password = newPass;
            user.save(function (err) {
                if (err) {
                    return validationError(res, err);
                }
                res.sendStatus(200);
            });
        } else {
            res.sendStatus(403);
        }
    });
};


/**
 * Change user password with patch
 */
exports.updatePassword = function (req, res) {
    var userId = req.params.id;
    var pass = String(req.body.password);
    User.findById(userId, function (err, user) {
        user.password = pass;
        user.save(function (err) {
            if (err) {
                return validationError(res, err);
            }
            res.sendStatus(200);
        });

    });
};


exports.forceUpdate = function (req, res, next) {
    var userId = req.params.id;
    User.findById(userId, function (err, user) {
        if (err) {
            return validationError(res, err);
        }
        if (!user) {
            return res.sendStatus(403);
        }
        user.password = req.body.password;
        user.save(function (err) {
            if (err) {
                return validationError(res, err);
            }
            res.sendStatus(200);
        });
    });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
    var userId = req.user._id;
    User.findOne({
        _id: userId
    }, '-salt -hashedPassword -accessToken -refreshToken -googleEmail -rootFolder', function (err, user) { // don't ever give out the password or salt
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.sendStatus(401);
        }
        res.json(user);
    });
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
    res.redirect('/');
};

function handleError(res, err) {
    return res.send(500, err);
}
