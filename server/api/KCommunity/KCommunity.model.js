var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KCommunitySchema = new Schema({
    title: {
        type: String,
        required: true
    },
    registrationKey: {
        type: String,
        default: ''
    },
    managerRegistrationKey: {
        type: String,
        default: 'build'
    },
    created: {
        type: Date,
        default: Date.now
    },
    archived: {
        type: Boolean,
        default: false
    },
    scaffolds: [{
        type: Schema.ObjectId,
        ref: 'Scaffold',
        unique: true
    }],
    views: [Schema.ObjectId],
    promisingcolorobjs: [Schema.ObjectId],
    rootContextId: {
        type: Schema.ObjectId
    },
    lang: {
        type: String
    }
});

var KCommunity = mongoose.model('KCommunity', KCommunitySchema);
module.exports = KCommunity;
