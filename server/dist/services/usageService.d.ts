export declare const usageService: {
    checkQuota(_userId: string, _plan?: "free" | "premium"): void;
    recordScan(userId: string): number;
    getUsage(userId: string): {
        used: number;
        limit: number;
        remaining: number;
    };
};
