/// <reference types="node" />
import https = require('https');
import { IOTConfig, IOTBeacon } from "../index";
declare class IOT {
    config: IOTConfig;
    path: string;
    sync: boolean;
    isValid: boolean;
    options: https.RequestOptions;
    constructor(config: IOTConfig);
    sendBeacon(beacon: IOTBeacon): void;
    sendBeaconSync(beacon: IOTBeacon): void;
    sendBeaconAsync(beacon: IOTBeacon): Promise<any>;
    validateBeaconAsync(beacon: IOTBeacon): Promise<unknown>;
}
export { IOT };
