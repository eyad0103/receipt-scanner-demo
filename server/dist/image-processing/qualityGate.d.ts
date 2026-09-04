export interface QualityIssue {
    code: "TOO_SMALL" | "BLURRY" | "TOO_DARK" | "OVEREXPOSED" | "LOW_CONTRAST" | "RECEIPT_TINY";
    message: string;
    advice: string;
    fatal: boolean;
}
export interface QualityReport {
    score: number;
    width: number;
    height: number;
    meanBrightness: number;
    blurVariance: number;
    contrastStd: number;
    receiptCoverage: number;
    issues: QualityIssue[];
    passed: boolean;
}
export declare function assessQuality(buffer: Buffer): Promise<QualityReport>;
