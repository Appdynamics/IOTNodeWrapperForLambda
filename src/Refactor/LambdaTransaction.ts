import { 
    CustomEvent,
    NetworkRequestEvent,
    BeaconProperties,
    ErrorEvent,
    AppConfig,
    DataTypeMap,
    StringMap
} from '../index';
import { Api } from './Api';
import { Beacon } from './Beacon';
import { Timer } from './Timer';
import http = require('http');
import URL = require('url')
import { stringify } from 'querystring';
import { HelperMethods } from '../Helpers/HelperMethods';
// import https = require('https')

enum LAMDA_TRANSACTION_STATE {
    INIT = 0,
    STARTED = 1,
    STOPPED = 2,
    TRANSACTION_ERROR = 3,
    VALIDATION_ERROR = 4,
    SEND_BEACON_ERROR = 5, // internal appd error
    APP_DISABLED = 6
}

export interface LambdaContext {
    functionName: any, // SDPR_S17_S001-vf-sendcommand
    functionVersion: any,
    invokedFunctionArn: any, // arn:aws:lambda:eu-west-1:XXX:function:SDPR_S17_S001-vf-sendcommand:gsdp
    memoryLimitInMB: any, // 1024
    awsRequestId: any, // 5c205d4b-7b47-46cb-bbd1-7c45973c333c
    logGroupName: any, // "/aws/lambda/SDPR_S17_S001-vf-sendcommand"
    logStreamName: any, // "2019/07/10/[$LATEST]16f43064823147a49794b6ce97364248"
    identity: {
        cognitoIdentityId: any,
        cognitoIdentityPoolId: any
    },
    clientContext: {
        client:{
            installation_id: any,
            app_title: any,
            app_version_name: any,
            app_version_code: any,
            app_package_name: any
        },
        env:{
            platform_version: any,
            platform: any,
            make: any,
            model: any,
            locale: any
        }
        Custom:any
    },
    callbackWaitsForEmptyEventLoop:boolean
}

// must be guarnteed to never throw or leak an exception! all things handled gracefully here
class LambdaTransaction {

    private state: LAMDA_TRANSACTION_STATE = LAMDA_TRANSACTION_STATE.INIT
    private beacon: Beacon
    private lambdaContext: any
    private timer: Timer
    private api: Api
    private debug: boolean
    private appKey: string
    private globalBeaconProperties: BeaconProperties
    private config: AppConfig

    constructor(config: AppConfig){
        this.config = config
        this.appKey = config.appKey
        this.debug = (config.loglevel && config.loglevel == 'debug') ? true : true
        this.timer = new Timer
        this.api = new Api(this.appKey)
        this.globalBeaconProperties = {
            stringProperties: {},
            datetimeProperties: {},
            booleanProperties: {},
            doubleProperties: {}            
        }
        this.beacon = new Beacon
    }

    getState(){
        return this.state
    }

