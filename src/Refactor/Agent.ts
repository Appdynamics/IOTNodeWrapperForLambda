import { LambdaTransaction } from './LambdaTransaction'

// static method to wrap the AWS handler function
// depending if the handler is sync or async it might affect how wrapping occurs

// public to client, exposed by agent
class Agent {

    static instrumentHandler(handler: Function, config?: any){
        var transaction = new LambdaTransaction(null);
        global.appdynamicsLambdaTransaction = transaction

        // todo handle async case
        return function handlerWrapperSync(event: any, context: any, callback?: any){
            if(callback) {
                callback = function(){
                    transaction.stop()

                    // I had concerns around passing null, but according to the following docs we should be fine as it will default to the global object.
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#Parameters
                    // thisArg: null and undefined will be replaced with the global object, and primitive values will be boxed. This argument is not optional
                    return callback(null, arguments)
                }
            }
            try {
                transaction.start()
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
}


export { Agent }