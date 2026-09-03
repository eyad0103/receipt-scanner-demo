"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = exports.JobQueue = void 0;
class JobQueue {
    constructor() {
        this.jobs = new Map();
        this.handlers = new Map();
        this.queue = [];
        this.processing = false;
    }
    register(type, handler) {
        this.handlers.set(type, handler);
    }
    async add(type, payload, opts) {
        const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const job = {
            id,
            type,
            payload,
            status: "pending",
            attempts: 0,
            maxAttempts: opts?.maxAttempts || 3,
            createdAt: new Date().toISOString(),
        };
        this.jobs.set(id, job);
        this.queue.push(id);
        this.tick();
        return id;
    }
    get(id) {
        return this.jobs.get(id);
    }
    async tick() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            const id = this.queue.shift();
            const job = this.jobs.get(id);
            if (!job)
                continue;
            const handler = this.handlers.get(job.type);
            if (!handler) {
                job.status = "failed";
                job.error = `No handler for ${job.type}`;
                continue;
            }
            job.status = "processing";
            job.startedAt = new Date().toISOString();
            job.attempts++;
            try {
                await handler(job.payload);
                job.status = "completed";
                job.completedAt = new Date().toISOString();
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                job.error = msg;
                if (job.attempts < job.maxAttempts) {
                    job.status = "pending";
                    this.queue.push(id);
                }
                else {
                    job.status = "failed";
                    job.completedAt = new Date().toISOString();
                }
            }
        }
        this.processing = false;
    }
}
exports.JobQueue = JobQueue;
exports.jobQueue = new JobQueue();
