"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || "3000", 10),
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
    upload: {
        maxSizeBytes: parseInt(process.env.MAX_UPLOAD_BYTES || "10485760", 10),
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
        dest: process.env.UPLOAD_DIR || "uploads",
    },
    ocr: {
        provider: process.env.OCR_PROVIDER || "tesseract",
        confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || "0.7"),
    },
    validation: {
        tolerance: parseFloat(process.env.VALIDATION_TOLERANCE || "0.02"),
        reviewThreshold: parseFloat(process.env.REVIEW_THRESHOLD || "0.75"),
    },
    rateLimit: {
        windowMs: 60 * 1000,
        maxUploads: 1000,
        maxGeneral: 500,
    },
    subscription: {
        freeScansPerMonth: 999999,
    },
};
