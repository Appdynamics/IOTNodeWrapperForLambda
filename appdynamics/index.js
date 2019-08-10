"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataType;
(function (DataType) {
    DataType["STRING"] = "string";
    DataType["DATETIME"] = "datetime";
    DataType["BOOLEAN"] = "boolean";
    DataType["DOUBLE"] = "double";
})(DataType = exports.DataType || (exports.DataType = {}));
var LOGLEVEL;
(function (LOGLEVEL) {
    LOGLEVEL[LOGLEVEL["DEBUG"] = 0] = "DEBUG";
    LOGLEVEL[LOGLEVEL["INFO"] = 2] = "INFO";
    LOGLEVEL[LOGLEVEL["WARN"] = 3] = "WARN";
    LOGLEVEL[LOGLEVEL["ERROR"] = 4] = "ERROR";
    LOGLEVEL[LOGLEVEL["OFF"] = 5] = "OFF";
})(LOGLEVEL = exports.LOGLEVEL || (exports.LOGLEVEL = {}));
/*
declare global {
    namespace NodeJS {
        interface Global {
            appdynamicsLambdaTransaction: any // make statically typed to LambdaTransaction
            txn: Transaction
            AppConfig: AppConfig
        }
    }
}
*/
