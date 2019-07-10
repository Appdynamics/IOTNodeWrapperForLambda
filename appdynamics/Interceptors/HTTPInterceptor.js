"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const Logger_1 = require("../Helpers/Logger");
const HelperMethods_1 = require("../Helpers/HelperMethods");
class HTTPInterceptor {
    static init() {
        Logger_1.Logger.debug("dsm::HTTPInterceptor::init");
        const originalRequest = http.request;
        // override the function
        http.request = function wrapMethodRequest(req) {
            Logger_1.Logger.debug("dsm::HTTPInterceptor::wrapMethodRequest start");
            if (req.host && req.host.indexOf("amazonaws") >= 0) {
                Logger_1.Logger.debug("dsm::HTTPInterceptor::amazonaws exit");
                return originalRequest.apply(this, arguments);
            }
            //appdynamics request ignore
            if (req.hostname && req.hostname.indexOf("appdynamics") >= 0) {
                Logger_1.Logger.debug("dsm::HTTPInterceptor::appdynamics exit");
                return originalRequest.apply(this, arguments);
            }
            if (global.txn) {
                var args = Array.prototype.slice.call(arguments);
                try {
                    var anonold = args[1];
                    Logger_1.Logger.debug('Intercepting Request');
                    var http = "http";
                    var port = req.port ? ":" + req.port : "";
                    var path = req.path || "/";
                    var host = (req.hostname ? req.hostname : (req.host ? req.host : ""));
                    if (req._defaultAgent && req._defaultAgent.defaultPort === 443) {
                        http = "https";
                    }
                    Logger_1.Logger.debug(`URL: ${http}://${host}${port}${path}`);
                    var findHeader = HelperMethods_1.HelperMethods.findRequestHeaderInformation(req);
                    if (findHeader.headersFound) {
                        var http1 = global.txn.createHTTPExitCall({
                            url: `${http}://${host}${port}${path}`
                        }, findHeader.beaconProperties.stringProperties);
                    }
                    else {
                        var http1 = global.txn.createHTTPExitCall({
                            url: `${http}://${host}${port}${path}`
                        }, {});
                    }
                    var onRes = function (res) {
                        if (http1) {
                            var findHeader = HelperMethods_1.HelperMethods.findResponHeaderInformation(res);
                            if (findHeader.headersFound) {
                                Logger_1.Logger.debug("dsm::HTTPInterceptor::http1 stop");
                                http1.stop({
                                    statusCode: res.statusCode
                                }, findHeader.beaconProperties.stringProperties);
                            }
                            else {
                                Logger_1.Logger.debug("dsm::HTTPInterceptor::http1 stop2");
                                http1.stop({
                                    statusCode: res.statusCode
                                });
                            }
                        }
                        Logger_1.Logger.debug("dsm::HTTPInterceptor::anonold start");
                        anonold(res);
                        Logger_1.Logger.debug("dsm::HTTPInterceptor::anonold end");
                    };
                    args[1] = onRes;
                }
                catch (err) {
                    Logger_1.Logger.debug('Problem Building Interceptor. Defaulting to original request.');
                    Logger_1.Logger.error(err);
                    return originalRequest.apply(this, arguments);
                }
                Logger_1.Logger.debug("dsm::HTTPInterceptor::originalRequest.apply start");
                var oldreq = originalRequest.apply(this, args);
                Logger_1.Logger.debug("dsm::HTTPInterceptor::originalRequest.apply end");
                oldreq.on('error', (e) => {
                    Logger_1.Logger.debug("dsm::HTTPInterceptor::oldreq on error");
                    Logger_1.Logger.error(e);
                    if (http1) {
                        http1.reportError({
                            name: 'HTTP Error',
                            message: e.message
                        });
                        http1.stop({
                            statusCode: e.statuCode || 501,
                            networkError: e.message
                        });
                    }
                });
                return oldreq;
            }
            else {
                Logger_1.Logger.warn("global.txn is not defined, skipping interception of HTTP exit call.");
            }
            Logger_1.Logger.debug("dsm::HTTPInterceptor::wrapMethodRequest end before apply");
            return originalRequest.apply(this, arguments);
        };
    }
}
exports.HTTPInterceptor = HTTPInterceptor;
