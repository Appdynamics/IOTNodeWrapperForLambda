import { NetworkRequestEvent, ExitCallConfiguration, IOTBeacon, BeaconProperties, ErrorEvent, CustomEvent, StringMap, NetworkResponseProperties, DataTypeMap } from "../index"
import { IOT } from "./IOT";
import { Timer } from "./Timer";
import { HelperMethods } from "../Helpers/HelperMethods";
import { Logger } from "../Helpers/Logger";

class ExitCall {
    timer: Timer;
    type: string;
    config: ExitCallConfiguration;
    iot: IOT
    constructor(iot: IOT, type: string, config: ExitCallConfiguration) {
        this.timer = new Timer();
        this.type = type;
        this.config = config;
        this.iot = iot;
        if (this.config.stringProperties) {
            this.config.stringProperties.eventType = this.type;
            this.config.stringProperties.uniqueClientId = this.config.uniqueClientId;
        } else {
            this.config.stringProperties = {
                eventType: this.type,
                uniqueClientId: this.config.uniqueClientId
            }
        }
    }
    //Overloading this method
    stop(responseProperties?: NetworkResponseProperties | BeaconProperties, properties?: BeaconProperties | NetworkResponseProperties) {

        Logger.debug("dsm::ExitCall::stop start")

        if(this.timer.end_process_time) {
            Logger.warn(`Already called stop on exit call.`);
            return;
        }
        this.timer.stop();
        var beacon: IOTBeacon | undefined;
        if (!responseProperties) {
            beacon = this.createTimingBeacon(undefined, undefined);
        } else if (responseProperties.statusCode || responseProperties.networkError || responseProperties.requestContentLength || responseProperties.responseContentLength || responseProperties.responseHeaders) {
            beacon = this.createTimingBeacon(responseProperties as NetworkResponseProperties, properties as BeaconProperties);
        } else {
            beacon = this.createTimingBeacon(undefined, responseProperties as BeaconProperties);
        }

        if (beacon) {
            this.iot.sendBeacon(beacon);
        }
        Logger.debug("dsm::ExitCall::stop stop")
    }


    createTimingBeacon(responseProperties: NetworkResponseProperties | undefined, properties: BeaconProperties | undefined): IOTBeacon | undefined {

        Logger.debug("dsm::ExitCall::createTimingBeacon start")
        const beacon: IOTBeacon = {
            deviceInfo: this.config.deviceInfo,
            versionInfo: this.config.versionInfo
        }
        if (this.type.toUpperCase() === "HTTP") {
            if (responseProperties) {
                if (this.config.networkRequestProperties) {
                    for (let key in responseProperties) {
                        if (key === "responseHeaders") {
                            this.config.networkRequestProperties[key] = HelperMethods.formatResponseHeaders(responseProperties[key] as StringMap)
                        } else {
                            this.config.networkRequestProperties[key] = responseProperties[key];
                        }

                    }
                }
            }
            var networkRequestEvent = this.config.networkRequestProperties as NetworkRequestEvent;
            networkRequestEvent.timestamp = this.timer.startDT as number;
            networkRequestEvent.duration = this.timer.elapsed;
            networkRequestEvent.stringProperties = this.config.stringProperties;
            networkRequestEvent.datetimeProperties = {
                start: this.timer.startDT as number,
                end: this.timer.endDT as number
            }
            networkRequestEvent = HelperMethods.setPropertiesOnEvent(networkRequestEvent, properties) as NetworkRequestEvent;
            beacon.networkRequestEvents = [networkRequestEvent];

        } else {
            var customevent: CustomEvent = {
                eventType: this.type,
                eventSummary: this.config.deviceInfo.deviceName as string,
                timestamp: this.timer.startDT as number,
                duration: this.timer.elapsed,
                stringProperties: this.config.stringProperties,
                datetimeProperties: {
                    start: this.timer.startDT as number,
                    end: this.timer.endDT as number
                }

            }
            if(customevent.stringProperties) {
                customevent.stringProperties.customEventDuration = (this.timer.elapsed as number).toString() + ' ms';
            } else {
                customevent.stringProperties = {
                    customEventDuration: (this.timer.elapsed as number).toString() + ' ms'
                }
            }

            customevent = HelperMethods.setPropertiesOnEvent(customevent, properties) as CustomEvent;
            beacon.customEvents = [customevent];
        }

        Logger.debug("dsm::ExitCall::createTimingBeacon end")
        return beacon;
    }
    reportError(errorevent: ErrorEvent, properties?: BeaconProperties) {

        Logger.debug("dsm::ExitCall::reportError start")
        const now = new Date();
        const beacon: IOTBeacon = {
            deviceInfo: this.config.deviceInfo,
            versionInfo: this.config.versionInfo
        }
        var err: ErrorEvent = errorevent;
        err.timestamp = now.getTime();
        err.stringProperties = this.config.stringProperties;
        err = HelperMethods.setPropertiesOnEvent(err, properties) as ErrorEvent;
        beacon.errorEvents = [err];
        if (this.iot) {
            this.iot.sendBeacon(beacon);
        }
        Logger.debug("dsm::ExitCall::reportError end")
    }


}
export { ExitCall }; 