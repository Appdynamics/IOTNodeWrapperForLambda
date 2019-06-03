import { DataTypeMap, DataType, StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent, BooleanMap } from "../index"
import { Logger } from "./Logger";
Object.defineProperty(Object.prototype, "getProp", {
    value: function (prop:string) {
        var key,self = this;
        for (key in self) {
            if (key.toLowerCase() == prop.toLowerCase()) {
                return self[key];
            }
        }
    },
    //this keeps jquery happy
    enumerable: false
});
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
    static findEventDataInformation(event:any, BeaconProperties:BeaconProperties, configMap: DataTypeMap) {
        var eventDataFound = false;
        if (configMap) {
            for (var dataKey in configMap) {
                if (event && event.getProp(dataKey)) {
                    eventDataFound = true;
                    Logger.debug(`Found Event Data for : ${dataKey}`);
                    var datatype: DataType = configMap[dataKey];
                    switch (datatype) {
                        case DataType.STRING:
                            if (BeaconProperties.stringProperties)
                                BeaconProperties.stringProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
                            break;
                        case DataType.DATETIME:
                            if (BeaconProperties.datetimeProperties)
                                BeaconProperties.datetimeProperties[dataKey.toLowerCase() + "_evt"] = new Date(event.getProp(dataKey)).getTime();
                            break;
                        case DataType.BOOLEAN:
                            if (BeaconProperties.booleanProperties)
                                BeaconProperties.booleanProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
                            break;
                        case DataType.DOUBLE:
                            if (BeaconProperties.doubleProperties)
                                BeaconProperties.doubleProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
                            break;
                        default:
                            Logger.warn(`DataType "${datatype}" is not a valid datatype`);
                            break;
                    }

                }
            }
        }
        return {
            eventDataFound: eventDataFound,
            beaconProperties: BeaconProperties

        }
    }
    static goThroughHeaders(res: any, append: string, configMap: DataTypeMap): any {
        var headersFound = false;
        var BeaconProperties: BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}

        };
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && !!res.getHeader(headerKey)) {
                    headersFound = true;
                    Logger.debug(`Found header: ${headerKey}`);
                    var datatype: DataType = configMap[headerKey];
                    switch (datatype) {
                        case DataType.STRING:
                            if (BeaconProperties.stringProperties)
                                BeaconProperties.stringProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
                            break;
                        case DataType.DATETIME:
                            if (BeaconProperties.datetimeProperties)
                                BeaconProperties.datetimeProperties[headerKey.toLowerCase() + append] = new Date(res.getHeader(headerKey)).getTime();
                            break;
                        case DataType.BOOLEAN:
                            if (BeaconProperties.booleanProperties)
                                BeaconProperties.booleanProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
                            break;
                        case DataType.DOUBLE:
                            if (BeaconProperties.doubleProperties)
                                BeaconProperties.doubleProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
                            break;
                        default:
                            Logger.warn(`DataType "${datatype}" is not a valid datatype`);
                            break;
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

        return HelperMethods.goThroughHeaders(event, '_evt', global.AppConfig.lambdaHeaders as DataTypeMap);


    }
    static findResponHeaderInformation(res: any): any {

        return HelperMethods.goThroughHeaders(res, '_res', global.AppConfig.responseHeaders as DataTypeMap);

    }
    static findRequestHeaderInformation(req: any): any {

        return HelperMethods.goThroughHeaders(req, '_req', global.AppConfig.requestHeaders as DataTypeMap);

    }
    // static findEventDataInformation(event, properties: string[]) {

    //     if (properties) {
    //         for (let prop in properties) {
    //             if (responseHeaders[key]) {
    //                 responseHeaders[key].push(headers[key]);
    //             } else {
    //                 responseHeaders[key] = [headers[key]];
    //             }
    //         }
    //         return responseHeaders;
    //     } else {
    //         return undefined;
    //     }

    // }
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

    static mergeBeaconProperties(beaconprop1:BeaconProperties, beaconprop2:BeaconProperties) {
        var BeaconProperties: BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}

        };
        BeaconProperties.stringProperties = {...beaconprop1.stringProperties, ...beaconprop2.stringProperties }
        BeaconProperties.booleanProperties = {...beaconprop1.booleanProperties, ...beaconprop2.booleanProperties }
        BeaconProperties.doubleProperties = {...beaconprop1.doubleProperties, ...beaconprop2.doubleProperties }
        BeaconProperties.datetimeProperties = {...beaconprop1.datetimeProperties, ...beaconprop2.datetimeProperties }
        
        return BeaconProperties;
    }
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined) {
        if (properties) {
            if (properties.stringProperties) {
                if (event.stringProperties) {
                    event.stringProperties = { ...event.stringProperties, ...properties.stringProperties }
                } else {
                    event.stringProperties = properties.stringProperties;
                }
            }
            if (properties.doubleProperties) {
                if (event.doubleProperties) {
                    event.doubleProperties = { ...event.doubleProperties, ...properties.doubleProperties }
                } else {
                    event.doubleProperties = properties.doubleProperties;
                }
            }
            if (properties.booleanProperties) {
                if (event.booleanProperties) {
                    event.booleanProperties = { ...event.booleanProperties, ...properties.booleanProperties }
                } else {
                    event.booleanProperties = properties.booleanProperties;
                }
            }
            if (properties.datetimeProperties) {
                if (event.datetimeProperties) {
                    event.datetimeProperties = { ...event.datetimeProperties, ...properties.datetimeProperties }
                } else {
                    event.datetimeProperties = properties.datetimeProperties;
                }
            }
        }
        return event;
    }

}
export { HelperMethods }