import { AppConfig, BooleanMap } from "./index";
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
        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            console.info('Appdynamics::Info::Appdynamics instrumentation is not enabled.')
            return func;
        }

        var loglevel = 'OFF';
        if (config.loglevel) {
            loglevel = config.loglevel;
        } else if (process.env.APPDYNAMICS_LOGLEVEL) {
            loglevel = process.env.APPDYNAMICS_LOGLEVEL;
        }
        Logger.init(loglevel);



        function isFunction(functionToCheck: any) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        var newfunc = undefined;

        Logger.info(`Potential function: ${func.name}`)
        if (isFunction(func)) {
            Logger.info(`Instrumenting ${func.name}`)
            var old = func;
            newfunc = function (event: any, context: any, callback: any) {
                if (event.stageVariables && event.stageVariables.APPDYNAMICS_LOGLEVEL) {
                    Logger.debug('loglevel in Stage Var.');
                    var loglevel = event.APPDYNAMICS_LOGLEVEL;
                    Logger.init(loglevel);
                }

                Logger.debug(`Intrumenting func: ${func}`);
                var uuid;
                var contextExists: boolean = true;
                var callbackExists: boolean = true;
                var requestID = '';
                if (!context) {
                    Logger.warn('context not given in function, generating uuid');
                    contextExists = false;
                    requestID = (new Date()).getTime().toString();
                } else {
                    requestID = context.awsRequestId;
                }
                if (config && config.uniqueIDHeader && event.headers && event.headers[config.uniqueIDHeader]) {
                    uuid = event.headers[config.uniqueIDHeader];
                }
                Logger.debug('Creating transaction');
                global.AppConfig = config || {};
                if (!config) {
                    config = {};
                }
                var findHeader = HelperMethods.findEventHeaderInformation(event);
                var appkey = '<NO KEY SET>';
                if (config.appKey) {
                    Logger.debug('appKey in config.');
                    appkey = config.appKey;
                } else if (process.env.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Environment.');
                    appkey = process.env.APPDYNAMICS_APPKEY;
                } else if (event.stageVariables && event.stageVariables.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Stage Var.');
                    appkey = event.APPDYNAMICS_APPKEY;
                } else {
                    Logger.error('No appKey found');
                }


                Logger.debug(appkey);
                var instrumentationenabled = true;
                if ((process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true") || (event.stageVariables && event.stageVariables.APPDYNAMICS_ENABLED === "true")) {
                    if (findHeader.headersFound) {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: appkey || '',
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            uniqueClientId: uuid
                        }, findHeader.beaconProperties);

                    } else {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: appkey || '',
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            uniqueClientId: uuid
                        });
                    }
                } else {
                    instrumentationenabled = false;
                    Logger.warn('Appdynamics::Warn::Appdynamics instrumentation is not enabled.');
                }

                Logger.debug('Staring Transaction');

                if (!callback) {
                    Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                    callbackExists = false;
                    //Cleanup


                };

                if (instrumentationenabled) {
                    process.once('beforeExit', function () {
                        //if the transaction hasn't been stopped (like in an exception) send the data
                        if (global.txn && global.txn.iot && global.txn.timer && !global.txn.timer.end_process_time) {
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            Logger.info('Process about to exit');
                            try {
                                global.txn.stop();
                            } catch (err) {
                                //eat any errors for graceful exit
                                Logger.error(err.message)
                            }

                        }
                    });
                    process.removeAllListeners('uncaughtException');
                    var reportExceptionToAppDynamics = function (err: any) {
                        if (global.txn && global.txn.iot) {
                            //global.txn.iot.sync = true;
                        }
                        if (global.txn) {

                            //Connection issues, dont wan't to end up in loop of beacons stop gracefully
                            if (err.message === "ECONNRESET") {
                                Logger.warn("Potential Communication issue.  Stopping communication to AppDynamics Collector for graceful shutdown.")
                                process.exit(1);
                            }
                            global.txn.reportError({ name: "UnCaughtExceptions", message: JSON.stringify(err) });
                            global.txn.stop();

                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);

                        }

                        process.exit(1);
                    };

                    var reportRejectionToAppDynamics = function (reason: any, promise: any) {
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
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);

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

                            } else if (arguments && arguments[1]) {
                                var res = arguments[1]
                                //Normal Error status codes
                                if (res.statusCode && (res.statusCode >= 400 && res.statusCode < 600)) {
                                    var body: string = (res.body) ? res.body : JSON.stringify(res);
                                    if (global.txn) {
                                        global.txn.reportError({
                                            name: res.statusCode.toString(),
                                            message: body as string
                                        });
                                    }
                                }
                            }
                        }
                        if (callback) {
                            callback.apply(null, arguments as IArguments);
                        }

                    }
                    old(event, context, newcallback);

                } else {
                    old(event, context);
                }

            }
        }

        try {


            //INIT interceptors
            HTTPInterceptor.init();
            var show: BooleanMap = {}
            var hide: BooleanMap = {}
            if (config.paramsToHide) {
                hide = config.paramsToHide as BooleanMap;
            }
            if (config.paramsToShow) {
                show = config.paramsToShow as BooleanMap;
            }
            AWSInterceptor.init(show, hide);




        } catch (err) {
            Logger.error('Interceptors failed to load');
        }

        if (newfunc) {
            return newfunc;
        } else {
            return func;
        }

        //return new;
    }
}
export { AppAgent }