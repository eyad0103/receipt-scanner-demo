export type VariantName = "original" | "enhanced" | "grayscale" | "thresholded";
export interface Variant {
    name: VariantName;
    buffer: Buffer;
    operations: string[];
}
interface JimpImage {
    bitmap: {
        width: number;
        height: number;
    };
    composite: (s: unknown, x: number, y: number) => void;
    resize?: (o: {
        w: number;
        h: number;
    }) => void;
    greyscale?: () => void;
    normalize?: () => void;
    contrast?: (n: number) => void;
    brightness?: (n: number) => void;
    getBufferAsync?: (mime: string) => Promise<Buffer>;
    getBuffer?: (mime: string) => Promise<Buffer> | void;
}
interface JimpCtor {
    read: (b: Buffer) => Promise<JimpImage>;
    MIME_JPEG?: string;
    new (o: {
        width: number;
        height: number;
        color: number;
    }): JimpImage;
}
export declare function loadJimp(): Promise<JimpCtor | null>;
export declare function encodeJimp(J: JimpCtor, img: JimpImage): Promise<Buffer | null>;
export declare function downscaleForOcr(buffer: Buffer, maxDim?: number): Promise<Buffer>;
export declare function padWhiteMargin(buffer: Buffer, ratio?: number): Promise<Buffer | null>;
export declare function normalizeDarkImage(buffer: Buffer): Promise<{
    buffer: Buffer;
    brightened: boolean;
}>;
export declare function generateVariants(base: Buffer): Promise<Variant[]>;
export declare function pickBestVariant(scored: Array<{
    variant: Variant;
    doc: import("../models/receipt").OcrDocument | null;
    score: number;
}>): Variant | null;
export {};
