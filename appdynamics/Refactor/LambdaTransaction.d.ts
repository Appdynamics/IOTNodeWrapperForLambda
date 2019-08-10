import { NetworkRequestEvent, BeaconProperties, AppConfig } from '../index';
declare enum LAMBDA_TRANSACTION_STATE {
    INIT = 0,
    STARTED = 1,
    STOPPED = 2,
    TRANSACTION_ERROR = 3,
    VALIDATION_ERROR = 4,
    SEND_BEACON_ERROR = 5,
    APP_DISABLED = 6
}
export interface LambdaContext {
    functionName: any;
    functionVersion: any;
    invokedFunctionArn: any;
    memoryLimitInMB: any;
    awsRequestId: any;
    logGroupName: any;
    logStreamName: any;
    identity: {
        cognitoIdentityId: any;
        cognitoIdentityPoolId: any;
    };
    clientContext: {
        client: {
            installation_id: any;
            app_title: any;
            app_version_name: any;
            app_version_code: any;
            app_package_name: any;
        };
        env: {
            platform_version: any;
            platform: any;
            make: any;
            model: any;
            locale: any;
        };
        Custom: any;
    };
    callbackWaitsForEmptyEventLoop: boolean;
}
declare class LambdaTransaction {
    private state;
    private beacon;
    private lambdaContext;
    private timer;
    private api;
    private debug;
    private appKey;
    private globalBeaconProperties;
    private config;
    constructor(config: AppConfig);
    getState(): LAMBDA_TRANSACTION_STATE;
    getStateFormatted(): LAMBDA_TRANSACTION_STATE | "INIT" | "STARTED" | "STOPPED" | "TRANSACTION_ERROR" | "VALIDATION_ERROR" | "SEND_BEACON_ERROR" | "APP_DISABLED";
    start(lambdaEvent: any, lambdaContext: LambdaContext): void;
    customData(properties?: BeaconProperties): void;
    private instrumentHttpRequestFunction;
    getUrlFromOptions(options: any): string;
    stop(): void;
    handleInvalidBeacon(): void;
    sendBeacon(): void;
    handleSendBeaconSuccess(response: any): void;
    handleSendBeaconError(error: Error): void;
    addError(error: Error): void;
    addNetworkRequest(networkRequestEvent: NetworkRequestEvent): void;
}
export { LambdaTransaction };
