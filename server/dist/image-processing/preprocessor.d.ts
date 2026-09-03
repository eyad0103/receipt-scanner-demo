export interface PreprocessResult {
    buffer: Buffer;
    operations: string[];
    degraded: boolean;
}
export interface PreprocessOptions {
    grayscale?: boolean;
    contrast?: number;
    brightness?: number;
    sharpen?: boolean;
    normalizeResolution?: boolean;
    threshold?: number;
}
export declare class ImagePreprocessor {
    preprocess(originalBuffer: Buffer, options?: PreprocessOptions): Promise<PreprocessResult>;
    chooseBest(original: Buffer, processed: PreprocessResult): Buffer;
}
