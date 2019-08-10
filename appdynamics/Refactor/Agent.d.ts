import { AppConfig } from "../index";
declare class Agent {
    static instrumentHandlerAsync(): void;
    static instrumentHandler(handler: any, config: AppConfig): Function;
}
export { Agent };
