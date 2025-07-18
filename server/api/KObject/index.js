'use strict';

var express = require('express');
var controller = require('./KObject.controller');
var commauth = require('../../auth/commauth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', commauth.checkPermissionById('r'), controller.show);
router.post('/:communityId', commauth.isAuthenticated(), controller.create);
router.put('/:communityId/:id', commauth.checkPermissionById('w'), controller.update);
router.delete('/:communityId/:id', commauth.checkPermissionById('w'), controller.destroy);
router.post('/:communityId/riseabove', commauth.isAuthenticated(), controller.getRiseAbove);
router.put('/:communityId/:id/savecomments', commauth.checkPermissionById("w"), controller.savecomments);
// Add and remove  from favourites
router.post('/addTofav/:communityId/:noteId',commauth.isAuthenticated(),controller.addNoteToFav);
router.post('/remFromfav/:communityId/:noteId',commauth.isAuthenticated(),controller.removeNoteFromFav);
module.exports = router;
