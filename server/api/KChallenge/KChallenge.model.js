'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KChallengeSchema = new Schema({
	viewId: {
		type: Schema.ObjectId,
		require: true,
	},
	title: {
		type: String,
		require: true
	},
	description: {
		type: String,
		require: true
	},
	communityId: {
		type: String,
		require: true
	},
	userName: {
		type: String,
		require: true
	},
	user: {
		type: String,
		require: true
	},
	authors: {
		type: [Schema.ObjectId]
	},
	created: {
		type: String,
		require: true
	},
  files: [String],
  contributionAuthor: String,
  contributionDate: String,
  keywords: String,
  abstract: String,
  users: String,
  grade: String,
  students: String,
  location: String,
  country: String,
  subject: String,
  duration: String,
  education: String,
  references: String,
  research: String,
  quotes: String,
  author: String,
  link: String
});


var KChallenge = mongoose.model('KChallenge', KChallengeSchema);
module.exports = KChallenge;
