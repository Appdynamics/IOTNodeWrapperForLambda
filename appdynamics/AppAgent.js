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
        Logger_1.Logger.init('DEBUG');
        Logger_1.Logger.debug('dsm::logger init');
        function isFunction(functionToCheck) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        var newfunc = undefined;
        Logger_1.Logger.info(`Potential function: ${func.name}`);
        Logger_1.Logger.debug("dsm::ENVIRONMENT VARIABLES1 \n" + JSON.stringify(process.env, null, 2));
        if (isFunction(func)) {
            Logger_1.Logger.debug('dsm::isFunction true');
            Logger_1.Logger.info(`Instrumenting ${func.name}`);
            var old = func;
            newfunc = function (event, context, callback) {
                Logger_1.Logger.debug('dsm::newfunc start');
                Logger_1.Logger.debug("dsm::ENVIRONMENT VARIABLES2 \n" + JSON.stringify(process.env, null, 2));
                Logger_1.Logger.debug("dsm::EVENT\n" + JSON.stringify(event, null, 2));
                Logger_1.Logger.debug("dsm::CONTEXT\n" + JSON.stringify(context, null, 2));
                // second place that is setting log level. for my testing I'll just always set to debug
                if (event.stageVariables && event.stageVariables.APPDYNAMICS_LOGLEVEL) {
                    var loglevel = event.stageVariables.APPDYNAMICS_LOGLEVEL;
                    Logger_1.Logger.debug('dsm::loglevel' + loglevel);
                    if (!logset) {
                        Logger_1.Logger.init('DEBUG');
                    }
                    Logger_1.Logger.debug('loglevel in Stage Var.');
                }
                var uuid;
                var contextExists = true;
                var callbackExists = true;
                var requestID = '';
                var beaconProperties = {
                    stringProperties: {},
                    doubleProperties: {},
                    datetimeProperties: {},
                    booleanProperties: {},
                };
                // set the uniqueClientId|requestID
                if (!context) {
                    Logger_1.Logger.warn('context not given in function, generating uuid');
                    contextExists = false;
                    requestID = (new Date()).getTime().toString();
                }
                else {
                    requestID = context.awsRequestId;
                    if (beaconProperties && beaconProperties.stringProperties) {
                        beaconProperties.stringProperties['awsrequestid'] = requestID;
                    }
                }
                Logger_1.Logger.debug("dsm::requestId1::" + requestID);
                // if the configuration provides a unique header key, grab it from the event headers
                if (config && config.uniqueIDHeader && event.headers && event.headers[config.uniqueIDHeader]) {
                    requestID = event.headers[config.uniqueIDHeader];
                }
                Logger_1.Logger.debug("dsm::requestId2::" + requestID);
                Logger_1.Logger.debug('Creating transaction');
                global.AppConfig = config || {};
                if (!config) {
                    config = {};
                }
                var findHeader = HelperMethods_1.HelperMethods.findEventHeaderInformation(event);
                var findEventData = HelperMethods_1.HelperMethods.findEventDataInformation(event, findHeader.beaconProperties, config.eventData);
                findHeader.beaconProperties = HelperMethods_1.HelperMethods.mergeBeaconProperties(beaconProperties, findHeader.beaconProperties);
                findEventData.beaconProperties = HelperMethods_1.HelperMethods.mergeBeaconProperties(beaconProperties, findEventData.beaconProperties);
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
                Logger_1.Logger.debug("dsm::appkey::" + appkey);
                Logger_1.Logger.debug(appkey);
                var instrumentationenabled = true;
                if ((process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true") || (!processenvironmentset_enabled && event.stageVariables && event.stageVariables.APPDYNAMICS_ENABLED === "true")) {
                    Logger_1.Logger.debug('dsm::transaction before create');
                    if (findEventData.eventDataFound) {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, findEventData.beaconProperties);
                    }
                    else if (findHeader.headersFound) {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, findHeader.beaconProperties);
                    }
                    else {
                        global.txn = new Transaction_1.Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, beaconProperties);
                    }
                    Logger_1.Logger.debug('dsm::transaction created');
                }
                else {
                    instrumentationenabled = false;
                    Logger_1.Logger.warn('Appdynamics::Warn::Appdynamics instrumentation is not enabled.');
                }
                Logger_1.Logger.debug("dsm::AWS_LAMBDA_FUNCTION_VERSION::" + process.env.AWS_LAMBDA_FUNCTION_VERSION);
                Logger_1.Logger.debug("dsm::AWS_LAMBDA_FUNCTION_NAME::" + process.env.AWS_LAMBDA_FUNCTION_NAME);
                Logger_1.Logger.debug('Staring Transaction');
                if (!callback) {
                    Logger_1.Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                    callbackExists = false;
                    //Cleanup
                }
                ;
                if (instrumentationenabled) {
                    process.once('beforeExit', function () {
                        Logger_1.Logger.debug('dsm::beforeExit');
                        //if the transaction hasn't been stopped (like in an exception) send the data
                        if (global.txn && global.txn.iot && global.txn.timer && !global.txn.timer.end_process_time) {
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            Logger_1.Logger.info('Process about to exit');
                            try {
                                Logger_1.Logger.debug('dsm::beforeExit stop1');
                                global.txn.stop();
                                Logger_1.Logger.debug('dsm::beforeExit stop2');
                            }
                            catch (err) {
                                Logger_1.Logger.error(err);
                                //eat any errors for graceful exit
                                Logger_1.Logger.error(err.message);
                            }
                        }
                    });
                    Logger_1.Logger.debug('dsm::removeAllListeners.uncaughtException');
                    process.removeAllListeners('uncaughtException');
                    var reportExceptionToAppDynamics = function (err) {
                        Logger_1.Logger.debug('dsm::uncaughtException');
                        Logger_1.Logger.error(err);
                        if (global.txn && global.txn.iot) {
                            //global.txn.iot.sync = true;
                        }
                        if (global.txn) {
                            Logger_1.Logger.debug('dsm::uncaughtException.txn');
                            //Connection issues, dont wan't to end up in loop of beacons stop gracefully
                            if (err.message === "ECONNRESET") {
                                Logger_1.Logger.warn("Potential Communication issue.  Stopping communication to AppDynamics Collector for graceful shutdown.");
                                process.exit(1);
                            }
                            Logger_1.Logger.debug('dsm::uncaughtException reporterror');
                            global.txn.reportError({ name: "UnCaughtExceptions", message: JSON.stringify(err) });
                            Logger_1.Logger.debug('dsm::uncaughtException stop');
                            global.txn.stop();
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                        }
                        Logger_1.Logger.debug('dsm::exit.1');
                        process.exit(1);
                        Logger_1.Logger.debug('dsm::exit.2');
                    };
                    var reportRejectionToAppDynamics = function (reason, promise) {
                        Logger_1.Logger.debug('dsm::reportRejectionToAppDynamics');
                        if (global.txn) {
                            Logger_1.Logger.debug('dsm::reportRejectionToAppDynamics.txn');
                            Logger_1.Logger.debug(reason);
                            Logger_1.Logger.debug(promise);
                            global.txn.reportError({ name: "UnHandledRejection", message: JSON.stringify(reason) });
                        }
                    };
                    process.on('uncaughtException', reportExceptionToAppDynamics);
                    process.on('unhandledRejection', reportRejectionToAppDynamics);
                }
                if (callbackExists) {
                    Logger_1.Logger.debug('dsm::callbackExists');
                    var newcallback = function () {
                        if (instrumentationenabled) {
                            Logger_1.Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            // 
                            if (global.txn) {
                                Logger_1.Logger.debug('dsm::newcallback.stop() start');
                                global.txn.stop();
                                Logger_1.Logger.debug('dsm::newcallback.stop() end');
                            }
                            if (arguments && arguments[0]) {
                                Logger_1.Logger.debug('dsm::newcallback.arguments[0]');
                                if (global.txn) {
                                    // Lambda Transaction error
                                    global.txn.reportError({
                                        name: 'Lambda Execution Error',
                                        message: JSON.stringify(arguments[0])
                                    });
                                }
                            }
                            else if (arguments && arguments[1]) {
                                Logger_1.Logger.debug('dsm::newcallback.arguments[1]');
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
                            Logger_1.Logger.debug('dsm::callback start');
                            callback.apply(null, arguments);
                            Logger_1.Logger.debug('dsm::callback start');
                        }
                    };
                    Logger_1.Logger.debug('dsm::old1 start');
                    old(event, context, newcallback);
                    Logger_1.Logger.debug('dsm::old1 end');
                }
                else {
                    Logger_1.Logger.debug('dsm::old2 start');
                    old(event, context);
                    Logger_1.Logger.debug('dsm::old2 end');
                }
                Logger_1.Logger.debug('dsm::newfunc end');
            };
        }
        try {
            //INIT interceptors
            Logger_1.Logger.debug("HTTPInterceptor.init start");
            HTTPInterceptor_1.HTTPInterceptor.init();
            Logger_1.Logger.debug("HTTPInterceptor.init end");
            Logger_1.Logger.debug("AWSInterceptor.init start");
            AWSInterceptor_1.AWSInterceptor.init(config.AWSData);
            Logger_1.Logger.debug("AWSInterceptor.init end");
        }
        catch (err) {
            Logger_1.Logger.error('Interceptors failed to load');
            Logger_1.Logger.error(err);
        }
        if (newfunc) {
            Logger_1.Logger.debug("newfunc returned");
            return newfunc;
        }
        else {
            Logger_1.Logger.debug("func returned");
            return func;
        }
        //return new;
    }
}
exports.AppAgent = AppAgent;
