import { LOGLEVEL } from "../index"
class Logger {

    static level:LOGLEVEL = LOGLEVEL.INFO;

    static init(level:string) {
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
          
        }
    }

    static debug(msg:string) {
        if(LOGLEVEL.DEBUG >= this.level) {
            console.debug('AppDynamics:Debug: ' + msg)
        }
    }

    static info(msg:string) {
        if(LOGLEVEL.INFO >= this.level) {
            console.info('AppDynamics:Info : ' + msg)
        }
    }

    static warn(msg:string) {
        if(LOGLEVEL.WARN >= this.level) {
            console.warn('AppDynamics:Warn:  ' + msg)
        }
    }

    static error(msg:any) {
        if(LOGLEVEL.ERROR >= this.level) {
            console.error('AppDynamics:Error: ' + msg)
        }
    }
}

export { Logger }