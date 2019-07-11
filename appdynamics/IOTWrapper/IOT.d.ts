import { IOTConfig, IOTBeacon } from "../index";
declare class IOT {
    config: IOTConfig;
    path: string;
    sync: boolean;
    isValid: boolean;
    constructor(config: IOTConfig);
    sendBeacon(beacon: IOTBeacon): void;
    sendBeaconSync(beacon: IOTBeacon): void;
    sendBeaconAsync(beacon: IOTBeacon): Promise<any>;
    private setupConfig;
}
export { IOT };
