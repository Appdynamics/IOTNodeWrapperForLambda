"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Api_1 = require("./Api");
const Beacon_1 = require("./Beacon");
const Timer_1 = require("./Timer");
const http = require("http");
const HelperMethods_1 = require("./Helpers/HelperMethods");
const Logger_1 = require("./Helpers/Logger");
var LAMBDA_TRANSACTION_STATE;
(function (LAMBDA_TRANSACTION_STATE) {
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["INIT"] = 0] = "INIT";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["STARTED"] = 1] = "STARTED";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["STOPPED"] = 2] = "STOPPED";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["TRANSACTION_ERROR"] = 3] = "TRANSACTION_ERROR";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["VALIDATION_ERROR"] = 4] = "VALIDATION_ERROR";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["SEND_BEACON_ERROR"] = 5] = "SEND_BEACON_ERROR";
    LAMBDA_TRANSACTION_STATE[LAMBDA_TRANSACTION_STATE["APP_DISABLED"] = 6] = "APP_DISABLED";
})(LAMBDA_TRANSACTION_STATE || (LAMBDA_TRANSACTION_STATE = {}));
// must be guarnteed to never throw or leak an exception! all things handled gracefully here
class LambdaTransaction {
    constructor(config) {
        this.state = LAMBDA_TRANSACTION_STATE.INIT;
        this.config = config;
        this.appKey = config.appKey;
        this.debug = (config.loglevel && config.loglevel == 'debug') ? true : true;
        this.timer = new Timer_1.Timer;
        this.api = new Api_1.Api(this.appKey);
        this.globalBeaconProperties = {
            stringProperties: {},
            datetimeProperties: {},
            booleanProperties: {},
            doubleProperties: {}
        };
        this.beacon = new Beacon_1.Beacon;
    }
    getState() {
        return this.state;
    }
    getStateFormatted() {
        switch (this.getState()) {
            case LAMBDA_TRANSACTION_STATE.INIT:
                return 'INIT';
            case LAMBDA_TRANSACTION_STATE.STARTED:
                return 'STARTED';
            case LAMBDA_TRANSACTION_STATE.STOPPED:
                return 'STOPPED';
            case LAMBDA_TRANSACTION_STATE.TRANSACTION_ERROR:
                return 'TRANSACTION_ERROR';
            case LAMBDA_TRANSACTION_STATE.VALIDATION_ERROR:
                return 'VALIDATION_ERROR';
            case LAMBDA_TRANSACTION_STATE.SEND_BEACON_ERROR:
                return 'SEND_BEACON_ERROR';
            case LAMBDA_TRANSACTION_STATE.APP_DISABLED:
                return 'APP_DISABLED';
        }
        return this.state;
    }
    start(lambdaEvent, lambdaContext) {
        // already started
        if (this.state != LAMBDA_TRANSACTION_STATE.INIT) {
            Logger_1.Logger.error('an attempt was made to start the transaction in a non-initiated state, state was: ' + this.state);
            throw new Error('an attempt was made to start the transaction in a non-initiated state');
        }
        // dsm todo there is an environment variable to check as well
        if (this.debug && !this.api.isAppEnabled()) {
            this.state = LAMBDA_TRANSACTION_STATE.APP_DISABLED;
            Logger_1.Logger.warn('The application for the AppKey provided is disabled. The AppD agent will not report any metrics. If the application should be activated, please review your controller and validate you provided the correct AppKey. AppKey Provided was: ' + this.appKey);
            return;
        }
        this.lambdaContext = lambdaContext;
        this.beacon.deviceInfo.deviceType = 'AwsLambdaTransaction';
        this.beacon.deviceInfo.deviceId = this.lambdaContext.awsRequestId;
        this.beacon.deviceInfo.deviceName = this.lambdaContext.functionName;
        this.beacon.versionInfo.softwareVersion = this.lambdaContext.functionVersion;
        // probably better to auto use something like the npm package version, will need to manually update for now
        // intended for us to know which agent version is being used
        this.beacon.versionInfo.firmwareVersion = '1.0';
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsFunctionName', this.lambdaContext.functionName);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsFunctionVersion', this.lambdaContext.functionVersion);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsInvokedFunctionArn', this.lambdaContext.invokedFunctionArn);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsMemoryLimitInMB', this.lambdaContext.memoryLimitInMB);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsRequestId', this.lambdaContext.awsRequestId);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsLogGroupName', this.lambdaContext.logGroupName);
        HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsLogStreamName', this.lambdaContext.logStreamName);
        if (this.config.uniqueIDHeader && lambdaEvent.headers) {
            HelperMethods_1.HelperMethods.setStringProperty(this.globalBeaconProperties.stringProperties, 'awsCustomUniqueId', lambdaEvent.headers[this.config.uniqueIDHeader]);
        }
        if (this.config.lambdaHeaders) {
            var eventHeaderProperties = HelperMethods_1.HelperMethods.goThroughHeaders(lambdaEvent, 'evth_', this.config.lambdaHeaders);
            if (eventHeaderProperties.headersFound) {
                HelperMethods_1.HelperMethods.mergeBeaconProperties(this.globalBeaconProperties, eventHeaderProperties.beaconProperties);
            }
        }
        if (this.config.eventData) {
            var eventProperties = HelperMethods_1.HelperMethods.findEventDataInformation(lambdaEvent, this.config.eventData);
            if (eventProperties.eventDataFound) {
                HelperMethods_1.HelperMethods.mergeBeaconProperties(this.globalBeaconProperties, eventProperties.beaconProperties);
            }
        }
        this.instrumentHttpRequestFunction();
        // this.instrumentAwsSdk()
        // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-a-response-event-handler.html
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html#events-property
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html
        this.timer.start();
        this.state = LAMBDA_TRANSACTION_STATE.STARTED;
        Logger_1.Logger.info('Transaction instrumented successfully and started.');
    }
    customData(properties) {
        if (!this.config.instrumentationEnabled || !properties) {
            return;
        }
        if (properties.stringProperties) {
            var scrubbedStringProps = {};
            for (var key in properties.stringProperties) {
                HelperMethods_1.HelperMethods.setStringProperty(scrubbedStringProps, 'cus_' + key, properties.stringProperties[key]);
            }
            properties.stringProperties = scrubbedStringProps;
        }
        HelperMethods_1.HelperMethods.mergeBeaconProperties(this.globalBeaconProperties, properties);
    }
    instrumentHttpRequestFunction() {
        Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction start');
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
        var lambdaTransaction = this;
        var originalHttpRequest = http.request;
        http.request = function httpRequestWrapper() {
            Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request start');
            var url = lambdaTransaction.getUrlFromOptions(arguments[0]);
            Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request url to intercept: ' + url);
            if (url.indexOf("appdynamics") >= 0) {
                Logger_1.Logger.debug('Skipping interceptor out to appdynamics.');
                return originalHttpRequest.apply(this, arguments);
            }
            var requestProperties = HelperMethods_1.HelperMethods.goThroughHeaders(arguments[0], 'req_', lambdaTransaction.config.requestHeaders);
            var requestTimer = new Timer_1.Timer();
            requestTimer.start();
            var originalCallback = arguments[1];
            var callingContext = this;
            arguments[1] = function callbackWrapper(response) {
                Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request.callback start');
                requestTimer.stop();
                var networkRequestEvent = {
                    statusCode: response.statusCode,
                    url: url,
                    timestamp: requestTimer.getStartTime(),
                    duration: requestTimer.getTimeElapsed()
                };
                // global props
                HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, lambdaTransaction.globalBeaconProperties);
                // request props
                if (requestProperties.headersFound) {
                    HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, requestProperties.beaconProperties);
                }
                // response props
                var responseProperties = HelperMethods_1.HelperMethods.goThroughHeaders(response, 'res_', lambdaTransaction.config.responseHeaders);
                if (responseProperties.headersFound) {
                    HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, responseProperties.beaconProperties);
                }
                lambdaTransaction.addNetworkRequest(networkRequestEvent);
                if (originalCallback) {
                    Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request.callback.original start');
                    originalCallback.apply(callingContext, [response]);
                    Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request.callback.original end');
                }
                Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request.callback end');
            };
            var request = originalHttpRequest.apply(this, [arguments[0], arguments[1]]);
            // https://nodejs.org/api/http.html#http_http_request_options_callback
            request.on('error', function (error) {
                Logger_1.Logger.error('LambdaTransaction.instrumentHttpRequestFunction.request error occured.');
                Logger_1.Logger.error(error);
                requestTimer.stop();
                var networkRequestEvent = {
                    url: url,
                    networkError: error.message,
                    timestamp: requestTimer.getStartTime(),
                    duration: requestTimer.getTimeElapsed()
                };
                // global props
                HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, lambdaTransaction.globalBeaconProperties);
                // request props
                if (requestProperties.headersFound) {
                    HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, requestProperties.beaconProperties);
                }
                lambdaTransaction.addNetworkRequest(networkRequestEvent);
                throw error;
            });
            Logger_1.Logger.debug('LambdaTransaction.instrumentHttpRequestFunction.request end');
            return request;
        };
        // what about https?
        /* var originalHttpsRequest = https.request
        https.request = requestWrapper*/
    }
    getUrlFromOptions(options) {
        if (options instanceof String) {
            return options + ''; // check for string better so you don't add to it
        }
        else {
            var http = "http";
            var port = options.port ? ":" + options.port : "";
            var path = options.path || "/";
            var host = (options.hostname ? options.hostname : (options.host ? options.host : ""));
            if (options._defaultAgent && options._defaultAgent.defaultPort === 443) {
                http = "https";
            }
            return `${http}://${host}${port}${path}`;
        }
    }
    stop() {
        // nothing to stop
        if (this.state != LAMBDA_TRANSACTION_STATE.STARTED) {
            Logger_1.Logger.warn('an attempt was made to stop the transaction in a non-started state, state was: ' + this.state);
            return;
        }
        this.timer.stop();
        Logger_1.Logger.info('Transaction instrumentation execution stopped and beacon is about to send. Time elapsed in ms: ' + this.timer.getTimeElapsed() + ', State prior to stop: ' + this.getStateFormatted());
        this.state = LAMBDA_TRANSACTION_STATE.STOPPED;
        var customEvent = {
            timestamp: this.timer.getStartTime(),
            duration: this.timer.getTimeElapsed(),
            eventType: 'LambdaTransaction',
            eventSummary: this.beacon.deviceInfo.deviceName
        };
        HelperMethods_1.HelperMethods.setPropertiesOnEvent(customEvent, this.globalBeaconProperties);
        this.beacon.addCustomEvent(customEvent);
        if (this.debug) {
            this.api.validateBeacons([this.beacon])
                .then(this.sendBeacon.bind(this))
                .catch(this.handleInvalidBeacon.bind(this));
        }
        else {
            this.sendBeacon();
        }
    }
    handleInvalidBeacon() {
        Logger_1.Logger.error('Beacon is not valid, see logs for more information.');
        this.state = LAMBDA_TRANSACTION_STATE.VALIDATION_ERROR;
        return;
    }
    sendBeacon() {
        Logger_1.Logger.debug('About to send beacon.');
        this.api.sendBeacons([this.beacon])
            .then(this.handleSendBeaconSuccess.bind(this))
            .catch(this.handleSendBeaconError.bind(this));
    }
    handleSendBeaconSuccess(response) {
        Logger_1.Logger.info('Beacon sent successfully.');
    }
    handleSendBeaconError(error) {
        Logger_1.Logger.error('Beacon failed to send.');
        Logger_1.Logger.error(error);
    }
    addError(error) {
        var errorEvent = {
            name: error.name,
            message: error.message,
            timestamp: Date.now()
        };
        HelperMethods_1.HelperMethods.setPropertiesOnEvent(errorEvent, this.globalBeaconProperties);
        this.beacon.addErrorEvent(errorEvent);
    }
    addNetworkRequest(networkRequestEvent) {
        this.beacon.addNetworkRequestEvent(networkRequestEvent);
    }
}
exports.LambdaTransaction = LambdaTransaction;
