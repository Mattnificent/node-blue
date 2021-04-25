

let GlobalConfig    = require('../config'),
    mongoose        = require('mongoose'),
    Promise         = require('bluebird'),
    _               = require('lodash'),
    db = mongoose.createConnection(
        'mongodb://' + GlobalConfig.MONGO.HOST + ':' + GlobalConfig.MONGO.PORT + '/'  + GlobalConfig.MONGO.DB,
        {
            db: { safe: true },
            server: {
                socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
                auto_reconnect: true
            }
        });


Promise.promisifyAll(mongoose);

db.on('error', function(error) {
    console.error('MongoDB connection error!');
    console.error(error);
});
db.on('connected', function() {
    console.log('MongoDB connected!');
});
db.once('open', function() {
    console.log('MongoDB connection opened!');
});
db.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
});

var Schema = mongoose.Schema;

exports.TrackedError = db.model('TrackedError',
    new Schema({
        node:           { type: Schema.Types.Mixed, required: true },   //{ name, type, id }
        // tab:            { type: Schema.Types.Mixed, required: true },
        // subflowStack:   { type: Schema.Types.Mixed, required: true },
        fun:            { type: String,             required: true },
        value:          { type: Schema.Types.Mixed, required: true }
    })
);
