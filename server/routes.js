/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

// Legacy: /api/links/from/<id>/child -> /api/links/from/<id>
app.get(/^\/api\/links\/from\/([^\/]+)\/child$/, function(req, res) {
  return res.redirect(308, '/api/links/from/' + req.params[0]);
});

    //The code which allows CrossDomainAccess to API
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // intercept OPTIONS method
        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    });


    // Insert routes below
    app.use('/api/notifications', require('./api/notification'));
    app.use('/api/contexts', require('./api/KBContext'));
    app.use('/api/groups', require('./api/KGroup'));
    app.use('/api/historicalobjects', require('./api/KHistoricalObject'));
    app.use('/api/communities', require('./api/KCommunity'));
    app.use('/api/objects', require('./api/KObject'));
    app.use('/api/contributions', require('./api/KContribution'));
    app.use('/api/challenges', require('./api/KChallenge'));
    app.use('/api/authors', require('./api/KAuthor'));
    app.use('/api/links', require('./api/KLink'));
    app.use('/api/records', require('./api/KRecord'));
    app.use('/api/upload', require('./api/upload'));
    app.use('/api/help', require('./api/Feedback'));
    app.use('/api/users', require('./api/user'));
    app.use('/api/recaptcha', require('./api/recaptcha'));
    app.use('/api/translate',require('./api/traslator'))
    app.use('/api/ai',require('./api/ai'))

    app.use('/api', require('./api'));
    app.use('/auth', require('./auth'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(function(req, res) {
            res.sendFile(path.resolve(app.get('appPath')) + '/index.html');
        });
};


