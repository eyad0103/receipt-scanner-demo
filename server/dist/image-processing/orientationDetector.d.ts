import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "../ocr/types";
export interface OrientationCandidate {
    angle: 0 | 90 | 180 | 270;
    score: number;
    doc: OcrDocument | null;
    metrics: {
        regions: number;
        avgConfidence: number;
        wordCount: number;
        numericTokens: number;
        spatialConsistency: number;
    };
}
export declare function detectBestOrientation(original: Buffer, provider: OcrProvider, opts?: {
    languageHint?: string;
}): Promise<{
    angle: 0 | 90 | 180 | 270;
    candidates: OrientationCandidate[];
    bestDoc: OcrDocument | null;
}>;
export declare function correctOrientation(buffer: Buffer, angle: 0 | 90 | 180 | 270): Promise<Buffer>;
