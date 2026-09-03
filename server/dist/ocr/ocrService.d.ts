import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
export declare class OcrService {
    private provider;
    constructor(provider: OcrProvider);
    get providerName(): string;
    processImage(imageBuffer: Buffer): Promise<OcrDocument>;
    static create(providerName?: string): OcrService;
}
