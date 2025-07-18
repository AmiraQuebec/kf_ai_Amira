'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KObjectSchema = new Schema({
    communityId: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: ''
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date,
        default: Date.now
    },
    status: { //unsaved, active or inactive
        type: String,
        required: false, //this should be true in the future
        index: true,
        default: 'active' //this should be unsaved in the future
    },
    permission: { //public or private
        type: String,
        required: false, //this should be true in the future
        index: true,
        default: 'public'
    },
    authors: {
        type: [Schema.ObjectId],
        default: []
    },
    group: {
        type: Schema.ObjectId,
        index: true
    },
    _groupMembers: { //cache for group members for reading optimization
        type: [Schema.ObjectId],
        default: []
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    docId: { //google file id
        type: String,
        default: ''
    },
    createdBy:{ //original author userName
        type: String,
        default: ''
    },
    docShared:{ //current google document coauthors
        type: [Schema.ObjectId],
        default: []
    },
    visitorRole:{ // required to check if visitor role is checked or no.
        type: Boolean,
        default: false
    },
    comments : {
        type: String,
        default: ''
    },
    wordCount : {
        type : Number,
        default : 0
    },
    // List of userIds who marked note as favourite 
    favAuthors: {
        type: [Schema.ObjectId],
        default: []
    },
});

var KObject = mongoose.model('KObject', KObjectSchema);

KObjectSchema.pre('save', function(next) {
    var obj = this;
    if (obj.group) {
        KObject.findById(obj.group, function(err, group) {
            if (err || !group) {
                console.error('error on updating groupmembers.');
            } else {
                obj._groupMembers = group.members;
            }
            next();
        });
    } else {
        next();
    }
});

KObjectSchema.post('save', function(obj) {
    if (obj.type === 'Group') {
        KObject.find({ group: obj._id }, function(err, objs){
            objs.forEach(function(doc){
                doc._groupMembers = doc.members;
                doc.save();
            });

        });
    }
});

module.exports = KObject;
