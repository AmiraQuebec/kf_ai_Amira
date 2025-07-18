var fs = require('fs');
var request = require('request');
var simplequeue = require('simplequeue');
var path = require('path');
var config = require('../config/environment');
var express = require('express');
var router = express.Router();
var readline = require('readline');
var google = require('googleapis');
var service = google.drive('v3');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var User = require('../api/user/user.model');
var KObject = require('../api/KObject/KObject.model');
var googleOAuthClient = {};
var queue = simplequeue.createQueue();
var _ = require('lodash');
var googleSettings = require('../../settings.js').google;


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
//var SCOPES = ['https://www.googleapis.com/auth/drive', 'profile', 'email'];
var SCOPES = ['https://www.googleapis.com/auth/drive'];
var clientSecret = googleSettings.clientSecret;
var clientId = googleSettings.clientId;
var redirectUrl = googleSettings.serverUrl + '/auth/googleOAuth/getToken';
var credentials = {};

/**
  * get credential from local memory or disk, if not exist, return null
  */
var getCredential = function(userName, cb){
  if(credentials[userName] === undefined){
    //search in mongodb and save to memory
    User.findOne({userName:userName}, function(err, user) {
        if (!err) {
            if(user && user.accessToken && user.refreshToken ){
                var crd = {};
                crd.access_token = user.accessToken;
                crd.refresh_token = user.refreshToken;
                crd.expiry_date = user.expiryDate;
                crd.google_email = user.googleEmail;
                crd.root_folder = user.rootFolder;
                credentials[userName] = crd;
                if(cb){
                    cb(credentials[userName]);
                }
            }
            else{
              if(cb){
                  cb(null);
              }
            }
        }
        else{
            if(cb){
                cb(null);
            }
        }
    });
  }
  else{
    if(cb){
        cb(credentials[userName]);
    }
  }
}

function getOAuthClient(){
  return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}

function getNewCredential(userName){
    return {};
}

function getGoogleAuthUrl(userName, viewId){
  var oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: userName +'|'+ viewId
    });
}

/**
 * Store token and user google email addr to disk which will be used in later program executions.
 *
 * 
 */
function storeToken2DB(userName, token, gEmail) {
  User.findOne({userName: userName}, function(err, user) {
        if (!err) {
            var updated = _.merge(user, {});
            updated.accessToken = token.access_token;
            updated.markModified('accessToken');
            updated.refreshToken  = token.refresh_token;
            updated.markModified('refreshToken');
            updated.expiryDate = token.expiry_date;
            updated.markModified('expiryDate');
            updated.googleEmail = gEmail;
            updated.markModified('googleEmail');
            user.save(function(err) {
              if(err){
                  return;
              }
            });
        }
    });
}

/**
 * Store "kf6" folder ID to disk which will be used in later program executions.
 *
 */
function storeFolderInfo2DB(userName, folderId) {
  User.findOne({userName: userName}, function(err, user) {
        if (!err) {
            var updated = _.merge(user, {});
            updated.rootFolder = folderId;
            updated.markModified('rootFolder');
            user.save(function(err) {
              if(err){
                  return;
              }
            });
        }
    });
}


/**
  * Check if "kf6" folder already exists in user's drive, 
  * if not exist, then create one and save folder id to local DB
  */
function createOrSaveFolder2DB(userName){
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    service.files.list({
            auth: oauth2Client,
            q:"name = 'kf6' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            pageSize: 10,
            spaces: 'drive'
            //fields: "nextPageToken, files(id, name)"
          }, function(err, response) {
            if (err) {
              console.error('The API returned an error: ' + err);
              return;
            }
            var files = response.files;
            if (files.length === 0) {
              //create "kf6" folder
              var fileMetadata = {
                    'name' : 'kf6',
                    'mimeType' : 'application/vnd.google-apps.folder'
              };
              service.files.create({
                     resource: fileMetadata,
                     auth: oauth2Client,
                     fields: 'id'
                  }, function(err, file) {
                    if (err) {
                      console.error('The API returned an error: ' + err);
                      return;
                    }
                    credentials[userName].root_folder = file.id;
                    storeFolderInfo2DB(userName, file.id);
                  });
            } else {
              //take the first folder and save to local DB
              var file = files[0];
              credentials[userName].root_folder = file.id;
              storeFolderInfo2DB(userName, file.id);
            }
          });
}

/**
 * for specified note, Store shared author id to disk.
 *
 * 
 */
function storePermission2DB(objId, authorId) {
  KObject.findById(objId, function(err, contribution) {
        if (err) {
            console.error(err);
            return;
        }
        
        var updated = _.merge(contribution, {});
        updated.docShared.push(authorId);
        updated.markModified('docShared');
        updated.save(function(err, newContribution) {
            if (err) {
                console.error(err);
                return;
            }
        });
    });
}

