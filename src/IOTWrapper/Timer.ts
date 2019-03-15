class Timer {
    start_process_time: [number, number] | undefined;
    startDT: number | undefined;
    end_process_time: [number, number] | undefined;
    endDT: number | undefined;
    elapsed: number | undefined;
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
export { Timer }; 