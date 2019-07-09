import { IOT } from "./IOT";
import { Timer } from "./Timer"
import { HelperMethods } from "../Helpers/HelperMethods"
import { ExitCall } from  "./ExitCall"
import { NetworkRequestEvent, TransactionConfiguration, IOTBeacon, BeaconProperties, ErrorEvent, CustomEvent, StringMap, ExitCallMap, BooleanMap, NumberMap } from "../index"
import { Logger } from "../Helpers/Logger"
import { eventNames } from "cluster";

class Transaction {
    config: TransactionConfiguration;
    isValid: boolean;
    iot?: IOT;
    timer: Timer;
    exitCalls: ExitCallMap;
    version: string = "1.0.1";
    beaconProperties: BeaconProperties;

    constructor(config: TransactionConfiguration, beaconProperties? : BeaconProperties) {
        Logger.debug("dsm::Transaction::ctor start")
        this.config = config;
        var cust_config = config;
        this.isValid = true;
        this.timer = new Timer();
        this.exitCalls = {};

        this.beaconProperties = {
            stringProperties: {},
            datetimeProperties: {},
            booleanProperties: {},
            doubleProperties: {}
            
        }
        if(beaconProperties){
            this.customData(beaconProperties);
        }

        if (!HelperMethods.isValid(cust_config, 'transactionName')) {
            this.isValid = false;
            Logger.error(`Invalid or missing transactionName`)
            return;
        }
        if (!HelperMethods.isValid(cust_config, 'transactionType')) {
            this.isValid = false;
            Logger.error(`Invalid or missing transactionType`)
            return;
        }
        if(cust_config.transactionType.length > 24) {
            cust_config.transactionType = cust_config.transactionType.substring(0,23);
            Logger.warn(`transactionType longer than 24 characters.  truncating to: ${cust_config.transactionType}`);
        }

        if (!HelperMethods.isValid(cust_config, 'appKey')) {
            Logger.error(`Invalid or missing appKey`);
            this.isValid = false;
            return;
        }

        cust_config = HelperMethods.propertyOrDefault(cust_config, 'collector', 'iot-col.eum-appdynamics.com') as TransactionConfiguration;
        cust_config = HelperMethods.propertyOrDefault(cust_config, "uniqueClientId", (new Date()).getTime().toString()) as TransactionConfiguration
        cust_config = HelperMethods.propertyOrDefault(cust_config, "debug", false) as TransactionConfiguration
        this.config = cust_config;

        this.iot = new IOT({
            appKey: this.config.appKey,
            collector: this.config.collector as string
        });
        Logger.debug("dsm::Transaction::ctor end")
    }

    customData(properties?: BeaconProperties) {
        Logger.debug("dsm::Transaction::customData start")
        if(!properties){
            return;
        }
        var sp:StringMap = this.beaconProperties.stringProperties as StringMap;
        var bp:BooleanMap= this.beaconProperties.booleanProperties as BooleanMap;
        var dp:NumberMap = this.beaconProperties.doubleProperties as NumberMap;
        var dtp:NumberMap = this.beaconProperties.datetimeProperties as NumberMap;

        this.beaconProperties.stringProperties  = {...sp, ...properties.stringProperties }
        this.beaconProperties.booleanProperties  = {...bp, ...properties.booleanProperties }
        this.beaconProperties.doubleProperties  = {...dp, ...properties.doubleProperties }
        this.beaconProperties.datetimeProperties  = {...dtp, ...properties.datetimeProperties }

        Logger.debug("dsm::Transaction::customData end")
    }

