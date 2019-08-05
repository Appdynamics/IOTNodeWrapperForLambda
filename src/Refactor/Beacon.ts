import { 
    DeviceInfo,
    VersionInfo,
    CustomEvent,
    NetworkRequestEvent,
    ErrorEvent
} from '../index'

class Beacon {

    deviceInfo: DeviceInfo
    versionInfo: VersionInfo
    networkRequestEvents: NetworkRequestEvent[]
    customEvents: CustomEvent[]
    errorEvents: ErrorEvent[]

    constructor(){
        this.deviceInfo = {
            deviceId:'',
            deviceName: '',
            deviceType: ''
        }
        this.versionInfo = {
            hardwareVersion: undefined,
            firmwareVersion: undefined,
            softwareVersion: undefined,
            opteratingSytemVersion: undefined
        }
        this.networkRequestEvents = []
        this.customEvents = []
        this.errorEvents = []
    }

    addNetworkRequestEvent(networkRequestEvent: NetworkRequestEvent){
        this.networkRequestEvents.push(networkRequestEvent)
    }

    addCustomEvent(customEvent: CustomEvent){
        this.customEvents.push(customEvent)
    }

    addErrorEvent(errorEvent: ErrorEvent){
        this.errorEvents.push(errorEvent)
    }
}

export { Beacon }