import { BoundingBox, OcrDocument } from "../models/receipt";
export interface OcrProvider {
    readonly name: string;
    processImage(imageBuffer: Buffer, opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
export interface OcrProviderExtended extends OcrProvider {
    detectText?(buffer: Buffer): Promise<Array<{
        text: string;
        confidence: number;
        bbox: BoundingBox;
    }>>;
    getConfidence?(doc: OcrDocument): number;
}
export declare function createBoundingBox(x: number, y: number, width: number, height: number): BoundingBox;
export declare function avgConfidence(doc: OcrDocument): number;
