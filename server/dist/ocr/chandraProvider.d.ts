import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class ChandraProvider implements OcrProvider {
    readonly name = "chandra";
    processImage(imageBuffer: Buffer, _opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
