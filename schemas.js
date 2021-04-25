
// TODO: handle optional fields for the entire object better

let schemas = {
    string: {
        type:   'string'
    },
    number: {
        type: 'number'
    },
    boolean: {
        type: 'boolean'
    },
    object: {
        type:   'object'
    },
    any: {
        type:   'any'
    },
    
    optional_string: {
        type:       'string',
        optional:   true
    },
    optional_number: {
        type:       'number',
        optional:   true
    },
    optional_boolean: {
        type:       'boolean',
        optional:   true
    },
    optional_object: {
        type:       'object',
        optional:   true
    },
    
    optional_string_or_null: {
        type:       ['string', 'null'],
        optional:   true
    },
    optional_number_or_null: {
        type:       ['number', 'null'],
        optional:   true
    },
    
    
    
    arrayOf: type => { return { type: 'array', items: type } }
};


schemas.intercom = {};

schemas.intercom.company = {
    type:       'object',
    strict:     true,
    properties: {
    
        type: {
            type:       'string',
            optional:   true,
            eq:         'company'
        },
        
        company_id:     schemas.optional_string,
        name:           schemas.optional_string,
        id:             schemas.optional_string,
        app_id:         schemas.optional_string,
        created_at:     schemas.optional_number,
        updated_at:     schemas.optional_number,
        monthly_spend:  schemas.optional_number,
        session_count:  schemas.optional_number,
        user_count:     schemas.optional_number,
        tags:           schemas.optional_object,            // TODO: make tags schema
        segments:       schemas.optional_object,            // TODO: make segments schema
        plan:           schemas.optional_object,
        
        custom_attributes: {
            type:           'object',
            optional:       true,
            properties: {
                type: {
                    type:       'string',
                    optional:   true,
                    eq:         [ 'Government', 'Vendor' ]
                }
            }
        }
    }
};

schemas.intercom.contact = {
    type:       'object',
    strict:     true,
    properties: {
        
        type: {
            type:       'string',
            optional:   true,
            eq:         'contact'
        },
        name:                       schemas.optional_string_or_null,
    
        // TODO: Support these 2 fields differently; they are hacked in to support creating a new contact using them
        firstName:                  schemas.optional_string_or_null,
        lastName:                   schemas.optional_string_or_null,
    
        // This wasn't in their documentation...
        phone:                      schemas.optional_string,
        
        email:                      schemas.optional_string,
        id:                         schemas.optional_string,
        user_id:                    schemas.optional_string,
        anonymous:                  schemas.optional_boolean,
        pseudonym:                  schemas.optional_string,
        avatar:                     schemas.optional_object,            // TODO: make avatar schema
        app_id:                     schemas.optional_string,
        location_data:              schemas.optional_object,            // TODO: make location schema
        last_request_at:            schemas.optional_number_or_null,    // TODO: make timestamp schema
        last_seen_ip:               schemas.optional_string_or_null,
        created_at:                 schemas.optional_number,
        remote_created_at:          schemas.optional_number_or_null,
        signed_up_at:               schemas.optional_number_or_null,
        updated_at:                 schemas.optional_number,
        session_count:              schemas.optional_number,
        social_profiles:            schemas.optional_object,            // TODO: make social_profiles schema
        unsubscribed_from_emails:   schemas.optional_boolean,
        user_agent_data:            schemas.optional_string_or_null,
        
        companies: { // TODO: Improve companies schema
            type:       ['object', 'array'],
            optional:   true
        },
        tags:                       schemas.optional_object,            // TODO: make tags schema
        segments:                   schemas.optional_object,            // TODO: make segments schema
        
        custom_attributes: {
            type:           'object',
            optional:       true,
            properties: {
                phone:      schemas.optional_string
            }
        },
    
    }
};

schemas.calendly = {
    webhook: {
        type:           'object',
        properties: {
            type:       schemas.string,
            id:         schemas.number,
            attributes: {
                type:           'object',
                properties: {
                    url:        schemas.string,
                    created_at: schemas.string, // ISO date - No offset provided
                    state:      schemas.string,
                    events: {
                        type:       'array',
                        uniqueness: true,
                        items: {
                            type:   'string',
                            eq:     [ 'invitee.created', 'invitee.canceled' ]
                        }
                    }
                }
            }
        }
    }
};

module.exports = schemas;

