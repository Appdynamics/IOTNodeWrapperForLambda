"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Transaction_1 = require("./IOTWrapper/Transaction");
const HTTPInterceptor_1 = require("./Interceptors/HTTPInterceptor");
const AWSInterceptor_1 = require("./Interceptors/AWSInterceptor");
const Logger_1 = require("./Helpers/Logger");
const HelperMethods_1 = require("./Helpers/HelperMethods");
class AppAgent {
    static init(func, config) {
        if (!config) {
            config = {};
        }
        var processenvironmentset_enabled = false;
        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            processenvironmentset_enabled = true;
            console.info('Appdynamics::Info::Appdynamics instrumentation is not enabled.');
            return func;
        }
        else if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true") {
            processenvironmentset_enabled = true;
        }
        var loglevel = 'OFF';
        var logset = false;
        if (config.loglevel) {
            loglevel = config.loglevel;
            logset = true;
        }
        else if (process.env.APPDYNAMICS_LOGLEVEL) {
            loglevel = process.env.APPDYNAMICS_LOGLEVEL;
            logset = true;
        }
        Logger_1.Logger.init(loglevel);
        function isFunction(functionToCheck) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        var newfunc = undefined;
        Logger_1.Logger.info(`Potential function: ${func.name}`);
        if (isFunction(func)) {
            Logger_1.Logger.info(`Instrumenting ${func.name}`);
            var old = func;
            newfunc = function (event, context, callback) {
                if (event.stageVariables && event.stageVariables.APPDYNAMICS_LOGLEVEL) {
                    var loglevel = event.stageVariables.APPDYNAMICS_LOGLEVEL;
                    if (!logset) {
                        Logger_1.Logger.init(loglevel);
                    }
                    Logger_1.Logger.debug('loglevel in Stage Var.');
                }
                var uuid;
                var contextExists = true;
                var callbackExists = true;
                var requestID = '';
                if (!context) {
                    Logger_1.Logger.warn('context not given in function, generating uuid');
                    contextExists = false;
                    requestID = (new Date()).getTime().toString();
                }
                else {
                    requestID = context.awsRequestId;
                }
                if (config && config.uniqueIDHeader && event.headers && event.headers[config.uniqueIDHeader]) {
                    uuid = event.headers[config.uniqueIDHeader];
                }
                Logger_1.Logger.debug('Creating transaction');
                global.AppConfig = config || {};
                if (!config) {
                    config = {};
                }
                var findHeader = HelperMethods_1.HelperMethods.findEventHeaderInformation(event);
                var findEventData = HelperMethods_1.HelperMethods.findEventDataInformation(event, findHeader.beaconProperties, config.eventData);
                var appkey = '<NO KEY SET>';
                if (config.appKey) {
                    Logger_1.Logger.debug('appKey in config.');
                    appkey = config.appKey;
                }
                else if (process.env.APPDYNAMICS_APPKEY) {
                    Logger_1.Logger.debug('appKey in Environment.');
                    appkey = process.env.APPDYNAMICS_APPKEY;
                }
                else if (event.stageVariables && event.stageVariables.APPDYNAMICS_APPKEY) {
                    Logger_1.Logger.debug('appKey in Stage Var.');
                    appkey = event.stageVariables.APPDYNAMICS_APPKEY;
                }
                else {
                    Logger_1.Logger.error('No appKey found');
                }
                Logger_1.Logger.debug(appkey);
                var instrumentationenabled = true;
                if ((process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true") || (!processenvironmentset_enabled && event.stageVariables && event.stageVariables.APPDYNAMICS_ENABLED === "true")) {
                    if (findEventData.eventDataFound) {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            uniqueClientId: uuid
                        }, findEventData.beaconProperties);
                    }
                    else if (findHeader.headersFound) {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            uniqueClientId: uuid
                        }, findHeader.beaconProperties);
                    }
                    else {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            uniqueClientId: uuid
                        });
                    }
                }
                else {
                    instrumentationenabled = false;
                    Logger_1.Logger.warn('Appdynamics::Warn::Appdynamics instrumentation is not enabled.');
                }
                Logger_1.Logger.debug('Staring Transaction');
                if (!callback) {
                    Logger_1.Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                    callbackExists = false;
                    //Cleanup
                }
                ;
                if (instrumentationenabled) {
                    process.once('beforeExit', function () {
                        //if the transaction hasn't been stopped (like in an exception) send the data
                        if (global.txn && global.txn.iot && global.txn.timer && !global.txn.timer.end_process_time) {
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            Logger_1.Logger.info('Process about to exit');
                            try {
                                global.txn.stop();
                            }
                            catch (err) {
                                //eat any errors for graceful exit
                                Logger_1.Logger.error(err.message);
                            }
                        }
                    });
                    process.removeAllListeners('uncaughtException');
                    var reportExceptionToAppDynamics = function (err) {
                        if (global.txn && global.txn.iot) {
                            //global.txn.iot.sync = true;
                        }
                        if (global.txn) {
                            //Connection issues, dont wan't to end up in loop of beacons stop gracefully
                            if (err.message === "ECONNRESET") {
                                Logger_1.Logger.warn("Potential Communication issue.  Stopping communication to AppDynamics Collector for graceful shutdown.");
                                process.exit(1);
                            }
                            global.txn.reportError({ name: "UnCaughtExceptions", message: JSON.stringify(err) });
                            global.txn.stop();
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                        }
                        process.exit(1);
                    };
                    var reportRejectionToAppDynamics = function (reason, promise) {
                        if (global.txn) {
                            global.txn.reportError({ name: "UnHandledRejection", message: JSON.stringify(reason) });
                        }
                    };
                    process.on('uncaughtException', reportExceptionToAppDynamics);
                    process.on('unhandledRejection', reportRejectionToAppDynamics);
                }
                if (callbackExists) {
                    var newcallback = function () {
                        if (instrumentationenabled) {
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            // 
                            if (global.txn) {
                                global.txn.stop();
                            }
                            if (arguments && arguments[0]) {
                                if (global.txn) {
                                    // Lambda Transaction error
                                    global.txn.reportError({
                                        name: 'Lambda Execution Error',
                                        message: JSON.stringify(arguments[0])
                                    });
                                }
                            }
                            else if (arguments && arguments[1]) {
                                var res = arguments[1];
                                //Normal Error status codes
                                if (res.statusCode && (res.statusCode >= 400 && res.statusCode < 600)) {
                                    var body = (res.body) ? res.body : JSON.stringify(res);
                                    if (global.txn) {
                                        global.txn.reportError({
                                            name: res.statusCode.toString(),
                                            message: body
                                        });
                                    }
                                }
                            }
                        }
                        if (callback) {
                            callback.apply(null, arguments);
                        }
                    };
                    old(event, context, newcallback);
                }
                else {
                    old(event, context);
                }
            };
        }
        try {
            //INIT interceptors
            HTTPInterceptor_1.HTTPInterceptor.init();
            AWSInterceptor_1.AWSInterceptor.init(config.AWSData);
        }
        catch (err) {
            Logger_1.Logger.error('Interceptors failed to load');
        }
        if (newfunc) {
            return newfunc;
        }
        else {
            return func;
        }
        //return new;
    }
}
exports.AppAgent = AppAgent;
