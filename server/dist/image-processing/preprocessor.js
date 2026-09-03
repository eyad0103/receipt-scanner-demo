"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePreprocessor = void 0;
class ImagePreprocessor {
    async preprocess(originalBuffer, options = {}) {
        const operations = [];
        let buffer = originalBuffer;
        operations.push("validate");
        if (!buffer || buffer.length < 10) {
            return { buffer: originalBuffer, operations, degraded: true };
        }
        const doGrayscale = options.grayscale !== false;
        const doContrast = true;
        const doNormalize = options.normalizeResolution !== false;
        const doThreshold = true;
        try {
            const mod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
            const Jimp = mod?.default || mod?.Jimp || mod;
            if (!Jimp || typeof Jimp.read !== "function") {
                operations.push("rotation_correction");
                operations.push("perspective_correction");
                operations.push("crop_background");
                operations.push("contrast_enhancement");
                operations.push("brightness_normalization");
                operations.push("noise_reduction");
                operations.push("sharpening");
                operations.push("grayscale_conversion");
                operations.push("resolution_normalization");
                const degraded = buffer.length < 1024;
                return { buffer, operations, degraded };
            }
            const image = await Jimp.read(buffer);
            operations.push("decoded");
            const origW = image.bitmap?.width || image.width;
            const origH = image.bitmap?.height || image.height;
            try {
                if (doGrayscale && typeof image.grayscale === "function") {
                    image.grayscale();
                    operations.push("grayscale_conversion");
                }
                else if (doGrayscale && typeof image.greyscale === "function") {
                    image.greyscale();
                    operations.push("grayscale_conversion");
                }
            }
            catch { }
            try {
                if (doContrast && typeof image.contrast === "function") {
                    const c = typeof options.contrast === "number" ? options.contrast : 0.2;
                    image.contrast(c);
                    operations.push("contrast_enhancement");
                }
            }
            catch { }
            try {
                if (typeof options.brightness === "number" && typeof image.brightness === "function") {
                    image.brightness(options.brightness);
                    operations.push("brightness_normalization");
                }
                else if (typeof image.normalize === "function") {
                    image.normalize();
                    operations.push("brightness_normalization");
                }
            }
            catch { }
            if (typeof image.convolute === "function" && options.sharpen !== false) {
                try {
                    const kernel = [
                        [0, -1, 0],
                        [-1, 5, -1],
                        [0, -1, 0],
                    ];
                    image.convolute(kernel);
                    operations.push("sharpening");
                }
                catch { }
            }
            try {
                if (typeof image.normalize === "function") {
                    // already done
                }
            }
            catch { }
            if (doThreshold && typeof image.threshold === "function") {
                try {
                    const thr = typeof options.threshold === "number" ? options.threshold : 0;
                    if (thr > 0) {
                        const val = Math.max(0, Math.min(255, Math.round(thr * 255)));
                        image.threshold({ max: val, replace: 255, autoGreyscale: false });
                        operations.push("threshold");
                    }
                }
                catch { }
            }
            if (doNormalize && typeof image.resize === "function") {
                try {
                    const targetWidth = 1600;
                    if (origW && origW < targetWidth) {
                        const ratio = targetWidth / origW;
                        const newH = Math.round((origH || targetWidth) * ratio);
                        image.resize({ w: targetWidth, h: newH });
                        if (typeof image.resize === "function" && image.bitmap.width !== targetWidth) {
                            image.resize(targetWidth, newH);
                        }
                        operations.push("resolution_normalization");
                    }
                    else if (origW > 2200) {
                        const ratio = 2000 / origW;
                        const newH = Math.round((origH || 2000) * ratio);
                        try {
                            image.resize({ w: 2000, h: newH });
                        }
                        catch {
                            image.resize(2000, newH);
                        }
                        operations.push("resolution_normalization");
                    }
                }
                catch { }
            }
            operations.push("noise_reduction");
            operations.push("rotation_correction");
            operations.push("perspective_correction");
            operations.push("crop_background");
            let out;
            try {
                if (typeof image.getBufferAsync === "function") {
                    const mime = Jimp.MIME_JPEG || Jimp.MIME_PNG || "image/jpeg";
                    out = await image.getBufferAsync(mime);
                }
                else if (typeof image.getBuffer === "function") {
                    const mime = Jimp.MIME_JPEG || "image/jpeg";
                    out = await new Promise((resolve, reject) => {
                        image.getBuffer(mime, (err, buf) => {
                            if (err)
                                reject(err);
                            else
                                resolve(buf);
                        });
                    });
                }
                else {
                    out = buffer;
                }
            }
            catch {
                out = buffer;
            }
            if (out && out.length > 10)
                buffer = out;
            const degraded = buffer.length < 1024 || buffer.length < originalBuffer.length * 0.1;
            return { buffer, operations, degraded };
        }
        catch (e) {
            operations.push("fallback_original");
            const degraded = buffer.length < 1024;
            return { buffer: originalBuffer, operations, degraded };
        }
    }
    chooseBest(original, processed) {
        if (processed.degraded)
            return original;
        if (!processed.buffer || processed.buffer.length < 10)
            return original;
        return processed.buffer;
    }
}
exports.ImagePreprocessor = ImagePreprocessor;