/**
  * Store Google File ID to mongodb
  */
function storeGFileID2DB(objId, gFileId){
  
  KObject.findById(objId, function(err, contribution) {
        if (err) {
            console.error(err);
            return;
        }
        
        var updated = _.merge(contribution, {});
        updated.data.oldUrl = updated.data.url;
        updated.data.url = "https://drive.google.com/file/d/"+gFileId+"/view";
        updated.data.downloadUrl = "https://drive.google.com/uc?authuser=0&id="+gFileId+"&export=download";
        updated.data.uploadTS = Date.now();
        updated.markModified('data');
        updated.save(function(err, newContribution) {
            if (err) {
                console.error(err);
                return;
            }
        });
    });
}

/**
  * Store Google File content and title to mongodb
  */
function storeGFileContent2DB(objId, content, title){
  
  KObject.findById(objId, function(err, contribution) {
        if (err) {
            console.error(err);
            return;
        }
        
        var updated = _.merge(contribution, {});
        updated.data.body = content;
        updated.markModified('data');
        updated.title = title;
        updated.markModified('title');
        updated.save(function(err, newContribution) {
            if (err) {
                console.error(err);
                return;
            }
        });
    });
}

/**
  * upload video to Google photo
  *
  */
googleOAuthClient.uploadVideo = function(userName, file, callback){
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    oauth2Client.getAccessToken(function(){
      if(credentials[userName].access_token !== oauth2Client.credentials.access_token){
          credentials[userName].access_token = oauth2Client.credentials.access_token;
          credentials[userName].refresh_token = oauth2Client.credentials.refresh_token;
          credentials[userName].expiry_date = oauth2Client.credentials.expiry_date;
          storeToken2DB(userName,credentials[userName], credentials[userName].google_email);
      }
      
      fs.readFile(file.path, function(err, content){
        if (err) {
            console.error(err);
            return;
        }
        request.post({
          'url': 'https://www.googleapis.com/upload/drive/v3/files',
          'qs': {
            'uploadType': 'multipart',
            'fields': 'id'
          },
          'headers' : {
            'Authorization': 'Bearer ' + oauth2Client.credentials.access_token
          },
          'multipart':  [
            {
              'Content-Type': 'application/json; charset=UTF-8',
              'body': JSON.stringify({
                 'name': file.originalFilename,
                 'parents': [credentials[userName].root_folder]
               })
            },
            {
              'Content-Type': 'video/mp4',
              'body': content
            }
          ]
        }, function(err,res){
            if(err){
                console.error(err);
            }
            else{
              var data = JSON.parse(res.body);
              //console.log(data.id);
              //update permission: any one with the link can view
              setupGFilePermission(userName, data.id);
              storeGFileID2DB(file.objId, data.id);
            }
        });
      });
    });
}

/**
  * initiate Google file permission
  */
function setupGFilePermission(userName, fileId){
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    service.permissions.create({
      resource: {
        'type':'anyone',
        'role':'reader',
        'withLink':true
      },
      auth: oauth2Client,
      fileId: fileId,
      fields: 'id'
    }, function(err, res) {
      if (err) {
        // Handle error
        console.error(err);
        return;
      }
    });
}

googleOAuthClient.addPermission = function(req, res){
    var fileId = req.body.docId;
    var author = req.body.createdBy;
    var userName = req.body.userName;
    var noteId = req.body.noteId;
    var authorId = req.body.authorId;
    var email = credentials[userName].google_email;
    var oauth2Client = getOAuthClient();
    getCredential(author, function(crd){
        oauth2Client.credentials = crd;
        service.permissions.create({
          resource: {
            'type':'user',
            'role':'writer',
            'emailAddress':email
          },
          auth: oauth2Client,
          fileId: fileId,
          fields: 'id'
        }, function(err, p) {
          if(err) {
            // Handle error
            res.status(404);
            res.json({'error':err});
          } else {
            storePermission2DB(noteId, authorId);
            res.json({'data':authorId});
          }
        });
    });
    
}



googleOAuthClient.getOAuthUrl = function(req, res) {
  // res.writeHead(302, {'Location': getGoogleAuthUrl()});
  var userName = req.body.userName;
  var viewId = req.body.viewId;
  var url = getGoogleAuthUrl(userName,viewId);
  res.json({'data':url});
};

