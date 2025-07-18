/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');

// When the user disconnects.. perform this
function onDisconnect(socket) {}

// When the user connects.. perform this
function onConnect(socket) {}

module.exports = function(socketio) {
    socketio.on('connection', function(socket) {
        //the first one for access via proxy 
        socket.address = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

        socket.connectedAt = new Date();

        socket.on('disconnect', function() {
            console.info('[%s] DISCONNECTED', socket.address);
        });
        socket.on('subscribe', function(room) {
            console.info('[%s] subscribes %s', socket.address, room);
            socket.join(room);
        });
        socket.on('unsubscribe', function(room) {
            console.info('[%s] unsubscribes %s', socket.address, room);
            socket.leave(room);
        });
        console.info('[%s] CONNECTED', socket.address);
    });

    require('../api/KLink/KLink.socket').register(socketio);
};