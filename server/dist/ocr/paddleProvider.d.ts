import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class PaddleOcrProvider implements OcrProvider {
    readonly name = "paddle";
    processImage(imageBuffer: Buffer, _opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
