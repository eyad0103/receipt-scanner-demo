export type JobStatus = "pending" | "processing" | "completed" | "failed";
export interface Job<T = unknown> {
    id: string;
    type: string;
    payload: T;
    status: JobStatus;
    attempts: number;
    maxAttempts: number;
    error?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
}
type Handler<T> = (payload: T) => Promise<void>;
export declare class JobQueue {
    private jobs;
    private handlers;
    private queue;
    private processing;
    register<T>(type: string, handler: Handler<T>): void;
    add<T>(type: string, payload: T, opts?: {
        maxAttempts?: number;
    }): Promise<string>;
    get(id: string): Job | undefined;
    private tick;
}
export declare const jobQueue: JobQueue;
export {};
