let adapter         = require('filenamePlaceholder'),
    adapter2Library = require('../regAdapt')().adapter2Library,
    mongo           = require('../mb_modules/mongo'),
    TrackedError    = mongo.TrackedError,
    logFactory      = require('../tools/logFactory'),
    
    inspector       = require('schema-inspector'),
    Promise         = require('bluebird'),
    _               = require('lodash'),
    time            = require('../tools/time'),
    makeSafeObject  = require('../tools/makeSafeObject'),
    
    objectTemplateKey = "dDJ95Kdks0kujf84kd9kr484fkIS3";

module.exports = function(RED) {
    
    function spec(node_config) {
        RED.nodes.createNode(this, node_config);
    
        let fun             = node_config.fun,
            fun2run         = adapter.functions[fun],
            logInput        = node_config[fun + "__logInput"],
            outputArray     = JSON.parse(node_config.outputArray),
            outputSettings  = JSON.parse(node_config.outputSettings)[fun],
            
            node            = this,
            log             = new logFactory(node),
            error           = new log({ isError: true }),
            statusUpdate    = new log({fill:"yellow",shape:"dot" });
        
        node.fun            = fun;
        node.sendOutput     = function(outputValue, statusMessage, outputId, existingMsg) {
    
            return Promise.try(function() {
                
                existingMsg     = existingMsg   || {};
                outputId        = outputId      || 'success';
                statusMessage   = statusMessage || outputId;
    
                let outputTime  = time.getMoment(),
                    settings    = outputSettings[outputId],
                    index       = outputArray.indexOf(outputId),
                    arrayToSend = new Array(index);
    
                if(outputId == 'success') {
                    if(settings.log) log('success', outputValue);
                    node.status({
                        fill:   'green',
                        shape:  'dot',
                        text:   statusMessage +
                        ' @ ' + time.format(outputTime) +
                        (lastInputTime ? ', AFTER ' + time.timeSpan(outputTime, lastInputTime) : '')
                    });
                }
                else if (outputId == 'invalidInput' || outputId == 'catchAll' ) {
                    if(settings.log) error(outputId, outputValue);
                    node.status({
                        fill:   'red',
                        shape:  'dot',
                        text:   statusMessage +
                        ' @ ' + time.format(outputTime) +
                        (lastInputTime ? ', AFTER ' + time.timeSpan(outputTime, lastInputTime) : '')
                    });
                }
                else {
                    if(settings.log) log(outputId, outputValue);
                    node.status({
                        fill:   'yellow',
                        shape:  'dot',
                        text:   statusMessage +
                        ' @ ' + time.format(outputTime) +
                        (lastInputTime ? ', AFTER ' + time.timeSpan(outputTime, lastInputTime) : '')
                    });
                }
    
                _.set(existingMsg, settings.path, outputValue);
    
                arrayToSend.push(existingMsg);
    
                node.send(arrayToSend);
                
            });
        };
        node.errorHandler   = function(err) {
    
            let msg = this;
            
            return Promise.try(function() {
    
                let safeError = makeSafeObject(err);
    
                let errorMatches = _.pickBy(fun2run.errorValidationRoutes, function(errorValidationRoute) {
                    let validationMatch = inspector.validate(errorValidationRoute.schema, safeError).valid;
                    // log("CHECKING ERROR AGAINST ROUTE: " + JSON.stringify(safeError) + " AGAINST THE FOLLOWING EVR: " + JSON.stringify(errorValidationRoute.schema) + " - " + validationMatch);
                    return validationMatch;
                });
    
                if(_.keys(errorMatches).length) {
                    return Promise.map(_.keys(errorMatches), function(errorValidationRouteId) {
                        return node.sendOutput(err, _.map(errorMatches, 'name').join(', '), errorValidationRouteId, msg);
                    })
                }
                else {
                    
                    let errorSavingPromise;
                    
                    if(!_.find(fun2run.trackedErrors, function(trackedError) {
                            // log("COMPARING WITH TRACKED ERROR:\n" + JSON.stringify(safeError) + "\n" + JSON.stringify(trackedError.value) + "\n", isEquivalent(safeError, trackedError.value));
                            return isEquivalent(safeError, trackedError.value);
                        }))
                        errorSavingPromise =
                            TrackedError.findAsync({
                                'node.type': node.type
                            })
                                .then(function(allTrackedErrors) {
                                    fun2run.trackedErrors = allTrackedErrors;
                                    if(!_.find(allTrackedErrors, function(trackedError) {
                                            // log("COMPARING WITH TRACKED ERROR:\n" + JSON.stringify(safeError) + "\n" + JSON.stringify(trackedError.value) + "\n", isEquivalent(safeError, trackedError.value));
                                            return isEquivalent(safeError, trackedError.value);
                                        })) {
                                        
                                        // TODO: Flatten this structure - including value
                                        let errr = {
                                                node: {
                                                    // name:
                                                    type:   node.type,
                                                    id:     node.id
                                                },
                                                fun:    fun,
                                                value:  safeError
                                            },
                                            mongoErr = new mongo.TrackedError(errr);
                                        
                                        return mongoErr.saveAsync()
                                            .then(function(result) {
                                                log("CREATED UNTRACKED ERROR", result);
                                            });
                                    }
                                    else
                                        return log("Error recently tracked")
                                });
                    
                    else
                        errorSavingPromise = Promise.resolve(log("Error already tracked"));
    
                    return errorSavingPromise
                        .catch(new error("ERROR CREATING UNTRACKED ERROR"))
                        .then(function() {
                            return node.sendOutput(err, err.message ? err.message : JSON.stringify(err), "catchAll", msg);
                        })
                }
            });
        };
            
        let lastInputTime;
    
        // // Needed this here because we're reloading a module, but npm cached it, so we need to clear it in order to get the new one
        delete require.cache[require.resolve('filenamePlaceholder')];
        adapter2Library(require('filenamePlaceholder'))
            .then(function(lib) {
                adapter = lib;
                fun2run = adapter.functions[fun];
                // log("adapter,", adapter);
            });
        
        // log("ACTIVATING,", node_config);
        
        function applyObjectTemplate(templateValue, injection) {
            
            if(_.isPlainObject(templateValue)) {
                
                let keys = Object.keys(templateValue);
    
                if (keys.length == 1 && keys[0] == objectTemplateKey) {
                    let injectionKey    = templateValue[objectTemplateKey],
                        injectionValue  = _.get(injection, injectionKey, null);
                    
                    if(injectionValue === null)
                        error("Injection appId not found", injectionKey);
                    // else
                    //     log("INJECTION - ", injectionKey, injectionValue);
    
                    return injectionValue;
                }
    
                return _.mapValues(templateValue, function(subVal) {
                    return applyObjectTemplate(subVal, injection);
                })
            }
            else if(_.isArray(templateValue)) {
                return _.map(templateValue, function(subVal) {
                    return applyObjectTemplate(subVal, injection);
                })
            }
            return templateValue;
        }
        

        function getInputParameters() {
        
            let msg                 = this,
                validationErrors    = [],
                params              = [];
        
            _.each(fun2run.inputs, function(param, param_id) {
                let paramConfig = node_config[fun + '__input__' + param_id],
                    inputValue, validationResult;
            
                if(paramConfig != undefined) {
                    let mjsonTemplate = JSON.parse(paramConfig);
                    inputValue = applyObjectTemplate(mjsonTemplate, msg);
                }
            
            
                if(param.schema.optional && inputValue == null)
                    validationResult = { valid: true };
                else
                    validationResult = inspector.validate(param.schema, inputValue);
            
                if (!validationResult.valid) {
                    validationErrors = validationErrors.concat(
                        _.map(validationResult.error, function(validationError) {
                            return validationError.property.replace(/^@/, param_id) + ": " + validationError.message;
                        })
                    );
                }
                params[param.i] = inputValue;
            });
        
            if(validationErrors.length) {
                node.sendOutput(validationErrors, validationErrors.join(', '), 'invalidInput', msg);
                return 'invalidInput';
            }
            return params;
        }
        
        if (fun2run.onStart)
            Promise.try(function() {
                
                let params = getInputParameters.apply({});
                
                if (params != 'invalidInput')  {
                    log("Running onStart");
                    return fun2run.onStart.apply(node, params)
                }
            })
                .then(new log("onStart complete"))
                .catch(node.errorHandler.bind({}));
        
        if (fun2run.onClose)
            node.on('close', function (done) {
    
                Promise.try(function() {
                    log("Running onClose");
                    return fun2run.onClose.apply(node);
                })
                    .then(new log("onClose complete"))
                    .catch(node.errorHandler.bind({}))
                    .then(done);
            });
        
        if (fun2run.onInput)
            node.on('input', function (msg) {
    
                lastInputTime = time.getMoment();
    
                let params;
                
                Promise.try(function() {
    
                    params = getInputParameters.apply(msg);
                    
                    if (params != 'invalidInput') {
                        if(logInput) statusUpdate("INPUT", params);
                        return fun2run.onInput.apply(node, params)
                    }
                })
                    .then(function (result) {
    
                            if (params != 'invalidInput') {
                                
                                let outputType = _.get(fun2run, 'output.schema.type', null),
                                    outputIsValid;
    
                                if (outputType == null ||
                                    outputType == 'null' ||
                                    outputType == 'any') {
        
                                    outputIsValid = {valid: true};
                                }
                                else
                                    outputIsValid = inspector.validate(fun2run.output.schema, result);
                                
                                if (!outputIsValid.valid)
                                    log("Warning: output was not valid: ", result, outputIsValid);
    
                                node.sendOutput(result, "success", "success", msg);
                            }
                        },
                        node.errorHandler.bind(msg)
                    )
            });
        
    }
    
    function isEquivalent(a, b) {
        
        let type = Object.prototype.toString.call(a);
        
        if(type != Object.prototype.toString.call(b)) {
            // console.log("type != Object.prototype.toString.call(b)");
            return false;
        }
        
        if(type == '[object Object]') {
            let aProps = Object.getOwnPropertyNames(a),
                bProps = Object.getOwnPropertyNames(b);
            
            // Mongo apparently strips these fields off, so we have to also
            _.remove(aProps, function(propName) {
                return _.isUndefined(a[propName]) || _.isFunction(a[propName]);
            });
            
            if (aProps.length != bProps.length){
                // console.log("aProps.length != bProps.length: " + JSON.stringify(aProps) + ", " + JSON.stringify(bProps));
                return false;
            }
            
            for (var i = 0; i < aProps.length; i++) {
                var propName = aProps[i];
                if (!isEquivalent(a[propName], b[propName])) {
                    // console.log("!isEquivalent(a[propName], b[propName])");
                    return false;
                }
            }
            
            return true;
        }
        return JSON.stringify(a) == JSON.stringify(b);
    }
    
    RED.nodes.registerType(adapter.id, spec);
};
