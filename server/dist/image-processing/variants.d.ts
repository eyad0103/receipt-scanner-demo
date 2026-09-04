export type VariantName = "original" | "enhanced" | "grayscale" | "thresholded";
export interface Variant {
    name: VariantName;
    buffer: Buffer;
    operations: string[];
}
export declare function downscaleForOcr(buffer: Buffer, maxDim?: number): Promise<Buffer>;
export declare function padWhiteMargin(buffer: Buffer, ratio?: number): Promise<Buffer | null>;
export declare function generateVariants(base: Buffer): Promise<Variant[]>;
export declare function pickBestVariant(scored: Array<{
    variant: Variant;
    doc: import("../models/receipt").OcrDocument | null;
    score: number;
}>): Variant | null;
