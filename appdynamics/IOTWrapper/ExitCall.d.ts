import { ExitCallConfiguration, IOTBeacon, BeaconProperties, ErrorEvent, NetworkResponseProperties } from "../index";
import { IOT } from "./IOT";
import { Timer } from "./Timer";
declare class ExitCall {
    timer: Timer;
    type: string;
    config: ExitCallConfiguration;
    iot: IOT;
    constructor(iot: IOT, type: string, config: ExitCallConfiguration);
    stop(responseProperties?: NetworkResponseProperties | BeaconProperties, properties?: BeaconProperties | NetworkResponseProperties): void;
    createTimingBeacon(responseProperties: NetworkResponseProperties | undefined, properties: BeaconProperties | undefined): IOTBeacon | undefined;
    reportError(errorevent: ErrorEvent, properties?: BeaconProperties): void;
}
export { ExitCall };
