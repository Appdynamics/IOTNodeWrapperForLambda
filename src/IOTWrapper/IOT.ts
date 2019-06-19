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
            Logger.warn('Appkey is not set, no beacons will be sent.');
        }
        this.path = `/eumcollector/iot/v1/application/${this.config.appKey}/beacons`;
    }
    sendBeaconSync(beacon: IOTBeacon) {
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
                Logger.error('problem with request: ' + e.message);
            });

        });
        const json = JSON.stringify(beacon);
        req.write(`[${json}]`);
        req.end();
    }
    async sendBeaconAsync(beacon: IOTBeacon): Promise<any> {
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
            const req = https.request(options, function (res) {
                Logger.info(`Beacon Status Code: ${res.statusCode}`);
                resolve('Success');
            });
            req.on('error', (err) => reject(err));

            const json = JSON.stringify(beacon);
            req.write(`[${json}]`);
            req.end();
            
  

        });

    }
     sendBeacon(beacon: IOTBeacon) {
        if(this.sync && this.isValid) {
            this.sendBeaconSync(beacon);
        } else if (this.isValid){
            this.sendBeaconAsync(beacon).catch((err) => { Logger.error(err)});
        }
    }
}
export { IOT }; 