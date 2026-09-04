export interface Bounds {
    x: number;
    y: number;
    w: number;
    h: number;
    cropped: boolean;
}
export declare function detectReceiptBounds(buffer: Buffer): Promise<{
    buffer: Buffer;
    bounds: Bounds;
}>;
