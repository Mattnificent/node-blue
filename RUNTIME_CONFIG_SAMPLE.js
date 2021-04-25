
module.exports = {
    
    //   __
    //  /  |
    //  `| |
    //   | |       ╔═╗┌─┐┬  ┌─┐┌─┐┌┬┐  ╔═╗┌─┐┌─┐┬  ┬┌─┐┌─┐┌┬┐┬┌─┐┌┐┌
    //  _| |_  _   ╚═╗├┤ │  ├┤ │   │   ╠═╣├─┘├─┘│  ││  ├─┤ │ ││ ││││
    // |_____|(_)  ╚═╝└─┘┴─┘└─┘└─┘ ┴   ╩ ╩┴  ┴  ┴─┘┴└─┘┴ ┴ ┴ ┴└─┘┘└┘
    //
    ///////////////////////////////////////////////////////////////////////
    // APP_ID:          Selects the flow file to edit and execute
    //                  Creates new flow file if it doesn't exist
    //---------------------------------------------------------------------
    // PUSH_TO_BRANCH:  Selects branch to push flow file changes to
    //                  Creates a new branch if branch does not exist
    //                  If set to false, the button to push changes won't exist
    //                  The current convention is to push to a branch with the same name as the APP_ID
    
    APP_ID:                     process.env.APP_ID                          || 'default',
    PUSH_TO_BRANCH:             process.env.PUSH_TO_BRANCH                  || false,
    
    // APP_ID:                                                                 'calendly',
    // PUSH_TO_BRANCH:                                                         'calendly',
    
    // APP_ID:                                                                 'hookroute',
    // PUSH_TO_BRANCH:                                                         'hookroute',
    
    // APP_ID:                                                                 'contacts',
    // PUSH_TO_BRANCH:                                                         'contacts',
    
    // APP_ID:                                                                 'intercom',
    // PUSH_TO_BRANCH:                                                         'intercom',
    
    
    
    //   _____
    //  / ___ `.
    // |_/___) |
    //  .'____.'     ╔═╗┌─┐┬  ┌─┐┌─┐┌┬┐  ╔═╗┌┐┌┬  ┬┬┬─┐┌─┐┌┐┌┌┬┐┌─┐┌┐┌┌┬┐
    // / /_____  _   ╚═╗├┤ │  ├┤ │   │   ║╣ │││└┐┌┘│├┬┘│ │││││││├┤ │││ │
    // |_______|(_)  ╚═╝└─┘┴─┘└─┘└─┘ ┴   ╚═╝┘└┘ └┘ ┴┴└─└─┘┘└┘┴ ┴└─┘┘└┘ ┴
    //
    ///////////////////////////////////////////////////////////////////////
    // ENV_ID:  Selects the external environment configuration for the app to execute in the context of
    //---------------------------------------------------------------------
    // ENV_DB:  Mongo database to get environment configuration from
    
    ENV_ID:                     process.env.ENV_ID                          || 'local',
    
    // ENV_ID:                                                                 'dev',
    
    // ENV_ID:                                                                 'qa',
    
    // ENV_ID:                                                                 'prod',
    
    ENV_DB: {
        
        DB:                     process.env.ENV_DB__DB                      || 'nodeblue_environments',
        
        HOST:                   process.env.ENV_DB__HOST                    || 'docker',
        PORT:                   process.env.ENV_DB__PORT                    || 27017,
    
        // HOST:                                                               'localhost',
        // PORT:                                                                10011,
    },
    
    
    //   ______
    //  / ____ `.
    //  `'  __) |
    //  _  |__ '.     ╔═╗┌─┐┌┐┌┌─┐┬┌─┐┬ ┬┬─┐┌─┐  ╦  ┌─┐┌─┐┌─┐┬┌┐┌┌─┐
    // | \____) | _   ║  │ ││││├┤ ││ ┬│ │├┬┘├┤   ║  │ ││ ┬│ ┬│││││ ┬
    //  \______.'(_)  ╚═╝└─┘┘└┘└  ┴└─┘└─┘┴└─└─┘  ╩═╝└─┘└─┘└─┘┴┘└┘└─┘
    //
    ///////////////////////////////////////////////////////////////////////
    LOGGING:{
        MAX_CHARS_PER_THING:    process.env.LOGGING__MAX_CHARS_PER_THING    || 10000,
        ALLOW_NEW_LINES:        process.env.LOGGING__ALLOW_NEW_LINES        || true
    },
    
    
    //  _    _
    // | |  | |
    // | |__| |_
    // |____   _|     ╔═╗┌─┐┌┐┌┌─┐┬┌─┐┬ ┬┬─┐┌─┐  ╔╦╗┬┌┬┐┌─┐╔═╗┌─┐┌┐┌┌─┐
    //     _| |_  _   ║  │ ││││├┤ ││ ┬│ │├┬┘├┤    ║ ││││├┤ ╔═╝│ ││││├┤
    //    |_____|(_)  ╚═╝└─┘┘└┘└  ┴└─┘└─┘┴└─└─┘   ╩ ┴┴ ┴└─┘╚═╝└─┘┘└┘└─┘
    //
    ///////////////////////////////////////////////////////////////////////
    TIME: {
        ZONE:                   process.env.TIME__ZONE                      || 'America/New_York',
        FORMAT:                 process.env.TIME__FORMAT                    || 'ddd M/D h:mm a'
    },
    
    
    // ╔═╗┌┬┐┬ ┬┌─┐┬─┐  ╦═╗┬ ┬┌┐┌┌┬┐┬┌┬┐┌─┐  ╦  ╦┌─┐┬─┐┬┌─┐┌┐ ┬  ┌─┐┌─┐
    // ║ ║ │ ├─┤├┤ ├┬┘  ╠╦╝│ ││││ │ ││││├┤   ╚╗╔╝├─┤├┬┘│├─┤├┴┐│  ├┤ └─┐
    // ╚═╝ ┴ ┴ ┴└─┘┴└─  ╩╚═└─┘┘└┘ ┴ ┴┴ ┴└─┘   ╚╝ ┴ ┴┴└─┴┴ ┴└─┘┴─┘└─┘└─┘
    ///////////////////////////////////////////////////////////////////////
    PORT:                       process.env.PORT                            ||  4004,
    COOKIE_SECRET:              process.env.COOKIE_SECRET                   ||  'TODO_GENERATE_ANY_BIG_RANDOM_SEQUENCE_HERE'
    
    
    
};
