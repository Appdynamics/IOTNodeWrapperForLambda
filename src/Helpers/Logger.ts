import { LOGLEVEL } from "../index"
class Logger {
    static level:LOGLEVEL = LOGLEVEL.ERROR;

    //console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
    // console.log("EVENT\n" + JSON.stringify(event, null, 2))

    static appString = "Appdynamics";
    static print(level:string, msg: any) {
        console.log(`${this.appString}::${level}::` + msg)
    }
    static init(level:string) {
        this.level = LOGLEVEL.DEBUG;
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
    static debug(msg:any) {
        if(LOGLEVEL.DEBUG >= this.level) {
            this.print('DEBUG', msg);
        }
    }
    static info(msg:any) {
        if(LOGLEVEL.INFO >= this.level) {
            this.print('INFO', msg);
        }
    }
    static warn(msg:any) {
        if(LOGLEVEL.WARN >= this.level) {
            this.print('WARN', msg);
        }
    }
    static error(msg:any) {
        if(LOGLEVEL.ERROR >= this.level) {
            this.print('ERROR', msg);
        }
    }
}

export { Logger }