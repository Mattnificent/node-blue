let _               = require('lodash'),
    Promise         = require('bluebird'),
    path            = require('path'),
    fs              = Promise.promisifyAll(require("fs")),
    inspector       = require('schema-inspector'),
    
    mongo           = require("./mb_modules/mongo"),
    TrackedError    = mongo.TrackedError,
    autoLabel       = require('./tools/autoLabel'),
    
    app,
    adapterDir,
    genNodeDir;

module.exports = function(_app, _adapterDir, _genNodeDir) {
    app         = _app;
    adapterDir  = _adapterDir;
    genNodeDir  = _genNodeDir;
    
    // Return the register adapter function
    return {
        generateNodes: generateNodes,
        adapter2Library: adapter2Library
    }
};


function generateNodes(adapterFile, ejsTemplate, jsTemplate) {
    let fullAdapterFilePath = path.join(adapterDir, adapterFile);
    
    return adapter2Library(require(fullAdapterFilePath))
        .then(function(libraryConfig) {
            
            app.app.get('/libraries/' + libraryConfig.id, function(req, res) {
                delete require.cache[require.resolve(fullAdapterFilePath)];
                adapter2Library(require(fullAdapterFilePath))
                    .then(function (library) {
                        res.send(library);
                    })
            });
            
            app.app.delete('/libraries/' + libraryConfig.id + '/errorValidationRoutes', function(req, res) {
                
                // console.log("Delete req.body\n" + JSON.stringify(req.body, null, 4));
                // console.log("libraryConfig\n" + JSON.stringify(libraryConfig, null, 4));
                
                let functionName = libraryConfig.functions[req.body.fun].name.replace(/([\(\)])/g, '\\$1');
                
                return fs.readFileAsync(fullAdapterFilePath, 'utf8')
                    .then(function(adapterText) {
                        
                        let pen1 = adapterText.match(new RegExp(
                                '\\n(\\s*)[\'"]?name[\'"]?\\s*:\\s*[\'|"]' +
                                functionName +
                                '[\'|"]\\s*,(.|[\\r\\n])*?\\n(\\s*)[\'"]?errors[\'"]?\\s*:\\s*\\[' +
                                '(.|[\\r\\n])*?\\n(\\s*)\{\\s*[\'"]?name[\'"]?\\s*:\\s*[\'"]' + req.body.errorName + '[\'"]'
                            )),
                            pen2 = adapterText.match(new RegExp(
                                '(\\n(\\s*)[\'"]?name[\'"]?\\s*:\\s*[\'|"]' +
                                functionName +
                                '[\'|"]\\s*,(.|[\\r\\n])*?\\n(\\s*)[\'"]?errors[\'"]?\\s*:\\s*\\[' +
                                '(.|[\\r\\n])*?)(\\n' + pen1[5] + '\{\\s*[\'"]?name[\'"]?\\s*:\\s*[\'"]' + req.body.errorName + '[\'"](.|[\\r\\n])*?\\n' + pen1[5] + '\},?)'
                            ));
                        
                        // console.log("functionName", functionName);
                        // console.log("pen1\n", JSON.stringify(pen1, null, 4));
                        // console.log("pen2\n", JSON.stringify(pen2, null, 4));
                        
                        if(!pen1) {
                            throw new Error("ERROR: Could not find errors for '" + functionName + "' in the adapter file. Please verify that 'errors: [' exists after 'name: \"" + functionName + "\",'.");
                            // TODO: handle when we can't find errors - try to add errors?
                        }
                        else {
                            if(pen1[1] != pen1[3])
                                console.log("Warning: '" + functionName + "' adapter file format is weak; indent 'errors: [' the same as 'name: \"" + functionName + "\",'.");
                            
                            let newAdapterText = adapterText.replace(pen2[0], pen2[1]);
                            
                            console.log("Removing error validation definition from " + libraryConfig.id + "." + req.body.fun + ":" + pen2[6]);
                            // console.log("newAdapterText\n----------------------------------------------------------------------\n" + newAdapterText);
                            
                            return fs.writeFileAsync(fullAdapterFilePath, newAdapterText, 'utf-8');
                        }
                    })
                    .then(function() {
                        
                        // Needed this here because we're reloading a module, but npm cached it, so we need to clear it in order to get the new one
                        delete require.cache[require.resolve(fullAdapterFilePath)];
                        
                        let newLibrary = require(fullAdapterFilePath);
                        
                        // console.log("Returning new lib\n----------------------------------------------------------------------------------------\n", JSON.stringify(newLibrary, null, 2));
                        
                        return adapter2Library(newLibrary)
                            .then(function (library) {
                                res.send(library);
                            });
                    })
                    .catch(function(err) {
                        console.error("Error saving new error for " + libraryConfig.id + "." + functionName + ":\n", err);
                        res.send(err);
                    });
            });
            
            app.app.post('/libraries/' + libraryConfig.id + '/errorValidationRoutes', function(req, res) {
                
                // console.log("req.body\n" + JSON.stringify(req.body, null, 4));
                // console.log("libraryConfig\n" + JSON.stringify(libraryConfig, null, 4));
                
                // TODO: Check if validation object itself is valid
                
                return fs.readFileAsync(fullAdapterFilePath, 'utf8')
                    .then(function(adapterText) {
                        
                        let functionName = libraryConfig.functions[req.body.fun].name.replace(/([\(\)])/g, '\\$1'),
                            fileHighlights = adapterText.match(new RegExp('\\n(\\s*)[\'"]?name[\'"]?\\s*:\\s*[\'|"]' + functionName + '[\'|"]\\s*,(.|[\\r\\n])*?\\n(\\s*)[\'"]?errors[\'"]?\\s*:\\s*\\['));
                        
                        // console.log("functionName", functionName);
                        // console.log("fileHighlights\n", JSON.stringify(fileHighlights, null, 4));
                        
                        if(!fileHighlights) {
                            throw new Error("ERROR: Could not find errors for '" + functionName + "' in the adapter file. Please verify that 'errors: [' exists after 'name: \"" + functionName + "\",'.");
                            // TODO: handle when we can't find errors - try to add errors?
                        }
                        else {
                            if(fileHighlights[1] != fileHighlights[3])
                                console.log("Warning: '" + functionName + "' adapter file format is weak; indent 'errors: [' the same as 'name: \"" + functionName + "\",'.");
                            
                            let newErrorLines = JSON.stringify(req.body.error, null, 4).split('\n').map(function(str) { return fileHighlights[3] + '    ' + str; }).join('\n');
                            
                            let newAdapterText = adapterText.replace(fileHighlights[0], fileHighlights[0] + '\n' + newErrorLines + ',');
                            
                            console.log("Adding error validation definition for " + libraryConfig.id + "." + req.body.fun + ":\n" + newErrorLines);
                            // console.log("newAdapterText\n----------------------------------------------------------------------\n" + newAdapterText);
                            
                            return fs.writeFileAsync(fullAdapterFilePath, newAdapterText, 'utf-8');
                        }
                    })
                    .then(function() {
                        
                        // Needed this here because we're reloading a module, but npm cached it, so we need to clear it in order to get the new one
                        delete require.cache[require.resolve(fullAdapterFilePath)];
                        
                        let newLibrary = require(fullAdapterFilePath);
                        
                        // console.log("Returning new lib\n----------------------------------------------------------------------------------------\n", JSON.stringify(newLibrary, null, 2));
                        
                        return adapter2Library(newLibrary)
                            .then(function (library) {
                                res.send(library);
                            });
                    })
                    .catch(function(err) {
                        console.error("Error saving new error:", err);
                        res.send(err);
                    });
            });
            
            let htmlFile = _.template(ejsTemplate.replace(/matt-script/g, 'script'))(libraryConfig),
                jsFile = jsTemplate
                    .replace(/filenamePlaceholder/ig, '../adapters/' + adapterFile)
                    .replace(/\.\.\//g, '../../');
            
            return Promise.all([
                fs.writeFileAsync(path.join(genNodeDir, libraryConfig.id + '.html'), htmlFile, 'utf-8'),
                fs.writeFileAsync(path.join(genNodeDir, libraryConfig.id + '.js'), jsFile, 'utf-8')
            ]);
        });
}

function adapter2Library(adapter) {
    
    ensureId(adapter);
    
    return getTrackedErrors(adapter.id)
        .then(function(trackedErrors) {
            
            adapter.functions = array2object(adapter.functions, function(fun) {
                
                // TODO: reason about some kind of default value here
                fun.inputs = array2object(fun.inputs);
    
                fun.inputCount = fun.onInput ? 1 : 0;
    
                fun.output = fun.output || { name: 'Finished', schema: { type: 'null'}, description: 'The operation has successfully completed.'};
    
                _.extend(fun.output, { id: autoLabel(fun.output.name) });
    
                fun.trackedErrors = _.filter(trackedErrors, { fun: fun.id });
                
                fun.errorValidationRoutes = array2object((fun.errors || []), function(errorValidationRoute) {
                    _.extend(errorValidationRoute, { routedErrors: [] });
                });
                
                fun.unRoutedErrors = _.filter(fun.trackedErrors, function(trackedError) {
                    _.extend(trackedError, { routed: false, doubleRouted: false })
                    return !_.filter(fun.errorValidationRoutes, function(errDef) {
                        
                        let result = inspector.validate(errDef.schema, trackedError.value).valid;

                        // console.log("Testing: " + JSON.stringify(trackedError.value) + " AGAINST: " + JSON.stringify(errDef.schema) + " - " + result);
                        
                        if(result) {
                            if(trackedError.routed) trackedError.doubleRouted = true;
                            trackedError.routed = true;
                            errDef.routedErrors.push(trackedError);
                        }
                        
                        return result;
                    }).length;
                });
            });
            return adapter;
        })
}

function getTrackedErrors(nodeType) {
    return TrackedError.findAsync({
        'node.type': nodeType
    })
}

function ensureId(thing) {
    if(!thing.id) thing.id = autoLabel(thing.name);
}

function array2object(arr, fn) {
    return _.reduce(arr, function(o, v, i) {
        ensureId(v);
        v.i = i;
        o[v.id] = v;
        if(fn) fn(v);
        return o;
    }, {});
}
