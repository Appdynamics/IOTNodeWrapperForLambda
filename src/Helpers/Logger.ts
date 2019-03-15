import { LogLevels } from "../index"
class Logger {
    static levels:LogLevels = {
        debug: false,
        info: false,
        warn: true,
        error: true
    }
    static appString = "Appdynamics";
    static print(level:string, msg: string) {
        console.log(`${this.appString}::${level}::${msg}`)
    }
    static init(levels:LogLevels) {
        if(levels) {
            this.levels.debug = levels.debug || this.levels.debug;
            this.levels.info = levels.info || this.levels.info;
            this.levels.warn = levels.warn || this.levels.warn;
            this.levels.error = levels.error || this.levels.error;
        }
    }
    static debug(msg:string) {
        if(this.levels.debug) {
            this.print('DEBUG', msg);
        }
    }
    static info(msg:string) {
        if(this.levels.info) {
            this.print('INFO', msg);
        }
    }
    static warn(msg:string) {
        if(this.levels.warn) {
            this.print('WARN', msg);
        }
    }
    static error(msg:string) {
        if(this.levels.error) {
            this.print('ERROR', msg);
        }
    }
}

export { Logger }