'use strict';
var request = require('request');

try {
  var settings = require('../../../settings.js').recaptcha;
  var enabled = true;
} catch (e) {
  var enabled = false;
  if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
    console.warn('The file setting.js doesn\'t exist or doesn\'t contain required information. Recaptcha will not work.');
  } else {
    throw e;
  }
}

exports.getConfig = function(req, res) {
  return res.json({
    publicKey: settings.publicKey
  });
};

exports.verifyResponse = function (req, res) {
  // Retrieve the secret key store in the server settings file
  var secretKey = settings.privateKey;
  var gRecaptchaResponse = req.body.gRecaptchaResponse;
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
  var data = {
    secret: settings.privateKey,
    response: gRecaptchaResponse
  };

  if (gRecaptchaResponse === undefined || gRecaptchaResponse === '' || gRecaptchaResponse === null) {
    return res.json({"responseCode": 1, "responseDesc": "Please select captcha"});
  }

  request.post(verificationUrl, {form: data}, function (error, response, body) {
    if (error) {
        console.error(error);
        return res.json({"responseCode": 1, "responseDesc": "Failed to request captcha verification"});
    } else if (response.statusCode !== 200){
        console.log("Verify reCAPTCHA failed with status code: ", response.statusCode);
        return res.json({"responseCode": 1, "responseDesc": "Failed to request captcha verification, error code: " + response.statusCode});
    }
      
    body = JSON.parse(body);
    if (body.success !== undefined && !body.success) {
      return res.json({"responseCode": 1, "responseDesc": "Failed captcha verification"});
    }
    res.json({"responseCode": 0, "responseDesc": "Success"});
  });
};
