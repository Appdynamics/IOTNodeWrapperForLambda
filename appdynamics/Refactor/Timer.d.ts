declare class Timer {
    startTimestamp: number | undefined;
    endTimestamp: number | undefined;
    constructor();
    start(): void;
    stop(): void;
    getStartTime(): number;
    getTimeElapsed(): number;
}
export { Timer };
