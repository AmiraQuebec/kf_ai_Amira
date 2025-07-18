'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KHistoricalObjectSchema = new Schema({
    communityId: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    type: { /* Object or Link */
        type: String,
        required: true,
        index: true
    },
    dataId: {
        type: Schema.ObjectId,
        required: true,
        index: true
    },
    dataType: {
        type: String,
        required: true,
        index: true
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
        default: {}
    }
});

var KHistoricalObject = mongoose.model('KHistoricalObject', KHistoricalObjectSchema);

KHistoricalObject.createByObject = function(object, callback) {
    create(object, 'Object', callback);
};

KHistoricalObject.createByLink = function(link, callback) {
    create(link, 'Link', callback);
};

function create(object, type, callback) {
    var seed = {};
    seed.communityId = object.communityId;
    seed.type = type;
    seed.dataId = object._id;
    seed.dataType = object.type;
    seed.data = object;
    KHistoricalObject.create(seed, callback);
}

module.exports = KHistoricalObject;