googleOAuthClient.checkStatus = function(req, res) {
  // res.writeHead(302, {'Location': getGoogleAuthUrl()});
  var userName = req.body.userName;
  if(credentials[userName] === undefined){
    //search in mongodb and save to memory
    User.findOne({userName:userName}, function(err, user) {
        if (!err) {
            if(user && user.accessToken && user.refreshToken ){
                var crd = {};
                crd.access_token = user.accessToken;
                crd.refresh_token = user.refreshToken;
                crd.expiry_date = user.expiryDate;
                crd.google_email = user.googleEmail;
                credentials[userName] = crd;
                if(!user.rootFolder){
                  createOrSaveFolder2DB(userName);
                }
                else{
                  credentials[userName].root_folder = user.rootFolder;
                }
                res.json({'data':true});
            }
            else{
                res.json({'data':false});
            }
        }
        else{
          res.json({'data':false});
        }
    });
  }else{
    res.json({'data':true});
  }
};

googleOAuthClient.getToken = function(req, res) {
  // res.writeHead(302, {'Location': getGoogleAuthUrl()});
  var info = req.query.state;
  var arr = info.split('|');
  var userName = arr[0];
  var viewId = arr[1];
  var code =  req.query.code;
  var oauth2Client = getOAuthClient();
  oauth2Client.getToken(code, function(err, tks) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if(!err) {
        credentials[userName] = tks;
        //save tokens for this user
        oauth2Client.credentials = credentials[userName];
        service.about.get({
             auth: oauth2Client,
             fields: 'user'
          }, function(err, data) {
            if(err) {
              // Handle error
              res.redirect('/view/'+viewId);
            } else {
              var email = data.user.emailAddress;
              credentials[userName].google_email = email;
              storeToken2DB(userName,tks,email);
              createOrSaveFolder2DB(userName);
              res.redirect('/view/'+viewId);
            }
          });
        
    }
    else{
        //res.redirect('/',{'msg':"failed to authorize from google."});
        res.redirect('/view/'+viewId);
    }
  });
};

/**
  * put video save message to queue
  * producer for queue
  */
googleOAuthClient.putMessage = function(req, res){
    var msg = {};
    var file = {};
    file.objId = req.body.objId;
    var path = req.body.url.replace(/^\/attachments/, '');
    file.path = config.attachmentsPath + path;
    file.originalFilename = req.body.originalFilename;
    msg.file = file;
    msg.username = req.body.userName;
    queue.putMessage(msg);
    res.json({'data':true});
};

/**
  * create note on google drive and save file info to local DB
  *
  */
googleOAuthClient.createFile = function(req, res){
    //creating file
    var title = req.body.title;
    var scaffolds = req.body.scaffolds;
    var userName = req.body.userName;
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    oauth2Client.getAccessToken(function(){
      if(credentials[userName].access_token !== oauth2Client.credentials.access_token){
          credentials[userName].access_token = oauth2Client.credentials.access_token;
          credentials[userName].refresh_token = oauth2Client.credentials.refresh_token;
          credentials[userName].expiry_date = oauth2Client.credentials.expiry_date;
          storeToken2DB(userName,credentials[userName], credentials[userName].google_email);
      }
      //generate content for google document
      var fileMetadata = {
            'name' : title,
            'mimeType' : 'application/vnd.google-apps.document',
            'parents': []
      };
      fileMetadata.parents.push(credentials[userName].root_folder);
      var html = createScaffoldHTML(scaffolds);
      if(html === ""){
          service.files.create({
             resource: fileMetadata,
             auth: oauth2Client,
             fields: 'id'
          }, function(err, file) {
            if(err) {
              // Handle error
              res.status(404);
              res.json({'error':err});
            } else {
              setupGFilePermission(userName, file.id);
              var data = {};
              data.docId = file.id;
              res.json({'data':data});
            }
          });
      }
      else{
          var media = {
            mimeType: 'text/html',
            body: html
          };
          service.files.create({
             resource: fileMetadata,
             auth: oauth2Client,
             media: media,
             fields: 'id'
          }, function(err, file) {
            if(err){
                  res.status(404);
                  res.json({'error':err});
              }
              else{
                setupGFilePermission(userName, file.id);
                var data = {};
                data.docId = file.id;
                res.json({'data':data});
              }
          });
      }
      
    });
    
};

/**
  * get document content from google drive
  */
