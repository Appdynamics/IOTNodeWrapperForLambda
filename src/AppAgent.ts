import { AppConfig, BooleanMap, DataTypeMap, BeaconProperties } from "./index";
import { Transaction } from "./IOTWrapper/Transaction";
import { HTTPInterceptor } from "./Interceptors/HTTPInterceptor";
import { AWSInterceptor } from "./Interceptors/AWSInterceptor";
import { Logger } from "./Helpers/Logger";
import { HelperMethods } from "./Helpers/HelperMethods";

// example client
function handler(event: any, context: any, callback: any){
    if(global.appdynamicsLambdaTransaction){
        global.appdynamicsLambdaTransaction.setCustomProperties({
            stringProperties: [{'key': 'value'}]
        })
    }
    console.log('handled!')
}
var app = {
    handler: instrumentHandler(handler)
}
app.handler(null, null, null)

// public to client, exposed by agent
function instrumentHandler(handler: Function, config?: AppConfig){
    var transaction = new LambdaTransaction(null);
    global.appdynamicsLambdaTransaction = transaction

    // todo write as async
    return function handlerWrapperSync(event: any, context: any, callback?: any){
        if(callback) {
            callback = function(){
                transaction.stop()
                return callback()
            }
        }
        transaction.start()
        try {
            handler(event, context, callback)
            transaction.stop()
        }
        catch (error) {
            transaction.reportError(error)
            transaction.stop()
            throw error
        }
    }
}

enum LAMDA_TRANSACTION_STATE {
    INIT = 0,
    STARTED = 1,
    STOPPED = 2,
    ERROR = 3
}

// must be guarnteed to never throw or leak an exception! all things handled gracefully here
class LambdaTransaction {

    private state: LAMDA_TRANSACTION_STATE
    private lambdaContext: any

    public constructor(lambdaContext: any){
        this.state = LAMDA_TRANSACTION_STATE.INIT
        this.lambdaContext = lambdaContext
    }

    public getState(){
        return this.state
    }

    public start(){
        // console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
        // console.log("EVENT\n" + JSON.stringify(event, null, 2))
        this.instrumentProcess()

        // todo start things?

        this.state = LAMDA_TRANSACTION_STATE.STARTED
    }

    public stop(){
        // nothing to stop
        if(this.state != LAMDA_TRANSACTION_STATE.STARTED){
            return
        }

        // end timer
        // send beacon
        this.state = LAMDA_TRANSACTION_STATE.STOPPED
    }

    public reportError(error: Error){
        // send beacon
    }

    public reportRejectedPromise(reason: any, promise: any){
        // send beacon
    }

    public setCustomProperties(){

    }

    private instrumentProcess(){
        // this should be formatted like uncaughtException & unhandledRejection
        // also, isn't there a better hook for AWS lambda?
        process.once('beforeExit', function beforeExitHandler () {
            if(global.appdynamicsLambdaTransaction){
                global.appdynamicsLambdaTransaction.stop()
            }
        });

        // this seems like it could have impacting affects to peoples code outside appd... why is this here?
        process.removeAllListeners('uncaughtException');
        process.on('uncaughtException', function uncaughtExceptionHandler (err: any) {
            if(global.appdynamicsLambdaTransaction){
                global.appdynamicsLambdaTransaction.reportError(err)
                global.appdynamicsLambdaTransaction.stop()
                process.exit(1);
            }
        });

        // why are we not removing listeners like the one above?
        // why would global.txn not be set?
        process.on('unhandledRejection', function unhandledRejectionHandler (reason: any, promise: any) {
            if(global.appdynamicsLambdaTransaction){
                global.appdynamicsLambdaTransaction.reportRejectedPromise(reason, promise)
                global.appdynamicsLambdaTransaction.stop()
            }
        });
    }
}

class AppAgent {

    static instrumentHandler(handler: Function, config?: AppConfig){
        // handlerWrapper(handler)
        // console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
        // console.log("EVENT\n" + JSON.stringify(event, null, 2))

    }

