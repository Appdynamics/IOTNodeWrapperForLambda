import { DeviceInfo, VersionInfo, CustomEvent, NetworkRequestEvent, ErrorEvent } from '../index';
declare class Beacon {
    deviceInfo: DeviceInfo;
    versionInfo: VersionInfo;
    networkRequestEvents: NetworkRequestEvent[];
    customEvents: CustomEvent[];
    errorEvents: ErrorEvent[];
    constructor();
    addNetworkRequestEvent(networkRequestEvent: NetworkRequestEvent): void;
    addCustomEvent(customEvent: CustomEvent): void;
    addErrorEvent(errorEvent: ErrorEvent): void;
}
export { Beacon };
