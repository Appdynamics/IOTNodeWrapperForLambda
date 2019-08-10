import { DataTypeMap, DataType, StringMap, NetworkRequestEvent, CustomEvent, BeaconProperties, ResponseHeaders, ErrorEvent, BooleanMap } from "../index"
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

    static setStringProperty(stringMap: StringMap, key:string, value:string){

        if(key.length > 24){
            console.warn('truncating beacon string property to under 24 characters, original key was: ' + key)
            key = key.substr(0, 24)
        }

        if(value && value.length > 128){
            console.warn('truncating beacon string property value to under 128 characters, key in question is: ' + key)
            value = value.substr(0, 128)
        }

        stringMap[key] = value
    }

    static findEventDataInformation(event:any, configMap: DataTypeMap) {
        var eventDataFound = false;
        var beaconProperties: BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        if (configMap) {
            for (var dataKey in configMap) {
                if (event && event[dataKey]) {
                    eventDataFound = true;
                    Logger.debug(`Found Event Data for : ${dataKey}`);
                    var datatype: DataType = configMap[dataKey];
                    var dataKey = dataKey.toLowerCase() + "_evt"
                    switch (datatype) {
                        case DataType.STRING:
                            HelperMethods.setStringProperty(beaconProperties.stringProperties, dataKey, event[dataKey])
                            break;
                        case DataType.DATETIME:
                            beaconProperties.datetimeProperties[dataKey] = new Date(event[dataKey]).getTime();
                            break;
                        case DataType.BOOLEAN:
                            beaconProperties.booleanProperties[dataKey] = event[dataKey];
                            break;
                        case DataType.DOUBLE:
                            beaconProperties.doubleProperties[dataKey] = event[dataKey];
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
            beaconProperties: beaconProperties
        }
    }
    static goThroughHeaders(res: any, append: string, configMap: DataTypeMap): any {
        var headersFound = false;
        var beaconProperties: BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && res.headers[headerKey]) {
                    headersFound = true;
                    Logger.debug(`Found header: ${headerKey}`);
                    var datatype: DataType = configMap[headerKey];
                    switch (datatype) {
                        case DataType.STRING:
                            HelperMethods.setStringProperty(beaconProperties.stringProperties, headerKey.toLowerCase() + append, res.header[headerKey])
                            break;
                        case DataType.DATETIME:
                            beaconProperties.datetimeProperties[headerKey.toLowerCase() + append] = new Date(res.headers[headerKey]).getTime();
                            break;
                        case DataType.BOOLEAN:
                            beaconProperties.booleanProperties[headerKey.toLowerCase() + append] = res.headers[headerKey];
                            break;
                        case DataType.DOUBLE:
                            beaconProperties.doubleProperties[headerKey.toLowerCase() + append] = res.headers[headerKey];
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
            beaconProperties: beaconProperties
        }
    }
    
    /*
    static findEventHeaderInformation(event: any): any {

        return HelperMethods.goThroughHeaders(event, '_evt', global.AppConfig.lambdaHeaders as DataTypeMap);


    }
    static findResponHeaderInformation(res: any): any {

        return HelperMethods.goThroughHeaders(res, '_res', global.AppConfig.responseHeaders as DataTypeMap);

    }
    static findRequestHeaderInformation(req: any): any {

        return HelperMethods.goThroughHeaders(req, '_req', global.AppConfig.requestHeaders as DataTypeMap);

    }*/
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
        return {
            stringProperties: Object.assign(beaconprop1.stringProperties, beaconprop2.stringProperties),
            booleanProperties: Object.assign(beaconprop1.booleanProperties, beaconprop2.booleanProperties),
            doubleProperties: Object.assign(beaconprop1.doubleProperties, beaconprop2.doubleProperties),
            datetimeProperties: Object.assign(beaconprop1.datetimeProperties, beaconprop2.datetimeProperties)
        } as BeaconProperties;
    }
    static setPropertiesOnEvent(event: ErrorEvent | NetworkRequestEvent | CustomEvent, properties: BeaconProperties | undefined) {

        if (properties) {
            if (properties.stringProperties) {
                if (event.stringProperties) {
                    Object.assign(event.stringProperties, properties.stringProperties)
                } else {
                    event.stringProperties = properties.stringProperties;
                }
            }
            if (properties.doubleProperties) {
                if (event.doubleProperties) {
                    Object.assign(event.doubleProperties, properties.doubleProperties)
                } else {
                    event.doubleProperties = properties.doubleProperties;
                }
            }
            if (properties.booleanProperties) {
                if (event.booleanProperties) {
                    Object.assign(event.booleanProperties, properties.booleanProperties)
                } else {
                    event.booleanProperties = properties.booleanProperties;
                }
            }
            if (properties.datetimeProperties) {
                if (event.datetimeProperties) {
                    Object.assign(event.datetimeProperties, properties.datetimeProperties)
                } else {
                    event.datetimeProperties = properties.datetimeProperties;
                }
            }
        }
        return event;
    }

}
export { HelperMethods }