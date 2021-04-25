let _ = require('lodash');

module.exports = function(thing) {
    let maxDepth = 100;
    
    var things = [], paths = [];
    
    function checkForCircularReferences(_thing, path) {
        
        for (var i = 0; i < things.length; i++) {
            if (things[i] === _thing)
                return '$ref => ' + paths[i];
        }
        
        if(i == things.length) {
            things.push(_thing);
            paths.push(path);
        }
    }
    
    return (function recurse(_thing, path, level) {
        
        let type = Object.prototype.toString.call(_thing),
            circularReference, count, index = 0;
        
        switch(type) {
            case '[object Object]':
            case '[object Error]':
                if(circularReference = checkForCircularReferences(_thing, path))
                    return circularReference;
                
                if(level > maxDepth) {
                    return '[DEEP OBJECT]';
                }
                return _(_thing)
                    .pickBy(function(value, key) {
                        try {
                            return _thing.hasOwnProperty(key)
                        }
                        // Because apparently this breaks sometimes...
                        // Gotta LOVE Javascript! It must be my favorite language!!
                        catch(err) {
                            return false;
                        }
                    })
                    .mapValues(function(value, key) {
                        return recurse(value, path + '.' + key, level + 1)
                    })
                    .mapKeys(function(value, key) {
                        return key.replace(/\./g, '');
                    })
                    .value();
            
            case '[object Array]':
                
                if(circularReference = checkForCircularReferences(_thing, path))
                    return circularReference;
                
                if(level > maxDepth) {
                    return '[DEEP ARRAY]';
                }
                
                return _.map(_thing, function(value, key) {
                    return recurse(value, path + '[' + key + ']', level + 1)
                });
            
            case '[object String]':
            case '[object Number]':
            case '[object Boolean]':
            case '[object Null]':
            case '[object Undefined]':
                return _thing;
            default:
                return type;
            
        }
    })(thing, '$', 0)
};
