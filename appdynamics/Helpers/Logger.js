"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
class Logger {
    static print(level, msg) {
        console.log(`${this.appString}::${level}::` + msg);
    }
    static init(level) {
        this.level = index_1.LOGLEVEL.DEBUG;
        /*
        if(level) {
            switch(level) {
                case "DEBUG":
                    this.level = LOGLEVEL.DEBUG;
                    break;
                case "INFO":
                    this.level = LOGLEVEL.INFO;
                    break;
                case "WARN":
                    this.level = LOGLEVEL.WARN;
                    break;
                case "ERROR":
                    this.level = LOGLEVEL.ERROR;;
                    break;
                default:
                    break;
                
            }
          
        }*/
    }
    static debug(msg) {
        if (index_1.LOGLEVEL.DEBUG >= this.level) {
            this.print('DEBUG', msg);
        }
    }
    static info(msg) {
        if (index_1.LOGLEVEL.INFO >= this.level) {
            this.print('INFO', msg);
        }
    }
    static warn(msg) {
        if (index_1.LOGLEVEL.WARN >= this.level) {
            this.print('WARN', msg);
        }
    }
    static error(msg) {
        if (index_1.LOGLEVEL.ERROR >= this.level) {
            this.print('ERROR', msg);
        }
    }
}
Logger.level = index_1.LOGLEVEL.ERROR;
//console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
// console.log("EVENT\n" + JSON.stringify(event, null, 2))
Logger.appString = "Appdynamics";
exports.Logger = Logger;
