class Timer {

    startTimestamp: number | undefined
    endTimestamp: number | undefined

    // is there benefit in nano precision? https://nodejs.org/api/process.html#process_process_hrtime_time

    constructor() {
    }

    start() {
        this.startTimestamp = Date.now()
    }

    stop() {
        this.endTimestamp = Date.now()
    }
    
    getStartTime(): number{
        return this.startTimestamp || 0
    }

    getTimeElapsed(): number {
        if(this.startTimestamp && this.endTimestamp){
            return this.endTimestamp - this.startTimestamp
        }
        else if (this.startTimestamp) {
            return Date.now() - this.startTimestamp
        } else {
            return 0
        }
    }

}
export { Timer }; 