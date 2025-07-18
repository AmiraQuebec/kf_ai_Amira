'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var router = express.Router();

router
  .post('/',(req,res,next)=>{
   passport.authenticate('lti', function(err, user, info) {
     var error = err || info;
     if (error) return res.status(401).json(error);
        if (!user) return res.status(404).json({
            message: 'Something went wrong, please try again.'
        })
        else{
          auth.setTokenCookie({user:user},res);
        }

  })(req, res, next);
})


module.exports = router;
