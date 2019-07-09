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
        Logger.debug('dsm::IOT::ctor')
        this.config = config;
        if(this.config.appKey === '<NO KEY SET>') {
            this.isValid = false;
            Logger.warn('Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
    }
    sendBeaconSync(beacon: IOTBeacon) {
        Logger.debug('dsm::IOT::sendBeaconSync start')
        const options: https.RequestOptions = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        }
        Logger.debug('IOT Beacon:')
        Logger.debug(JSON.stringify(beacon));

        const req = https.request(options, function (res) {
            req.on('error', function (e) {
                Logger.error(e)
                Logger.error('problem with request: ' + e.message);
            });

        });
        const json = JSON.stringify(beacon);
        req.write(`[${json}]`);
        req.end();
        Logger.debug('dsm::IOT::sendBeaconSync end')
    }
    async sendBeaconAsync(beacon: IOTBeacon): Promise<any> {
        Logger.debug('dsm::IOT::sendBeaconAsync start')
        const options: https.RequestOptions = {
            hostname: this.config.collector,
            port: 443,
            path: this.path,
            method: 'POST'
        }
        Logger.debug('-=-=-=-=-=-=-=-  IOT Beacon -=-=-=-=-=-=-=-=')
        Logger.debug(JSON.stringify(beacon));
        
        // return new pending promise
        return new Promise(async (resolve, reject) => {
            Logger.debug('dsm::IOT::sendBeaconAsync promise start')
            const req = https.request(options, function (res) {
                Logger.debug('dsm::IOT::request success')
                Logger.info(`Beacon Status Code: ${res.statusCode}`);
                resolve('Success');
            });
            req.on('error', (err) => function(){
                Logger.error(err)
                reject(err)
            });

            const json = JSON.stringify(beacon);
            req.write(`[${json}]`);
            req.end();
            
  
            Logger.debug('dsm::IOT::sendBeaconAsync end')

        });

    }
     sendBeacon(beacon: IOTBeacon) {
        Logger.debug('dsm::IOT::sendBeacon start')
        if(this.sync && this.isValid) {
            this.sendBeaconSync(beacon);
        } else if (this.isValid){
            this.sendBeaconAsync(beacon)
            .catch((err) => { 
                Logger.error(err)
                Logger.error(JSON.stringify(err))
            });
        }
        Logger.debug('dsm::IOT::sendBeacon end')
    }
}
export { IOT }; 