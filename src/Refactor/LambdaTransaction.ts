import { Beacon } from './Beacon'

enum LAMDA_TRANSACTION_STATE {
    INIT = 0,
    STARTED = 1,
    STOPPED = 2,
    ERROR = 3
}

// must be guarnteed to never throw or leak an exception! all things handled gracefully here
class LambdaTransaction {

    private state: LAMDA_TRANSACTION_STATE = LAMDA_TRANSACTION_STATE.INIT
    private beacon: Beacon
    private lambdaContext: any

    constructor(lambdaContext: any){
        this.lambdaContext = lambdaContext
    }

    getState(){
        return this.state
    }

    start(){
        // already started
        if(this.state != LAMDA_TRANSACTION_STATE.INIT){
            console.error('an attempt was made to start the transaction in a non-initiated state, state was: ' + this.state)
            throw 'an attempt was made to start the transaction in a non-initiated state'
        }
        this.state = LAMDA_TRANSACTION_STATE.STARTED
    }

    stop(){
        // nothing to stop
        if(this.state != LAMDA_TRANSACTION_STATE.STARTED){
            console.warn('an attempt was made to stop the transaction in a non-started state, state was: ' + this.state)
            return
        }

        // end timer
        // send beacon
        this.state = LAMDA_TRANSACTION_STATE.STOPPED
    }

    addError(error: Error){
        // send beacon
    }

    addRejectedPromise(reason: any, promise: any){
        // send beacon
    }

    setCustomProperties(newCustomProperties: any){
        // if new properties are provided, they will overwrite the existing ones.
    }

    sendBeacon(){
        // submits any beacons accumulated
    }

}


export { LambdaTransaction }; 