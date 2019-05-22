import { DataTypeMap, StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent } from "../index";
declare class HelperMethods {
    static isValid(obj: any, prop: string): boolean;
    static propertyOrDefault(obj: any, prop: string, init: any): any;
    static findEventDataInformation(event: any, BeaconProperties: BeaconProperties, configMap: DataTypeMap): {
        eventDataFound: boolean;
        beaconProperties: BeaconProperties;
    };
    static goThroughHeaders(res: any, append: string, configMap: DataTypeMap): any;
    static findEventHeaderInformation(event: any): any;
    static findResponHeaderInformation(res: any): any;
    static findRequestHeaderInformation(req: any): any;
    static formatResponseHeaders(headers: StringMap): ResponseHeaders | undefined;
    static setStringPropertiesTogether(map1: StringMap, map2: StringMap): StringMap;
    static mergeBeaconProperties(beaconprop1: BeaconProperties, beaconprop2: BeaconProperties): BeaconProperties;
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined): ErrorEvent | NetworkRequestEvent | CustomEvent;
}
export { HelperMethods };
