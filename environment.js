
let RUNTIME_CONFIG      = require('./RUNTIME_CONFIG'),
    CONNECTION_STRING   = 'mongodb://' + RUNTIME_CONFIG.ENV_DB.HOST + ':' + RUNTIME_CONFIG.ENV_DB.PORT + '/'  + RUNTIME_CONFIG.ENV_DB.DB;

console.log('Application: "' + RUNTIME_CONFIG.APP_ID + '"');
console.log('Connecting to Environment Database: "' + CONNECTION_STRING + '"');

let Promise         = require('bluebird'),
    fs              = Promise.promisifyAll(require("fs")),
    _               = require('lodash'),
    path            = require('path'),
    mongoose        = require('mongoose'),
    Schema          = mongoose.Schema,
    Environment,
    
    db              = mongoose.createConnection(
        CONNECTION_STRING,
        {
            server: {
                socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
                auto_reconnect: true
            }
        }
    );


Promise.promisifyAll(mongoose);

//////////////////////////////////////////////////////////////////////////////////////////


let defaultConfigs = {

};


//////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    
    getConfig: function(environmentId, configId) {
        
        if(!environmentId)  throw new Error('Error in getConfig: environmentId is required. Configs should normally be loaded from config.js.');
        if(!configId)       throw new Error('Error in getConfig: configId is required. Configs should normally be loaded from config.js.');
        
        console.log('getConfig: Getting "' + configId + '" config from "' + environmentId + '" environment');
    
        return Environment.findAsync({ configId: configId })
            .then(function(envConfigs) {
                
                if(envConfigs.length == 0)  throw new Error('getConfig Error: No "' + configId + '" configuration exists');
                if(envConfigs.length > 1)   throw new Error('getConfig Error: Multiple "' + configId + '" configurations exist');
                
                let cfgValue = envConfigs[0]._doc[environmentId];
                
                if(_.isUndefined(cfgValue)) throw new Error('getConfig Error: "' + configId + '" configuration does not exist in the "' + environmentId + '" environment');
                
                console.log("getConfig Success: cfgValue = " + JSON.stringify(cfgValue));
                
                return cfgValue;
            });
    },
    
    setConfigFile: function() {
        
        return new Promise(function (resolve, reject) {
            
            db.on('error', function(error) {
                console.error('Environment Database - connection error');
                console.error(error);
                reject(error);
            });
            db.on('connected', function() {
                console.log('Environment Database - connected');
            });
            db.once('open', function() {
                console.log('Environment Database - connection opened');
                
                Environment = db.model('Environment', new Schema({}));
                
                console.log('Selecting "' + RUNTIME_CONFIG.ENV_ID + '" environment');
                
                Environment.findAsync({ ENV_ID: RUNTIME_CONFIG.ENV_ID })
                    .then(function(envConfigs) {
                        
						console.log('envConfigs: ', envConfigs);
						
                        let ENVIRONMENT_CONFIG = flat2nested(envConfigs[0]._doc);
                        
                        _.extend(ENVIRONMENT_CONFIG, RUNTIME_CONFIG);
                        
                        let envConfigString = 'module.exports = ' + JSON.stringify(ENVIRONMENT_CONFIG, null, 4);
                        
                        console.log("GLOBAL_CONFIG: " + JSON.stringify(ENVIRONMENT_CONFIG));
                        
                        return fs.writeFileAsync(path.join(__dirname, 'config.js'), envConfigString, 'utf-8')
                            .then(function() {
                                resolve(ENVIRONMENT_CONFIG);
                            });
                    });
            });
            db.on('reconnected', function () {
                console.log('Environment Database - reconnected');
            });
            db.on('disconnected', function() {
                console.error('Environment Database - disconnected');
            });
        });
    }
};


function flat2nested(flat) {
    
    let nested = {};
    
    _.each(flat, function(value, key) {
        _.set(nested, key.replace('__', '.'), value);
    });
    
    return nested;
}
