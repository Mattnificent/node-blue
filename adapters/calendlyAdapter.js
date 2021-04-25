let schemas     = require('../schemas'),
    calendly    = require('../mb_modules/calendly');
    
module.exports = {
    
    name:           'Calendly',
    description:    'Access Calendly API',
    color:          '#99ffff',
    
    functions: [
        {
            name:       'Test API Key',
            onInput:    calendly.testApiKey,
            errors: [
                {
                    "name": "banana",
                    "schema": {
                        "type": "object",
                        "properties": {}
                    }
                },
            ]
        },
        {
            name:       'Create a Webhook Subscription',
            onInput:    calendly.createWebhookSubscription,
            inputs: [
                {
                    name:           'URL',
                    schema:         schemas.string,
                    description:    'Where to send webhooks to'
                },
                {
                    name:           'Invitee Created',
                    schema:         schemas.boolean,
                    description:    'Subscribe to "invitee.created" webhooks'
                },
                {
                    name:           'Invitee Canceled',
                    schema:         schemas.boolean,
                    description:    'Subscribe to "invitee.canceled" webhooks'
                }
            ],
            output: {
                name:           'Hook ID',
                schema:         schemas.number,
                description:    'ID of newly created webhook subscription'
            },
            errors: [
            ]
        },
        {
            name:       'Get Webhook Subscription by ID',
            onInput:    calendly.getWebhookSubscriptionById,
            inputs: [
                {
                    name:           'Hook ID',
                    schema:         schemas.number,
                    description:    'Webhook subcription ID to look up'
                }
            ],
            output: {
                name:           'Calendly Webhook Record',
                schema:         schemas.calendly.webhook,
                description:    'Webhook record matching input hook ID',
            },
            errors: [
            ]
        },
        {
            name:       'Get All Webhook Subscriptions',
            onInput:    calendly.getAllWebhookSubscriptions,
            output: {
                name:           'Calendly Webhook Record Array',
                schema:         schemas.arrayOf(schemas.calendly.webhook),
                description:    'Array of webhook subscription records',
            },
            errors: [
            ]
        },
        {
            name:       'Delete Webhook Subscription by ID',
            onInput:    calendly.deleteWebhookSubscriptionById,
            inputs: [
                {
                    name:           'Hook ID',
                    schema:         schemas.number,
                    description:    'ID of the webhook subscription to delete'
                }
            ],
            errors: [
            ]
        }
    ]
};

