"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LambdaTransaction_1 = require("./LambdaTransaction");
const Logger_1 = require("../Helpers/Logger");
/*
const AsyncFunction = require('./async-function');
const addGlobals = () => Object.assign(global, { AsyncFunction });
Object.assign(addGlobals, {
    AsyncFunction, addGlobals,
});
*/
class Agent {
    // note that this is a sync execution but the function return could be sync or async
    static instrumentHandlerAsync() {
    }
    static instrumentHandler(handler, config) {
        var logLevel = config.loglevel ? config.loglevel : 'DEBUG';
        Logger_1.Logger.init(logLevel);
        var transaction = new LambdaTransaction_1.LambdaTransaction(config);
        global.txn = transaction;
        if (!config.instrumentationEnabled) {
            Logger_1.Logger.info('Handler will not be instrumented as specified by the "instrumentationEnabled" or environment variable APPDYNAMICS_ENABLED configuration.');
            return handler;
        }
        if (!config.appKey) {
            Logger_1.Logger.warn('handler will not be instrumented, please provide an appKey');
            return handler;
        }
        if (isAsync(handler)) {
            Logger_1.Logger.debug('Instrumenting async function.');
            return function handlerWrapperAsync(event, context, originalCallback) {
                return __awaiter(this, void 0, void 0, function* () {
                    return handlerWrapper(event, context, originalCallback);
                });
            };
        }
        else {
            Logger_1.Logger.debug('Instrumenting sync function.');
            return function handlerWrapperSync(event, context, originalCallback) {
                return handlerWrapper(event, context, originalCallback);
            };
        }
        function isAsync(func) {
            // this doesn't appear to work in mocha, TODO test in AWS environment
            return func.constructor.name === "AsyncFunction";
        }
        function isPromise(object) {
            return Promise.resolve(object) == object;
        }
        function isError(object) {
            return object instanceof Error;
        }
        function handleHttpErrorIfPresent(response) {
            if (!isNaN(response) && isHttpErrorCode(response)) {
                Logger_1.Logger.debug('Agent.handleHttpErrorIfPresent error code found');
                var transactionError = new Error();
                transactionError.name = response;
                transaction.addError(transactionError);
            }
            else if (isHttpErrorResponse(response)) {
                Logger_1.Logger.debug('Agent.handleHttpErrorIfPresent error response found');
                // it should always have a body in this instance per spec
                // https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
                var errorMessage = response.body
                    ? response.body
                    : '';
                var transactionError = new Error();
                transactionError.name = response.statusCode;
                transactionError.message = errorMessage;
                transaction.addError(transactionError);
            }
        }
        function isHttpErrorResponse(response) {
            return response && response.statusCode && isHttpErrorCode(response.statusCode);
        }
        function isHttpErrorCode(code) {
            return (code < 200 || code > 299);
        }
        function wrapCallback(originalCallback) {
            return function (error, response) {
                Logger_1.Logger.debug('Agent.wrapCallback wrapper callback');
                handleHttpErrorIfPresent(response);
                return originalCallback.apply(null, error, response);
            };
        }
        // does this break async best practices?
        function handlerWrapper(event, context, originalCallback) {
            var wrappedCallback = wrapCallback(originalCallback);
            transaction.start(event, context);
            var response = null;
            try {
                response = handler(event, context, wrappedCallback);
            }
            catch (error) {
                Logger_1.Logger.error('Handler execution threw error');
                Logger_1.Logger.error(error);
                transaction.addError(error);
                transaction.stop();
                throw error;
            }
            if (isPromise(response)) {
                Logger_1.Logger.debug('Agent.handlerWrapper.response is promise.');
                return new Promise((resolve, reject) => {
                    response.then(function (response) {
                        handleHttpErrorIfPresent(response);
                        transaction.stop();
                        resolve(response);
                    })
                        .catch(function (error) {
                        transaction.addError(error);
                        transaction.stop();
                        reject(error);
                    });
                });
            }
            else if (isError(response)) {
                Logger_1.Logger.debug('Agent.handlerWrapper.response is error.');
                transaction.addError(response);
                transaction.stop();
                return response;
            }
            else if (response) {
                Logger_1.Logger.debug('Agent.handlerWrapper.response is object.');
                handleHttpErrorIfPresent(response);
                transaction.stop();
                return response;
            }
            else {
                Logger_1.Logger.debug('Agent.handlerWrapper.response not returned.');
                transaction.stop();
                return response;
            }
        }
    }
}
exports.Agent = Agent;
