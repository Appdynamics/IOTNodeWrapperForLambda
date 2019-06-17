# NodeJS Lambda

A javascript node library to report lambda timing using IOT Agent


### Prerequisites

An AppDynamics Controller.  
An AppDynamics IOT API Key.  
NPM

### Usage 

A step by step to quick get up and running 

1. add appdynamics lib to your lambda

```
npm install git+https://github.com/Appdynamics/IOT-Node-Wrapper-for-Lambda.git
```

2. Import AppAgent.ts Transaction at top of each handler function

```
import { AppAgent } from '@appdynamicsnodelambda/nodelambda/appdynamics/AppAgent'
```

3.  Initialize the AppAgent at end of your handler by passing in the handler function
```
import { AppAgent } from '@appdynamicsnodelambda/nodelambda/appdynamics/AppAgent'

var myhandler =  (event: any, context: any, callback: any) => {
    callback(null, 'success');
}
myhandler = AppAgent.init(myhandler, {
    lambdaHeaders: {
        "headertolookfor":DataType.STRING
    }
});
export { myhandler }
```
4.  Add the following enivronment/stage variable in lambda

```
APPDYNAMICS_ENABLED
```
set value to "true" to enable the agent or "false" to disable the agent

5.  Add the following enivronment/stage variable in lambda

```
APPDYNAMICS_APPKEY
```
set value to the appKey for your installation

*Note these can be set at environement or stageVariable level.  The environment Variable takes precedence.


### App Config
```
export interface AppConfig {
    /*App Key to IOT Application in AppDynamics*/
    appKey?: string;
    /*Optional key that will look at the event.headers for a uniqueid.  If none given, datetime.now() is used as a uniquekey */
    uniqueIDHeader?: string;
    /*String of which log level reporting to be done*/
    loglevel?: string;
    /*Map of header key to data type to look for in event.headers*/
    lambdaHeaders?:DataTypeMap;
    /*Map of header key to data type to look for in request.headers*/
    requestHeaders?:DataTypeMap;
    /*Map of header key to data type to look for in resp.headers*/
    responseHeaders?:DataTypeMap;
    /*Map of property to data type to look for in event*/
    eventData?:DataTypeMap;
    /*Map of parameter to data type to look for in aws services*/
    AWSData?:DataTypeMap;
}
```

Valid DataTypes should match this typing:
```
export enum DataType {
    STRING = "string",
    DATETIME = "datetime",
    BOOLEAN = "boolean",
    DOUBLE = "double"

}
```


Example:
```
import { AppAgent } from '@appdynamicsnodelambda/nodelambda/appdynamics/AppAgent'
import { DataType } from '@appdynamicsnodelambda/nodelambda/appdynamics/index';

var handler =  (event: any, context: any, callback: any) => {
    callback(null, 'success');
}
handler = AppAgent.init(handler, {
    eventData: {
        'EventDataPropert':DataType.STRING
    },    
    lambdaHeaders: {
        'sessionID':DataType.DOUBLE,
        'DateTimeKey': DataType.DATETIME,
        'TestBool': DataType.BOOLEAN
    },
    responseHeaders: {
        'sessionid':DataType.STRING
    }

});

export { handler }
```

### Custom data

Custom Properties can be sent at a transactional level.  The function takes an object that contains dictionaries for each of the different data types.

Signature:

```
stringProperties?: StringMap;
booleanProperties?: BooleanMap;
doubleProperties?: NumberMap;
datetimeProperties?: NumberMap;
```

stringProperties: object
A map of the string properties of this event. There cannot be more than 16 string properties per event. Entry keys have a max length of 24 characters. Entry values have a max length of 128 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "username": "john.doe" }

booleanProperties: object
A map of the boolean properties of this event. There cannot be more than 16 boolean properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "error": false }

doubleProperties: object
A map of the double properties of this event. There cannot be more than 16 double properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "Fahrenheit": 98.2 }

datetimeProperties: object
A map of the datetime properties of this event, in millisecond epoch time. There cannot be more than 16 datetime properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "bootTime": 1487119625012 }



Example usage:

```
import { AppAgent } from '@appdynamicsnodelambda/nodelambda/appdynamics/AppAgent'


var handler =  (event: any, context: any, callback: any) => {
    if(global.txn){
        global.txn.customData({
            stringProperties: { 'MyProperty': 'MyStringValue'}
        });
    }
    callback(null, 'success');
}
handler = AppAgent.init(handler);
export { handler }


```

### Exit Calls
By default, the agent will pick up any requests that utilize the http module or aws-sdk events.  For exit points not picked up by default, custom code can be used like so to add an exit point to your transaction

```
  if(global.txn) {
        myexitcall = global.txn.createHTTPExitCall({
            url: 'urlofexitcall.com'
        }) as ExitCall;
    }

    mylibrary.getresults((data)=> {
        if(myexitcall) {
            myexitcall.stop();
        }
    });
```

### Logging
APPDYNAMICS_LOGLEVEL can be added at the environment or stage level to enable logging


## Authors

* **Michael Sickles** - *Initial work* - michael.sickles@appdynamics.com
