import { Agent } from "./Refactor/Agent";
import { AppConfig } from "./index";
import { Logger } from "./Helpers/Logger";

class AppAgent {

    static init(func: any, config?: AppConfig) {

        if(!config){
            //Note is this valid if environment variables are used? DSMTODO
            Logger.warn('Nothing will be instrumented since no configuration was provided. ')
            return func
        }

        return Agent.instrumentHandler(func, config)

    }
}
export { AppAgent }