"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timer {
    constructor() {
        this.start();
    }
    start() {
        this.startDT = (new Date()).getTime();
        this.start_process_time = process.hrtime();
    }
    stop() {
        this.end_process_time = process.hrtime(this.start_process_time);
        this.endDT = (new Date()).getTime();
        this.elapsed = Math.round((this.end_process_time[0] * 1e9 + this.end_process_time[1]) / 1e6);
    }
}
exports.Timer = Timer;
