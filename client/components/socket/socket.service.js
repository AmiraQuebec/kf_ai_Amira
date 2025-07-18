/* global io */
'use strict';

angular.module('kf6App')
    .factory('socket', function(socketFactory) {

        // socket.io now auto-configures its connection when we ommit a connection url
        var ioSocket = io('', {
            // Send auth token on connection, you will need to DI the Auth service above
            // 'query': 'token=' + Auth.getToken()
            path: '/socket.io-client'
        });

        var socket = socketFactory({
            ioSocket: ioSocket
        });

        function exactlyNew(newItem, oldItem) {
            var isLink = newItem.from && newItem.to;
            if (!isLink) {
                return true;
            }

            if (newItem.modified < oldItem.modified) {
                return false;
            }

            if (newItem.modified > oldItem.modified) {
                return true;
            }

            //in case of the same
            if (newItem._to && oldItem._to) {
                if (newItem._to.modified > oldItem._to.modified) {
                    return true;
                }
            }
            if (newItem._from && oldItem._from) {
                if (newItem._from.modified > oldItem._from.modified) {
                    return true;
                }
            }

            return false;
        }

        return {
            socket: socket,

            /**
             * Register listeners to sync an array with updates on a model
             *
             * Takes the array we want to sync, the model name that socket updates are sent from,
             * and an optional callback function after new items are updated.
             *
             * @param {String} modelName
             * @param {Array} array
             * @param {Function} cb
             */
            syncUpdates: function(modelName, cond, array, cb) {
                cb = cb || angular.noop;

                /**
                 * Syncs item creation/updates on 'model:save'
                 */
                socket.on(modelName + ':save', function(item) {

                    if (cond && cond(item) === false) {
                        return;
                    }

                    var oldItem = _.find(array, {
                        _id: item._id
                    });
                    //var index = array.indexOf(oldItem);
                    var event = 'unknown';

                    // replace oldItem if it exists
                    // otherwise just add item to the collection
                    if (oldItem) {
                        if (!exactlyNew(item, oldItem)) {
                            console.warn('This is the old one.');
                            return;
                        }
                        $.extend(oldItem, item);
                        event = 'updated';
                    } else {
                        array.push(item);
                        event = 'created';
                    }

                    if (oldItem) {
                        cb(event, oldItem, array);
                    } else {
                        cb(event, item, array);
                    }
                });

                /**
                 * Syncs removed items on 'model:remove'
                 */
                socket.on(modelName + ':remove', function(item) {

                    if (cond && cond(item) === false) {
                        return;
                    }

                    var event = 'deleted';
                    _.remove(array, {
                        _id: item._id
                    });
                    cb(event, item, array);
                });
            },

            /**
             * Removes listeners for a models updates on the socket
             *
             * @param modelName
             */
            unsyncUpdates: function(modelName) {
                socket.removeAllListeners(modelName + ':save');
                socket.removeAllListeners(modelName + ':remove');
            }
        };
    });