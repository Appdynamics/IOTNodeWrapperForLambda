"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
class Logger {
    static init(level) {
        if (level) {
            switch (level) {
                case "DEBUG":
                    this.level = index_1.LOGLEVEL.DEBUG;
                    break;
                case "INFO":
                    this.level = index_1.LOGLEVEL.INFO;
                    break;
                case "WARN":
                    this.level = index_1.LOGLEVEL.WARN;
                    break;
                case "ERROR":
                    this.level = index_1.LOGLEVEL.ERROR;
                    ;
                    break;
                default:
                    break;
            }
        }
    }
    static debug(msg) {
        if (index_1.LOGLEVEL.DEBUG >= this.level) {
            console.debug('AppDynamics:Debug: ' + msg);
        }
    }
    static info(msg) {
        if (index_1.LOGLEVEL.INFO >= this.level) {
            console.info('AppDynamics:Info : ' + msg);
        }
    }
    static warn(msg) {
        if (index_1.LOGLEVEL.WARN >= this.level) {
            console.warn('AppDynamics:Warn:  ' + msg);
        }
    }
    static error(msg) {
        if (index_1.LOGLEVEL.ERROR >= this.level) {
            console.error('AppDynamics:Error: ' + msg);
        }
    }
}
Logger.level = index_1.LOGLEVEL.INFO;
exports.Logger = Logger;
