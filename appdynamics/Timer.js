"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timer {
    // is there benefit in nano precision? https://nodejs.org/api/process.html#process_process_hrtime_time
    constructor() {
    }
    start() {
        this.startTimestamp = Date.now();
    }
    stop() {
        this.endTimestamp = Date.now();
    }
    getStartTime() {
        return this.startTimestamp || 0;
    }
    getTimeElapsed() {
        if (this.startTimestamp && this.endTimestamp) {
            return this.endTimestamp - this.startTimestamp;
        }
        else if (this.startTimestamp) {
            return Date.now() - this.startTimestamp;
        }
        else {
            return 0;
        }
    }
}
exports.Timer = Timer;
