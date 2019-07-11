import https = require('https');
import { IOTConfig, IOTBeacon } from "../index"
import { HelperMethods } from "../Helpers/HelperMethods"
import { Logger } from "../Helpers/Logger"
class IOT {

    config: IOTConfig;
    path: string;
    sync:boolean = false;
    isValid:boolean = true;

    constructor(config: IOTConfig) {
        this.config = config;
        if(this.config.appKey === '<NO KEY SET>') {
            this.isValid = false;
            Logger.warn('IOT::Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
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
        const options = this.setupConfig()
        Logger.debug('IOT::sendBeaconSync::beacon')
        Logger.debug(beacon);

        Logger.debug('IOT::sendBeaconSync::http.request start')
        const req = https.request(options, function (res) {
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
        const options = this.setupConfig()
        Logger.debug('IOT::sendBeaconAsync::beacon')
        Logger.debug(beacon);
        return new Promise(async (resolve, reject) => {
            Logger.debug('IOT::sendBeaconAsync::Promise Request Start')
            const req = https.request(options, function (res) {
                Logger.debug('IOT::sendBeaconAsync::Request Complete')
                Logger.debug('IOT::sendBeaconAsync::Response')
                Logger.debug(res)
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

    private setupConfig(){
        const options: https.RequestOptions = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        }
        Logger.debug('IOT::sendBeaconAsync::options')
        Logger.debug(options)
        return options
    }
}
export { IOT }; 