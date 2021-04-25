var _ = require('lodash'),
    logFactory  = require('../../tools/logFactory');

module.exports = function(RED) {
    
    function spec(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            pendingJoins = {};
        
        node.on('input', function (msg) {
            
            var joinKey = msg.parts.id;
            
            if(!pendingJoins[joinKey])
                pendingJoins[joinKey] = _.map(_.range(msg.parts.count), function() { return undefined; });
            
            pendingJoins[joinKey][msg.parts.index] = msg.payload;
            
            if(_.every(pendingJoins[joinKey]))
                node.send(msg.original);
            
        });
    }
    
    RED.nodes.registerType("tool_join", spec);
};
