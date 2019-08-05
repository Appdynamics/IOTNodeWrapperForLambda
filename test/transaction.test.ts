import { Agent } from '../src/Refactor/Agent'
import { LambdaTransaction, LambdaContext } from '../src/Refactor/LambdaTransaction'
import http = require('http');
const assert = require('assert');

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

    function awsHandler_basic(event: any, context: any, callback: any){
        wait(123)
        console.log('handled')
        callback()
    }

    function awsHandler_withUnhandledError(event: any, context: any, callback: any){
        throw new Error('awsHandler_withError thrown error')
    }

    function awsHandler_withHandledError(event: any, context: any, callback: any){
        callback(new Error('awsHandler_withHandledError handled error'))
    }

    function awsHandler_httpExitCall_ErrorBadAddress(event: any, context: any, callback: any){

        const options = {
            host: 'thisShouldFail.abc'
        };
        
        // Make a request
        const req = http.request(options);
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_httpExitCall_Error error')
            assert(true)
        });
        
        req.on('end', (info) => {
            console.log('awsHandler_httpExitCall_Error end')
            assert(false)
        });
    }

    function awsHandler_httpExitCall_Error500(event: any, context: any, callback: any){

        // https://httpstat.us/
        const options = {
            hostname: 'httpstat.us',
            port: 80,
            path: '/500',
        };
        
        // Make a request
        const req = http.request(options, function(response){
            assert(response.statusCode == 500)
        });
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_httpExitCall_Error500 error')
            assert(false)
        });
        
        req.on('end', (info) => {
            console.log('awsHandler_httpExitCall_Error500 end')
            assert(false)
        });
    }

    function awsHandler_httpExitCall(event: any, context: any, callback: any){

        // httpstat.us

        const options = {
            hostname: 'httpstat.us',
            port: 80,
            path: '/200',
        };
        
        // Make a request
        const req = http.request(options);
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_httpExitCall error')
            assert(false)
        });
        
        req.on('end', (info) => {
            console.log('awsHandler_httpExitCall end')
            callback()
        });
    }

    function awsHandler_TwohttpExitCalls(event: any, context: any, callback: any){

        // httpstat.us

        const options = {
            hostname: 'httpstat.us',
            port: 80,
            path: '/200',
        };
        
        // Make a request
        const req = http.request(options);
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_TwohttpExitCalls error')
            assert(false)
        });
        
        req.on('end', (info) => {
            console.log('awsHandler_TwohttpExitCalls end')
        });
        
        // Make a request
        const req2 = http.request(options);
        req2.end();
        
        req2.on('error', (info) => {
            console.log('awsHandler_TwohttpExitCalls error')
            assert(false)
        });
        
        req2.on('end', (info) => {
            console.log('awsHandler_TwohttpExitCalls end')
            callback()
        });
    }

    function awsHandler_ThreehttpExitCalls(event: any, context: any, callback: any){

        // httpstat.us

        const options = {
            hostname: 'httpstat.us',
            port: 80,
            path: '/200',
        };
        
        // Make a request
        const req = http.request(options);
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_TwohttpExitCalls error')
            assert(false)
        });
        
        req.on('end', (info) => {
            console.log('awsHandler_TwohttpExitCalls end')
        });
        
        // Make a request
        const req2 = http.request(options);
        req2.end();
        
        req2.on('error', (info) => {
            console.log('awsHandler_TwohttpExitCalls error')
            assert(false)
        });
        
        req2.on('end', (info) => {
            console.log('awsHandler_TwohttpExitCalls end')
            callback()
        });
        
        // Make a request
        const req3 = http.request(options);
        req3.end();
        
        req3.on('error', (info) => {
            console.log('awsHandler_TwohttpExitCalls error')
            assert(false)
        });
        
        req3.on('end', (info) => {
            console.log('awsHandler_TwohttpExitCalls end')
            callback()
        });
    }

    function awsHandler_httpExitCall_withCallback(event: any, context: any, callback: any){


        const options = {
            hostname: 'httpstat.us',
            port: 80,
            path: '/200',
        };
        
        // Make a request
        const req = http.request(options, function(response:any){
            console.log('http callbacked')
            assert(true)
        });
        req.end();
        
        req.on('error', (info) => {
            console.log('awsHandler_httpExitCall error')
            assert(false)
        });
    }

    function awsHandler_callback_withUnhandledError(event: any, context: any, callback: any){

        
    }

    function callback2(){
        console.log('callbacked')
    }
/*
    it('awsHandler_httpExitCall_withCallback_500', function(){
        runHandlerTest(awsHandler_httpExitCall_withCallback_500, 'awsHandler_httpExitCall_withCallback_500')
    })


    it('awsHandler_httpExitCall', function(){
        runHandlerTest(awsHandler_httpExitCall, 'awsHandler_httpExitCall')
    })

    it('awsHandler_TwohttpExitCalls', function(){
        runHandlerTest(awsHandler_TwohttpExitCalls, 'awsHandler_TwohttpExitCalls')
    })

    
    it('awsHandler_ThreehttpExitCalls', function(){
        runHandlerTest(awsHandler_ThreehttpExitCalls, 'awsHandler_ThreehttpExitCalls')
    })
    */
    /*
    it('awsHandler_basic', function() {
        runHandlerTest(awsHandler_basic, 'awsHandler_basic')
    }); 

    it('awsHandler_httpExitCall_withCallback', function(){
        runHandlerTest(awsHandler_httpExitCall_withCallback, 'awsHandler_httpExitCall_withCallback')
    })

    it('awsHandler_httpExitCall_runTwice', function(){
        runHandlerTest(awsHandler_httpExitCall, 'awsHandler_httpExitCall')
        runHandlerTest(awsHandler_httpExitCall, 'awsHandler_httpExitCall')
        // note it will error if you try to call newHandler() twice. is there a scenario where this should function?
    })

    it('awsHandler_httpExitCall_ErrorBadAddress', function(){
        runHandlerTest(awsHandler_httpExitCall_ErrorBadAddress, 'awsHandler_httpExitCall_ErrorBadAddress')
    })

    it('awsHandler_httpExitCall_Error500', function(){
        runHandlerTest(awsHandler_httpExitCall_Error500, 'awsHandler_httpExitCall_Error500')
    })

    it('awsHandler_withUnhandledError', function(){
        try {
            runHandlerTest(awsHandler_withUnhandledError, 'awsHandler_withUnhandledError')
            assert(false)
        } catch(error) {
            assert(true)
        }
    })

    it('awsHandler_withHandledError', function(){
        runHandlerTest(awsHandler_withHandledError, 'awsHandler_withHandledError')
    })*/

    function runHandlerTest(func:any, funcName:any){
        var newHandler = Agent.instrumentHandler(func, {
            appKey: 'AD-AAB-AAR-SKR', 
            debugMode: true
        })
        var lambdaContext = {
            functionName: funcName,
            functionVersion: 1,
            awsRequestId: uuidv4()
        }
        newHandler(null, lambdaContext, callback2)
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      

});
