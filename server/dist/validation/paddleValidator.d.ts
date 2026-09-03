import { OcrDocument, ParsedReceipt } from "../models/receipt";
export interface PaddleValidation {
    agreement: number;
    paddleDoc: OcrDocument | null;
    paddleParsed: ParsedReceipt | null;
    issues: string[];
    confidenceAdjustment: number;
}
export declare function validateWithPaddle(primaryDoc: OcrDocument, primaryParsed: ParsedReceipt, imageBuffer: Buffer): Promise<PaddleValidation>;
