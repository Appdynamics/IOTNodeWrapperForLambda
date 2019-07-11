import { Agent } from '../src/Refactor/Agent'
import { LambdaTransaction } from '../src/Refactor/LambdaTransaction'

describe('example', function() {
    it('run', function() {
        //let result = Calculator.Sum(5, 2);
        //expect(result).equal(7);
        console.log('success')
    }); 
});

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

    function handler(){
        console.log('handled')
    }

    function callback(){
        console.log('callbacked')
    }

    it('instrumentHandler', function() {
        var newHandler = Agent.instrumentHandler(handler)
        newHandler(null, null, callback)
    }); 
});

// will need to mock out a fake event and a fake context and fake callback