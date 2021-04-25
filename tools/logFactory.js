let logUtil         = require('./logUtil'),
    time            = require('./time'),
    _               = require('lodash');

module.exports = function() {

    // If log new log() is constructed:
    if(this.isFactory) {
        var callback,
            returnFunction,
            newArgs = [];
        // (node node, string header, log anotherCustomLogger, function callback)
        _.each(arguments, function(arg) {
            if(!arg) return;
            if(_.isString(arg))
                newArgs.push({
                    value: arg,
                    isLogHeader: true
                });
            else if(_.isArray(arg.additionalArguments))
                newArgs = newArgs.concat(arg.additionalArguments);
            else if(_.isArray(arg.innerArgs))
                _.each(arg.innerArgs, function(a){
                    if(a) newArgs.push(a);
                });
            else
                newArgs.push(arg);
        });

        // This return function can be used as a logger or logger factory
        returnFunction = function() {
            var innerArgs = (arguments.length === 1?[arguments[0]]:Array.apply(null, arguments));
            return module.exports.apply(this, newArgs.concat({ innerArgs: innerArgs }));
        };
        returnFunction.prototype.isFactory = true;
        returnFunction.additionalArguments = newArgs;
        return returnFunction;
    }
    // If log() is invoked:
    // Log the parameters passed to it
    else {
        var innerArgs, node, nodeStatus, headers = [], stringsToLog = [], errorsToLog = [],
            isError                 = false,
            consoleLogDebug         = true,
            limitSize               = true,
            shouldPrintTimestamp    = false,
            overwriteSameLine       = false,
            callback, i, args = (arguments.length === 1?[arguments[0]]:Array.apply(null, arguments));

        for(i = 0; i < args.length; i++) {
    
            var shouldLogThis = true;
            
            if(_.isObject(args[i])) {
                
                if(_.isArray(args[i].innerArgs)) {
                    args = args.concat(args[i].innerArgs);
                    innerArgs = args[i].innerArgs;
                    shouldLogThis = false;
                }
                else {
                    if(args[i].isLogHeader) {
                        headers.push("[" + logUtil.prepString(args[i].value) + "]");
                        shouldLogThis = false;
                    }
                    if(_.isBoolean(args[i].isError)) {
                        isError = args[i].isError;
                        shouldLogThis = false;
                    }
                    if(_.isBoolean(args[i].consoleLogDebug)) {
                        consoleLogDebug = args[i].consoleLogDebug;
                        shouldLogThis = false;
                    }
                    if(_.isBoolean(args[i].timestamp)) {
                        shouldPrintTimestamp = args[i].timestamp;
                        shouldLogThis = false;
                    }
                    if(_.isBoolean(args[i].limitSize)) {
                        limitSize = args[i].limitSize;
                        shouldLogThis = false;
                    }
                    if(_.isBoolean(args[i].isTable)) {
                        return createTable(args[i]);
                    }
                    if(_.isBoolean(args[i].overwriteSameLine)) {
                        overwriteSameLine = args[i].overwriteSameLine;
                        shouldLogThis = false;
                    }
                    if(_.isNumber(args[i]._wireCount)) {
                        node = args[i];
                        shouldLogThis = false;
                    }
                    if(args[i].fill && args[i].shape) {
                        nodeStatus = args[i];
                        shouldLogThis = false;
                    }
                }
            }
            else if(_.isFunction(args[i])) {
                if(_.isArray(args[i].additionalArguments))
                    args = args.concat(args[i].additionalArguments);
                else
                    callback = args[i];
                shouldLogThis = false;
            }
            else shouldLogThis = true;
            
            if(shouldLogThis) {
                if(Object.prototype.toString.call(args[i]) == '[object Error]') {
                    isError = true;
                    errorsToLog.push(args[i]);
                }
                    
                else
                    stringsToLog.push(logUtil.anything2string(args[i]));
            }
                
        }
        
        // TODO: Make all this better
        var msgBody = stringsToLog.join(" - ");

        var msgHeader = (
                node ?
                    node.type + (node.fun ? '.' + node.fun : '' ) + ' - ' :
                    // '{node:' + JSON.stringify(_.pick(node, ['id', 'type', 'z', 'fun'])) + '}, ' :
                    ''
            ) +
            (
                headers.length ?
                    JSON.stringify(headers) + ' - ' :
                    // '{headers:' + JSON.stringify(headers) + '}, ' :
                    ""
            );
        
        var toOutput = time.getMoment().format('ddd M/D h:mm:ss:SSS a') + " - " + msgHeader + msgBody;
    
        if(isError) {
            
            if(node) {
                let errMsg = _.map(errorsToLog, function(err) {
                    return (err.type ? err.type + ' ' : '' ) + (err.message ? err.message + ' ' : '' ) + (err.stack ? err.stack : '')
                });
                node.status({fill:"red",shape:"ring",text:errMsg });
            }
            setTimeout(function() {
                console.error(toOutput);
                _.each(errorsToLog, function(err) {
                    console.error(err)
                })
            }, 200)
            
        }

        else if(consoleLogDebug) {
            if(overwriteSameLine)
                process.stdout.write("\r" + toOutput);
            else
                console.log(toOutput);
        }

        if(callback)
            return callback(msgBody, msgHeader);
        else
            return innerArgs ? (innerArgs.length == 1? innerArgs[0] : innerArgs) : null;
    }
};



