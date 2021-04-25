let schemas         = require('../schemas'),
    rabbitMq        = require('../mb_modules/rabbitmq');

module.exports = {
    
    name:           'Rabbit MQ',
    description:    'Enqueue to, or Dequeue from Rabbit MQ',
    color:          '#ffb366',
    
    functions: [
        {
            name:       'Enqueue to Rabbit MQ',
            onInput:    rabbitMq.enqueue,
            // onClose:    rabbitMq.cleanup,
            inputs: [
                {
                    name:           'Queue Name',
                    schema:         schemas.string,
                    description:    'Queue to push messages to'
                },
                {
                    name:           'Message',
                    schema:         schemas.any,
                    description:    'Message to be enqueued'
                },
                {
                    name:           'Environment Override',
                    schema:         { type: 'string', optional: true },
                    description:    'If this is not set, it will use the RABBITMQ__URL of the configured runtime environment;\n' +
                                    'otherwise it will try to use the RABBITMQ__URL of the environment with the ID provided.\n' +
                                    'Will throw an error if the provided environment ID is not found.'
                }
            ],
            errors: [
            ]
        },
        {
            name:       'Dequeue from Rabbit MQ',
            onStart:    rabbitMq.dequeue,
            onClose:    rabbitMq.cleanup,
            inputs: [
                {
                    name:           'Queue Name',
                    schema:         schemas.string,
                    description:    'Queue to get messages from'
                },
                {
                    name:           'Requires Ack',
                    schema:         schemas.boolean,
                    description:    ''
                },
                {
                    name:           'Exclusive Subscribe',
                    schema:         schemas.boolean,
                    description:    ''
                },
                {
                    name:           'Prefetch Count',
                    schema:         schemas.number,
                    description:    ''
                },


            ],
            output: {
                name:           'Dequeued Message',
                schema:         schemas.any,
                description:    'Message that was dequeued'
            },
            errors: [
            ]
        },
    ]
};








