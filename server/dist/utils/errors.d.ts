import { ErrorCode } from "../models/receipt";
export declare class AppError extends Error {
    code: ErrorCode;
    statusCode: number;
    details?: unknown | undefined;
    constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown | undefined);
}
export declare const Errors: {
    invalidImage: (msg?: string) => AppError;
    unsupportedType: (msg?: string) => AppError;
    fileTooLarge: (msg?: string) => AppError;
    emptyUpload: () => AppError;
    ocrFailed: (msg?: string) => AppError;
    receiptNotDetected: () => AppError;
    parserFailed: (msg?: string) => AppError;
    validationFailed: (msg?: string) => AppError;
    notFound: (msg?: string) => AppError;
    unauthorized: (msg?: string) => AppError;
    forbidden: (msg?: string) => AppError;
    quotaExceeded: (msg?: string) => AppError;
    rateLimited: (msg?: string) => AppError;
};