function createTable(tableConfig){
    let columnNames = [],
        doubleLines = [],
        singleLines = [],
        tildLines   = [];
    
    // Create column headers
    _.each(tableConfig.columns, function(headerConfigArray) {
        
        let name    = headerConfigArray[0],
            width   = headerConfigArray[1];
        
        columnNames.push(logUtil.anything2string(name,  false, width, { chr: " ", dir: 3 }));
        doubleLines.push(logUtil.anything2string("",    false, width, { chr: "=" }));
        tildLines.push(  logUtil.anything2string("",    false, width, { chr: "~" }));
        singleLines.push(logUtil.anything2string("",    false, width, { chr: "-" }));
        
    });
    
    // Join the column names, set the table width, and set the title
    let columnNamesRow  = columnNames.join("|/"),
        innerWidth      = columnNamesRow.length,
        titleRow        = logUtil.anything2string(tableConfig.title, false, innerWidth, { chr: " ", dir: 3 }),
        doubleLinesRow  = "";
    
    for(var i = 0; i < innerWidth; i++) doubleLinesRow += "=";
    
    // Configure table borders
    let topLine         = "/=" + doubleLinesRow         + "=\\",
        titleLine       = "||" + titleRow               + "||",
        titleSeparator  = "||" + doubleLinesRow         + "||",
        columnNamesLine = "||" + columnNamesRow         + "||",
        tildeLine       = "||" + tildLines.join("+~")   + "||",
        
        singleLine      = "||" + singleLines.join("+-") + "||";
    
    // Print table header
    console.log([topLine, titleLine, titleSeparator, columnNamesLine, tildeLine].join('\n'));
    
    // Return function for creating rows
    var createRowFunction = function() {
        
        // Get the call-time parameters (row values)
        var innerArgs = (arguments.length === 1?[arguments[0]]:Array.apply(null, arguments));
        
        let cellValues = [];
        _.each(innerArgs, function(cellValue, index) {
            
            let width = tableConfig.columns[index][1];
            
            // Stringify and pad the row values
            cellValues.push(logUtil.anything2string(cellValue, false, width, {  }));
        });
        
        // Create the row
        let rowLine = "||" + cellValues.join("| ") + "||";
        
        // Print row
        console.log([rowLine, singleLine].join('\n'));
    };
    
    // TODO: Check if I need this
    createRowFunction.prototype.isFactory = true;
    
    // Return the function we just made
    return createRowFunction;
}

_.extend(module.exports, {
    prototype: {
        isFactory: true
    }
});