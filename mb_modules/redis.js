let GlobalConfig    = require('../config'),
    Redis           = require('redis'),
    RedisClient     = Redis.createClient(GlobalConfig.redis.PORT, GlobalConfig.redis.HOST),
    Promise         = require('bluebird');

let promiseLibrary = Promise.promisifyAll(RedisClient);

module.exports = promiseLibrary;
