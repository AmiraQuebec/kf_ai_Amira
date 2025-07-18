/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var KLink = require('./KLink.model');
var controller = require('./KLink.controller');
var KObject = require('../KObject/KObject.model');

exports.register = function(socketio) {

    KLink.schema.pre('save', function(next) {
        this.wasNew = this.isNew;
        next();
    });

    KLink.schema.post('save', function(link) {
        socketio.sockets.to('linkfrom:' + link.from).emit('link:save', link);

        // To Update Notes counts when Raise Above is Created in view.
        if (this.wasNew && link.type === 'contains' && link._from.type === "View" &&  link._to.type === "Note") {
                notesCount(link.from,socketio);
        }
    });

    KLink.schema.post('remove', function(link) {
        socketio.sockets.to('linkfrom:' + link.from).emit('link:remove', link);

        // To Update Notes counts when Note is Deleted in view.
        if(link.type === 'contains' && link._from.type === "View" &&  link._to.type === "Note" ){
                    notesCount(link.from,socketio);
        }
    });


    KObject.schema.post('save', function(obj) {
        if(obj.type === 'Note' && obj.status === "active"){
            KLink.find({
                to : obj._id,
                type:"contains",
                "_from.type":"View",
                "_to.type":"Note"
            },function (err,links) {
                if (err) {
                    console.error(err);
                }
                links.forEach(function(link) {
                    notesCount(link.from,socketio);
                })
            })
        }
    });




};

function notesCount(viewId,socketio) {
    KLink.count({
        from: viewId,
        type:"contains",
        "_from.type":"View",
        "_to.type":"Note",
        "_to.status":"active"
    }, function(err, notesCount) {
        if (err) {
            console.error(err);
        }

        KLink.count({
            from: viewId,
            type:"contains",
            "_from.type":"View",
            "_to.type":"Note",
            "_to.status":"active",
            "_to.data.riseabove":"riseabove"
        }, function(err, riseaboveCount) {
            if (err) {
                console.error(err);
            }

            var data = {
                    viewId: viewId,
                    count: {notesCount:notesCount,riseaboveCount:riseaboveCount}
            };
            socketio.sockets.to('noteCount:' + viewId).emit('noteCount:update', data);
        });
    });
}
