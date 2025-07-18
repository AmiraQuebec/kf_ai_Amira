'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KLinkSchema = new Schema({
    communityId: {
        type: Schema.ObjectId,
        required: true, //temporary
        index: true
    },
    from: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    to: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        index: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date,
        default: Date.now
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    /* here are cache in order to work faster for reading */
    _to: {
        type: Schema.Types.Mixed,
        //        required: true,
        default: {}
    },
    _from: {
        type: Schema.Types.Mixed,
        //        required: true,
        default: {}
    }
});

var KLink = mongoose.model('KLink', KLinkSchema);

function updateLinks(obj) {
    KLink.find({
        to: obj._id
    }, function(err, links) {
        if (err) {
            return;
        }
        links.forEach(function(link) {
            link._to = KLink.createCashObj(obj);
            link.markModified('_to');
            link.save();
        });
    });
    KLink.find({
        from: obj._id
    }, function(err, links) {
        if (err) {
            return;
        }
        links.forEach(function(link) {
            link._from = KLink.createCashObj(obj);
            link.markModified('_from');
            link.save();
        });
    });
}

/* this method will be called in both update and create */
var KObject = require('../KObject/KObject.model');
KObject.schema.post('save', function(obj) {
    updateLinks(obj);
});

KLink.createCashObj = function(obj) {

    var cache = {};
    cache.type = obj.type;
    cache.title = obj.title;
    cache.status = obj.status;
    cache.created = obj.created;
    cache.modified = obj.modified;
    cache.authors = obj.authors;
    cache.group = obj.group;
    cache._groupMembers = obj._groupMembers;
    cache.permission = obj.permission;

    /* for author */
    if (obj.userName) {
        cache.userName = obj.userName;
    }
    if (obj.firstName) {
        cache.firstName = obj.firstName;
    }
    if (obj.lastName) {
        cache.lastName = obj.lastName;
    }
    if (obj.email) {
        cache.email = obj.email;
    }

    /* for note */
    if (obj.data && obj.data.riseabove) {
        cache.data = {};
        cache.data.riseabove = 'riseabove'; /* dummy object */
    }

     if (obj.data && obj.data.promisingContains) {
        cache.data = {};
        cache.data.promisingContains = 'promisingContains'; /* dummy object */
    }

    if(obj.langInNote){
        cache.langInNote = obj.langInNote;
    }

    return cache;
}

module.exports = KLink;
