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
exports.downscaleForOcr = downscaleForOcr;
exports.padWhiteMargin = padWhiteMargin;
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
async function loadJimp() {
    try {
        const mod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
        const mm = mod;
        const ctor = (mm?.Jimp || mm?.default || mod);
        if (typeof ctor !== "function" || typeof ctor.read !== "function")
            return null;
        return ctor;
    }
    catch {
        return null;
    }
}
async function encodeJimp(J, img) {
    try {
        const mime = J.MIME_JPEG || "image/jpeg";
        if (typeof img.getBufferAsync === "function")
            return await img.getBufferAsync(mime);
        if (typeof img.getBuffer === "function") {
            const out = (await img.getBuffer(mime));
            if (out && typeof out.then === "function")
                return (await out);
            if (Buffer.isBuffer(out))
                return out;
        }
        return null;
    }
    catch {
        return null;
    }
}
async function downscaleForOcr(buffer, maxDim = 1400) {
    try {
        const J = await loadJimp();
        if (!J)
            return buffer;
        const src = await J.read(buffer);
        const w = src.bitmap.width, h = src.bitmap.height;
        const m = Math.max(w, h);
        if (!m || m <= maxDim)
            return buffer;
        const ratio = maxDim / m;
        src.resize?.({ w: Math.round(w * ratio), h: Math.round(h * ratio) });
        return (await encodeJimp(J, src)) || buffer;
    }
    catch {
        return buffer;
    }
}
async function padWhiteMargin(buffer, ratio = 0.06) {
    try {
        const J = await loadJimp();
        if (!J)
            return null;
        const src = await J.read(buffer);
        const w = src.bitmap.width, h = src.bitmap.height;
        if (!w || !h)
            return null;
        const m = Math.max(20, Math.round(Math.min(w, h) * ratio));
        const canvas = new J({ width: w + 2 * m, height: h + 2 * m, color: 0xffffffff });
        canvas.composite(src, m, m);
        return await encodeJimp(J, canvas);
    }
    catch {
        return null;
    }
}
async function generateVariants(base) {
    const padded = await padWhiteMargin(base);
    const src = padded || base;
    const padOps = padded ? ["white_margin"] : [];
    const variants = [{ name: "original", buffer: src, operations: [...padOps, "original"] }];
    const enhanced = await applyJimpVariant(src, (img) => {
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
    const grayscale = await applyJimpVariant(src, (img) => {
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
    const thresholded = await applyJimpVariant(src, (img) => {
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
