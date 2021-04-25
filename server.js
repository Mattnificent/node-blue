
console.log("|===========================================|\n" +
            "|                                           |\n" +
            "| Running Node-BLUE Server - Version 0.0.1  |\n" +
            "|                                           |\n" +
            "|===========================================|\n");


// Easy

// TODO: don't display stupid nodes. clean up categories. etc



// Medium

// TODO: Embedded validation on the client (might already work???)

// TODO: Isolate adapter inputs for onStart, onInput, and onClose functions
//          Don't allow mson for onStart or onClose


// Hard

// TODO: Build logging Framework

// TODO: Support retry mechanism for errors - refactor rabbitMq



let _               = require('lodash'),
    Promise         = require('bluebird'),
    RED             = require('node-red'),
    http            = require('http'),
    express         = require('express'),
    path            = require('path'),
    fs              = Promise.promisifyAll(require("fs")),
    auth            = require('basic-auth'),
    moment          = require('moment-timezone'),
    cookieParser    = require('cookie-parser'),
    bodyParser      = require('body-parser'),
    session         = require('express-session'),
    os              = require('os'),
    interceptor     = require('express-interceptor'),
    childProcess    = require('child_process'),
    
    REDUserDir      = path.join(__dirname, 'flows'),
    nodesDir        = path.join(__dirname, 'nodes'),
    adapterDir      = path.join(__dirname, 'adapters'),
    templateDir     = path.join(__dirname, 'templates'),
    genNodeDir      = path.join(nodesDir, 'generated'),
    
    makeSafe        = require('./tools/makeSafeObject'),
    Environment     = require('./environment');

Object.defineProperty(Error.prototype, 'message', {
    enumerable: true
});
Object.defineProperty(Error.prototype, 'stack', {
    enumerable: true
});


function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        console.log("Removing", path);
        fs.rmdirSync(path);
    }
}

console.log('Getting Config...');

