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
    stringProperties?: StringMap;
    booleanProperties?: BooleanMap;
    doubleProperties?: NumberMap;
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
    responseHeaders?: ResponseHeaders;
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
    severity?: Severity;
}
export declare enum Severity {
    ALERT = "alert",
    CRITICAL = "critical",
    FATAL = "fatal"
}
export interface stackTrace {
    thread?: string;
    runtime?: Runtime;
    stackFrames?: [StackFrame];
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
export declare enum DataType {
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
    appKey?: string;
    uniqueIDHeader?: string;
    loglevel?: string;
    lambdaHeaders?: DataTypeMap;
    requestHeaders?: DataTypeMap;
    responseHeaders?: DataTypeMap;
    eventData?: DataTypeMap;
    AWSData?: DataTypeMap;
}
export declare enum LOGLEVEL {
    DEBUG = 0,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    OFF = 5
}
declare global {
    namespace NodeJS {
        interface Global {
            txn: Transaction;
            AppConfig: AppConfig;
        }
    }
}
export {};
