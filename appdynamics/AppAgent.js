"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = require("./Refactor/Agent");
class AppAgent {
    static init(func, config) {
        if (!config) {
            config = {
                instrumentationEnabled: true,
                loglevel: 'INFO'
            };
        }
        console.log('dsn' + process.env.APPDYNAMICS_ENABLED);
        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            config.instrumentationEnabled = false;
        }
        else {
            config.instrumentationEnabled = true;
        }
        if (process.env.APPDYNAMICS_LOGLEVEL) {
            config.loglevel = process.env.APPDYNAMICS_LOGLEVEL;
        }
        if (process.env.APPDYNAMICS_APPKEY) {
            config.appKey = process.env.APPDYNAMICS_APPKEY;
        }
        return Agent_1.Agent.instrumentHandler(func, config);
    }
}
exports.AppAgent = AppAgent;
