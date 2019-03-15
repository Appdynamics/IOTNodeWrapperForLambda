# NodeJS Lambda

A javascript node library to report lambda timing using IOT Agent


### Prerequisites

An AppDynamics Controller.  
An AppDynamics IOT API Key.
NPM

### Usage 

A step by step to quick get up and running 

1. add appdynamics lib to labmda function folder

**Note** see Building Package below on how to build the appdynamics lib

2. Import AppAgent.js Transaction at top of index.js with all of your module.exports functions 

```
const AppAgent = require("./apdynamics/AppAgent.js").AppAgent;
```

3.  Initialize the AppAgent at end of index.js with all of your module.exports functions
```
exports = AppAgent.init(exports, {appKey: 'IOT-KEY' })
```
4.  Add the following enivronment variable in lambda

```
APPDYNAMICS_ENABLED
```

set value to "true" to enable the agent or "false" to disable the agent

### Building Package

For initial setup run the folloiwng command
```
npm install
```


To generate appdynamics module folder run 
```
tsc
```
## Authors

* **Michael Sickles** - *Initial work* - michael.sickles@appdynamics.com
