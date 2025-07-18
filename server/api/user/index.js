'use strict';

var express = require('express');
var controller = require('./user.controller');
var fs = require('fs');
var config = require('../../config/environment');
var multipart = require('connect-multiparty');
var auth = require('../../auth/auth.service');
var app = require('../../app');

var router = express.Router();

/* for attachments */
if (fs.existsSync(config.attachmentsPath) === false) {
    var res = fs.mkdirSync(config.attachmentsPath);
}
//auth does not work because img will be retrieved the browser auth, not angular $http auth
//app.use('/uploads', auth.isAuthenticated(), express.static(config.attachmentsPath));
app.use(config.attachmentsURL, express.static(config.attachmentsPath));

/* for attachments upload */
var multipartMiddleware = multipart({
    uploadDir: config.attachmentsPath
});


router.get('/', auth.hasRole('admin'), controller.index);
router.get('/myRegistrations', auth.isAuthenticated(), controller.myRegistrations);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/search/role', auth.hasRole('manager'), controller.searchForAdmin);
router.post('/search/count', auth.hasRole('admin'), controller.searchCount);
router.post('/search', auth.hasRole('admin'), controller.search);
router.post('/', controller.create);
router.post('/users', multipartMiddleware, controller.createManyUsers);
router.post('/rename', multipartMiddleware, controller.renameUsers);
router.post('/renameAllUser/:id/', multipartMiddleware, controller.renameAllUser);
router.post('/validate', multipartMiddleware, controller.validate);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.patch('/:id', auth.hasRole('manager'), controller.updatePassword);
router.put('/:id', auth.hasRole('admin'), controller.forceUpdate);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
