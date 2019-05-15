"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Timer_1 = require("./Timer");
const HelperMethods_1 = require("../Helpers/HelperMethods");
const Logger_1 = require("../Helpers/Logger");
class ExitCall {
    constructor(iot, type, config) {
        this.timer = new Timer_1.Timer();
        this.type = type;
        this.config = config;
        this.iot = iot;
        if (this.config.stringProperties) {
            this.config.stringProperties.eventType = this.type;
            this.config.stringProperties.uniqueClientId = this.config.uniqueClientId;
        }
        else {
            this.config.stringProperties = {
                eventType: this.type,
                uniqueClientId: this.config.uniqueClientId
            };
        }
    }
    //Overloading this method
    stop(responseProperties, properties) {
        if (this.timer.end_process_time) {
            Logger_1.Logger.warn(`Already called stop on exit call.`);
            return;
        }
        this.timer.stop();
        var beacon;
        if (!responseProperties) {
            beacon = this.createTimingBeacon(undefined, undefined);
        }
        else if (responseProperties.statusCode || responseProperties.networkError || responseProperties.requestContentLength || responseProperties.responseContentLength || responseProperties.responseHeaders) {
            beacon = this.createTimingBeacon(responseProperties, properties);
        }
        else {
            beacon = this.createTimingBeacon(undefined, responseProperties);
        }
        if (beacon) {
            this.iot.sendBeacon(beacon);
        }
    }
    createTimingBeacon(responseProperties, properties) {
        const beacon = {
            deviceInfo: this.config.deviceInfo,
            versionInfo: this.config.versionInfo
        };
        if (this.type.toUpperCase() === "HTTP") {
            if (responseProperties) {
                if (this.config.networkRequestProperties) {
                    for (let key in responseProperties) {
                        if (key === "responseHeaders") {
                            this.config.networkRequestProperties[key] = HelperMethods_1.HelperMethods.formatResponseHeaders(responseProperties[key]);
                        }
                        else {
                            this.config.networkRequestProperties[key] = responseProperties[key];
                        }
                    }
                }
            }
            var networkRequestEvent = this.config.networkRequestProperties;
            networkRequestEvent.timestamp = this.timer.startDT;
            networkRequestEvent.duration = this.timer.elapsed;
            networkRequestEvent.stringProperties = this.config.stringProperties;
            networkRequestEvent.datetimeProperties = {
                start: this.timer.startDT,
                end: this.timer.endDT
            };
            networkRequestEvent = HelperMethods_1.HelperMethods.setPropertiesOnEvent(networkRequestEvent, properties);
            beacon.networkRequestEvents = [networkRequestEvent];
        }
        else {
            var customevent = {
                eventType: this.type,
                eventSummary: this.config.deviceInfo.deviceName,
                timestamp: this.timer.startDT,
                duration: this.timer.elapsed,
                stringProperties: this.config.stringProperties,
                datetimeProperties: {
                    start: this.timer.startDT,
                    end: this.timer.endDT
                }
            };
            if (customevent.stringProperties) {
                customevent.stringProperties.customEventDuration = this.timer.elapsed.toString() + ' ms';
            }
            else {
                customevent.stringProperties = {
                    customEventDuration: this.timer.elapsed.toString() + ' ms'
                };
            }
            customevent = HelperMethods_1.HelperMethods.setPropertiesOnEvent(customevent, properties);
            beacon.customEvents = [customevent];
        }
        return beacon;
    }
    reportError(errorevent, properties) {
        const now = new Date();
        const beacon = {
            deviceInfo: this.config.deviceInfo,
            versionInfo: this.config.versionInfo
        };
        var err = errorevent;
        err.timestamp = now.getTime();
        err.stringProperties = this.config.stringProperties;
        err = HelperMethods_1.HelperMethods.setPropertiesOnEvent(err, properties);
        beacon.errorEvents = [err];
        if (this.iot) {
            this.iot.sendBeacon(beacon);
        }
    }
}
exports.ExitCall = ExitCall;
