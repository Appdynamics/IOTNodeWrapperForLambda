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
            Logger_1.Logger.warn('IOT::Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
    }
    sendBeacon(beacon) {
        if (this.sync && this.isValid) {
            // note there is no condition in which this will ever get called
            try {
                this.sendBeaconSync(beacon);
                Logger_1.Logger.debug('IOT::sendBeaconSync::Success');
            }
            catch (error) {
                Logger_1.Logger.error('IOT::sendBeaconSync failed to send.');
                Logger_1.Logger.error(error);
            }
        }
        else if (this.isValid) {
            this.sendBeaconAsync(beacon)
                .then(function () {
                Logger_1.Logger.debug('IOT::sendBeaconAsync::Success');
            })
                .catch(function (err) {
                Logger_1.Logger.error('IOT::sendBeaconAsync failed to send.');
                Logger_1.Logger.error(err);
            });
        }
    }
    sendBeaconSync(beacon) {
        const options = this.setupConfig();
        Logger_1.Logger.debug('IOT::sendBeaconSync::beacon');
        Logger_1.Logger.debug(beacon);
        Logger_1.Logger.debug('IOT::sendBeaconSync::http.request start');
        const req = https.request(options, function (res) {
            Logger_1.Logger.debug('IOT::sendBeaconSync::response');
            Logger_1.Logger.debug(res);
            req.on('error', function (e) {
                Logger_1.Logger.error('IOT::sendBeaconSync::error');
                Logger_1.Logger.error(e);
            });
        });
        const json = JSON.stringify(beacon);
        req.write(`[${json}]`);
        req.end();
        Logger_1.Logger.debug('IOT::sendBeaconSync::http.request end');
    }
    sendBeaconAsync(beacon) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = this.setupConfig();
            Logger_1.Logger.debug('IOT::sendBeaconAsync::beacon');
            Logger_1.Logger.debug(beacon);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.debug('IOT::sendBeaconAsync::Promise Request Start');
                const req = https.request(options, function (res) {
                    Logger_1.Logger.debug('IOT::sendBeaconAsync::Request Complete');
                    Logger_1.Logger.debug('IOT::sendBeaconAsync::Response');
                    Logger_1.Logger.debug(res);
                });
                req.on('error', (err) => {
                    Logger_1.Logger.error('IOT::sendBeaconAsync::Request Error');
                    Logger_1.Logger.error(err);
                    reject(err);
                });
                const json = JSON.stringify(beacon);
                req.write(`[${json}]`);
                req.end();
                Logger_1.Logger.debug('IOT::sendBeaconAsync::Promise Request End');
            }));
        });
    }
    setupConfig() {
        const options = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        };
        Logger_1.Logger.debug('IOT::sendBeaconAsync::options');
        Logger_1.Logger.debug(options);
        return options;
    }
}
exports.IOT = IOT;
