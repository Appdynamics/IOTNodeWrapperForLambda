import { Beacon } from './Beacon';
declare class Api {
    private apiUrl;
    private hostName;
    constructor(appKey: string);
    isAppEnabled(): boolean;
    validateBeacons(beacons: Beacon[]): Promise<unknown>;
    sendBeacons(beacons: Beacon[]): Promise<unknown>;
}
export { Api };
