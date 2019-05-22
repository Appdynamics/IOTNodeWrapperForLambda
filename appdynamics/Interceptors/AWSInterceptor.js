"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const Logger_1 = require("../Helpers/Logger");
const index_1 = require("../index");
const HelperMethods_1 = require("../Helpers/HelperMethods");
class AWSInterceptor {
    static setProperties(srcproperties, newprop) {
        if (!srcproperties) {
            srcproperties = {};
        }
        if (newprop) {
            for (let key in newprop) {
                srcproperties[key] = newprop[key];
            }
        }
        return srcproperties;
    }
    static init(awsData) {
        var validParams = true;
        try {
            var finalParamMap = this.setProperties(this.defaultParams, awsData);
        }
        catch (err) {
            Logger_1.Logger.error('Problems Setting up Params to monitor');
            validParams = false;
        }
        AWS.events.on('send', function startSend(resp) {
            if (global.txn) {
                var url = resp.request.service.endpoint.href;
                Logger_1.Logger.debug('AWS Send Event');
                var req = resp.request;
                var stringProperties = {};
                try {
                    if (req && req.operation) {
                        stringProperties.operation = req.operation;
                    }
                    if (validParams && req && req.params) {
                        for (var key in req.params) {
                            if (finalParamMap && !!finalParamMap[key]) {
                                var strparam = typeof req.params[key] === "string" ? req.params[key] : JSON.stringify(req.params[key]);
                                stringProperties[key] = strparam;
                            }
                        }
                    }
                }
                catch (err) {
                    stringProperties = {};
                    Logger_1.Logger.error('Invlaid format on one of the properties');
                }
                stringProperties = HelperMethods_1.HelperMethods.setStringPropertiesTogether(stringProperties, HelperMethods_1.HelperMethods.findRequestHeaderInformation(req).beaconProperties.stringProperties);
                var localexit = global.txn.createHTTPExitCall({
                    url: url
                }, stringProperties);
                req.on('complete', function endSend(resp) {
                    Logger_1.Logger.debug('AWS Complete Event');
                    var findHeader = HelperMethods_1.HelperMethods.findResponHeaderInformation(resp);
                    if (localexit) {
                        if (findHeader.headersFound) {
                            localexit.stop({
                                statusCode: resp.httpResponse.statusCode
                            }, findHeader.beaconProperties);
                        }
                        else {
                            localexit.stop({
                                statusCode: resp.httpResponse.statusCode
                            });
                        }
                    }
                }).on('error', function printError(err) {
                    Logger_1.Logger.debug('AWS Error Event');
                    if (localexit) {
                        localexit.reportError({
                            name: err.code,
                            message: err.message
                        });
                    }
                });
            }
            else {
                Logger_1.Logger.warn("global.txn is not defined, skipping interception of AWS exit call.");
            }
        });
    }
}
AWSInterceptor.defaultParams = {
    TopicArn: index_1.DataType.STRING,
    TableName: index_1.DataType.STRING,
    StreamName: index_1.DataType.STRING,
    FunctionName: index_1.DataType.STRING,
    QueueName: index_1.DataType.STRING,
    billingGroupArn: index_1.DataType.STRING,
    billingGroupName: index_1.DataType.STRING,
    thingGroupArn: index_1.DataType.STRING,
    thingGroupName: index_1.DataType.STRING,
    thingName: index_1.DataType.STRING,
    policyName: index_1.DataType.STRING,
    jobId: index_1.DataType.STRING //IOT
};
exports.AWSInterceptor = AWSInterceptor;
