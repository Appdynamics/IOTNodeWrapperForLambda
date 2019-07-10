import { LOGLEVEL } from "../index";
declare class Logger {
    static level: LOGLEVEL;
    static appString: string;
    static print(level: string, msg: any): void;
    static init(level: string): void;
    static debug(msg: any): void;
    static info(msg: any): void;
    static warn(msg: any): void;
    static error(msg: any): void;
}
export { Logger };
