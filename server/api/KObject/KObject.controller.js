'use strict';

var _ = require('lodash');
var KObject = require('./KObject.model');
var KRecordController = require('../KRecord/KRecord.controller.js');
var KHistoricalObject = require('../KHistoricalObject/KHistoricalObject.model.js');
var upload = require('../upload/upload.controller');
var KCommunities = require('../KCommunity/KCommunity.controller');
var mongoose = require('mongoose');
// Get list of KObjects
exports.index = function(req, res) {
    //this should not be used
    res.status(200).json([]);
};

// Get a single KObject
exports.show = function(req, res) {
    KObject.findById(req.params.id, function(err, obj) {
        if (err) {
            return handleError(res, err);
        }
        if (!obj) {
            return res.sendStatus(404);
        }
        
        return res.json(obj);
    });
};

// Creates a new KObject in the DB.
exports.create = function(req, res) {
    if (!_.includes(req.body.authors, req.author._id.toString())) {
        console.error('author must be included in authors.');
        return res.sendStatus(403);
    }
    KObject.create(req.body, function(err, obj) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(obj);
    });
};

// Updates an existing contribution in the DB.
exports.update = function(req, res) {
    
    var newobj = req.body;
    if (newobj.type === 'Attachment' && newobj.tmpFilename) {
        try {
            upload.processAttachment(newobj);
        } catch (e) {
            return res.send(500, e);
        }
    }

    if (newobj._id) {
        delete newobj._id;
        delete newobj.__v; /* by using this, we can avoid conflict of editing multi users*/
    }

    KObject.findById(req.params.id, function(err, contribution) {
        if (err) {
            return handleError(res, err);
        }
        if (!contribution) {
            return res.sendStatus(404);
        }

        // exceptional case restriction
        if (contribution.type === 'Author' && contribution.role !== newobj.role && req.author.role !== 'manager') {
            return res.sendStatus(403);
        }


        var updated = _.merge(contribution, newobj);
        if (newobj.authors) {
            updated.authors = newobj.authors;
            updated.markModified('authors');
        }
        if (newobj.keywords) {
            updated.keywords = newobj.keywords;
            updated.markModified('keywords');
        }
        if (newobj.members) {
            updated.members = newobj.members;
            updated.markModified('members');
        }
        if (newobj.data) {
            //Added to Multilanguage Notes : In order to update the languages disabled by user.
            updated.data.languages = newobj.data.languages;
            updated.markModified('data');
        }
        if(newobj.wordCount){
            updated.wordCount = newobj.wordCount;
            updated.markModified('wordCount');
        }
        /* Database validation check from 6.5.x */
        /* (A workspace creation problem was caused by this on 6.4.x) */
        if (updated.__t === 'KAuthor' && !updated.userName) {
            return res.sendStatus(500);
        }
        /* Database validation check end */

        updated.modified = Date.now();
        if (updated.group && updated.group.toString() !== newobj.group) {
            updated._groupMembers = null;
        }
        updated.save(function(err, newContribution) {
            if (err) {
                return handleError(res, err);
            }
            KHistoricalObject.createByObject(newContribution, function(err, historical) {
                if (err) {
                    return handleError(res, err);
                }
                KRecordController.createInternal({
                    authorId: req.author._id,
                    targetId: contribution._id,
                    type: 'modified',
                    historicalObjectType: 'Object',
                    historicalObjectId: historical._id
                });
            });
            return res.status(200).json(newContribution);
        });
    });
};

// Deletes a KObject from the DB.
exports.destroy = function(req, res) {
    //not implemented yet
    res.sendStatus(500);
};

// Get all riseabove
exports.getRiseAbove = function(req, res) {
    var query = req.body.query;
    var projection  = req.body.projection;
    var communityId = req.params.communityId;

    var mongoQuery = {
        $and: []
    };
    mongoQuery.$and.push({
        communityId: communityId
    });

    mongoQuery.$and.push({
        status: 'active'
    });

    mongoQuery.$and.push({
        type: 'View'
    });

    mongoQuery.$and.push({
        title: 'riseabove:'
    });

    if (query.authors && query.authors.length > 0) {
        var authorIds = [];
        query.authors.forEach(function(authorIdStr) {
            authorIds.push(mongoose.Types.ObjectId(authorIdStr));
        });
        mongoQuery.$and.push({
            authors: {
                $in: authorIds
            }
        });
    }
    KObject.find(mongoQuery, projection, function(err, riseabovelist) {
        if (err) {
            return handleError(res, err);
        }
        if (!riseabovelist) {
            return res.sendStatus(404);
        }
        return res.json(riseabovelist);
    });
};

/**
 * API that saves as favourite for a particular Note.
 *
 * **/
exports.addNoteToFav =function(req,res){
    KObject.findById(req.params.noteId, function(err, contribution) {
        if (err) {
            return handleError(res, err);
        }
        if (!contribution) {
            return res.sendStatus(404);
        }
        var favAuthors=contribution.favAuthors;
        var newauthor=req.user._id;
        if(favAuthors){
            favAuthors.push(newauthor);
        }else{
            favAuthors=[];
            favAuthors.push(newauthor);
        }
        contribution.favAuthors=favAuthors;
        contribution.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            res.status(200).json({"sucess":true});
        });
      
    });
}

/**
 * API that remove as favourite for a particular Note.
 *
 * **/
exports.removeNoteFromFav =function(req,res){
    KObject.findById(req.params.noteId, function(err, contribution) {
        if (err) {
            return handleError(res, err);
        }
        if (!contribution) {
            return res.sendStatus(404);
        }
        var favAuthors=contribution.favAuthors;
        var newauthor=req.user._id;

        if (favAuthors) {
            var index = favAuthors.indexOf(newauthor);
            if (index > -1) {
                favAuthors.splice(index, 1);
            }
        }
        contribution.favAuthors=favAuthors;
        contribution.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            res.status(200).json({"sucess":true});
        });
      
    });
}

/**
 * API that saves the comments for a particular Note.
 *
 * **/
exports.savecomments = function (req,res) {
    KObject.findOneAndUpdate({_id : req.params.id},{$set : {comments: req.body.comments}},(err,contribution) => {
       if(err){
           handleError(res,err);
       } else{
           return res.status(200).json(contribution);
       }
    });
};

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
