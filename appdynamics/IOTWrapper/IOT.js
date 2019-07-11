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
const index_1 = require("../index");
const Logger_1 = require("../Helpers/Logger");
class IOT {
    constructor(config) {
        this.sync = false;
        this.isValid = true;
        this.options = {};
        this.config = config;
        if (this.config.appKey === '<NO KEY SET>') {
            this.isValid = false;
            Logger_1.Logger.warn('IOT::Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
        this.options = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        };
        Logger_1.Logger.debug('IOT::IOT::options');
        Logger_1.Logger.debug(this.options);
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
        Logger_1.Logger.debug('IOT::sendBeaconSync::beacon');
        Logger_1.Logger.debug(beacon);
        Logger_1.Logger.debug('IOT::sendBeaconSync::http.request start');
        const req = https.request(this.options, function (res) {
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
            Logger_1.Logger.debug('IOT::sendBeaconAsync::beacon');
            Logger_1.Logger.debug(beacon);
            // todo if debug mode is enabled, call validate beacon https://docs.appdynamics.com/javadocs/iot-rest-api/4.4/4.4.0/#path--application--appKey--validate-beacons
            if (Logger_1.Logger.level == index_1.LOGLEVEL.DEBUG) {
                this.validateBeaconAsync(beacon);
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.debug('IOT::sendBeaconAsync::Promise Request Start');
                const req = https.request(this.options, function (incomingMessage) {
                    Logger_1.Logger.debug('IOT::sendBeaconAsync::Request Complete');
                    Logger_1.Logger.debug('IOT::sendBeaconAsync::Response = ' + incomingMessage.statusCode);
                    if (incomingMessage.statusCode == 200 || incomingMessage.statusCode == 202) {
                        Logger_1.Logger.info('IOT::sendBeaconAsync::Promise Response Success');
                        resolve('Success');
                    }
                    else {
                        // 400 Bad Request
                        // 402 Payment Required
                        // 403 Forbidden
                        // 429 Too Many Requests
                        Logger_1.Logger.error('IOT::sendBeaconAsync::Promise Response Error');
                        Logger_1.Logger.error('IOT::sendBeaconAsync::Response = ' + incomingMessage.statusCode);
                    }
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
    validateBeaconAsync(beacon) {
        return __awaiter(this, void 0, void 0, function* () {
            var validateOptions = this.options;
            validateOptions.path = `/eumcollector/iot/v1/application/${this.config.appKey}/validate-beacons`;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.debug('IOT::validateBeaconAsync::Promise Request Start');
                const req = https.request(this.options, function (response) {
                    Logger_1.Logger.debug('IOT::validateBeaconAsync::Request Complete');
                    Logger_1.Logger.debug('IOT::validateBeaconAsync::Response = ' + response.statusCode);
                    if (response.statusCode == 200) {
                        Logger_1.Logger.info('IOT::validateBeaconAsync::Promise Response Success');
                        resolve('Success');
                        // 422 Unprocessable Entity
                    }
                    else if (response.statusCode == 422) {
                        Logger_1.Logger.error('IOT::validateBeaconAsync::Promise Response Validation Error');
                        console.error(response);
                    }
                    else {
                        // 400 Bad Request
                        // 402 Payment Required
                        // 403 Forbidden
                        // 429 Too Many Requests
                        Logger_1.Logger.error('IOT::validateBeaconAsync::Promise Response Error');
                        Logger_1.Logger.error('IOT::validateBeaconAsync::Response = ' + response.statusCode);
                    }
                });
                req.on('error', (err) => {
                    Logger_1.Logger.error('IOT::validateBeaconAsync::Request Error');
                    Logger_1.Logger.error(err);
                    reject(err);
                });
                const json = JSON.stringify(beacon);
                req.write(`[${json}]`);
                req.end();
                Logger_1.Logger.debug('IOT::validateBeaconAsync::Promise Request End');
            }));
        });
    }
}
exports.IOT = IOT;
