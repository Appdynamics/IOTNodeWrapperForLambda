"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Beacon {
    constructor() {
        this.deviceInfo = {
            deviceId: '',
            deviceName: '',
            deviceType: ''
        };
        this.versionInfo = {
            hardwareVersion: undefined,
            firmwareVersion: undefined,
            softwareVersion: undefined,
            opteratingSytemVersion: undefined
        };
        this.networkRequestEvents = [];
        this.customEvents = [];
        this.errorEvents = [];
    }
    addNetworkRequestEvent(networkRequestEvent) {
        this.networkRequestEvents.push(networkRequestEvent);
    }
    addCustomEvent(customEvent) {
        this.customEvents.push(customEvent);
    }
    addErrorEvent(errorEvent) {
        this.errorEvents.push(errorEvent);
    }
}
exports.Beacon = Beacon;
