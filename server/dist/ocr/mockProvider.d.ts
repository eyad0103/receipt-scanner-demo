import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class MockOcrProvider implements OcrProvider {
    readonly name = "mock";
    processImage(imageBuffer: Buffer, _opts?: {
        languageHint?: string;
    }): Promise<OcrDocument>;
}
