import { AppConfig, BooleanMap, DataTypeMap, BeaconProperties } from "./index";
import { Transaction } from "./IOTWrapper/Transaction";
import { HTTPInterceptor } from "./Interceptors/HTTPInterceptor";
import { AWSInterceptor } from "./Interceptors/AWSInterceptor";
import { Logger } from "./Helpers/Logger";
import { HelperMethods } from "./Helpers/HelperMethods";
class AppAgent {
    static init(func: any, config?: AppConfig) {
        if (!config) {
            config = {} as AppConfig;
        }
        var processenvironmentset_enabled = false
        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            processenvironmentset_enabled = true;
            console.info('Appdynamics::Info::Appdynamics instrumentation is not enabled.')
            return func;
        } else if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true")  {
            processenvironmentset_enabled = true;
        }

        var loglevel = 'OFF';
        var logset = false;
        if (config.loglevel) {
            loglevel = config.loglevel;
            logset = true;
        } else if (process.env.APPDYNAMICS_LOGLEVEL) {
            loglevel = process.env.APPDYNAMICS_LOGLEVEL;
            logset = true;
        }
        Logger.init('DEBUG');

        Logger.debug('dsm::logger init')

        function isFunction(functionToCheck: any) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        var newfunc = undefined;

        Logger.info(`Potential function: ${func.name}`)
        Logger.debug("dsm::ENVIRONMENT VARIABLES1 \n" + JSON.stringify(process.env, null, 2))
        if (isFunction(func)) {

            Logger.debug('dsm::isFunction true')

            Logger.info(`Instrumenting ${func.name}`)
            var old = func;
            newfunc = function (event: any, context: any, callback: any) {

                Logger.debug('dsm::newfunc start')
                Logger.debug("dsm::ENVIRONMENT VARIABLES2 \n" + JSON.stringify(process.env, null, 2))
                Logger.debug("dsm::EVENT\n" + JSON.stringify(event, null, 2))
                Logger.debug("dsm::CONTEXT\n" + JSON.stringify(context, null, 2))

                // second place that is setting log level. for my testing I'll just always set to debug
                if (event.stageVariables && event.stageVariables.APPDYNAMICS_LOGLEVEL) {
                    var loglevel = event.stageVariables.APPDYNAMICS_LOGLEVEL;
                    Logger.debug('dsm::loglevel' + loglevel);
                    if(!logset) { Logger.init('DEBUG');}
                    Logger.debug('loglevel in Stage Var.');
                }

                var uuid;
                var contextExists: boolean = true;
                var callbackExists: boolean = true;
                var requestID = '';
                var beaconProperties: BeaconProperties = {
                    stringProperties: {},
                    doubleProperties: {},
                    datetimeProperties: {},
                    booleanProperties: {},
                };

                // set the uniqueClientId|requestID
                if (!context) {
                    Logger.warn('context not given in function, generating uuid');
                    contextExists = false;
                    requestID = (new Date()).getTime().toString();
                } else {
                    requestID = context.awsRequestId;
                    if(beaconProperties && beaconProperties.stringProperties) {
                        beaconProperties.stringProperties['awsrequestid'] = requestID;
                    }
                }
                Logger.debug("dsm::requestId1::" + requestID)

                // if the configuration provides a unique header key, grab it from the event headers
                if (config && config.uniqueIDHeader && event.headers && event.headers[config.uniqueIDHeader]) {
                    requestID = event.headers[config.uniqueIDHeader];
                }
                Logger.debug("dsm::requestId2::" + requestID)

                Logger.debug('Creating transaction');
                global.AppConfig = config || {};
                if (!config) {
                    config = {};
                }
                var findHeader = HelperMethods.findEventHeaderInformation(event);
                var findEventData = HelperMethods.findEventDataInformation(event, findHeader.beaconProperties, config.eventData as DataTypeMap);
                findHeader.beaconProperties = HelperMethods.mergeBeaconProperties(beaconProperties, findHeader.beaconProperties);
                findEventData.beaconProperties = HelperMethods.mergeBeaconProperties(beaconProperties, findEventData.beaconProperties);

                var appkey = '<NO KEY SET>';
                if (config.appKey) {
                    Logger.debug('appKey in config.');
                    appkey = config.appKey;
                } else if (process.env.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Environment.');
                    appkey = process.env.APPDYNAMICS_APPKEY;
                } else if (event.stageVariables && event.stageVariables.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Stage Var.');
                    appkey = event.stageVariables.APPDYNAMICS_APPKEY;
                } else {
                    Logger.error('No appKey found');
                }


                Logger.debug("dsm::appkey::" + appkey)
                Logger.debug(appkey);
                var instrumentationenabled = true;
                if ((process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true") || (!processenvironmentset_enabled && event.stageVariables && event.stageVariables.APPDYNAMICS_ENABLED === "true")) {
                    Logger.debug('dsm::transaction before create')
                    if(findEventData.eventDataFound) {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, findEventData.beaconProperties);

                    } else if (findHeader.headersFound) {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, findHeader.beaconProperties);

                    } else {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: appkey || '',
                            transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            transactionType: 'Lambda',
                            uniqueClientId: requestID
                        }, beaconProperties);
                    }
                    Logger.debug('dsm::transaction created')
                } else {
                    instrumentationenabled = false;
                    Logger.warn('Appdynamics::Warn::Appdynamics instrumentation is not enabled.');
                }
                Logger.debug("dsm::AWS_LAMBDA_FUNCTION_VERSION::" + process.env.AWS_LAMBDA_FUNCTION_VERSION)
                Logger.debug("dsm::AWS_LAMBDA_FUNCTION_NAME::" + process.env.AWS_LAMBDA_FUNCTION_NAME)

                Logger.debug('Staring Transaction');

                if (!callback) {
                    Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                    callbackExists = false;
                    //Cleanup


                };

                if (instrumentationenabled) {
                    process.once('beforeExit', function () {
                        // this never gets hit, there for ".stop" is never called
                        Logger.debug('dsm::beforeExit')
                        //if the transaction hasn't been stopped (like in an exception) send the data
                        if (global.txn && global.txn.iot && global.txn.timer && !global.txn.timer.end_process_time) {
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            Logger.info('Process about to exit');
                            try {
                                Logger.debug('dsm::beforeExit stop1')
                                global.txn.stop();
                                Logger.debug('dsm::beforeExit stop2')
                            } catch (err) {
                                Logger.error(err)
                                //eat any errors for graceful exit
                                Logger.error(err.message)
                            }

                        }
                    });
                    Logger.debug('dsm::removeAllListeners.uncaughtException')
                    process.removeAllListeners('uncaughtException');
                    var reportExceptionToAppDynamics = function (err: any) {
                        Logger.debug('dsm::uncaughtException')
                        Logger.error(err)
                        if (global.txn && global.txn.iot) {
                            //global.txn.iot.sync = true;
                        }
                        if (global.txn) {
                            Logger.debug('dsm::uncaughtException.txn')

                            //Connection issues, dont wan't to end up in loop of beacons stop gracefully
                            if (err.message === "ECONNRESET") {
                                Logger.warn("Potential Communication issue.  Stopping communication to AppDynamics Collector for graceful shutdown.")
                                process.exit(1);
                            }
                            Logger.debug('dsm::uncaughtException reporterror')
                            global.txn.reportError({ name: "UnCaughtExceptions", message: JSON.stringify(err) });
                            Logger.debug('dsm::uncaughtException stop')
                            global.txn.stop();

                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);

                        }

                        Logger.debug('dsm::exit.1')
                        process.exit(1);
                        Logger.debug('dsm::exit.2')
                    };

                    var reportRejectionToAppDynamics = function (reason: any, promise: any) {
                        Logger.debug('dsm::reportRejectionToAppDynamics')
                        if (global.txn) {
                            Logger.debug('dsm::reportRejectionToAppDynamics.txn')
                            Logger.debug(reason)
                            Logger.debug(promise)

                            global.txn.reportError({ name: "UnHandledRejection", message: JSON.stringify(reason) });
                        }
                    };
                    process.on('uncaughtException', reportExceptionToAppDynamics);
                    process.on('unhandledRejection', reportRejectionToAppDynamics);
                }
                if (callbackExists) {
                    Logger.debug('dsm::callbackExists')
                    var newcallback = function () {
                        if (instrumentationenabled) {
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);

                            // 
                            if (global.txn) {
                                Logger.debug('dsm::newcallback.stop() start')
                                global.txn.stop();
                                Logger.debug('dsm::newcallback.stop() end')
                            }

                            if (arguments && arguments[0]) {
                                Logger.debug('dsm::newcallback.arguments[0]')
                                if (global.txn) {
                                    // Lambda Transaction error
                                    global.txn.reportError({
                                        name: 'Lambda Execution Error',
                                        message: JSON.stringify(arguments[0])
                                    });
                                }

                            } else if (arguments && arguments[1]) {
                                Logger.debug('dsm::newcallback.arguments[1]')
                                // if a response object was provided, we want to inspect it and if it's an error report it
                                var res = arguments[1]
                                Logger.debug(res)
                                // Normal Error status codes
                                // note if res isn't in this object formater it will error
                                if (res.statusCode && (res.statusCode >= 400 && res.statusCode < 600)) {
                                    var body: string = (res.body) ? res.body : JSON.stringify(res);
                                    Logger.debug(body)
                                    if (global.txn) {
                                        // dsm bug is getting here
                                        global.txn.reportError({
                                            name: res.statusCode.toString(),
                                            message: body as string
                                        });
                                    }
                                }
                            }
                        }
                        if (callback) {
                            Logger.debug('dsm::callback start')
                            callback.apply(null, arguments as IArguments);
                            Logger.debug('dsm::callback start')
                        }

                    }
                    Logger.debug('dsm::old1 start')
                    old(event, context, newcallback);
                    Logger.debug('dsm::old1 end')

                } else {
                    Logger.debug('dsm::old2 start')
                    old(event, context);
                    Logger.debug('dsm::old2 end')
                }


                Logger.debug('dsm::newfunc end')
            }
        }

        try {
            //INIT interceptors
            Logger.debug("HTTPInterceptor.init start")
            HTTPInterceptor.init();
            Logger.debug("HTTPInterceptor.init end")
            Logger.debug("AWSInterceptor.init start")
            AWSInterceptor.init(config.AWSData);
            Logger.debug("AWSInterceptor.init end")

        } catch (err) {
            Logger.error('Interceptors failed to load');
            Logger.error(err);
        }

        if (newfunc) {
            Logger.debug("newfunc returned")
            return newfunc;
        } else {
            Logger.debug("func returned")
            return func;
        }

        //return new;
    }
}
export { AppAgent }