import { OcrDocument, ScoredField } from "../models/receipt";
export declare function extractMerchant(doc: OcrDocument): ScoredField<string | null>;
export declare function extractDate(doc: OcrDocument): ScoredField<string | null>;
export declare function extractTime(doc: OcrDocument): ScoredField<string | null>;
export declare function extractCurrency(doc: OcrDocument): string;
export declare function extractMoneyField(doc: OcrDocument, predicate: (text: string) => boolean): ScoredField<number | null>;
export declare function extractMoneyFieldFromLines(lines: Array<{
    text: string;
    confidence: number;
}>, predicate: (text: string) => boolean): ScoredField<number | null>;
export declare function extractPaymentMethod(doc: OcrDocument): ScoredField<string | null>;
export declare function extractReceiptNumber(doc: OcrDocument): ScoredField<string | null>;
