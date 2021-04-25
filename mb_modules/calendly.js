let _               = require('lodash'),
    GlobalConfig    = require('../config'),
    API_ROOT        = 'https://calendly.com/api/v1',
    request         = require('request-promise').defaults({
        headers:
        {
            'X-TOKEN': GlobalConfig.CALENDLY.API_KEY
        }
    });

let errorHandler = err => {
    throw _.omit(err, 'response');
};


module.exports = {
    
    testApiKey: function() {
        return request.get(API_ROOT + '/echo')
            .catch(errorHandler);
    },
    
    createWebhookSubscription: function(url, inviteeCreated, inviteeCanceled) {
    
        return request.post({
            url: API_ROOT + '/hooks',
            body: 'url=' + url + ( inviteeCreated ? '&events[]=invitee.created' : '' ) + ( inviteeCanceled ? '&events[]=invitee.canceled' : '' )
        })
            .then(function(result) {
                return result.id;
            })
            .catch(errorHandler);
    },
    
    getWebhookSubscriptionById: function(hookId) {
    
        return request.get({
            url: API_ROOT + '/hooks/' + hookId,
            json: true
        })
            .then(function(result) {
                return result.data[0];
            })
            .catch(errorHandler);
    },
    
    getAllWebhookSubscriptions: function() {
    
        return request.get({
            url: API_ROOT + '/hooks/',
            json: true
        })
            .then(function(result) {
                return result.data;
            })
            .catch(errorHandler);
    },
    
    
    deleteWebhookSubscriptionById: function(hookId) {
    
        return request.delete(API_ROOT + '/hooks/' + hookId)
            .catch(errorHandler);
    }
};
