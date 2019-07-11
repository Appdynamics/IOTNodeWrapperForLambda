import { IOT } from "./IOT";
import { Timer } from "./Timer";
import { ExitCall } from "./ExitCall";
import { NetworkRequestEvent, TransactionConfiguration, IOTBeacon, BeaconProperties, ErrorEvent, StringMap, ExitCallMap } from "../index";
declare class Transaction {
    config: TransactionConfiguration;
    isValid: boolean;
    iot?: IOT;
    timer: Timer;
    exitCalls: ExitCallMap;
    version: string;
    beaconProperties: BeaconProperties;
    constructor(config: TransactionConfiguration, beaconProperties?: BeaconProperties);
    customData(properties?: BeaconProperties): void;
    stop(properties?: BeaconProperties): void;
    reportError(errorevent: ErrorEvent, properties?: BeaconProperties): void;
    createTimingBeacon(properties: BeaconProperties): IOTBeacon | undefined;
    createCustomExitCall(type: string, stringProperties: StringMap): ExitCall | undefined;
    createHTTPExitCall(networkRequestProperties: NetworkRequestEvent, stringProperties?: StringMap): ExitCall | undefined;
}
export { Transaction };
