import { ParsedReceipt } from "../models/receipt";
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    confidenceAdjustment: number;
}
export declare function validateReceipt(parsed: ParsedReceipt): ValidationResult;
export declare function computeConfidence(parsed: ParsedReceipt, validation: ValidationResult): number;
export declare function needsReview(confidence: number, validation: ValidationResult): boolean;