    start(lambdaEvent:any, lambdaContext:LambdaContext){
        // already started
        if(this.state != LAMDA_TRANSACTION_STATE.INIT){
            console.error('an attempt was made to start the transaction in a non-initiated state, state was: ' + this.state)
            throw new Error('an attempt was made to start the transaction in a non-initiated state')
        }

        if(this.debug && !this.api.isAppEnabled()){
            this.state = LAMDA_TRANSACTION_STATE.APP_DISABLED
            console.warn('The application for the AppKey provided is disabled. The AppD agent will not report any metrics. If the application should be activated, please review your controller and validate you provided the correct AppKey. AppKey Provided was: ' + this.appKey)
            return
        }

        this.lambdaContext = lambdaContext
        this.beacon.deviceInfo.deviceType = 'AwsLambdaTransaction'
        this.beacon.deviceInfo.deviceId =  this.lambdaContext.awsRequestId
        this.beacon.deviceInfo.deviceName = this.lambdaContext.functionName

        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsFunctionName', this.lambdaContext.functionName)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsFunctionVersion', this.lambdaContext.functionVersion)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsInvokedFunctionArn', this.lambdaContext.invokedFunctionArn)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsMemoryLimitInMB', this.lambdaContext.memoryLimitInMB)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsRequestId', this.lambdaContext.awsRequestId)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsLogGroupName', this.lambdaContext.logGroupName)
        HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsLogStreamName', this.lambdaContext.logStreamName)

        if(this.config.uniqueIDHeader && lambdaEvent.headers){
            HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsCustomUniqueId', lambdaEvent.headers[this.config.uniqueIDHeader])
        }

        if(this.config.lambdaHeaders){
            var eventHeaderProperties = HelperMethods.goThroughHeaders(lambdaEvent, '_evth', this.config.lambdaHeaders as DataTypeMap)
            if(eventHeaderProperties.headersFound){
                HelperMethods.mergeBeaconProperties(this.globalBeaconProperties, eventHeaderProperties.beaconProperties)
            }
        }

        if(this.config.eventData){
            var eventProperties = HelperMethods.findEventDataInformation(lambdaEvent, this.config.eventData as DataTypeMap)
            if(eventProperties.eventDataFound){
                HelperMethods.mergeBeaconProperties(this.globalBeaconProperties, eventProperties.beaconProperties)
            }
        }

        this.instrumentHttpRequestFunction()

        // this.instrumentAwsSdk()
        // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-a-response-event-handler.html
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html#events-property
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html

        this.timer.start()
        this.state = LAMDA_TRANSACTION_STATE.STARTED
    }

    private instrumentHttpRequestFunction(){

        // TODO handle scenario where if this gets called a second time a warning needs to be displayed.
        // code will end up reporting inaccurate beacons in this edge scenario
        // only encountered during unit testing since everything runs in the same process
        // it's not anticipated that AWS will re-use the HTTP library and it's wrapped function
        // recommended solution: inspect the http.request to see if it == 'httpRequestWrapper'

        // note this does not handle other parameters coming in
        // http.request(options[, callback])
        // http.request(url[, options][, callback])
        // note not handling: https.request, https.get, http.get
        // does https call http under the covers? need to test..

        var lambdaTransaction = this
        var originalHttpRequest = http.request
        http.request = function httpRequestWrapper() {

            var url = lambdaTransaction.getUrlFromOptions(arguments[0])
            if(url.indexOf("appdynamics") >= 0){
                return originalHttpRequest.apply(this, arguments as any)
            }

            var requestProperties = HelperMethods.goThroughHeaders(arguments[0], '_req', lambdaTransaction.config.requestHeaders as DataTypeMap)
            var requestTimer = new Timer()
            requestTimer.start()
            var originalCallback = arguments[1]
            var callingContext = this

            arguments[1] = function callbackWrapper(response:any){                

                requestTimer.stop()     

                var networkRequestEvent:NetworkRequestEvent = {                
                    statusCode: response.statusCode,                
                    url: url,                
                    timestamp: requestTimer.getStartTime(),                
                    duration: requestTimer.getTimeElapsed()                
                }

                // global props
                HelperMethods.setPropertiesOnEvent(networkRequestEvent, lambdaTransaction.globalBeaconProperties)
                
                // request props
                if(requestProperties.headersFound){
                    HelperMethods.setPropertiesOnEvent(networkRequestEvent, requestProperties.beaconProperties)
                }

                // response props
                var responseProperties =  HelperMethods.goThroughHeaders(response, '_res', lambdaTransaction.config.responseHeaders as DataTypeMap);
                if(responseProperties.headersFound){
                    HelperMethods.setPropertiesOnEvent(networkRequestEvent, responseProperties.beaconProperties)
                }
                
                lambdaTransaction.addNetworkRequest(networkRequestEvent)

                if(originalCallback){
                    originalCallback.apply(callingContext, [response])
                }
            }

            var request = originalHttpRequest.apply(this, [arguments[0], arguments[1]])

            // https://nodejs.org/api/http.html#http_http_request_options_callback
            request.on('error', function(error:any){

                console.error(`problem with request: ${error.message}`);

                requestTimer.stop()

                var networkRequestEvent:NetworkRequestEvent = {
                    url: url,
                    networkError: error.message,
                    timestamp: requestTimer.getStartTime(),
                    duration: requestTimer.getTimeElapsed()
                }
                
                // global props
                HelperMethods.setPropertiesOnEvent(networkRequestEvent, lambdaTransaction.globalBeaconProperties)
                
                // request props
                if(requestProperties.headersFound){
                    HelperMethods.setPropertiesOnEvent(networkRequestEvent, requestProperties.beaconProperties)
                }

                lambdaTransaction.addNetworkRequest(networkRequestEvent)

                throw error
            })

            return request
        }

        // what about https?
        /* var originalHttpsRequest = https.request
        https.request = requestWrapper*/
    }

    getUrlFromOptions(options:any):string{
        if(options instanceof String){
            return options + '' // check for string better so you don't add to it
        } else {
            var http = "http";
            var port = options.port ? ":" + options.port : "";
            var path = options.path || "/";
            var host = (options.hostname ? options.hostname : (options.host ? options.host : ""));
            if (options._defaultAgent && options._defaultAgent.defaultPort === 443) {
                http = "https"
            }
            return `${http}://${host}${port}${path}`
        }
    }

    stop(){
        // nothing to stop
        if(this.state != LAMDA_TRANSACTION_STATE.STARTED){
            console.warn('an attempt was made to stop the transaction in a non-started state, state was: ' + this.state)
            return
        }

        this.timer.stop()

        var customEvent:CustomEvent = {
            timestamp: this.timer.getStartTime(),
            duration: this.timer.getTimeElapsed(),
            eventType: 'LambdaTransaction',
            eventSummary: this.beacon.deviceInfo.deviceName
        }
        HelperMethods.setPropertiesOnEvent(customEvent, this.globalBeaconProperties)
        this.beacon.addCustomEvent(customEvent)

        if(this.debug){
            this.api.validateBeacons([this.beacon])
                .then(this.sendBeacon.bind(this))
                .catch(this.handleInvalidBeacon.bind(this))
        } else {
            this.sendBeacon()
        }
    }

    handleInvalidBeacon(){
        console.error('Beacon is not valid, see logs for more information.')
        this.state = LAMDA_TRANSACTION_STATE.VALIDATION_ERROR
        return
    }

    sendBeacon(){
        this.api.sendBeacons([this.beacon])
            .then(this.handleSendBeaconSuccess.bind(this))
            .catch(this.handleSendBeaconError.bind(this))
    }

    handleSendBeaconSuccess(response:any){
        console.log('handleSendBeaconSuccess')
    }

    handleSendBeaconError(error: Error){
        console.error('handleSendBeaconError')
        console.error(error)
    }

    addError(error: Error){
        var errorEvent:ErrorEvent = {   
            name: error.name,
            message: error.message,
            timestamp: Date.now()
        }
        HelperMethods.setPropertiesOnEvent(errorEvent, this.globalBeaconProperties)
        this.beacon.addErrorEvent(errorEvent)
    }

    //addRejectedPromise(reason: any, promise: any){
        // send beacon
    //}

    addNetworkRequest(networkRequestEvent: NetworkRequestEvent){
        this.beacon.addNetworkRequestEvent(networkRequestEvent)
    }
}


export { LambdaTransaction };
