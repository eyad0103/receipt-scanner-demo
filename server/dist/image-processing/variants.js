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
exports.generateVariants = generateVariants;
exports.pickBestVariant = pickBestVariant;
async function applyJimpVariant(buffer, ops) {
    try {
        const mod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
        const Jimp = mod?.default || mod?.Jimp || mod;
        if (!Jimp || typeof Jimp.read !== "function")
            return null;
        const J = Jimp;
        const img = await J.read(buffer);
        ops(img);
        const mime = J.MIME_JPEG || "image/jpeg";
        const out = await img.getBufferAsync(mime);
        return out;
    }
    catch {
        return null;
    }
}
async function generateVariants(base) {
    const variants = [{ name: "original", buffer: base, operations: ["original"] }];
    const enhanced = await applyJimpVariant(base, (img) => {
        const im = img;
        try {
            if (im.grayscale)
                im.grayscale();
            else if (im.greyscale)
                im.greyscale();
        }
        catch { }
        try {
            im.contrast(0.18);
        }
        catch { }
        try {
            if (im.normalize)
                im.normalize();
        }
        catch { }
        try {
            if (im.convolute)
                im.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]);
        }
        catch { }
        try {
            if (im.bitmap.width < 1600) {
                const ratio = 1600 / im.bitmap.width;
                im.resize?.({ w: 1600, h: Math.round(im.bitmap.height * ratio) });
            }
        }
        catch { }
    });
    if (enhanced)
        variants.push({ name: "enhanced", buffer: enhanced, operations: ["grayscale", "contrast", "normalize", "sharpen", "resize"] });
    const grayscale = await applyJimpVariant(base, (img) => {
        const im = img;
        try {
            if (im.grayscale)
                im.grayscale();
            else if (im.greyscale)
                im.greyscale();
        }
        catch { }
    });
    if (grayscale)
        variants.push({ name: "grayscale", buffer: grayscale, operations: ["grayscale"] });
    const thresholded = await applyJimpVariant(base, (img) => {
        const im = img;
        try {
            if (im.grayscale)
                im.grayscale();
            else if (im.greyscale)
                im.greyscale();
        }
        catch { }
        try {
            im.threshold?.({ max: 140, replace: 255, autoGreyscale: false });
        }
        catch { }
    });
    if (thresholded)
        variants.push({ name: "thresholded", buffer: thresholded, operations: ["grayscale", "threshold"] });
    return variants;
}
function pickBestVariant(scored) {
    if (scored.length === 0)
        return null;
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return sorted[0].variant;
}
