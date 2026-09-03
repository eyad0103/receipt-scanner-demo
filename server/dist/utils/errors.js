"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.AppError = void 0;
class AppError extends Error {
    constructor(code, message, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
exports.Errors = {
    invalidImage: (msg = "Invalid or corrupted image") => new AppError("INVALID_IMAGE", msg, 400),
    unsupportedType: (msg = "Unsupported file type. Use JPEG, PNG or WEBP") => new AppError("UNSUPPORTED_TYPE", msg, 400),
    fileTooLarge: (msg = "File exceeds size limit") => new AppError("FILE_TOO_LARGE", msg, 400),
    emptyUpload: () => new AppError("EMPTY_UPLOAD", "Empty upload", 400),
    ocrFailed: (msg = "We couldn't read this receipt. Try taking a clearer photo.") => new AppError("OCR_FAILED", msg, 422),
    receiptNotDetected: () => new AppError("RECEIPT_NOT_DETECTED", "No receipt detected in image", 422),
    parserFailed: (msg = "Failed to parse receipt") => new AppError("PARSER_FAILED", msg, 422),
    validationFailed: (msg = "Receipt validation failed") => new AppError("VALIDATION_FAILED", msg, 422),
    notFound: (msg = "Resource not found") => new AppError("NOT_FOUND", msg, 404),
    unauthorized: (msg = "Unauthorized") => new AppError("UNAUTHORIZED", msg, 401),
    forbidden: (msg = "Forbidden") => new AppError("FORBIDDEN", msg, 403),
    quotaExceeded: (msg = "Monthly scan quota exceeded") => new AppError("QUOTA_EXCEEDED", msg, 429),
    rateLimited: (msg = "Too many requests") => new AppError("RATE_LIMITED", msg, 429),
};
