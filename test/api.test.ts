import { Api } from '../src/Refactor/Api'
import { Beacon } from '../src/Refactor/Beacon';
import { 
    DeviceInfo,
    VersionInfo,
    CustomEvent,
    NetworkRequestEvent,
    ErrorEvent
} from '../src/index'
import { fail } from 'assert';
import { isError } from 'util';
/*
describe('api', function() {

    it('isAppEnabled', function() {

    }); 

    it('validateBeacons_valid', function() {
        var beacon = new Beacon()
        beacon.deviceInfo.deviceId = 'unitTest_deviceId'
        beacon.deviceInfo.deviceName = 'unitTest_deviceName'
        beacon.deviceInfo.deviceType = 'unitTest_deviceType'
        var customEvent:CustomEvent = {
            eventSummary: 'unitTest_eventSummary',
            eventType: 'unitTest_eventType',
            timestamp: Date.now()
        }
        beacon.addCustomEvent(customEvent)

        var api = new Api('AD-AAB-AAR-SKR')
        api.validateBeacons([beacon])
            .then((response) => console.log(response))
            .catch((err) => fail(err))
    }); 

    it('validateBeacons_invalid', function() {
        var beacon = new Beacon()
        var api = new Api('AD-AAB-AAR-SKR')

        api.validateBeacons([beacon])
            .then((response) => fail('not supposed to succeed'))
            .catch((err) => console.log(err))
    }); 

    it('sendBeacons', function() {
        var beacon = new Beacon()
        beacon.deviceInfo.deviceId = 'unitTest_deviceId'
        beacon.deviceInfo.deviceName = 'unitTest_deviceName'
        beacon.deviceInfo.deviceType = 'unitTest_deviceType'
        var customEvent:CustomEvent = {
            eventSummary: 'unitTest_eventSummary',
            eventType: 'unitTest_eventType',
            timestamp: Date.now()
        }
        beacon.addCustomEvent(customEvent)

        var api = new Api('AD-AAB-AAR-SKR')
        api.sendBeacons([beacon])
            .then((response) => console.log(response))
            .catch((err) => fail(err))
    }); 

});
*/