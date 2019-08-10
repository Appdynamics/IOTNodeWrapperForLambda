import { Agent } from "./Refactor/Agent";
import { AppConfig } from "./index";
import { Logger } from "./Helpers/Logger";

class AppAgent {

    static init(func: any, config?: AppConfig) {

        if(!config){
            config = {
                instrumentationEnabled: true,
                loglevel: 'INFO'
            } as AppConfig
        }

        if (process.env.APPDYNAMICS_ENABLED && process.env.APPDYNAMICS_ENABLED === "false"){
            config.instrumentationEnabled = false
        } else {
            config.instrumentationEnabled = true
        }

        if (process.env.APPDYNAMICS_LOGLEVEL){
            config.loglevel = process.env.APPDYNAMICS_LOGLEVEL
        }

        if (process.env.APPDYNAMICS_APPKEY){
            config.appKey = process.env.APPDYNAMICS_APPKEY
        }

        return Agent.instrumentHandler(func, config)

    }
}
export { AppAgent }