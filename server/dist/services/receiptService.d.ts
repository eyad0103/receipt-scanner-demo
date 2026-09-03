export interface PipelineDebug {
    orientation: {
        angle: 0 | 90 | 180 | 270;
        candidates: unknown[];
    };
    variants: {
        name: string;
        operations: string[];
        score: number;
    }[];
    selectedVariant: string;
    lineCount: number;
    lines: Array<{
        text: string;
        confidence: number;
        bbox: unknown;
        klass?: string;
    }>;
    qrCodes: unknown[];
    rawOcrElements: number;
    handwritingFallback: boolean;
    paddleValidation?: {
        agreement: number;
        issues: string[];
        adjustment: number;
    } | null;
}
export declare function getPipelineDebug(receiptId: string): PipelineDebug | undefined;
export declare class ReceiptService {
    private baseOcr;
    processReceipt(receiptId: string, imageBuffer: Buffer, forcedProvider?: string): Promise<void>;
}
export declare const receiptService: ReceiptService;
