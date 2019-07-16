import http = require('http');
import { Logger } from '../Helpers/Logger';
import { BeaconProperties} from '../index';
import { HelperMethods } from '../Helpers/HelperMethods';

class HTTPInterceptor {
    static init() {
        const originalRequest = http.request;
        // override the function
        http.request = function wrapMethodRequest(req: any) {
            
            if (req.host && req.host.indexOf("amazonaws") >= 0) {
                return originalRequest.apply(this, arguments as any );
            }
            //appdynamics request ignore
            if (req.hostname && req.hostname.indexOf("appdynamics") >= 0) {
                return originalRequest.apply(this, arguments as any);
            }

            if (global.txn) {
                var args: any = Array.prototype.slice.call(arguments);
                try {
                    var anonold = args[1];
                    Logger.debug('Intercepting Request');
                    var http = "http";
                    var port = req.port ? ":" + req.port : "";
                    var path = req.path || "/";
                    var host = (req.hostname ? req.hostname : (req.host ? req.host : ""));
                    if (req._defaultAgent && req._defaultAgent.defaultPort === 443) {
                        http = "https"
                    }
                    Logger.debug(`URL: ${http}://${host}${port}${path}`);
                    var findHeader = HelperMethods.findRequestHeaderInformation(req);
                    if(findHeader.headersFound) {
                        var http1 = global.txn.createHTTPExitCall({
                            url: `${http}://${host}${port}${path}`
                        }, findHeader.beaconProperties.stringProperties);
                    } else {
                        var http1 = global.txn.createHTTPExitCall({
                            url: `${http}://${host}${port}${path}`
                        },{});
                    }

                    var onRes = function (res: any) {
                        if (http1) {
                            var findHeader = HelperMethods.findResponHeaderInformation(res);
                            if(findHeader.headersFound) {
                                http1.stop({
                                    statusCode: res.statusCode
                                }, findHeader.beaconProperties.stringProperties);

                            } else {
                                http1.stop({
                                    statusCode: res.statusCode
                                });
                            }

                        }
                        anonold(res);
                    };
                    args[1] = onRes;
                } catch (err) {
                    Logger.debug('Problem Building Interceptor. Defaulting to original request.');
                    return originalRequest.apply(this, arguments as any);
                }

                var oldreq = originalRequest.apply(this, args);
                oldreq.on('error', (e: any) => {
                    if (http1) {
                        http1.reportError({
                            name: 'HTTP Error',
                            message: e.message as string
                        });
                        http1.stop({
                            statusCode: e.statuCode || 501,
                            networkError: e.message
                        });
                    }
                });
                return oldreq;

            } else {
                Logger.warn("global.txn is not defined, skipping interception of HTTP exit call.");
            }

            return originalRequest.apply(this, arguments as any);
        }
    }
}

export { HTTPInterceptor }