'use strict';

var Feedback = require('./Feedback.model');
var Email = require('../../components/kfmail/kfmail.js');

var validationError = function(res, err) {
    console.error(err);
    return res.status(422).json(err);
};

exports.saveAndSend = function(req, res){
	//save to local
	var newFeedback = {};
    newFeedback.email = req.body.email;
    newFeedback.title = req.body.subject;
    newFeedback.content = req.body.content;
    newFeedback.create = Date.now();
    newFeedback.status = "1";
    var fb = new Feedback(newFeedback);
    fb.save(function(err) {
        if (err) {
            return validationError(res, err);
        }
        //send to Trello
        //!!! please change to a valid trello email address
		//var to = "weiyu8+4vme7zhlmts6ug7mp6yl@boards.trello.com";
        var to = "ikit5+j24ckkdtzbgc8wwf6gg1@boards.trello.com";
		var subject = newFeedback.title;
		var body = "From: " + newFeedback.email +"\n" + newFeedback.content;
		Email.send(to, subject, body);
        res.json({
            id: fb._id
        });
    });
	
}
