"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = require("./Agent");
class AppAgent {
    static init(func, config) {
        if (!config) {
            config = {};
        }
        if (config.instrumentationEnabled) {
            // use provided value
        }
        else if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            config.instrumentationEnabled = false;
        }
        else {
            config.instrumentationEnabled = true;
        }
        if (config.loglevel) {
            // use provided value
        }
        else if (process.env.APPDYNAMICS_LOGLEVEL) {
            config.loglevel = process.env.APPDYNAMICS_LOGLEVEL;
        }
        else {
            config.loglevel = 'INFO';
        }
        if (config.appKey) {
            // use provided value
        }
        else if (process.env.APPDYNAMICS_APPKEY) {
            config.appKey = process.env.APPDYNAMICS_APPKEY;
        }
        else {
            // let agent handle validation logic for this invalid case
        }
        return Agent_1.Agent.instrumentHandler(func, config);
    }
}
exports.AppAgent = AppAgent;
