let GlobalConfig    = require('../config'),
    _               = require('lodash'),
    
    MAX_CHARS       = GlobalConfig.LOGGING.MAX_CHARS_PER_THING,
    ALLOW_NEW_LINES = GlobalConfig.LOGGING.ALLOW_NEW_LINES;

function anything2string(inputThing, allowNewLines, maxChars, pad, printThisIfUndefined) {
    
    let overriddenAllowNewLines = _.isBoolean(allowNewLines) ? allowNewLines : ALLOW_NEW_LINES,
        typeOfThing = Object.prototype.toString.call(inputThing),
        thingAsString;
    
    switch(typeOfThing) {
        case "[object Object]":
        case "[object Array]":
            thingAsString = prepObject(inputThing, overriddenAllowNewLines);
            break;
        case "[object String]":
            thingAsString = inputThing;
            break;
        case "[object Number]":
        case "[object Boolean]":
            thingAsString = inputThing.toString();
            break;
        
        // TODO: make the date logger more awesome (iso?)
        case "[object Date]":
            thingAsString = inputThing.toString();
            break;
        case "[object Undefined]":
            thingAsString = printThisIfUndefined || "undefined";
            break;
        case "[object Null]":
            thingAsString = "null";
            break;
        default:
            thingAsString = typeOfThing + " " + inputThing.toString();
            break;
    }
    
    return prepString(thingAsString, overriddenAllowNewLines, maxChars, pad);
}

function prepString(inputString, allowNewLines, maxChars, pad) {
    
    let overriddenAllowNewLines = _.isBoolean(allowNewLines) ? allowNewLines : ALLOW_NEW_LINES,
        maxLength               = _.min([maxChars, MAX_CHARS]),
        output;
    
    // Escape new lines if needed
    if(overriddenAllowNewLines) output = inputString;
    else output = inputString.replace(/\n/g, '\\n');
    
    // Truncate the string if needed
    if(output.length > maxLength) {
        
        var additionalCharCount             = output.length.toString().length + 5,
            additionalCharCountBigHalf      = Math.ceil( (maxLength - additionalCharCount) / 2),
            additionalCharCountSmallHalf    = Math.floor( (maxLength - additionalCharCount) / 2);
        
        output = "#" + output.length + " " +
            output.slice(0, additionalCharCountBigHalf) + "..." +
            output.slice(-additionalCharCountSmallHalf);
    }
    
    // Pad the string, if needed
    if(pad)
        output = padFunc(output, maxLength, pad.chr, pad.dir);
    
    return output;
}

function prepObject(inputObject, allowNewLines ) {
    let overriddenAllowNewLines = _.isBoolean(allowNewLines) ? allowNewLines : ALLOW_NEW_LINES,
        returnString;
    try {
        if(overriddenAllowNewLines) returnString = JSON.stringify(inputObject, null, 4);
        else                        returnString = JSON.stringify(inputObject);
    }
    catch(err) {
        returnString = util.inspect(inputObject);
    }
    return returnString;
}

var STR_PAD_LEFT = 1;
var STR_PAD_RIGHT = 2;
var STR_PAD_BOTH = 3;

function padFunc(str, len, chr, dir) {
    
    if(str === undefined) str = "undefined";
    else if((typeof str) !== "string") str = JSON.stringify(str);
    
    if (typeof(len) == "undefined") len = 0;
    if (typeof(chr) == "undefined") chr = ' ';
    if (typeof(dir) == "undefined") dir = STR_PAD_RIGHT;
    
    if (len + 1 >= str.length) {
        
        switch (dir){
            
            case STR_PAD_LEFT:
                str = Array(len + 1 - str.length).join(chr) + str;
                break;
            
            case STR_PAD_BOTH:
                var right = Math.ceil((padlen = len - str.length) / 2);
                var left = padlen - right;
                str = Array(left+1).join(chr) + str + Array(right+1).join(chr);
                break;
            
            default:
                str = str + Array(len + 1 - str.length).join(chr);
                break;
            
        } // switch
    }
    return str;
}

module.exports = {
    anything2string:    anything2string,
    prepString:         prepString,
    prepObject:         prepObject,
    pad:                padFunc
};
