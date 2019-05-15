import { LOGLEVEL } from "../index";
declare class Logger {
    static level: LOGLEVEL;
    static appString: string;
    static print(level: string, msg: string): void;
    static init(level: string): void;
    static debug(msg: string): void;
    static info(msg: string): void;
    static warn(msg: string): void;
    static error(msg: string): void;
}
export { Logger };
