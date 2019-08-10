"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const Logger_1 = require("./Logger");
class HelperMethods {
    static isValid(obj, prop) {
        if (typeof (obj[prop]) === 'undefined') {
            Logger_1.Logger.error(`Missing Property: "${prop}"`);
            return false;
        }
        return true;
    }
    static propertyOrDefault(obj, prop, init) {
        if (typeof obj[prop] === 'undefined') {
            obj[prop] = init;
        }
        return obj;
    }
    static setStringProperty(stringMap, key, value) {
        if (key.length > 24) {
            console.warn('truncating beacon string property to under 24 characters, original key was: ' + key);
            key = key.substr(0, 24);
        }
        if (value && value.length > 128) {
            console.warn('truncating beacon string property value to under 128 characters, key in question is: ' + key);
            value = value.substr(0, 128);
        }
        stringMap[key] = value;
    }
    static findEventDataInformation(event, configMap) {
        var eventDataFound = false;
        var beaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        if (!event) {
            return {
                eventDataFound: false,
                beaconProperties: beaconProperties
            };
        }
        if (configMap) {
            for (var dataKey in configMap) {
                if (event && event[dataKey]) {
                    eventDataFound = true;
                    Logger_1.Logger.debug(`Found Event Data for : ${dataKey}`);
                    var datatype = configMap[dataKey];
                    var dataKey = "evt_" + dataKey;
                    switch (datatype) {
                        case index_1.DataType.STRING:
                            HelperMethods.setStringProperty(beaconProperties.stringProperties, dataKey, event[dataKey]);
                            break;
                        case index_1.DataType.DATETIME:
                            beaconProperties.datetimeProperties[dataKey] = new Date(event[dataKey]).getTime();
                            break;
                        case index_1.DataType.BOOLEAN:
                            beaconProperties.booleanProperties[dataKey] = event[dataKey];
                            break;
                        case index_1.DataType.DOUBLE:
                            beaconProperties.doubleProperties[dataKey] = event[dataKey];
                            break;
                        default:
                            Logger_1.Logger.warn(`DataType "${datatype}" is not a valid datatype`);
                            break;
                    }
                }
            }
        }
        return {
            eventDataFound: eventDataFound,
            beaconProperties: beaconProperties
        };
    }
    static goThroughHeaders(res, prepend, configMap) {
        var headersFound = false;
        var beaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        if (!res) {
            return {
                headersFound: false,
                beaconProperties: beaconProperties
            };
        }
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && res.headers[headerKey]) {
                    headersFound = true;
                    Logger_1.Logger.debug(`Found header: ${headerKey}`);
                    var datatype = configMap[headerKey];
                    var dataKey = prepend + headerKey;
                    switch (datatype) {
                        case index_1.DataType.STRING:
                            HelperMethods.setStringProperty(beaconProperties.stringProperties, dataKey, res.headers[headerKey]);
                            break;
                        case index_1.DataType.DATETIME:
                            beaconProperties.datetimeProperties[dataKey] = new Date(res.headers[headerKey]).getTime();
                            break;
                        case index_1.DataType.BOOLEAN:
                            beaconProperties.booleanProperties[dataKey] = res.headers[headerKey];
                            break;
                        case index_1.DataType.DOUBLE:
                            beaconProperties.doubleProperties[dataKey] = res.headers[headerKey];
                            break;
                        default:
                            Logger_1.Logger.warn(`DataType "${datatype}" is not a valid datatype`);
                            break;
                    }
                }
            }
        }
        return {
            headersFound: headersFound,
            beaconProperties: beaconProperties
        };
    }
    static formatResponseHeaders(headers) {
        var responseHeaders = {};
        if (headers) {
            for (let key in headers) {
                if (responseHeaders[key]) {
                    responseHeaders[key].push(headers[key]);
                }
                else {
                    responseHeaders[key] = [headers[key]];
                }
            }
            return responseHeaders;
        }
        else {
            return undefined;
        }
    }
    static setStringPropertiesTogether(map1, map2) {
        if (map1) {
            if (map2) {
                for (let key in map2) {
                    map1[key] = map2[key];
                }
            }
        }
        return map1;
    }
    static mergeBeaconProperties(beaconprop1, beaconprop2) {
        return {
            stringProperties: Object.assign(beaconprop1.stringProperties, beaconprop2.stringProperties),
            booleanProperties: Object.assign(beaconprop1.booleanProperties, beaconprop2.booleanProperties),
            doubleProperties: Object.assign(beaconprop1.doubleProperties, beaconprop2.doubleProperties),
            datetimeProperties: Object.assign(beaconprop1.datetimeProperties, beaconprop2.datetimeProperties)
        };
    }
    static setPropertiesOnEvent(event, properties) {
        if (properties) {
            if (properties.stringProperties) {
                if (!event.stringProperties) {
                    event.stringProperties = {};
                }
                Object.assign(event.stringProperties, properties.stringProperties);
            }
            if (properties.doubleProperties) {
                if (!event.doubleProperties) {
                    event.doubleProperties = {};
                }
                Object.assign(event.doubleProperties, properties.doubleProperties);
                if (event.doubleProperties) {
                }
                else {
                    event.doubleProperties = properties.doubleProperties;
                }
            }
            if (properties.booleanProperties) {
                if (!event.booleanProperties) {
                    event.booleanProperties = {};
                }
                Object.assign(event.booleanProperties, properties.booleanProperties);
            }
            if (properties.datetimeProperties) {
                if (!event.datetimeProperties) {
                    event.datetimeProperties = {};
                }
                Object.assign(event.datetimeProperties, properties.datetimeProperties);
            }
        }
        return event;
    }
}
exports.HelperMethods = HelperMethods;
