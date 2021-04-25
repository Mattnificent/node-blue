let moment          = require('moment-timezone'),
    GlobalConfig    = require('../config'),
    _               = require('lodash');


exports.getMoment = function(momentObj) {
    return momentObj ? moment(momentObj).tz(GlobalConfig.TIME.ZONE) : moment.utc().tz(GlobalConfig.TIME.ZONE);
};

exports.format = function(momentObj) {
    return momentObj.format(GlobalConfig.TIME.FORMAT);
};


exports.timeSpan = function(laterTime, earlierTime) {
    
    let duration    = moment.duration(laterTime.diff(earlierTime)),
        s           = duration.seconds(),
        m           = duration.minutes(),
        h           = duration.hours(),
        timeArray   = [];
    
    if(h)       timeArray.push( h == 1 ?  "1 hour" : h + " hours" );
    if(m)       timeArray.push( m == 1 ?  "1 minute" : m + " minutes" );
    if(h || m)  timeArray.push("and " + ( s == 1 ?  "1 second" : s + " seconds"));
    else        timeArray.push( s + "." + duration.milliseconds() + " seconds");
    
    return timeArray.join(", ");
};