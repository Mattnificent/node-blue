let Intercom        = require('intercom-client'),
    GlobalConfig    = require('../config'),
    _               = require('lodash'),
    
    // TODO: Once Intercom enables all permissions for the access tokens, switch these lines out
    // client          = new Intercom.Client({ token: GlobalConfig.INTERCOM.ACCESS_TOKEN });
    client          = new Intercom.Client(GlobalConfig.INTERCOM.APP_ID, GlobalConfig.INTERCOM.API_KEY);

function find(dataType, successHandler, failureHandler){
    
    return function (query) {
    
        let findPromise;
    
        if(query)
            findPromise = client[dataType].listBy.apply({ client: client }, [query]);
        else
            findPromise = client[dataType].list.apply({ client: client });
    
        return findPromise.then(successHandler, failureHandler);
    }
}

function create(dataType){
    
    return function(newRecord) {
        
        return client[dataType].create.apply({ client: client }, [newRecord])
            .then(function (result) {
                return result.body;
            })
    }
}

module.exports = {
    
    contacts: {
        find: find('contacts',
            function (result) {
                return result.body['contacts'];
            }
        ),
        create: function(newContact) {
            
            // Translate "firstName" and "lastName" to just "name",
            // remove them from the new object, but not from the original
            if(newContact.firstName || newContact.lastName) {
                let names = [];
                if(newContact.firstName)    names.push(newContact.firstName.trim());
                if(newContact.lastName)     names.push(newContact.lastName.trim());
                newContact = _.omit(newContact, ['firstName', 'lastName']);
                newContact.name = names.join(' ');
            }
            
            return create('contacts')(newContact)
        }
    },
    
    companies: {
        find: find('companies',
            function (result) {
                return [ result.body ];
            },
            function (err) {
                if(err.message.match(/Company Not Found/))
                    return [];
                throw err
            }),
        create: create('companies')
    }
};


