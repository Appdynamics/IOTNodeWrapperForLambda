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
        "headertolookfor":true
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
    if(global.txn){
        global.txn.customData({
            stringProperties: { 'MyProperty': 'MyStringValue'}
        });
    }
```

### Logging
APPDYNAMICS_LOGLEVEL can be added at the environment or stage level to enable logging


## Authors

* **Michael Sickles** - *Initial work* - michael.sickles@appdynamics.com
