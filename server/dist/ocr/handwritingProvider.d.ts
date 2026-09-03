import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class HandwritingOcrProvider implements OcrProvider {
    private primary;
    readonly name = "handwriting-fallback";
    constructor(primary: OcrProvider);
    processImage(imageBuffer: Buffer, opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
