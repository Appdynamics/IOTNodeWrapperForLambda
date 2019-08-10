import { LambdaTransaction, LambdaContext } from './LambdaTransaction'
import { AppConfig, BooleanMap, DataType, DataTypeMap, BeaconProperties } from "../index";
import { Logger } from '../Helpers/Logger';

/*
const AsyncFunction = require('./async-function');
const addGlobals = () => Object.assign(global, { AsyncFunction });
Object.assign(addGlobals, {
    AsyncFunction, addGlobals,
});
*/

class Agent {

    // note that this is a sync execution but the function return could be sync or async

    static instrumentHandlerAsync(){

    }

    static instrumentHandler(handler: Function, config: AppConfig):Function{
        
        var logLevel = config.loglevel ? config.loglevel : 'DEBUG'
        Logger.init(logLevel)

        if(!config.appKey){
            Logger.warn('handler will not be instrumented, please provide an appKey')
            return handler
        }

        var transaction = new LambdaTransaction(config);
        global.txn = transaction

        if(isAsync(handler)){
            Logger.debug('Instrumenting async function.')
            return async function handlerWrapperAsync(event: any, context: any, originalCallback: any){
                return handlerWrapper(event, context, originalCallback)               
            }
        } else {
            Logger.debug('Instrumenting sync function.')
            return function handlerWrapperSync(event: any, context: any, originalCallback?: any){
                return handlerWrapper(event, context, originalCallback)
            }
        }

        function isAsync (func:any) {
            var string2check = {}.toString.call(func);
            return (string2check === '[object AsyncFunction]');
            // todo this doesn't function properly
            //return func.constructor.name === 'AsyncFunction'
            return true
        }

        function isPromise(object:any) {
            return Promise.resolve(object) == object;
        }

        function isError(object:any){
            return object instanceof Error
        }

        function handleHttpErrorIfPresent(response:any){
            if(!isNaN(response) && isHttpErrorCode(response)) {
                Logger.debug('Agent.handleHttpErrorIfPresent error code found')
                var transactionError = new Error()
                transactionError.name = response
                transaction.addError(transactionError)
            } else if(isHttpErrorResponse(response)){
                Logger.debug('Agent.handleHttpErrorIfPresent error response found')
                // it should always have a body in this instance per spec
                // https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
                var errorMessage:string = response.body
                    ? response.body 
                    : ''
                var transactionError = new Error()
                transactionError.name = response.statusCode
                transactionError.message = errorMessage
                transaction.addError(transactionError)
            }            
        }

        function isHttpErrorResponse(response:any){
            return response && response.statusCode && isHttpErrorCode(response.statusCode)
        }

        function isHttpErrorCode(code:any){
            return (code < 200 || code > 299)
        }

        function wrapCallback(originalCallback:any){
            return function(error: Error, response?: any){
                Logger.debug('Agent.wrapCallback wrapper callback')
                handleHttpErrorIfPresent(response)
                return originalCallback.apply(null, error, response)
            }
        }

        // does this break async best practices?
        function handlerWrapper(event: any, context: any, originalCallback: any){
            var wrappedCallback = wrapCallback(originalCallback)
            transaction.start(event, context)
            var response:any = null
            try {
                response = handler(event, context, wrappedCallback)         
            }
            catch (error) {
                Logger.error('Handler execution threw error')
                Logger.error(error)
                transaction.addError(error)
                transaction.stop()
                throw error
            } 

             if (isPromise(response)) {
                Logger.debug('Agent.handlerWrapper.response is promise.')
                return new Promise((resolve, reject) => {
                    response.then(function(response:any){
                        handleHttpErrorIfPresent(response)
                        transaction.stop()
                        resolve(response)
                    })
                    .catch(function(error:Error){
                        transaction.addError(error)
                        transaction.stop()
                        reject(error)
                    })
                })
            } else if(isError(response)) {
                Logger.debug('Agent.handlerWrapper.response is error.')
                transaction.addError(response)
                transaction.stop()
                return response
            } else if (response) {
                Logger.debug('Agent.handlerWrapper.response is object.')
                handleHttpErrorIfPresent(response)
                transaction.stop()
                return response
            } else {
                Logger.debug('Agent.handlerWrapper.response not returned.')
                transaction.stop()
                return response
            }
        }
    }
}


export { Agent }