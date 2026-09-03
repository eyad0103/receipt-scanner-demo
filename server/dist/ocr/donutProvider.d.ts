import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class DonutProvider implements OcrProvider {
    readonly name = "donut";
    processImage(imageBuffer: Buffer, _opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
