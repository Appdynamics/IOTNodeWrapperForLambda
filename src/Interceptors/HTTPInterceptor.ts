
import http = require('http');
import { Logger } from '../Helpers/Logger';
import { BeaconProperties} from '../index';
import { HelperMethods } from '../Helpers/HelperMethods';
class HTTPInterceptor {
    static init() {
        Logger.debug("dsm::HTTPInterceptor::init")
        const originalRequest = http.request;
        // override the function
        http.request = function wrapMethodRequest(req: any) {
            Logger.debug("dsm::HTTPInterceptor::wrapMethodRequest start")
            if (req.host && req.host.indexOf("amazonaws") >= 0) {
                Logger.debug("dsm::HTTPInterceptor::amazonaws exit")
                return originalRequest.apply(this, arguments as any );
            }
            //appdynamics request ignore
            if (req.hostname && req.hostname.indexOf("appdynamics") >= 0) {
                Logger.debug("dsm::HTTPInterceptor::appdynamics exit")
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
                                Logger.debug("dsm::HTTPInterceptor::http1 stop")
                                http1.stop({
                                    statusCode: res.statusCode
                                }, findHeader.beaconProperties.stringProperties);

                            } else {
                                Logger.debug("dsm::HTTPInterceptor::http1 stop2")
                                http1.stop({
                                    statusCode: res.statusCode
                                });
                            }
                        }
                        Logger.debug("dsm::HTTPInterceptor::anonold start")
                        anonold(res);
                        Logger.debug("dsm::HTTPInterceptor::anonold end")
                    };
                    args[1] = onRes;
                } catch (err) {
                    Logger.debug('Problem Building Interceptor. Defaulting to original request.');
                    Logger.error(err)
                    return originalRequest.apply(this, arguments as any);
                }

                Logger.debug("dsm::HTTPInterceptor::originalRequest.apply start")
                var oldreq = originalRequest.apply(this, args);
                Logger.debug("dsm::HTTPInterceptor::originalRequest.apply end")
                oldreq.on('error', (e: any) => {
                    Logger.debug("dsm::HTTPInterceptor::oldreq on error")
                    Logger.error(e)
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


            Logger.debug("dsm::HTTPInterceptor::wrapMethodRequest end before apply")
            return originalRequest.apply(this, arguments as any);
        }
    }
}

export { HTTPInterceptor }