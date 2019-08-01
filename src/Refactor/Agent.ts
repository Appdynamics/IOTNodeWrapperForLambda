import { LambdaTransaction, LambdaContext } from './LambdaTransaction'

// static method to wrap the AWS handler function
// depending if the handler is sync or async it might affect how wrapping occurs

// public to client, exposed by agent
class Agent {

    // note that this is a sync execution but the function return could be sync or async
    static instrumentHandler(handler: Function, config?: any){
        
        var transaction = new LambdaTransaction(config.appKey, config.debugMode);
        global.appdynamicsLambdaTransaction = transaction

        function isSync(f: Function){
            return true
        }

        if(isSync(handler)){
            return function handlerWrapperSync(event: any, context: any, originalCallback?: any){    
                var wrappedCallback = originalCallback
                if(originalCallback) {
                    wrappedCallback = function(error: Error, response?: any){
                        console.log('awsHandler_withHandledError HIT')
                        if(error){
                            console.log('adding error')
                            transaction.addError(error)
                        }
                        if(response){
                            console.log('response found')
                        }
                        // 7.29.todo
                        // todo check & log error
                        // todo check response error message
                        // todo write unit tests for
                        return originalCallback.apply(null, error, response) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#Parameters
                    }
                }
                transaction.start(context)
                try {
                    handler(event, context, wrappedCallback)
                }
                catch (error) {
                    transaction.addError(error)
                    transaction.stop()
                    throw error
                }
                transaction.stop()
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