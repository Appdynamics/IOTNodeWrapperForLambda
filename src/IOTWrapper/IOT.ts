import https = require('https');
import { IOTConfig, IOTBeacon, LOGLEVEL } from "../index"
import { HelperMethods } from "../Helpers/HelperMethods"
import { Logger } from "../Helpers/Logger"
import { IncomingMessage } from 'http';
class IOT {

    config: IOTConfig;
    path: string;
    sync:boolean = false;
    isValid:boolean = true;
    options:https.RequestOptions = {}

    constructor(config: IOTConfig) {
        this.config = config;
        if(this.config.appKey === '<NO KEY SET>') {
            this.isValid = false;
            Logger.warn('IOT::Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;

        this.options = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        }
        Logger.debug('IOT::IOT::options')
        Logger.debug(this.options)
    }
    
    sendBeacon(beacon: IOTBeacon) {
        if(this.sync && this.isValid) {
        // note there is no condition in which this will ever get called
            try {
                this.sendBeaconSync(beacon);
                Logger.debug('IOT::sendBeaconSync::Success')
            }
            catch (error){
                Logger.error('IOT::sendBeaconSync failed to send.')
                Logger.error(error)
            }
       } else if (this.isValid){
            this.sendBeaconAsync(beacon)
                .then(function(){
                    Logger.debug('IOT::sendBeaconAsync::Success')
                })
                .catch(function(err){ 
                    Logger.error('IOT::sendBeaconAsync failed to send.')
                    Logger.error(err)
                })
       }
    }

    sendBeaconSync(beacon: IOTBeacon) {
        Logger.debug('IOT::sendBeaconSync::beacon')
        Logger.debug(beacon);
        Logger.debug('IOT::sendBeaconSync::http.request start')
        const req = https.request(this.options, function (res) {
            Logger.debug('IOT::sendBeaconSync::response')
            Logger.debug(res)
            req.on('error', function (e) {
                Logger.error('IOT::sendBeaconSync::error')
                Logger.error(e)
            });

        });
        const json = JSON.stringify(beacon);
        req.write(`[${json}]`);
        req.end();
        Logger.debug('IOT::sendBeaconSync::http.request end')
    }

    async sendBeaconAsync(beacon: IOTBeacon): Promise<any> {
        Logger.debug('IOT::sendBeaconAsync::beacon')
        Logger.debug(beacon);

        // todo if debug mode is enabled, call validate beacon https://docs.appdynamics.com/javadocs/iot-rest-api/4.4/4.4.0/#path--application--appKey--validate-beacons
        if(Logger.level == LOGLEVEL.DEBUG){
            this.validateBeaconAsync(beacon)
        }

        return new Promise(async (resolve, reject) => {
            Logger.debug('IOT::sendBeaconAsync::Promise Request Start')
            const req = https.request(this.options, function (incomingMessage: IncomingMessage) {
                Logger.debug('IOT::sendBeaconAsync::Request Complete')
                Logger.debug('IOT::sendBeaconAsync::Response = ' + incomingMessage.statusCode)
                if(incomingMessage.statusCode == 200 || incomingMessage.statusCode == 202){
                    Logger.info('IOT::sendBeaconAsync::Promise Response Success')
                    resolve('Success');
                } else {
                    // 400 Bad Request
                    // 402 Payment Required
                    // 403 Forbidden
                    // 429 Too Many Requests
                    Logger.error('IOT::sendBeaconAsync::Promise Response Error')
                    Logger.error('IOT::sendBeaconAsync::Response = ' + incomingMessage.statusCode)
                }
            });
            req.on('error', (err) => {
                Logger.error('IOT::sendBeaconAsync::Request Error')
                Logger.error(err)
                reject(err)
            });
            const json = JSON.stringify(beacon);
            req.write(`[${json}]`);
            req.end();
            Logger.debug('IOT::sendBeaconAsync::Promise Request End')
        });
    }

    async validateBeaconAsync(beacon: IOTBeacon){
        var validateOptions = this.options
        validateOptions.path = `/eumcollector/iot/v1/application/${this.config.appKey}/validate-beacons`;
        return new Promise(async (resolve, reject) => {
            Logger.debug('IOT::validateBeaconAsync::Promise Request Start')
            const req = https.request(this.options, function (response: any) {
                Logger.debug('IOT::validateBeaconAsync::Request Complete')
                Logger.debug('IOT::validateBeaconAsync::Response = ' + response.statusCode)

                if(response.statusCode == 200){
                    Logger.info('IOT::validateBeaconAsync::Promise Response Success')
                    resolve('Success');
                // 422 Unprocessable Entity
                } else if (response.statusCode == 422){ 
                    Logger.error('IOT::validateBeaconAsync::Promise Response Validation Error')
                    console.error(response)
                } else {
                    // 400 Bad Request
                    // 402 Payment Required
                    // 403 Forbidden
                    // 429 Too Many Requests
                    Logger.error('IOT::validateBeaconAsync::Promise Response Error')
                    Logger.error('IOT::validateBeaconAsync::Response = ' + response.statusCode)
                }
            });
            req.on('error', (err) => {
                Logger.error('IOT::validateBeaconAsync::Request Error')
                Logger.error(err)
                reject(err)
            });
            const json = JSON.stringify(beacon);
            req.write(`[${json}]`);
            req.end();
            Logger.debug('IOT::validateBeaconAsync::Promise Request End')
        });
    }
}
export { IOT }; 