googleOAuthClient.exportFile = function(req, res){
    var noteId = req.body.noteId;
    var docId = req.body.docId;
    var userName = req.body.userName;
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    oauth2Client.getAccessToken(function(){
      if(credentials[userName].access_token !== oauth2Client.credentials.access_token){
          credentials[userName].access_token = oauth2Client.credentials.access_token;
          credentials[userName].refresh_token = oauth2Client.credentials.refresh_token;
          credentials[userName].expiry_date = oauth2Client.credentials.expiry_date;
          storeToken2DB(userName,credentials[userName], credentials[userName].google_email);
      }
      service.files.get({
         auth: oauth2Client,
         fileId: docId
      }, function(err, file) {
        if(err) {
          // Handle error
          res.status(404);
          res.json({'error':err});
        } else {
          var data = {};
          data.title = file.name;
          service.files.export({
             auth: oauth2Client,
             fileId: docId,
             mimeType: 'text/html'
          }, function(err, content) {
            if(err) {
              // Handle error
              res.status(404);
              res.json({'error':err});
            } else {
              //save to local
              var idx = content.indexOf("<p ");
              var html = content.substring(idx);
              idx = html.indexOf("</body>");
              html = html.substring(0,idx);
              storeGFileContent2DB(noteId, html, data.title);
              data.body = html;
              res.json({'data':data});
            }
          });
        }
      });
    });
};

googleOAuthClient.getList = function(req, res){
    var userName = req.body.userName;
    var pageToken = req.body.pageToken;
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    oauth2Client.getAccessToken(function(){
      if(credentials[userName].access_token !== oauth2Client.credentials.access_token){
          credentials[userName].access_token = oauth2Client.credentials.access_token;
          credentials[userName].refresh_token = oauth2Client.credentials.refresh_token;
          credentials[userName].expiry_date = oauth2Client.credentials.expiry_date;
          storeToken2DB(userName,credentials[userName], credentials[userName].google_email);
      }
      service.files.list({
              auth: oauth2Client,
              q:"'"+credentials[userName].root_folder+"' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false",
              pageSize: 10,
              spaces: 'drive',
              pageToken: pageToken,
              fields: 'nextPageToken, files(id,name,createdTime)'
            }, function(err, response) {
              if (err) {
                res.status(404);
                return res.json({'error':err});
              }
              //console.log(response);
              var files = response;
              res.json({'data':files});
            }
      );
    });
};

googleOAuthClient.importFromDrive = function(req, res){
    var userName = req.body.userName;
    var docId = req.body.docId;
    var oauth2Client = getOAuthClient();
    oauth2Client.credentials = credentials[userName];
    oauth2Client.getAccessToken(function(){
      if(credentials[userName].access_token !== oauth2Client.credentials.access_token){
          credentials[userName].access_token = oauth2Client.credentials.access_token;
          credentials[userName].refresh_token = oauth2Client.credentials.refresh_token;
          credentials[userName].expiry_date = oauth2Client.credentials.expiry_date;
          storeToken2DB(userName,credentials[userName], credentials[userName].google_email);
      }

      setupGFilePermission(userName, docId);
      
      service.files.export({
             auth: oauth2Client,
             fileId: docId,
             mimeType: 'text/html'
          }, function(err, content) {
            if(err) {
              // Handle error
              res.status(404);
              res.json({'error':err});
            } else {
              //save to local
              var idx = content.indexOf("<p ");
              var html = content.substring(idx);
              idx = html.indexOf("</body>");
              html = html.substring(0,idx);
              var data = {};
              data.body = html;
              res.json({'data':data});
            }
          });
        });
}



function createScaffoldHTML(scaffolds){
    var html = "";
    if(scaffolds !==""){
      var sfs = scaffolds.split(",");
      html = '<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"></head>';
      html += '<body style="background-color: #ffffff; max-width: 451.4pt">';
      for(var i = 0; i< sfs.length; i++){
        if(sfs[i].trim() ==='') continue;
        html +='<p style="font-size: 11pt; padding: 0; font-family: &amp; quot; Arial &amp;quot;; line-height: 1.0; margin: 0; color: #000000">';
        html +='<span style="color: yellow; font-weight: 700">[</span><span style="font-weight:700">&nbsp;'+sfs[i]+'</span>';
        html +='<span style="font-size: 11pt; font-weight: 400">&nbsp;-&nbsp;&nbsp;-&nbsp;</span><span style="color: yellow; font-weight: 700">]</span>';
        html +='</p>';
      }
      html += "</body></html>";
    }
    return html;
}

/**
  * Consumer for queue
  */
function Consumer() {
    var self = this;
    
    this.process = function() {
        var msg = queue.getMessageSync();
        
        if (msg !== null){
          //handle massage
          googleOAuthClient.uploadVideo(msg.username, msg.file, function(){

          });
        } 
        setTimeout(self.process, getRandomInteger(300, 600));
    }
}


function getRandomInteger(from, to) {
    return from + Math.floor(Math.random()*(to-from));
}

var consumer_1 = new Consumer();
consumer_1.process();


module.exports = googleOAuthClient;
