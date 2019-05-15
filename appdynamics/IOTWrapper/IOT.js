"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const Logger_1 = require("../Helpers/Logger");
class IOT {
    constructor(config) {
        this.sync = false;
        this.isValid = true;
        this.config = config;
        if (this.config.appKey === '<NO KEY SET>') {
            this.isValid = false;
            Logger_1.Logger.warn('Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
    }
    sendBeaconSync(beacon) {
        const options = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        };
        Logger_1.Logger.debug('IOT Beacon:');
        Logger_1.Logger.debug(JSON.stringify(beacon));
        const req = https.request(options, function (res) {
            req.on('error', function (e) {
                Logger_1.Logger.error('problem with request: ' + e.message);
            });
        });
        const json = JSON.stringify(beacon);
        req.write(`[${json}]`);
        req.end();
    }
    sendBeaconAsync(beacon) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                hostname: this.config.collector,
                port: 443,
                path: this.path,
                method: 'POST'
            };
            Logger_1.Logger.debug('-=-=-=-=-=-=-=-  IOT Beacon -=-=-=-=-=-=-=-=');
            Logger_1.Logger.debug(JSON.stringify(beacon));
            // return new pending promise
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const req = https.request(options, function (res) {
                    resolve('Success');
                });
                req.on('error', (err) => reject(err));
                const json = JSON.stringify(beacon);
                req.write(`[${json}]`);
                req.end();
            }));
        });
    }
    sendBeacon(beacon) {
        if (this.sync && this.isValid) {
            this.sendBeaconSync(beacon);
        }
        else if (this.isValid) {
            this.sendBeaconAsync(beacon).catch((err) => { Logger_1.Logger.error(err); });
        }
    }
}
exports.IOT = IOT;
