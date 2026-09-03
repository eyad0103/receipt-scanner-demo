export declare const config: {
    port: number;
    jwtSecret: string;
    upload: {
        maxSizeBytes: number;
        allowedMimeTypes: string[];
        allowedExtensions: string[];
        dest: string;
    };
    ocr: {
        provider: string;
        confidenceThreshold: number;
    };
    validation: {
        tolerance: number;
        reviewThreshold: number;
    };
    rateLimit: {
        windowMs: number;
        maxUploads: number;
        maxGeneral: number;
    };
    subscription: {
        freeScansPerMonth: number;
    };
};
