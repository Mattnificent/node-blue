var _ = require('lodash');

module.exports = function(RED) {
    
    function spec(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            path = config.path;
        
        node.on('input', function (msg) {
            
            var thingToSplit = _.get(msg, path, []);
            
            if(!_.isArray(thingToSplit)) {
                var ermsg = "Input to splitter was not an array; it was a " + (typeof (thingToSplit)) + " - " + JSON.stringify(thingToSplit);
                node.error(ermsg);
                throw ermsg;
            }
    
            var count = thingToSplit.length;
            
            for(var i = 0; i < count; i++) {
                node.send({
                    parts: {
                        id: msg._msgid,
                        index: i,
                        count: count
                    },
                    original: msg,
                    payload: thingToSplit[i]
                })
            }
            
        });
    }
    
    RED.nodes.registerType("tool_split", spec);
};
