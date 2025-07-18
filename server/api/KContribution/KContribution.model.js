'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KContributionSchema = new Schema({
    keywords: [String],
    text4search: String,langInNote:{
        type:[String]
    }
});

// for text index search
KContributionSchema.index({
    text4search: 'text'
});

var KObject = require('../KObject/KObject.model');
module.exports = KObject.discriminator('KContribution', KContributionSchema);
