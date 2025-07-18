'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KGroupSchema = new Schema({
    members: {
        type: [Schema.ObjectId],
        default: []
    }
});

var KObject = require('../KObject/KObject.model');
module.exports = KObject.discriminator('KGroup', KGroupSchema);
