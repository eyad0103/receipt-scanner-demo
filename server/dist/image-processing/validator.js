"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpload = validateUpload;
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
function validateUpload(file) {
    if (!file)
        throw errors_1.Errors.emptyUpload();
    if (file.size === 0)
        throw errors_1.Errors.emptyUpload();
    if (file.size > config_1.config.upload.maxSizeBytes) {
        throw errors_1.Errors.fileTooLarge(`File exceeds ${config_1.config.upload.maxSizeBytes} bytes`);
    }
    if (!config_1.config.upload.allowedMimeTypes.includes(file.mimetype)) {
        throw errors_1.Errors.unsupportedType();
    }
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    if (ext && !config_1.config.upload.allowedExtensions.includes(ext)) {
        throw errors_1.Errors.unsupportedType();
    }
    if (!file.buffer || file.buffer.length < 10) {
        throw errors_1.Errors.invalidImage("Corrupted or empty image");
    }
    const header = file.buffer.subarray(0, 8);
    const isJpeg = header[0] === 0xff && header[1] === 0xd8;
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
    const isValidHeader = isJpeg || isPng || isWebp;
    if (!isValidHeader && file.buffer.length > 100) {
        throw errors_1.Errors.invalidImage("Unsupported or corrupted image format");
    }
    if (file.buffer.length < 512)
        throw errors_1.Errors.invalidImage("Image too small or corrupted");
}
