import { AppConfig, BooleanMap } from "./index";
import { Transaction } from "./IOTWrapper/Transaction";
import { HTTPInterceptor } from "./Interceptors/HTTPInterceptor";
import { AWSInterceptor } from "./Interceptors/AWSInterceptor";
import { Logger } from "./Helpers/Logger";
import { HelperMethods } from "./Helpers/HelperMethods";
class AppAgent {
    static init(exports: any, config: AppConfig) {
        if(!(process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true")) {
            console.log('Appdynamics::Info::Appdynamics instrumentation is not enabled.')
            return exports;
        }
        Logger.init(config.loglevels || {});
        function isFunction(functionToCheck: any) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        for (var func in exports) {
            Logger.info(`Potential function: ${func}`)
            if (isFunction(exports[func])) {
                Logger.info(`Instrumenting ${func}`)
                var old = exports[func];
                exports[func] = function (event: any, context: any, callback: any) {
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
                    if (config.uniqueIDHeader && event.headers && event.headers[config.uniqueIDHeader]) {
                        uuid = event.headers[config.uniqueIDHeader];
                    }
                    Logger.debug('Creating transaction');
                    global.AppConfig = config;
                    var findHeader = HelperMethods.findEventHeaderInformation(event);
                    if(findHeader.headersFound) {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: config.appKey,
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            uniqueClientId: uuid
                        }, findHeader.beaconProperties);

                    } else {
                        global.txn = new Transaction({
                            version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                            appKey: config.appKey,
                            transactionName: requestID,
                            transactionType: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                            uniqueClientId: uuid
                        });
                    }


                    Logger.debug('Staring Transaction');

                    if (!callback) {
                        Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                        callbackExists = false;
                        //Cleanup
                        

                    };
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

                    var reportRejectionToAppDynamics = function(reason:any, promise:any) {
                        if (global.txn) {

                            global.txn.reportError({ name: "UnHandledRejection", message: JSON.stringify(reason) });
                        }
                    };
                    process.on('uncaughtException', reportExceptionToAppDynamics);
                    process.on('unhandledRejection', reportRejectionToAppDynamics);
                    if (callbackExists) {
                        var newcallback = function () {
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



        return exports;
    }
}
export { AppAgent }