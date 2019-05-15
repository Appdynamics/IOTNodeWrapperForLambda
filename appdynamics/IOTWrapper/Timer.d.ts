declare class Timer {
    start_process_time: [number, number] | undefined;
    startDT: number | undefined;
    end_process_time: [number, number] | undefined;
    endDT: number | undefined;
    elapsed: number | undefined;
    constructor();
    start(): void;
    stop(): void;
}
export { Timer };