    static init(func: any, config?: AppConfig) {

        // parameters
            // awsHandler (currently called func)
            // agentConfig (currently called config)

        // FR
            // 100% fail proof, function always returned & executable
            // instruments awsHandler

        // NFR
            // logging
            // error handling

        // validate initial parameters
            // function
            // configuration

        // awsHandler characteristics
            // it will be sync or async
            // Async(event,context): For async functions, you return a response, error, or promise to the runtime instead of using callback.
            // Sync(event,context,callback): The callback function takes two arguments: an Error and a response. The response object must be compatible with JSON.stringify.)

        // seems like there are conditions when the config is not provided that could be grouped up
        // should create a default state for AppConfig
        var initConfig = config || {} as AppConfig;

        // are we instrumenting?
        var processenvironmentset_enabled = false
        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            processenvironmentset_enabled = true;
            console.info('Appdynamics::Info::Appdynamics instrumentation is not enabled.')
            return func;
        } else if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "true")  {
            processenvironmentset_enabled = true;
        }

        // setup logging
        var loglevel = 'OFF';
        var logset = false;
        if (initConfig.loglevel) {
            loglevel = initConfig.loglevel;
            logset = true;
        } else if (process.env.APPDYNAMICS_LOGLEVEL) {
            loglevel = process.env.APPDYNAMICS_LOGLEVEL;
            logset = true;
        }
        Logger.init(loglevel);

        // this is a helper function
        function isFunction(functionToCheck: any) {
            var string2check = {}.toString.call(functionToCheck);
            return functionToCheck && (string2check === '[object Function]' || string2check === '[object AsyncFunction]');
        }
        var newfunc = undefined;

        Logger.info(`Potential function: ${func.name}`)

        // defensive programming, if we don't have a function exit...
        // consider moving this up earlier and not executing code further down the chain
        if (isFunction(func)) {
            Logger.info(`Instrumenting ${func.name}`)
            var old = func;
            // further nesting...
            newfunc = function (event: any, context: any, callback: any) {

                // more logging level information.....
                // wouldn't this error trying to redefine the loglevel? well actually we're in a new function so the context is different
                if (event.stageVariables && event.stageVariables.APPDYNAMICS_LOGLEVEL) {
                    var loglevel = event.stageVariables.APPDYNAMICS_LOGLEVEL;
                    if(!logset) { Logger.init(loglevel);}
                    Logger.debug('loglevel in Stage Var.');
                }

                var requestID = '';
                var beaconProperties: BeaconProperties = {
                    stringProperties: {},
                    doubleProperties: {},
                    datetimeProperties: {},
                    booleanProperties: {},
                };

                if (initConfig && initConfig.uniqueIDHeader && event.headers && event.headers[initConfig.uniqueIDHeader]) {
                    requestID = event.headers[initConfig.uniqueIDHeader];
                } else {
                    if (!context) {
                        Logger.warn('context not given in function, generating uuid');
                        requestID = (new Date()).getTime().toString();
                    } else {
                        requestID = context.awsRequestId;
                        if(beaconProperties && beaconProperties.stringProperties) {
                            beaconProperties.stringProperties['awsrequestid'] = requestID;
                        }
                    }
                }

                Logger.debug('Creating transaction');

                global.AppConfig = initConfig;
                var findHeader = HelperMethods.findEventHeaderInformation(event);
                var findEventData = HelperMethods.findEventDataInformation(event, findHeader.beaconProperties, initConfig.eventData as DataTypeMap);
                findHeader.beaconProperties = HelperMethods.mergeBeaconProperties(beaconProperties, findHeader.beaconProperties);
                findEventData.beaconProperties = HelperMethods.mergeBeaconProperties(beaconProperties, findEventData.beaconProperties);

                // get app key
                var appkey = '<NO KEY SET>';
                if (initConfig.appKey) {
                    Logger.debug('appKey in config.');
                    appkey = initConfig.appKey;
                } else if (process.env.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Environment.');
                    appkey = process.env.APPDYNAMICS_APPKEY;
                } else if (event.stageVariables && event.stageVariables.APPDYNAMICS_APPKEY) {
                    Logger.debug('appKey in Stage Var.');
                    appkey = event.stageVariables.APPDYNAMICS_APPKEY;
                } else {
                    Logger.error('No appKey found');
                    // then shouldn't we stop processing?
                }
                Logger.debug(appkey);

                var instrumentationenabled = true;

                // create transaction
                // this looks like a check to say if we're supposed to be instrumenting or not
                // what is stageVariables? seems like we just need the appkey and then he masked the true intention behind this statement
                // i think the intent is that if either or is set, then we are instrumenting. should be a part of an initial validation step
                if ((
                        process.env.APPDYNAMICS_ENABLED 
                        && process.env.APPDYNAMICS_ENABLED === "true"
                    ) 
                    || (
                        !processenvironmentset_enabled 
                        && event.stageVariables 
                        && event.stageVariables.APPDYNAMICS_ENABLED === "true"
                )){
                    var beaconPropertiesToUse;
                    if(findEventData.eventDataFound) {
                        beaconPropertiesToUse = findEventData.beaconProperties;
                    } else if (findHeader.headersFound) {
                        beaconPropertiesToUse = findHeader.beaconProperties;
                    } else {
                        beaconPropertiesToUse = beaconProperties;
                    }
                    global.txn = new Transaction({
                        // this could just be read from the context and not the environment..
                        version: process.env.AWS_LAMBDA_FUNCTION_VERSION as string,
                        appKey: appkey || '',
                        transactionName: process.env.AWS_LAMBDA_FUNCTION_NAME as string,
                        transactionType: 'Lambda',
                        uniqueClientId: requestID
                    }, beaconPropertiesToUse);
                } else { 
                    // again, I thought we checked this somewhere else...
                    // I need to start tracking invalid scenarios
                    instrumentationenabled = false;
                    Logger.warn('Appdynamics::Warn::Appdynamics instrumentation is not enabled.');
                }

                Logger.debug('Staring Transaction');

                // again another check...
                // add process level instrumentation
                if (instrumentationenabled) {

                    // this should be formatted like uncaughtException & unhandledRejection
                    // also, isn't there a better hook for AWS lambda?
                    process.once('beforeExit', function () {
                        //if the transaction hasn't been stopped (like in an exception) send the data
                        // really uncleary way to manage this condition, looks like it should be a method of Transaction.IsStopped()
                        // perhaps adding a state to Transaction; TRANSACTION_STATE = INIT|STARTED|STOPPED|ERROR
                        if (global.txn && global.txn.iot && global.txn.timer && !global.txn.timer.end_process_time) {
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);
                            Logger.info('Process about to exit');
                            try {
                                global.txn.stop();
                            } catch (err) {
                                //eat any errors for graceful exit
                                Logger.error(err.message) // needs better error handling, should just search all logger statements and cleanup
                            }

                        }
                    });

                    // this seems like it could have impacting affects to peoples code outside appd... why is this here?
                    process.removeAllListeners('uncaughtException');

                    var reportExceptionToAppDynamics = function (err: any) {
                        if (global.txn && global.txn.iot) {
                            //global.txn.iot.sync = true;
                            // what was the intention here?
                        }
                        if (global.txn) {
                            
                            //Connection issues, dont wan't to end up in loop of beacons stop gracefully
                            // seems like an odd case? connectivity issues should be handled within the TXN.reportError then gracefully caught & logged,this would eliminate any process exitting at this level
                            // oh I see, if an uncaught exception occurs in the running process, it will be globally handled here.
                            // this could be handled gracefully without hooking into process level
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

                    // why are we not removing listeners like the one above?
                    // why would global.txn not be set?
                    var reportRejectionToAppDynamics = function (reason: any, promise: any) {
                        if (global.txn) {
                            global.txn.reportError({ name: "UnHandledRejection", message: JSON.stringify(reason) });
                        }
                    };

                    process.on('uncaughtException', reportExceptionToAppDynamics);
                    process.on('unhandledRejection', reportRejectionToAppDynamics);
                }

                var callbackExists: boolean = true;
                if (!callback) {
                    Logger.warn('callback not given in function, have to stop txn in process.exit synchronously');
                    callbackExists = false;
                    //Cleanup
                }
                if (callbackExists) {

                    // wrapp the callback
                    var newcallback = function () {
                        if (instrumentationenabled) {
                            Logger.info(`Stopping ${global.txn.config.transactionName}:${global.txn.config.transactionType}`);

                            // 
                            if (global.txn) {
                                global.txn.stop();
                            }

                            // why does this mean there is an error?
                            // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
                            // https://github.com/bojand/mailgun-js/issues/206
                            // see Example index.js File – HTTP Request with Callback
                            // should also probably be logging errors
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
        else {
            Logger.warn('Function not provided, code will not behave as intended, please pass a function to the init function')
        }

        try {
            //INIT interceptors, should this code even be setup if the previous lambda was not a function?
            HTTPInterceptor.init();
            AWSInterceptor.init(initConfig.AWSData);
        } catch (err) {
            Logger.error('Interceptors failed to load');
        }

        // why would this ever be a valid scenario
        if (newfunc) {
            return newfunc;
        } else {
            return func;
        }
    }
}
export { AppAgent }