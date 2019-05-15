"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    static goThroughHeaders(res, append, configMap) {
        var headersFound = false;
        var BeaconProperties = {
            stringProperties: {}
        };
        if (configMap) {
            for (var headerKey in configMap) {
                if (res.headers && res.headers[headerKey]) {
                    headersFound = true;
                    Logger_1.Logger.debug(`Found header: ${headerKey}`);
                    if (BeaconProperties && BeaconProperties.stringProperties) {
                        BeaconProperties.stringProperties[headerKey.toLowerCase() + append] = res.headers[headerKey];
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
