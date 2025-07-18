'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KRecordSchema = new Schema({
    communityId: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    authorId: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    targetId: {
        type: Schema.ObjectId,
        required: false,
        index: true
    },
    type: { /* created, read, modified, or deleted */
        type: String,
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },

    /* historical information will be set in modified type */

    historicalObjectType: { /* Object or Link */
        type: String,
        required: false,
        index: true
    },
    historicalVariableName: { /* in case of link, link.type should be set  */
        type: String,
        required: false,
        index: true
    },
    historicalOperationType: { /* only in case of link: created, modified, or deleted should be set */
        type: String,
        required: false,
        index: true
    },
    historicalObjectId: {
        type: Schema.ObjectId,
        required: false,
        index: true
    }
});

module.exports = mongoose.model('KRecord', KRecordSchema);