    stop(properties?: BeaconProperties) {
        Logger.debug("dsm::Transaction::stop start")
        if(this.timer.end_process_time) {
            Logger.warn('Already called stop on transaction.')
            return;
        }
        this.timer.stop();
        const beacon: IOTBeacon | undefined = this.createTimingBeacon(properties as BeaconProperties);
        if (this.isValid && beacon && this.iot) {
            this.iot.sendBeacon(beacon);
        }
        Logger.debug("dsm::Transaction::stop stop")
    }
    reportError(errorevent: ErrorEvent, properties?: BeaconProperties) {
        Logger.debug("dsm::Transaction::reportError start")
        if (this.isValid) {
            const now = new Date();
            const beacon: IOTBeacon = {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.uniqueClientId
                },
                versionInfo: {
                    softwareVersion: this.config.version
                }

            }

            var err: ErrorEvent = errorevent;

            err.timestamp = now.getTime();
            err.stringProperties = {
                transactionName: this.config.transactionName as string,
                eventType: this.config.transactionType,
                uniqueClientId: this.config.uniqueClientId as string
            }
            this.customData(properties);
            err = HelperMethods.setPropertiesOnEvent(err, this.beaconProperties) as ErrorEvent;

            beacon.errorEvents = [err];
            if (this.iot) {
                this.iot.sendBeacon(beacon);
            }
        } else {
            Logger.error(`Transaction not valid.  Exit call not created`);
        }

        Logger.debug("dsm::Transaction::reportError end")
    }

    createTimingBeacon(properties: BeaconProperties): IOTBeacon | undefined {
        Logger.debug("dsm::Transaction::createTimingBeacon start")
        if (this.isValid) {
            const beacon: IOTBeacon = {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.uniqueClientId
                },
                versionInfo: {
                    softwareVersion: this.config.version
                }
            }
            var customevent: CustomEvent = {
                eventType: this.config.transactionType,
                eventSummary: this.config.transactionName as string,
                timestamp: this.timer.startDT as number,
                duration: this.timer.elapsed,
                stringProperties: {
                    uniqueClientId: this.config.uniqueClientId as string,
                    customEventDuration: (this.timer.elapsed as number).toString() + ' ms'
                },
                datetimeProperties: {
                    start: this.timer.startDT as number,
                    end: this.timer.endDT as number
                }
            }
            this.customData(properties)
            if(this.beaconProperties) {
                customevent = HelperMethods.setPropertiesOnEvent(customevent, this.beaconProperties) as CustomEvent;
            }
            ///customevent = HelperMethods.setPropertiesOnEvent(customevent, properties) as CustomEvent;
            beacon.customEvents = [customevent];
            Logger.debug("dsm::Transaction::createTimingBeacon end")
            return beacon;
        } else {
            Logger.debug("dsm::Transaction::createTimingBeacon end")
            return undefined;
        }
    }
    createCustomExitCall(type: string, stringProperties: StringMap) {
        Logger.debug("dsm::Transaction::createCustomExitCall start")
        if (this.isValid) {
            const exitcall = new ExitCall(this.iot as IOT, type, {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.uniqueClientId
                },
                versionInfo: {
                    softwareVersion: this.config.version
                },
                stringProperties: HelperMethods.setStringPropertiesTogether(this.beaconProperties.stringProperties as StringMap, stringProperties as StringMap),
                uniqueClientId: this.config.uniqueClientId as string
            });
            Logger.debug("dsm::Transaction::createCustomExitCall end")
            return exitcall;
        } else {
            Logger.error(`Transaction not valid.  Exit call not created`);
        }
        Logger.debug("dsm::Transaction::createCustomExitCall end")
    }
    createHTTPExitCall(networkRequestProperties: NetworkRequestEvent, stringProperties: StringMap) {
        Logger.debug("dsm::Transaction::createHTTPExitCall start")
        if (this.isValid) {
            const exitCall: ExitCall = new ExitCall(this.iot as IOT, "HTTP", {
                deviceInfo: {
                    deviceName: this.config.transactionName,
                    deviceType: this.config.transactionType,
                    deviceId: this.config.uniqueClientId
                },
                versionInfo: {
                    softwareVersion: this.config.version
                },
                stringProperties: HelperMethods.setStringPropertiesTogether(this.beaconProperties.stringProperties as StringMap, stringProperties),
                networkRequestProperties: networkRequestProperties,
                uniqueClientId: this.config.uniqueClientId as string
            });
            Logger.debug("dsm::Transaction::createHTTPExitCall end")
            return exitCall;
        } else {
            Logger.error(`Transaction not valid.  Exit call not created`);
        }
        Logger.debug("dsm::Transaction::createHTTPExitCall start")
    }

}

export { Transaction }; 