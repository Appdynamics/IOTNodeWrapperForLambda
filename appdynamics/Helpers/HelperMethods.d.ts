import { StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent, BooleanMap } from "../index";
declare class HelperMethods {
    static isValid(obj: any, prop: string): boolean;
    static propertyOrDefault(obj: any, prop: string, init: any): any;
    static goThroughHeaders(res: any, append: string, configMap: BooleanMap): any;
    static findEventHeaderInformation(event: any): any;
    static findResponHeaderInformation(res: any): any;
    static findRequestHeaderInformation(req: any): any;
    static formatResponseHeaders(headers: StringMap): ResponseHeaders | undefined;
    static setStringPropertiesTogether(map1: StringMap, map2: StringMap): StringMap;
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined): ErrorEvent | NetworkRequestEvent | CustomEvent;
}
export { HelperMethods };
