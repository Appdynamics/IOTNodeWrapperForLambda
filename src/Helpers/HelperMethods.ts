import { StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent, BooleanMap } from "../index"
import { Logger } from "./Logger";
class HelperMethods {
    static isValid(obj: any, prop: string) {
        if (typeof (obj[prop]) === 'undefined') {
            Logger.error(`Missing Property: "${prop}"`)
            return false
        }
        return true;
    }
    static propertyOrDefault(obj: any, prop: string, init: any) {
        if (typeof obj[prop] === 'undefined') {
            obj[prop] = init;
        }
        return obj;
    }
    static goThroughHeaders(res: any, append: string,  configMap: StringMap): any {
        var headersFound = false;
        var BeaconProperties: BeaconProperties = {
            stringProperties: {}
        };
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && res.headers[headerKey]) {
                    headersFound = true;
                    Logger.debug(`Found header: ${headerKey}`);
                    if (BeaconProperties && BeaconProperties.stringProperties) {
                        BeaconProperties.stringProperties[headerKey.toLowerCase() + append] = res.headers[headerKey]
                    }
                }
            }
        }
        return {
            headersFound: headersFound,
            beaconProperties: BeaconProperties

        }
    }
    static findEventHeaderInformation(event: any): any {
        return HelperMethods.goThroughHeaders(event, '_evt', global.AppConfig.lambdaHeaders as StringMap);
    }
    static findResponHeaderInformation(res: any): any {
        return HelperMethods.goThroughHeaders(res, '_res',  global.AppConfig.responseHeaders as StringMap);
    }
    static findRequestHeaderInformation(req: any): any {
        return HelperMethods.goThroughHeaders(req,  '_req', global.AppConfig.requestHeaders as StringMap);
    }
    static formatResponseHeaders(headers: StringMap) {
        var responseHeaders: ResponseHeaders = {};

        if (headers) {
            for (let key in headers) {
                if (responseHeaders[key]) {
                    responseHeaders[key].push(headers[key]);
                } else {
                    responseHeaders[key] = [headers[key]];
                }
            }
            return responseHeaders;
        } else {
            return undefined;
        }

    }
    static setStringPropertiesTogether(map1: StringMap, map2: StringMap) {
        if (map1) {
            if (map2) {
                for (let key in map2) {
                    map1[key] = map2[key] as string;
                }
            }
        }
        return map1;
    }
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined) {
        if (properties) {
            if (properties.stringProperties) {
                if (event.stringProperties) {
                    for (let key in properties.stringProperties) {
                        event.stringProperties[key] = properties.stringProperties[key] as string;
                    }
                } else {
                    event.stringProperties = properties.stringProperties;
                }
            }
            if (properties.doubleProperties) {
                if (event.doubleProperties) {
                    for (let key in properties.doubleProperties) {

                        event.doubleProperties[key] = properties.doubleProperties[key] as number;
                    }
                } else {
                    event.doubleProperties = properties.doubleProperties;
                }
            }
            if (properties.booleanProperties) {
                if (event.booleanProperties) {
                    for (let key in properties.booleanProperties) {

                        event.booleanProperties[key] = properties.booleanProperties[key] as boolean;

                    }
                } else {
                    event.booleanProperties = properties.booleanProperties;
                }
            }
            if (properties.datetimeProperties) {
                if (event.datetimeProperties) {
                    for (let key in properties.datetimeProperties) {

                        event.datetimeProperties[key] = properties.datetimeProperties[key] as number;

                    }
                } else {
                    event.datetimeProperties = properties.datetimeProperties;
                }
            }
        }
        return event;
    }

}
export { HelperMethods }