Environment.setConfigFile()
    .then(function(globalConfig) {
		
		console.log('Global Config: ', JSON.stringify(globalConfig, null, 4));

        let appId           = globalConfig.APP_ID,
            flowFile        = path.join(REDUserDir, `${appId}.json`),
            
            App = function() {
				
				console.log('4');
				
                let self = this,
                    server;
            
                self.startExpress = function() {
                
					console.log('5');
				
                    self.port = globalConfig.PORT;
                
                    let secret = globalConfig.COOKIE_SECRET;
                
                    self.app = express();
                    self.app.use(cookieParser(secret));
                    self.app.use(bodyParser.json());
                    self.app.use(session({ secret: secret, saveUninitialized: true, resave: true}));
                
                    server = http.createServer(self.app);
                    server.listen(self.port, function() {
                        console.log('%s: Node server started on port %d ...', new Date(Date.now()), self.port);
                    });
                };
            
                self.startNodeRed = function() {
                
					console.log({users: [{
                                username: globalConfig.UI_USERNAME,
                                password: globalConfig.UI_PASSWORD_HASH,
                                permissions: "*"
					}]});
				
                    // setup RED
                    // Create the settings object
                    let REDsettings = {
                        adminAuth: {
                            type: "credentials",
                            users: [{
                                username: globalConfig.UI_USERNAME,
                                password: globalConfig.UI_PASSWORD_HASH,
                                permissions: "*"
                            }]
                        },
                        httpAdminRoot: "/red",
                        httpNodeRoot: "/api",
                        httpNodeCors: {
                            "origin": "*", // TODO: strengthen security here...
                            "methods": "GET,PUT,POST,DELETE,TRACE,HEAD,OPTIONS",
                            "allowedHeaders": "accept,accesstoken,authorization,if-modified-since,cache-control,pragma,content-type,origin,X-Request-With"
                        },
                        userDir: REDUserDir,
                        flowFile: flowFile,
                        flowFilePretty: true,
                        nodesDir: nodesDir,
                        verbose: true,
                        socketTimeout: 10000,
                        functionGlobalContext: {
                            // this is how required modules can be passed to inline js functions in the flows
                            '_': _,
                            'S': require('string'),
                            os: os,
                            path: path,
                            moment: moment,
                            bluebird: require('bluebird'),
                            request: require('request-promise')
                        }
                    };
                
                    // Initialise the runtime with a server and settings
                    RED.init(server, REDsettings);
                    
					console.log('7');
				
                    self.app.use('/red', interceptor(function(req, res){
                        return {
                            // Only HTML responses will be intercepted
                            isInterceptable: function(){
                                return /text\/html/.test(res.get('Content-Type'));
                            },
                            // Appends a paragraph at the end of the response body
                            intercept: function(body, send) {
                                // console.log("Intercepted " + req.method + " " + req.originalUrl + " - statusCode = " + res.statusCode);
                                if(res.statusCode == 200) {
                                    // console.log("BODY", JSON.stringify(body, null, 2));
                                    
                                    body = body.replace(/<title>Node-RED<\/title>/,
                                        '<title>' + globalConfig.ENV_ID + ' - ' + globalConfig.APP_ID + '</title>');
    
                                    body = body.replace(/<span>Node-RED<\/span>/,
                                        '<span>Node-BLUE</span>');

                                }
                                send(body);
                            }
                        };
                    }));
                    
					console.log('8');
				
                    if(globalConfig.PUSH_TO_BRANCH) {
    
                        self.app.use("/red/red/red.min.js", interceptor(function(req, res){
                            return {
                                // Only HTML responses will be intercepted
                                isInterceptable: function(){
                                    return true;
                                },
                                // Appends a paragraph at the end of the response body
                                intercept: function(body, send) {
                                    // console.log("Intercepted " + req.method + " " + req.originalUrl + " - statusCode = " + res.statusCode);
                
                                    if(res.statusCode == 200) {
                    
                                        body = body.replace(/(btn-deploy.*?<\/li>)/,
                                            '$1<li>'+
                                            '<button class="btn btn-primary disabled" id="btn-commit" ><i class="fa fa-github"/> Git Push </button>'+
                                            '</li>');
                    
                                        body = body.replace(/(RED.events.emit\("deploy"\))/,
                                            '$1,$("#btn-commit").removeClass("disabled")');
                                        
                                        body = body.replace(/(\$\("#btn-deploy"\).click)/,
                                            '$("#btn-commit").click(function(){' +
                                                'console.log("Pushing to Git!");' +
                                                'let xrc=prompt("Please enter a commit message", "Updating ' + globalConfig.APP_ID + ' flowgram");' +
                                                'if(xrc!=null) {' +
                                                    '$.ajax({' +
                                                        'url:"git",' +
                                                        'type:"POST",' +
                                                        'contentType:"application/json",' +
                                                        'data:"{\\"msg\\":\\""+xrc+"\\"}",' +
                                                        'success:function(rz){' +
                                                            'console.log("GIT RESULT:",rz);' +
                                                            'if(rz.startsWith("ERROR"))' +
                                                                'RED.notify("Error checking into source control","error");' +
                                                            'else{' +
                                                                'RED.notify("Successfully checked into source control","success");' +
                                                                '$("#btn-commit").addClass("disabled");' +
                                                            '}' +
                                                        '},' +
                                                        'error:function(jqXHR, textStatus, errorThrown){' +
                                                            'console.log("GIT AJAX ERROR:", jqXHR, textStatus, errorThrown);' +
                                                        '}' +
                                                    '});' +
                                                '}' +
                                                'else ' +
                                                    'console.log("Not checking flow into source control.")' +
                                            '}),$1');
                                    }
                                    send(body);
                                }
                            };
                        }));
    
                        self.app.post(REDsettings.httpAdminRoot + '/git', function(req, res) {
                            
                            let exec = Promise.promisify(childProcess.exec),
                                runCommand = function(command) {
                                return function() {
                                    console.log('Running "' + command + '"');
                                    return exec(command)
                                        .then(function(res) {
                                            // console.log('    ' + command + ' SUCCESS:', res);
                                            return res;
                                        })
                                        .catch(function(err) {
                                            console.error('    ' + command + ' ERROR:', err.message);
                                            throw err.message;
                                        });
                                    }
                                };
    
    
                            // Check if the branch exists
                            runCommand('git rev-parse --verify origin/' + globalConfig.PUSH_TO_BRANCH)()
                                
                                // Branch does exist
                                .then(function() {
    
                                    // Make sure there are no changes in the repo, which would cause conflicts
                                    return runCommand('git fetch')()
                                        .then(runCommand('git checkout ' + globalConfig.PUSH_TO_BRANCH))
                                        .then(runCommand('git stash'))
                                        .then(runCommand('git diff ' + globalConfig.PUSH_TO_BRANCH + ' origin/' + globalConfig.PUSH_TO_BRANCH))
                                        .then(function(diffResult){
                                            return runCommand('git stash pop')()
                                                .then(function() {
                                                    if(diffResult) throw 'Original local branch is different from remote branch - ' + diffResult;
                                                    return runCommand('git pull');
                                                });
                                        })
                                },
                                
                                // Branch does not exist
                                function() {
                                    return runCommand('git checkout -b ' + globalConfig.PUSH_TO_BRANCH)()
                                })
                                    
                                // Don't check in existing staged changes
                                .then(runCommand('git reset HEAD -- .'))
                                .then(runCommand('git add adapters/* flows/' + appId + '.json -f'))
                                .then(runCommand('git commit -m "' + req.body.msg + '"'))
                                .then(runCommand('git push -u origin ' + globalConfig.PUSH_TO_BRANCH))
                                
                                .then(function() {
                                    console.log('GIT CHECK-IN SUCCESS');
                                    res.send('SUCCESS');
                                })
                                .catch(function(err) {
                                    let errMsg = 'ERROR: ' + JSON.stringify(err);
                                    console.error('GIT CHECK-IN ' + errMsg);
                                    res.send(errMsg);
                                });
                        });
                        
                    }
                    
                    self.app.use(REDsettings.httpAdminRoot, RED.httpAdmin);
                    
                    // Serve the http nodes UI from /api
                    self.app.use(REDsettings.httpNodeRoot,
                        
                        // middleware for basic auth on red api http endpoints
                        function(req, res, next) {
                            
                            console.log("Got API Request. Method = ", req.method);
                            
                            if (req.method === 'OPTIONS') {
                                return next();
                            }
                            
                            let pathRoot        = req.url.replace(/^\//, '').split('/')[0],
                                pathAuth        = _.find(globalConfig.ENDPOINT_AUTH.PATHS || [], { pathRoot: pathRoot }),
                                correctUsername = _.get(pathAuth, 'USERNAME') || globalConfig.ENDPOINT_AUTH.USERNAME,
                                correctPassword = _.get(pathAuth, 'PASSWORD') || globalConfig.ENDPOINT_AUTH.PASSWORD;
                            
                            if(correctUsername || correctPassword) {
                                let incomingCredentials = auth(req),
                                    incomingUsername    = _.get(incomingCredentials, 'name'),
                                    incomingPassword    = _.get(incomingCredentials, 'pass');
                                
                                if( ( !correctUsername || incomingUsername == correctUsername ) &&
                                    ( !correctPassword || incomingPassword == correctPassword ) )
                                    next();

                                else {
                                    res.statusCode = 401;
                                    res.end('Access denied');
                                }
                            }
                            else
                                next();
                        },

                        // This is basically the "next" function above ^^
                        RED.httpNode);
                
                    RED.start();
                };
            },
            
            app = new App();

        // Delete useless affiliated modules
        let dirsToDelete = [
            path.join(__dirname, 'node_modules', 'node-red-contrib-async'),
            path.join(__dirname, 'node_modules', 'node-red-node-aws'),
            path.join(__dirname, 'node_modules', 'node-red-node-email'),
            path.join(__dirname, 'node_modules', 'node-red-node-feedparser'),
            path.join(__dirname, 'node_modules', 'node-red-node-mongodb'),
            path.join(__dirname, 'node_modules', 'node-red-node-rbe'),
            path.join(__dirname, 'node_modules', 'node-red-node-serialport'),
            path.join(__dirname, 'node_modules', 'node-red-node-twitter')
        ];
        _.each(dirsToDelete, function(dir) {
            deleteFolderRecursive(dir);
        });

        // Create these directories, if they don't already exist
        if (!fs.existsSync(adapterDir)){
            fs.mkdirSync(adapterDir);
        }
        if (!fs.existsSync(genNodeDir)){
            fs.mkdirSync(genNodeDir);
        }
        
    
        let tasks = [
            fs.readdirAsync(adapterDir),
            fs.readFileAsync(path.join(templateDir, 'node.ejs'), 'utf8'),
            fs.readFileAsync(path.join(templateDir, 'node.js'), 'utf8')
        ];
    
        if(!fs.existsSync(flowFile)) {
            console.log("The file, " + flowFile + " did not exist. Creating.");
            tasks.push(fs.writeFileAsync(flowFile, '[]', 'utf-8'));
        }

		console.log('Waiting for tasks to complete...');
				
        // Get the adapters to generate into nodes
        Promise.all(tasks)
            .spread(function(adapterFiles, ejsTemplate, jsTemplate) {
                
				console.log('Tasks complete! Starting Express...');
				
                app.startExpress();
                
                let regAdapt = require('./regAdapt');
            
                console.log("Adapter Files: " + JSON.stringify(adapterFiles));
                return Promise.map(adapterFiles, function(adapterFile) {
                    return regAdapt(app, adapterDir, genNodeDir).generateNodes(adapterFile, ejsTemplate, jsTemplate);
                })
            })
            .then(function() {
				console.log('Starting Node-RED!');
				
                app.startNodeRed();
            });
    });
