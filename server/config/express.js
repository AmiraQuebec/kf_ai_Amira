/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var log4js = require('log4js');
var fs = require('fs');

module.exports = function(app) {
    var env = app.get('env');

    app.set('views', config.root + '/server/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(compression());
    app.use(bodyParser.urlencoded({
        limit: '100mb', // 100kb default is too small
        extended: false
    }));
    app.use(bodyParser.json({
        limit: '100mb' // 100kb default is too small
    }));
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(passport.initialize());

    // Persist sessions with mongoStore
    // We need to enable sessions for passport twitter because its an oauth 1.0 strategy
    app.use(session({
        secret: config.secrets.session,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));

    // for proxy
    app.enable('trust proxy');

    // for logging
    //morgan.format('kf-format', ':remote-addr - - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" (:response-time ms)');
    //Apache combined format in morgan for fluentd
    morgan.format('kf-format', ':remote-addr - - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');

    if ('production' === env) {
        app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
        app.use(express.static(path.join(config.root, 'public')));
app.use('/bower_components', require('express').static(require('path').join(__dirname, '../../client/bower_components')));
        app.set('appPath', config.root + '/public');

        //logging
        var logDir = config.logDir;
        if(fs.existsSync(logDir) === false){
            fs.mkdirSync(logDir);
        }
        log4js.configure({
            appenders: [{
                'type': 'dateFile',
                'filename': logDir + '/access.log',
                'pattern': '-yyyyMMdd',
                'layout': {
                    'type': 'pattern',
                    'pattern': '%m'
                }
            }]
        });
        var appLogger = log4js.getLogger('dateFile');
        var HTTPLogger = morgan('kf-format', {
            'stream': {
                write: function(str) {
                    str = str.slice(0, -1);//chop
                    appLogger.info(str);
                }
            }
        });
        app.use(HTTPLogger);
        //app.use(morgan('kf-format'));
    }

    if ('development' === env || 'test' === env) {
        app.use(require('connect-livereload')());
        app.use(express.static(path.join(config.root, '.tmp')));
        app.use(express.static(path.join(config.root, 'client')));
        app.set('appPath', 'client');
        app.use(morgan('dev'));
        //app.use(morgan('default'));
        //app.use(morgan('kf-format'));
        app.use(errorHandler()); // Error handler - has to be last
    }

};
