'use strict';

// Reference: https://github.com/nodemailer/nodemailer#set-up-smtp

exports.mail = {
  transportOptions: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'kf6feedback@gmail.com',
        pass: 'password or use environment variable such as process.env.EMAIL_PASSWORD'
    }
  },
  from: 'zzzz@gmail.com',
  baseURL: 'https://kf.example.net/'
};

exports.auth = {
  local: {
    caseSensitiveUsername : false // default = false
  }
};

// Get Google reCAPTCHA keys at https://www.google.com/recaptcha/
exports.recaptcha = {
  publicKey: 'INSERT PUBLIC KEY HERE',
  privateKey: 'INSERT PRIVATE KEY HERE'
};


// Get Google Docs credentials at https://console.developers.google.com/flows/enableapi?apiid=drive&pli=1
// You'll need to create a OAuth client ID
// Remember to add redirect URLs in your Google Drive API console such as: "https://your_host/auth/googleOAuth/getToken"
// For example:  https://kf6.ikit.org/auth/googleOAuth/getToken
// More info about Google Drive API at https://developers.google.com/drive/v3/web/about-sdk
exports.google = {
    clientSecret: 'INSERT CLIENT SECRET HERE',
    clientId:'INSERT CLIENT ID HERE',
    serverUrl: 'INSERT CURRENT SERVER URL SUCH AS - https://kf6.ikit.org' // DO NOT INCLUDE TRAILING '/'
};
