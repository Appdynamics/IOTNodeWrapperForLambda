"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const Logger_1 = require("./Logger");
Object.defineProperty(Object.prototype, "getProp", {
    value: function (prop) {
        var key, self = this;
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
    static findEventDataInformation(event, BeaconProperties, configMap) {
        var eventDataFound = false;
        if (configMap) {
            for (var dataKey in configMap) {
                if (event && event.getProp(dataKey)) {
                    eventDataFound = true;
                    Logger_1.Logger.debug(`Found Event Data for : ${dataKey}`);
                    var datatype = configMap[dataKey];
                    switch (datatype) {
                        case index_1.DataType.STRING:
                            if (BeaconProperties.stringProperties)
                                BeaconProperties.stringProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
                            break;
                        case index_1.DataType.DATETIME:
                            if (BeaconProperties.datetimeProperties)
                                BeaconProperties.datetimeProperties[dataKey.toLowerCase() + "_evt"] = new Date(event.getProp(dataKey)).getTime();
                            break;
                        case index_1.DataType.BOOLEAN:
                            if (BeaconProperties.booleanProperties)
                                BeaconProperties.booleanProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
                            break;
                        case index_1.DataType.DOUBLE:
                            if (BeaconProperties.doubleProperties)
                                BeaconProperties.doubleProperties[dataKey.toLowerCase() + "_evt"] = event.getProp(dataKey);
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
            beaconProperties: BeaconProperties
        };
    }
    static goThroughHeaders(res, append, configMap) {
        var headersFound = false;
        var BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && !!res.getHeader(headerKey)) {
                    headersFound = true;
                    Logger_1.Logger.debug(`Found header: ${headerKey}`);
                    var datatype = configMap[headerKey];
                    switch (datatype) {
                        case index_1.DataType.STRING:
                            if (BeaconProperties.stringProperties)
                                BeaconProperties.stringProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
                            break;
                        case index_1.DataType.DATETIME:
                            if (BeaconProperties.datetimeProperties)
                                BeaconProperties.datetimeProperties[headerKey.toLowerCase() + append] = new Date(res.getHeader(headerKey)).getTime();
                            break;
                        case index_1.DataType.BOOLEAN:
                            if (BeaconProperties.booleanProperties)
                                BeaconProperties.booleanProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
                            break;
                        case index_1.DataType.DOUBLE:
                            if (BeaconProperties.doubleProperties)
                                BeaconProperties.doubleProperties[headerKey.toLowerCase() + append] = res.getHeader(headerKey);
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
            beaconProperties: BeaconProperties
        };
    }
    static findEventHeaderInformation(event) {
        return HelperMethods.goThroughHeaders(event, '_evt', global.AppConfig.lambdaHeaders);
    }
    static findResponHeaderInformation(res) {
        return HelperMethods.goThroughHeaders(res, '_res', global.AppConfig.responseHeaders);
    }
    static findRequestHeaderInformation(req) {
        return HelperMethods.goThroughHeaders(req, '_req', global.AppConfig.requestHeaders);
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
        var BeaconProperties = {
            stringProperties: {},
            booleanProperties: {},
            doubleProperties: {},
            datetimeProperties: {}
        };
        BeaconProperties.stringProperties = Object.assign({}, beaconprop1.stringProperties, beaconprop2.stringProperties);
        BeaconProperties.booleanProperties = Object.assign({}, beaconprop1.booleanProperties, beaconprop2.booleanProperties);
        BeaconProperties.doubleProperties = Object.assign({}, beaconprop1.doubleProperties, beaconprop2.doubleProperties);
        BeaconProperties.datetimeProperties = Object.assign({}, beaconprop1.datetimeProperties, beaconprop2.datetimeProperties);
        return BeaconProperties;
    }
    static setPropertiesOnEvent(event, properties) {
        if (properties) {
            if (properties.stringProperties) {
                if (event.stringProperties) {
                    event.stringProperties = Object.assign({}, event.stringProperties, properties.stringProperties);
                }
                else {
                    event.stringProperties = properties.stringProperties;
                }
            }
            if (properties.doubleProperties) {
                if (event.doubleProperties) {
                    event.doubleProperties = Object.assign({}, event.doubleProperties, properties.doubleProperties);
                }
                else {
                    event.doubleProperties = properties.doubleProperties;
                }
            }
            if (properties.booleanProperties) {
                if (event.booleanProperties) {
                    event.booleanProperties = Object.assign({}, event.booleanProperties, properties.booleanProperties);
                }
                else {
                    event.booleanProperties = properties.booleanProperties;
                }
            }
            if (properties.datetimeProperties) {
                if (event.datetimeProperties) {
                    event.datetimeProperties = Object.assign({}, event.datetimeProperties, properties.datetimeProperties);
                }
                else {
                    event.datetimeProperties = properties.datetimeProperties;
                }
            }
        }
        return event;
    }
}
exports.HelperMethods = HelperMethods;
