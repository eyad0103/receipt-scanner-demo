import { ParsedReceipt } from "../models/receipt";
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    confidenceAdjustment: number;
}
export declare function validateReceipt(parsed: ParsedReceipt): ValidationResult;
export interface ReconcileResult {
    fixedItems: Array<{
        name: string;
        from: number;
        to: number;
    }>;
    filledTotal: number | null;
    filledSubtotal: number | null;
    balanced: boolean;
    warnings: string[];
    confidenceBoost: number;
}
export declare function reconcileArithmetic(parsed: ParsedReceipt): ReconcileResult;
export declare function computeConfidence(parsed: ParsedReceipt, validation: ValidationResult): number;
export declare function needsReview(confidence: number, validation: ValidationResult): boolean;
