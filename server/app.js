/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });
var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });
// Connect to database
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data


// Setup server
var app = express();
var path = require('path');
app.use('/bower_components', require('express').static(path.join(__dirname, '../client/bower_components'), {fallthrough:false}));
// Expose app
exports = module.exports = app;

var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
    serveClient: (config.env === 'production') ? false : true,
    path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function() {
    console.info('Express server listening on %d, in %s mode', config.port, app.get('env'));
});
