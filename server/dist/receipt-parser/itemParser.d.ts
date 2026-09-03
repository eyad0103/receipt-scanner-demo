import { OcrDocument, OcrElement } from "../models/receipt";
export interface ParsedItem {
    name: string;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number;
    confidence: number;
    boundingBox?: OcrElement["boundingBox"];
}
export declare function parseItems(doc: OcrDocument): ParsedItem[];
export declare function parseItemsFromLines(lines: Array<{
    text: string;
    confidence: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    klass?: string;
}>, doc: OcrDocument): ParsedItem[];
