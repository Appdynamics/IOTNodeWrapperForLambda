const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
import { Logger } from '../Helpers/Logger'
import { TextEncoder } from 'util';
import { ExitCall } from '../IOTWrapper/ExitCall';
import { StringMap, BooleanMap, DataTypeMap, DataType } from '../index'
import { HelperMethods } from '../Helpers/HelperMethods';
class AWSInterceptor {
    static defaultParams: DataTypeMap = {
        TopicArn: DataType.STRING, //SNS
        TableName: DataType.STRING, //Dynamo
        StreamName: DataType.STRING, //Kinesis
        FunctionName: DataType.STRING, //Lambda
        QueueName: DataType.STRING, //SQS
        billingGroupArn: DataType.STRING, //IOT
        billingGroupName: DataType.STRING, //IOT
        thingGroupArn: DataType.STRING, //IOT
        thingGroupName: DataType.STRING, //IOT
        thingName: DataType.STRING, //IOT
        policyName: DataType.STRING, //IOT
        jobId: DataType.STRING //IOT
    }

    static setProperties(srcproperties: DataTypeMap, newprop: DataTypeMap): DataTypeMap {
        if (!srcproperties) {
            srcproperties = {}
        }
        if (newprop) {
            for (let key in newprop) {
                srcproperties[key] = newprop[key];
            }
        }
        return srcproperties
    }
    static init(awsData?:DataTypeMap) {
        Logger.debug("dsm::AWSInterceptor::init")
        var validParams = true;
        try {
            var finalParamMap = this.setProperties(this.defaultParams, awsData as DataTypeMap);
        } catch (err) {
            Logger.error(err)
            Logger.error('Problems Setting up Params to monitor')
            validParams = false;
        }

        AWS.events.on('send', function startSend(resp: any) {
            Logger.debug("dsm::AWSInterceptor::send")
            if (global.txn) {
                Logger.debug("dsm::AWSInterceptor::send.txn=true")
                var url = resp.request.service.endpoint.href;
                Logger.debug("dsm::AWSInterceptor::url::" + url)
                Logger.debug('AWS Send Event');
                var req = resp.request;
                var stringProperties: StringMap = {};
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
                } catch (err) {
                    Logger.debug("dsm::AWSInterceptor::send:error")
                    Logger.error(err)
                    stringProperties = {};
                    Logger.error('Invlaid format on one of the properties');
                }
                stringProperties = HelperMethods.setStringPropertiesTogether(stringProperties, HelperMethods.findRequestHeaderInformation(req).beaconProperties.stringProperties);
                var localexit = global.txn.createHTTPExitCall({
                    url: url
                }, stringProperties) as ExitCall;
                Logger.debug("dsm::AWSInterceptor::localexit")
                req.on('complete', function endSend(resp: any) {
                    Logger.debug("dsm::AWSInterceptor::complete")
                    Logger.debug('AWS Complete Event');
                    var findHeader =  HelperMethods.findResponHeaderInformation(resp);
                    if (localexit) {
                        Logger.debug("dsm::AWSInterceptor::localexit=true")
                        if(findHeader.headersFound) {
                        localexit.stop({
                            statusCode: resp.httpResponse.statusCode
                        },
                        findHeader.beaconProperties);
                        Logger.debug("dsm::AWSInterceptor::localexit=stop1")
                    } else {
                        Logger.debug("dsm::AWSInterceptor::localexit=false")
                        localexit.stop({
                            statusCode: resp.httpResponse.statusCode
                        });
                        Logger.debug("dsm::AWSInterceptor::localexit=stop2")
                    }

                    }
                }).on('error', function printError(err: any) {
                    Logger.debug("dsm::AWSInterceptor::error")
                    Logger.error(err)
                    Logger.debug('AWS Error Event');
                    if (localexit) {
                        localexit.reportError({
                            name: err.code,
                            message: err.message
                        });
                    }


                });
            } else {
                Logger.warn("global.txn is not defined, skipping interception of AWS exit call.");
            }
        });
    }
}


export { AWSInterceptor }