let schemas         = require('../schemas'),
    _               = require('lodash'),
    intercom        = require('../mb_modules/intercom');

module.exports = {
    
    name:           'Intercom',
    description:    'Intercom API Library',
    color:          '#66b3ff',
    
    functions: [
        {
            name:       'Find Contacts (Intercom Leads)',
            onInput:    intercom.contacts.find,
            inputs: [
                {
                    name:           'Filter Query',
                    schema:         _.extend(schemas.intercom.contact, { optional: true } ),
                    description:    ''
                }
            ],
            output: {
                name:           'Retrieved Contacts',
                schema:         schemas.arrayOf(schemas.intercom.contact),
                description:    'Contacts that were found in Intercom'
            },
            errors: [
            ]
        },
        {
            name:       'Create Contact (Intercom Lead)',
            onInput:    intercom.contacts.create,
            inputs: [
                {
                    name:           'Contact to Create',
                    schema:         schemas.intercom.contact,
                    description:    ''
                },
            ],
            output: {
                name:           'Created Contact',
                schema:         schemas.intercom.contact,
                description:    'Contact that was created in Intercom'
            },
            errors: [
            ]
        },
        {
            name:       'Find Companies',
            onInput:    intercom.companies.find,
            inputs: [
                {
                    name:           'Filter Query',
                    schema:         _.extend(schemas.intercom.company, { optional: true } ),
                    description:    ''
                }
            ],
            output: {
                name:           'Retrieved Companies',
                schema:         schemas.arrayOf(schemas.intercom.company),
                description:    'Companies that were found in Intercom'
            },
            errors: [
            ]
        },
        {
            name:       'Create Company',
            onInput:    intercom.companies.create,
            inputs: [
                {
                    name:           'Company to Create',
                    schema:         schemas.intercom.company,
                    description:    ''
                },
            ],
            output: {
                name:           'Created Company',
                schema:         schemas.intercom.company,
                description:    'Company that was created in Intercom'
            },
            errors: [
            ]
        }
    ]
};

