import { Transaction } from "./IOTWrapper/Transaction";
import { ExitCall } from "./IOTWrapper/ExitCall";

export interface IOTConfig {
    appKey: string;
    collector: string;
}
export interface IOTBeacon {
    deviceInfo: DeviceInfo;
    versionInfo?: VersionInfo;
    customEvents?: [CustomEvent];
    networkRequestEvents?: [NetworkRequestEvent];
    errorEvents?: [ErrorEvent];
}
export interface DeviceInfo {
    deviceName?: string;
    deviceType: string;
    deviceId: string;
}
export interface VersionInfo {
    hardwareVersion?: string;
    firmwareVersion?: string;
    softwareVersion?: string;
    opteratingSytemVersion?: string;

}

export interface Event {
    timestamp?: number;
    duration?: number;
    stringProperties?: StringMap;
    booleanProperties?: BooleanMap;
    doubleProperties?: NumberMap;
    datetimeProperties?: NumberMap;

}
export interface BeaconProperties {
    [key: string]: string | number | StringMap | undefined | BooleanMap | NumberMap | boolean;
    /*A map of the string properties of this event. There cannot be more than 16 string properties per event. Entry keys have a max length of 24 characters. Entry values have a max length of 128 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "username": "john.doe" }*/
    stringProperties?: StringMap;
    /*A map of the boolean properties of this event. There cannot be more than 16 boolean properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "error": false }*/
    booleanProperties?: BooleanMap;
    /*A map of the double properties of this event. There cannot be more than 16 double properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "Fahrenheit": 98.2 }*/
    doubleProperties?: NumberMap;
    /*A map of the datetime properties of this event, in millisecond epoch time. There cannot be more than 16 datetime properties per event. Entry keys have a max length of 24 characters. Entry keys cannot contain the pipe character '|'. Valid Examples: { "bootTime": 1487119625012 }*/
    datetimeProperties?: NumberMap;
}
export interface StringMap {
    [propName: string]: string;
}

export interface BooleanMap {
    [propName: string]: boolean;
}
export interface NumberMap {
    [propName: string]: number;
}

export interface DataTypeMap {
    [propeName: string]: DataType;
}
export interface ExitCallMap {
    [propName: string]: ExitCall;
}
export interface CustomEvent extends Event {
    eventType: string;
    eventSummary: string;

}
export interface NetworkRequestEvent extends Event {
    [key: string]: string | number | StringMap | undefined | BooleanMap | NumberMap | ResponseHeaders;
    url: string;
    statusCode?: number;
    networkError?: string;
    requestContentLength?: number;
    responseContentLength?: number;
    responseHeaders?: ResponseHeaders; //TODO, better way to fix headers?

}
export interface ResponseHeaders {
    [propName: string]: [string];
}
export interface NetworkResponseProperties {
    [key: string]: string | number | StringMap | undefined;
    statusCode?: number;
    networkError?: string;
    requestContentLength?: number;
    responseContentLength?: number;
    responseHeaders?: StringMap;
}
export interface ErrorEvent extends Event {
    name: string;
    message?: string;
    stackTraces?: [stackTrace];
    errorStackTraceIndex?: number;
    severity?: Severity

}
export declare enum Severity {
    ALERT = "alert",
    CRITICAL = "critical",
    FATAL = "fatal"
}
export interface stackTrace {
    thread?: string;
    runtime?: Runtime;
    stackFrames?: [StackFrame]

}
export interface StackFrame {
    symbolName?: string;
    packageName?: string;
    filePath?: string;
    lineNumber?: number;
    absoluteAddress?: number;
    imageOffset?: number;
    symbolOffset?: number;
}
export enum DataType {
    STRING = "string",
    DATETIME = "datetime",
    BOOLEAN = "boolean",
    DOUBLE = "double"

}
declare enum Runtime {
    NATIVE = "native",
    JAVA = "java",
    PYTHON = "python",
    JAVASCRIPT = "javascript",
    DOTNET = ".net",
    NODEJS = "node.js"
}
export interface ExitCallConfiguration {
    stringProperties?: StringMap;
    networkRequestProperties?: NetworkRequestEvent;
    deviceInfo: DeviceInfo;
    versionInfo: VersionInfo;
    uniqueClientId: string;
}

export interface TransactionConfiguration {
    collector?: string;
    appKey: string;
    version: string;
    transactionName: string;
    transactionType: string;
    uniqueClientId: string;
    lambdaHeaders?: StringMap;
}


export interface AppConfig {
    /*App Key to IOT Application in AppDynamics*/
    appKey?: string;
    /*Optional key that will look at the event.headers for a uniqueid.  If none given, datetime.now() is used as a uniquekey */
    uniqueIDHeader?: string;
    /*String of which log level reporting to be done*/
    loglevel?: string;
    /*Map of header key to data type to look for in event.headers*/
    lambdaHeaders?:DataTypeMap;
    /*Map of header key to data type to look for in request.headers*/
    requestHeaders?:DataTypeMap;
    /*Map of header key to data type to look for in resp.headers*/
    responseHeaders?:DataTypeMap;
    /*Map of property to data type to look for in event*/
    eventData?:DataTypeMap;
    /*Map of parameter to data type to look for in aws services*/
    AWSData?:DataTypeMap;
}

export enum LOGLEVEL {
    DEBUG = 0,
    INFO = 2,
    WARN = 3,
    ERROR = 4, 
    OFF = 5

}
declare global {
    namespace NodeJS {
        interface Global {
            txn: Transaction
            AppConfig: AppConfig
        }
    }
} 

