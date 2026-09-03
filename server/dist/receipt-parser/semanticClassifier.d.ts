import { ReconstructedLine } from "./lineReconstructor";
export type LineClass = "MERCHANT" | "DATE" | "TIME" | "ITEM" | "QTY_PRICE" | "SUBTOTAL" | "TAX" | "DISCOUNT" | "TOTAL" | "PAYMENT" | "RECEIPT_ID" | "UNKNOWN";
export interface ClassifiedLine extends ReconstructedLine {
    klass: LineClass;
    classConfidence: number;
}
export declare function classifyLines(lines: ReconstructedLine[]): ClassifiedLine[];
