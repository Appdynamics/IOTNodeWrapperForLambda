import { Agent } from "./Refactor/Agent";
import { AppConfig } from "./index";
import { Logger } from "./Helpers/Logger";

class AppAgent {

    static init(func: any, config?: AppConfig) {

        if(!config){
            config = {} as AppConfig
        }

        if(config.instrumentationEnabled){
            // use provided value
        } else if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false") {
            config.instrumentationEnabled = false
        } else {
            config.instrumentationEnabled = true
        }

        if(config.loglevel){
            // use provided value
        } else if (process.env.APPDYNAMICS_LOGLEVEL){
            config.loglevel = process.env.APPDYNAMICS_LOGLEVEL
        } else {
            config.loglevel = 'INFO'
        }

        if(config.appKey){
            // use provided value
        } else if (process.env.APPDYNAMICS_APPKEY){
            config.appKey = process.env.APPDYNAMICS_APPKEY
        } else {
            // let agent handle validation logic for this invalid case
        }

        return Agent.instrumentHandler(func, config)

    }
}
export { AppAgent }