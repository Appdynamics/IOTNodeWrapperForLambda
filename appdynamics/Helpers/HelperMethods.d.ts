import { DataTypeMap, StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent } from "../index";
declare class HelperMethods {
    static isValid(obj: any, prop: string): boolean;
    static propertyOrDefault(obj: any, prop: string, init: any): any;
    static setStringProperty(stringMap: StringMap, key: string, value: string): void;
    static findEventDataInformation(event: any, configMap: DataTypeMap): {
        eventDataFound: boolean;
        beaconProperties: BeaconProperties;
    };
    static goThroughHeaders(res: any, prepend: string, configMap: DataTypeMap): any;
    static formatResponseHeaders(headers: StringMap): ResponseHeaders | undefined;
    static setStringPropertiesTogether(map1: StringMap, map2: StringMap): StringMap;
    static mergeBeaconProperties(beaconprop1: BeaconProperties, beaconprop2: BeaconProperties): BeaconProperties;
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined): CustomEvent | NetworkRequestEvent | ErrorEvent;
}
export { HelperMethods };
