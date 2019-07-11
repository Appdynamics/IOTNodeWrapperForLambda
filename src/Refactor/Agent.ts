import { LambdaTransaction } from './LambdaTransaction'

// static method to wrap the AWS handler function
// depending if the handler is sync or async it might affect how wrapping occurs

// public to client, exposed by agent
class Agent {

    public test(){
        global.appdynamicsLambdaTransaction = null
    }

    // note that this is a sync execution but the function return could be sync or async
    static instrumentHandler(handler: Function, config?: any){
        var transaction = new LambdaTransaction(null);
        global.appdynamicsLambdaTransaction = transaction

        function isSync(f: Function){
            return true
        }

        if(isSync(handler)){
            return function handlerWrapperSync(event: any, context: any, callback?: any){    
                if(callback) {
                    callback = function(error: Error, response?: any){
                        // todo log error
                        // todo check response error message
                        return callback.apply(null, error, response) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#Parameters
                    }
                }
                transaction.start()
                try {
                    handler(event, context, callback)
                }
                catch (error) {
                    transaction.addError(error)
                    transaction.stop()
                    throw error
                }
                transaction.stop()
            }
        } else {
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