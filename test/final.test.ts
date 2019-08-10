/*

public updateCustomData(customData: object): void {

    const LOG_PREFIX_FN = LOG_PREFIX_CLASS + "updateCustomData | ";

    if (global.txn && customData && Object.keys(customData).length > 0) {

        try {
            global.txn.customData({
                stringProperties: customData
            });
        } catch (error) {
            console.log(`${LOG_PREFIX_FN} AppDError: ${JSON.stringify(error)}`);
        }
    }
}

var handler = AppAgent.init(handler, {
    uniqueIDHeader: "clientrequestid",
    lambdaHeaders: {
        "x-originator-type": DataType.STRING,
        "x-clientapp-version": DataType.STRING,
        "x-os-type": DataType.STRING,
        "SessionId": DataType.STRING
    }
});

*/

/*

handler = AppAgent.init(handler, {
    uniqueIDHeader: "clientrequestid",
    lambdaHeaders: {
        "x-originator-type": DataType.STRING,
        "x-clientapp-version": DataType.STRING,
        "x-os-type": DataType.STRING
    },
    requestHeaders: {
        "SessionId": DataType.STRING,
        "ClientRequestId": DataType.STRING
    },
    responseHeaders: {
        "sessionid": DataType.STRING,
        "SessionId": DataType.STRING,
        "clientrequestid": DataType.STRING,
        "ClientRequestId": DataType.STRING
    }
});

*/

import { AppAgent } from '../src/AppAgent'
import { AppConfig, BooleanMap, DataType, DataTypeMap, BeaconProperties } from "../src/index";
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

describe('final', function() {

    function wait(ms: any){
        var start = new Date().getTime();
        var end = start;
        while(end < start + ms) {
          end = new Date().getTime();
       }
    }

    function awsHandler_basic(event: any, context: any, callback: any){
        // wait(10)
        // todo call global.txn.customData({})
        console.log('handled')
        callback()
    }

    function callback2(){
        console.log('callbacked')
    }

    it('awsHandler_basic', function() {

        var config:AppConfig = {
            appKey: 'AD-AAB-AAR-SKR',
            uniqueIDHeader: undefined,
            loglevel: 'DEBUG',
            lambdaHeaders: {
                'lambdaHeaderTest' : DataType.STRING
            }, 
            requestHeaders: {
                'requestHeaderTest' : DataType.STRING
            }, 
            responseHeaders: {
                'responseHeaderTest' : DataType.STRING
            }, 
            eventData: {
                'eventDataTest' : DataType.STRING
            }, 
            AWSData: {
                'awsDataTest' : DataType.STRING
            }
        }
        var newHandler = AppAgent.init(awsHandler_basic, config)

        var lambdaContext = {
            functionName: 'awsHandler_basic',
            functionVersion: 1,
            awsRequestId: uuidv4()
        }
        newHandler(null, lambdaContext, callback2)

    }); 

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }
      

});
