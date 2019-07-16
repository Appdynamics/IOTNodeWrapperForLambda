import { Agent } from '../src/Refactor/Agent'
import { LambdaTransaction, LambdaContext } from '../src/Refactor/LambdaTransaction'

// note why does this need to be added, and how does this correlate to index.ts when everything is compiled and ran in the lambda context?
// https://stackoverflow.com/questions/40743131/how-to-prevent-property-does-not-exist-on-type-global-with-jsdom-and-t
declare global {
    namespace NodeJS {
        interface Global {
            appdynamicsLambdaTransaction: LambdaTransaction
        }
    }
} 

describe('agent', function() {

    function wait(ms: any){
        var start = new Date().getTime();
        var end = start;
        while(end < start + ms) {
          end = new Date().getTime();
       }
    }

    function awsHandler(event: any, context: any, callback: any){
        wait(123)
        console.log('handled')
        callback()
    }

    function callback2(){
        console.log('callbacked')
    }

    it('instrumentHandler', function() {
        var newHandler = Agent.instrumentHandler(awsHandler, {
            appKey: 'AD-AAB-AAR-SKR', 
            debugMode: true
        })
        var lambdaContext = {
            functionName: 'awsHandler',
            functionVersion: 1
        }
        newHandler(null, lambdaContext, callback2)
    }); 
});
