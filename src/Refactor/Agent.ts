import { LambdaTransaction, LambdaContext } from './LambdaTransaction'

// static method to wrap the AWS handler function
// depending if the handler is sync or async it might affect how wrapping occurs

// public to client, exposed by agent
class Agent {

    // note that this is a sync execution but the function return could be sync or async
    static instrumentHandler(handler: Function, config?: any){
        
        var transaction = new LambdaTransaction(config.appKey, config.debugMode);
        global.appdynamicsLambdaTransaction = transaction

        function isAsync(f: Function){
            return f.constructor.name == 'AsyncFunction'
        }

        function isHttpErrorResponse(response:any){
            // https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
            return response 
                && response.statusCode 
                && (response.statusCode < 200 || response.statusCode > 299)
        }

        if(isAsync(handler)){
            return function handlerWrapperSync(event: any, context: any, originalCallback?: any){    

                var wrappedCallback = originalCallback
                if(originalCallback) {
                    wrappedCallback = function(error: Error, response?: any){
                        if(error){
                            transaction.addError(error)
                        }
                        else if(isHttpErrorResponse(response)){
                            // it should always have a body in this instance
                            // https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
                            var errorMessage:string = response.body
                                ? response.body 
                                : ''
                            var transactionError = new Error()
                            transactionError.name = response.statusCode
                            transactionError.message = errorMessage
                            transaction.addError(transactionError)
                        }
                        console.log('wrappedCallback.apply')
                        return originalCallback.apply(null, error, response)
                    }
                }

                transaction.start(context)
                var unhandledError:Error
                try {
                    if(wrappedCallback){
                        handler(event, context, wrappedCallback)
                    } else {
                        handler(event, context)
                    }                        
                }
                catch (error) {
                    unhandledError = error
                    transaction.addError(error)
                } finally {
                    transaction.stop()
                }

                if(unhandledError){
                    throw unhandledError
                }
            }
        } else {
            throw new Error('not implemented yet')
            return function handlerWrapperAsync(event: any, context: any){
                console.log('async')
                handler(event, context)
            }
            // todo handle async case
            /*promise.then(function(result){
                //some code
            }).catch(function(error) {
                // log and rethrow 
                console.log(error);
                throw error;
            });*/
        }
    }
}


export { Agent }