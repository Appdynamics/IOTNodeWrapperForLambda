"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IOT_1 = require("./IOT");
const Timer_1 = require("./Timer");
const HelperMethods_1 = require("../Helpers/HelperMethods");
const ExitCall_1 = require("./ExitCall");
const Logger_1 = require("../Helpers/Logger");
class Transaction {
    constructor(config, beaconProperties) {
        this.version = "1.0.1";
        this.config = config;
        var cust_config = config;
        this.isValid = true;
        this.timer = new Timer_1.Timer();
        this.exitCalls = {};
        this.beaconProperties = {
            stringProperties: {},
            datetimeProperties: {},
            booleanProperties: {},
            doubleProperties: {}
        };
        if (beaconProperties) {
            this.customData(beaconProperties);
        }
        if (!HelperMethods_1.HelperMethods.isValid(cust_config, 'transactionName')) {
            this.isValid = false;
            Logger_1.Logger.error(`Invalid or missing transactionName`);
            return;
        }
        if (!HelperMethods_1.HelperMethods.isValid(cust_config, 'transactionType')) {
            this.isValid = false;
            Logger_1.Logger.error(`Invalid or missing transactionType`);
            return;
        }
        if (cust_config.transactionType.length > 24) {
            cust_config.transactionType = cust_config.transactionType.substring(0, 23);
            Logger_1.Logger.warn(`transactionType longer than 24 characters.  truncating to: ${cust_config.transactionType}`);
        }
        if (!HelperMethods_1.HelperMethods.isValid(cust_config, 'appKey')) {
            Logger_1.Logger.error(`Invalid or missing appKey`);
            this.isValid = false;
            return;
        }
        cust_config = HelperMethods_1.HelperMethods.propertyOrDefault(cust_config, 'collector', 'syd-iot-col.eum-appdynamics.com');
        //cust_config = HelperMethods_1.HelperMethods.propertyOrDefault(cust_config, 'collector', 'syd-col.eum-appdynamics.com');
        cust_config = HelperMethods_1.HelperMethods.propertyOrDefault(cust_config, "uniqueClientId", (new Date()).getTime().toString());
        cust_config = HelperMethods_1.HelperMethods.propertyOrDefault(cust_config, "debug", false);
        this.config = cust_config;
        this.iot = new IOT_1.IOT({
            appKey: this.config.appKey,
            httpsProxy: this.config.httpsProxy,
            collector: this.config.collector
        });
    }
    customData(properties) {
        if (!properties) {
            return;
        }
        var sp = this.beaconProperties.stringProperties;
        var bp = this.beaconProperties.booleanProperties;
        var dp = this.beaconProperties.doubleProperties;
        var dtp = this.beaconProperties.datetimeProperties;
        this.beaconProperties.stringProperties = Object.assign({}, sp, properties.stringProperties);
        this.beaconProperties.booleanProperties = Object.assign({}, bp, properties.booleanProperties);
        this.beaconProperties.doubleProperties = Object.assign({}, dp, properties.doubleProperties);
        this.beaconProperties.datetimeProperties = Object.assign({}, dtp, properties.datetimeProperties);
    }
    stop(properties) {
        if (this.timer.end_process_time) {
            Logger_1.Logger.warn('Already called stop on transaction.');
            return;
        }
        this.timer.stop();
        const beacon = this.createTimingBeacon(properties);
        if (this.isValid && beacon && this.iot) {
            this.iot.sendBeacon(beacon);
        }
    }
    reportError(errorevent, properties) {
        if (this.isValid) {
            const now = new Date();
            const beacon = {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.transactionName
                },
                versionInfo: {
                    softwareVersion: this.config.version
                }
            };
            var err = errorevent;
            err.timestamp = now.getTime();
            err.stringProperties = {
                transactionName: this.config.transactionName,
                eventType: this.config.transactionType,
                uniqueClientId: this.config.uniqueClientId
            };
            this.customData(properties);
            err = HelperMethods_1.HelperMethods.setPropertiesOnEvent(err, this.beaconProperties);
            beacon.errorEvents = [err];
            if (this.iot) {
                this.iot.sendBeacon(beacon);
            }
        }
        else {
            Logger_1.Logger.error(`Transaction not valid.  Exit call not created`);
        }
    }
    createTimingBeacon(properties) {
        if (this.isValid) {
            const beacon = {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.transactionName
                },
                versionInfo: {
                    softwareVersion: this.config.version
                }
            };
            var customevent = {
                eventType: this.config.transactionType,
                eventSummary: this.config.transactionName,
                timestamp: this.timer.startDT,
                duration: this.timer.elapsed,
                stringProperties: {
                    uniqueClientId: this.config.uniqueClientId,
                    customEventDuration: this.timer.elapsed.toString() + ' ms'
                },
                datetimeProperties: {
                    start: this.timer.startDT,
                    end: this.timer.endDT
                }
            };
            this.customData(properties);
            if (this.beaconProperties) {
                customevent = HelperMethods_1.HelperMethods.setPropertiesOnEvent(customevent, this.beaconProperties);
            }
            ///customevent = HelperMethods.setPropertiesOnEvent(customevent, properties) as CustomEvent;
            beacon.customEvents = [customevent];
            return beacon;
        }
        else {
            return undefined;
        }
    }
    createCustomExitCall(type, stringProperties) {
        if (this.isValid) {
            const exitcall = new ExitCall_1.ExitCall(this.iot, type, {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.transactionName
                },
                versionInfo: {
                    softwareVersion: this.config.version
                },
                stringProperties: stringProperties,
                uniqueClientId: this.config.uniqueClientId
            });
            return exitcall;
        }
        else {
            Logger_1.Logger.error(`Transaction not valid.  Exit call not created`);
        }
    }
    createHTTPExitCall(networkRequestProperties, stringProperties) {
        if (this.isValid) {
            const exitCall = new ExitCall_1.ExitCall(this.iot, "HTTP", {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.transactionName
                },
                versionInfo: {
                    softwareVersion: this.config.version
                },
                stringProperties: stringProperties,
                networkRequestProperties: networkRequestProperties,
                uniqueClientId: this.config.uniqueClientId
            });
            return exitCall;
        }
        else {
            Logger_1.Logger.error(`Transaction not valid.  Exit call not created`);
        }
    }
}
exports.Transaction = Transaction;
