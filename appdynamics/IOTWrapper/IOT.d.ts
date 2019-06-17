/// <reference types="node" />
import { IOTConfig, IOTBeacon } from "../index";
import { Agent } from 'http';
declare class IOT {
    config: IOTConfig;
    path: string;
    sync: boolean;
    isValid: boolean;
    agent: Agent;
    constructor(config: IOTConfig);
    sendBeaconSync(beacon: IOTBeacon): void;
    sendBeaconAsync(beacon: IOTBeacon): Promise<any>;
    sendBeacon(beacon: IOTBeacon): void;
}
export { IOT };
