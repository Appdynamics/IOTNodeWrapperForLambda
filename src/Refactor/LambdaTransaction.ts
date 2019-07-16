import { 
    CustomEvent,
    NetworkRequestEvent
} from '../index';
import { Api } from './Api';
import { Beacon } from './Beacon';
import { Timer } from './Timer';
import http = require('http');
// import https = require('https')

enum LAMDA_TRANSACTION_STATE {
    INIT = 0,
    STARTED = 1,
    STOPPED = 2,
    TRANSACTION_ERROR = 3,
    VALIDATION_ERROR = 4,
    FATAL_ERROR = 5, // internal appd error
    APP_DISABLED = 6
}

interface LambdaConfig {
    debug: boolean,
    appKey: string,
    deviceType: string
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
    private customProperties: Map<string,any>

    constructor(appKey: string, isDebug:boolean = false){
        this.appKey = appKey
        this.debug = true
        this.timer = new Timer
        this.api = new Api(this.appKey)
        this.customProperties = new Map<string,any>()
        this.beacon = new Beacon
    }

    getState(){
        return this.state
    }

    start(lambdaContext:LambdaContext){
        // already started
        if(this.state != LAMDA_TRANSACTION_STATE.INIT){
            console.error('an attempt was made to start the transaction in a non-initiated state, state was: ' + this.state)
            throw 'an attempt was made to start the transaction in a non-initiated state'
        }

        if(this.debug && !this.api.isAppEnabled()){
            this.state = LAMDA_TRANSACTION_STATE.APP_DISABLED
            console.warn('The application for the AppKey provided is disabled. The AppD agent will not report any metrics. If the application should be activated, please review your controller and validate you provided the correct AppKey. AppKey Provided was: ' + this.appKey)
            return
        }

        this.lambdaContext = lambdaContext
        this.beacon.deviceInfo.deviceType = 'LambdaTransaction'
        this.beacon.deviceInfo.deviceName = this.lambdaContext.functionName // should deviceName and Id be switched?
        this.beacon.deviceInfo.deviceId = this.lambdaContext.functionName //+ '_' + this.lambdaContext.functionVersion

        this.instrumentHttpRequestFunction()

        // todo at some point need to instrument interceptors / http code

        this.timer.start()
        this.state = LAMDA_TRANSACTION_STATE.STARTED
    }

    private instrumentHttpRequestFunction(){

        var lambdaTransaction = this
        var originalHttpRequest = http.request
        http.request = function httpRequestWrapper(options: any, callback?: any):http.ClientRequest {
            
            var url = lambdaTransaction.getUrlFromOptions(options)
            if(url.indexOf("appdynamics") >= 0){
                return originalHttpRequest.apply(this, arguments as any)
            }

            var requestTimer = new Timer()
            requestTimer.start()

            var request = originalHttpRequest.apply(this, arguments as any)
            request.once('response', function(response){ 
                // note might need to go back to callback strategy
                // unit test successful execution & verify log output
                // unit test that the original response is still called
                console.log(`STATUS: ${response.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
                requestTimer.stop()
                // determine if 
                var networkRequestEvent:NetworkRequestEvent = {
                    statusCode: response.statusCode,
                    url: url,
                    timestamp: requestTimer.getStartTime(),
                    duration: requestTimer.getTimeElapsed()
                }
                lambdaTransaction.addNetworkRequest(networkRequestEvent)
            })

            request.on('error', function(error){
                // unit test an error occuring, possibly just to an unauthorized place? or would that just hit the response?
                // think i need to hit a non existing website probably
                console.error(`problem with request: ${error.message}`);
                requestTimer.stop()
                var networkRequestEvent:NetworkRequestEvent = {
                    url: url,
                    networkError: error.message,
                    timestamp: requestTimer.getStartTime(),
                    duration: requestTimer.getTimeElapsed()
                }
                lambdaTransaction.addNetworkRequest(networkRequestEvent)
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

        // todo put this back in, I was just lazy to handle the callback code flows
        /*if(this.debug){
            this.api.validateBeacons([this.beacon])
                .then()
                .catch()
            console.error('Beacon is not valid, see logs for more information.')
            this.state = LAMDA_TRANSACTION_STATE.VALIDATION_ERROR
            return
        }*/

        this.timer.stop()

        var customEvent:CustomEvent = {
            timestamp: this.timer.getStartTime(),
            duration: this.timer.getTimeElapsed(),
            eventType: 'LambdaTransaction',
            eventSummary: this.beacon.deviceInfo.deviceName
        }
        for(var key in this.customProperties.keys){
            // customEvent.stringProperties.set(key, this.customProperties.get(key))
        }
        this.beacon.addCustomEvent(customEvent)

        // todo update beacon properties such as custom event with custom timing information

        this.api.sendBeacons([this.beacon])
        this.state = LAMDA_TRANSACTION_STATE.STOPPED
    }

    addError(error: Error){
        // send beacon
    }

    addRejectedPromise(reason: any, promise: any){
        // send beacon
    }

    addCustomProperty(key: string, value: object){
        this.customProperties.set(key,value)
    }

    addNetworkRequest(networkRequestEvent: NetworkRequestEvent){
        this.beacon.addNetworkRequestEvent(networkRequestEvent)
    }

    setCustomProperties(newCustomProperties: any){
        // if new properties are provided, they will overwrite the existing ones.
    }
}


export { LambdaTransaction };
