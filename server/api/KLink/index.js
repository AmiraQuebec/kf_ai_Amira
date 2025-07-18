'use strict';

var express = require('express');
var controller = require('./KLink.controller');
var commauth = require('../../auth/commauth.service');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.post('/from/', controller.fromIndexArray);
router.get('/from/:id/child/', controller.getChildView);
router.get('/from/:id', controller.fromIndex);
router.get('/to/:id', controller.toIndex);
router.get('/either/:id', controller.eitherIndex);
router.get('/from/:fromId/to/:toId', controller.fromtoIndex);
router.get('/view/:id', controller.viewIndex);
router.post('/:communityId/search', commauth.isAuthenticated(), controller.search);
router.get('/buildson/:id', controller.buildsonIndex); // ajout michelle janvier 2016

router.get('/updatecache/:linkId', controller.updateCash);
router.get('/updateallcache/:communityId', auth.hasRole('admin'), controller.updateAllCash);

//Kbdac notes count 
router.get('/notesCount/:viewId', controller.notesCount);

router.get('/:id', controller.show);
router.post('/', commauth.isLinkAuthenticated(), controller.create);
router.put('/:id', commauth.isLinkAuthenticated(), controller.update);
router.delete('/:id', commauth.isLinkAuthenticatedById(), controller.destroy);
router.post('/createGNoteLink', commauth.isLinkAuthenticated(), controller.createGNoteLink);

router.get('/freespace/:communityId/:id', commauth.isAuthenticated(), controller.freeSpace);
router.post('/:communityId/studentProfile', commauth.isAuthenticated(), controller.studentProfileSearch);
module.exports = router;
