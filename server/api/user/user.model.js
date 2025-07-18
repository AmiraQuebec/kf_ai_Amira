'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google', 'idul', 'moodle'];

var UserSchema = new Schema({
    name: String, /* moved to first and last name now temporary keeping for compatibility */
    firstName: String,
    lastName: String,
    email: {
        type: String,
        lowercase: true
    },
    userName: {
      type: String,
      required: true,
      unique: true
    },
    role: {
        type: String,
        default: 'user'
    },
    hashedPassword: String,
    provider: String,
    salt: String,
    facebook: {},
    twitter: {},
    google: {},
    github: {},
    ltiData:{
        required: false,
    },
    accessToken: String,
    refreshToken: String,
    expiryDate: Date,
    googleEmail: String,
    rootFolder: String
});

/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

// Public profile information
UserSchema
    .virtual('profile')
    .get(function() {
        return {
            '_id': this._id,
            'email': this.email,
            'userName': this.userName,
            'name': this.firstName + ' ' + this.lastName,
            'firstName': this.firstName,
            'lastName': this.lastName,
            'role': this.role
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function() {
        return {
            '_id': this._id,
            'role': this.role
        };
    });

/**
 * Validations
 */

// Validate empty userName
UserSchema
    .path('userName')
    .validate(function(userName) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return userName.length;
    }, 'UserName cannot be blank');

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function(hashedPassword) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return hashedPassword.length;
    }, 'Password cannot be blank');

// Validate userName is not taken

UserSchema
    .path('userName')
    .validate(function(userName, respond) {
        var self = this;
        this.constructor.findOne({
          provider: 'local',
          userName: new RegExp('^' + userName + '$', 'i')
        }, function(err, user) {
            if (err) throw err;
            if (user) {
                if (self.id === user.id) return respond(true);
                return respond(false);
            }
            respond(true);
        });
    }, 'The specified userName is already in use.');
// TODO i18n: translate the messages because their appear in the user registration and possible somewhere else

var validatePresenceOf = function(value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function(next) {
        if (!this.isNew) return next();

        if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
            next(new Error('Invalid password'));
        else
            next();
    });

/**
 * Methods
 */
UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
    }
};

module.exports = mongoose.model('User', UserSchema);
