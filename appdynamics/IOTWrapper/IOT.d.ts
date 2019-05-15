import { IOTConfig, IOTBeacon } from "../index";
declare class IOT {
    config: IOTConfig;
    path: string;
    sync: boolean;
    isValid: boolean;
    constructor(config: IOTConfig);
    sendBeaconSync(beacon: IOTBeacon): void;
    sendBeaconAsync(beacon: IOTBeacon): Promise<any>;
    sendBeacon(beacon: IOTBeacon): void;
}
export { IOT };
