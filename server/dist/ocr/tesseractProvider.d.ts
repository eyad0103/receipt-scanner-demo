import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class TesseractOcrProvider implements OcrProvider {
    readonly name = "tesseract";
    private fallback;
    processImage(imageBuffer: Buffer, opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
