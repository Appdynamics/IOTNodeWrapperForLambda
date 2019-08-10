import { LambdaTransaction, LambdaContext } from './LambdaTransaction'
import { AppConfig, BooleanMap, DataType, DataTypeMap, BeaconProperties } from "../index";

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
        
        if(!config.appKey){
            console.warn('handler will not be instrumented, please provide an appKey')
            return handler
        }

        var transaction = new LambdaTransaction(config);
        global.txn = transaction

        function isAsync (func:any) {
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
                var transactionError = new Error()
                transactionError.name = response
                transaction.addError(transactionError)
            } else if(isHttpErrorResponse(response)){
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
                transaction.addError(error)
                transaction.stop()
                throw error
            } 

             if (isPromise(response)) {
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
                transaction.addError(response)
                transaction.stop()
                return response
            } else if (response) {
                handleHttpErrorIfPresent(response)
                transaction.stop()
                return response
            } else {
                transaction.stop()
                return response
            }
        }

        if(isAsync(handler)){
            console.log('async')
            return async function handlerWrapperAsync(event: any, context: any, originalCallback: any){
                return handlerWrapper(event, context, originalCallback)               
            }
        } else {
            console.log('sync')
            return function handlerWrapperSync(event: any, context: any, originalCallback?: any){
                return handlerWrapper(event, context, originalCallback)
            }
        }
    }
}


export { Agent }