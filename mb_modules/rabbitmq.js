var amqp                    = require('amqplib'),
    _                       = require('lodash'),
    Promise                 = require('bluebird'),
    domain                  = require('domain'),
                            
    Environment             = require('../environment'),
    GlobalConfig            = require('../config'),
    defaultUrl              = GlobalConfig.RABBITMQ.URL,
    
    RECONNECT_BACKOFF_TIME  = 5000,
    
    connectionPromise, connection, channel, stop;


// TODO: Add some re-connect mechanism that buffers messages while trying to reconnect
function getConnection(connectionUrl) {
    
    let node = this;
    
    if(!connectionPromise) {
        connectionPromise = amqp.connect(connectionUrl, { clientProperties: { applicationName: GlobalConfig.APP_ID } })
            .then(function(conn) {
    
                connection = conn;
                
                var d = domain.create();
                d.on('error', function(err) {
                    // this is to force a re-connect attempt without crashing the process when something unexpected happens such as the socket connection getting reset/disconnected
                    connectionPromise = null;
                    node.errorHandler(err);
                });
                
                d.add(conn);
                return conn;
                
            }).catch(function(err) {
                
                // this also resets the connection promise so that the next attempt could try to re-establish connection
                connectionPromise = null;
                node.errorHandler(err);
            });
    }
    return connectionPromise;
}


function getFromQueue(queueName, requiresAck, exclusiveSubscribe, prefetchCount) {
    if(stop) return;
    
    let node = this;
    
    getConnection.apply(node, [ defaultUrl ])
        
        .then(function() {          return connection.createChannel();                          })
        
        .then(function(_channel) {  channel = _channel;
            return channel.prefetch(prefetchCount);                     })
        
        .then(function() {          return channel.assertExchange('hook.route', 'topic');       })
        
        .then(function() {          return channel.assertQueue(queueName);                      })
        
        .then(function(q) {
            
            if(exclusiveSubscribe && q.consumerCount === 1) {
                return connection.close()
                    .then(function() {
                        setTimeout(getFromQueue, RECONNECT_BACKOFF_TIME);
                        node.status({
                            fill:   "grey",
                            shape:  "dot",
                            text:   "consumed elsewhere"
                        });
                        return null;
                    });
            }
            else {
                node.status({
                    fill:   "green",
                    shape:  "ring",
                    text:   "connected!"
                });
                return  channel.consume(queueName, processMessage, {  noAck: !requiresAck, exclusive: exclusiveSubscribe });
            }
        });
    
    function processMessage(msg) {
        
        // if(!msg) {
        //     console.log("message was falsy: " + JSON.stringify(msg))
        // }
        
        var message = msg.content ? JSON.parse(msg.content.toString()) : msg;
        
        node.sendOutput({
            message: message,
            // rawMessage: msg,
            requiresAck: requiresAck,
            acknowledge: function() {
                if(requiresAck && channel) {
                    channel.ack(msg);
                }
            },
            reject: function() {
                if(requiresAck && channel) {
                    channel.reject(msg);
                }
            }
        });
    }
}



module.exports = {
    
    enqueue: function(queueName, message, environmentOverride) {
        
        let node = this,
            firstPromise, url;
        
        if(!queueName)  throw new Error('queueName is required');
        if(!message)    throw new Error('message is required');
        
        if(environmentOverride) firstPromise = Environment.getConfig(environmentOverride, 'RABBITMQ__URL');
        else                    firstPromise = Promise.resolve(defaultUrl);
        
        return firstPromise
            
            .then(function(_url) {      url = _url;
                                        return getConnection.apply(node, [ _url ]);                     })
            
            .then(function() {          return connection.createConfirmChannel();                       })
            
            .then(function(_channel) {  channel = _channel;
                                        return channel.assertExchange('hook.route', 'topic');           })
            
            .then(function() {          return channel.assertQueue(queueName);                          })
            
            .then(function() {          return channel.bindQueue(queueName, 'hook.route', queueName)    })
            
            .then(function() {          channel.publish(    'hook.route',
                                                            queueName,
                                                            new Buffer(
                                                                _.isObject(message) ?
                                                                    JSON.stringify(message) :
                                                                    message.toString()
                                                            ),
                                                            { persistent: true }
                                        );
                                        return channel.waitForConfirms();                               })
            
            .then(function() {          return channel.close();                                         });
        
    },
    
    dequeue: function(queueName, requiresAck, exclusiveSubscribe, prefetchCount) {
        
        let node = this;
    
        getFromQueue.apply(node, [ queueName, requiresAck, exclusiveSubscribe, prefetchCount ]);
    },
    
    cleanup: function() {
        connectionPromise = null;
        
        if (connection) {
            connection.close();
        }
    }
    
};
