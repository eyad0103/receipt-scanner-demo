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
exports.loadJimp = loadJimp;
exports.encodeJimp = encodeJimp;
exports.downscaleForOcr = downscaleForOcr;
exports.padWhiteMargin = padWhiteMargin;
exports.normalizeDarkImage = normalizeDarkImage;
exports.generateVariants = generateVariants;
exports.pickBestVariant = pickBestVariant;
async function applyJimpVariant(buffer, ops) {
    try {
        const J = await loadJimp();
        if (!J)
            return null;
        const img = await J.read(buffer);
        ops(img);
        return await encodeJimp(J, img);
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
async function normalizeDarkImage(buffer) {
    try {
        const J = await loadJimp();
        if (!J)
            return { buffer, brightened: false };
        const src = await J.read(buffer);
        const w = src.bitmap.width, h = src.bitmap.height;
        const data = src.bitmap.data;
        const step = Math.max(1, Math.floor((w * h) / 20000));
        let sum = 0, n = 0;
        for (let i = 0; i < w * h; i += step) {
            const o = i * 4;
            sum += 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
            n++;
        }
        const mean = sum / Math.max(1, n);
        if (mean >= 100)
            return { buffer, brightened: false };
        const amt = Math.min(0.6, (100 - mean) / 100 + 0.15);
        src.brightness?.(amt);
        const out = await encodeJimp(J, src);
        return out ? { buffer: out, brightened: true } : { buffer, brightened: false };
    }
    catch {
        return { buffer, brightened: false };
    }
}
async function generateVariants(base) {
    const norm = await normalizeDarkImage(base);
    const padded = await padWhiteMargin(norm.buffer);
    const src = padded || norm.buffer;
    const padOps = [...(norm.brightened ? ["auto_brighten"] : []), ...(padded ? ["white_margin"] : [])];
    const variants = [{ name: "original", buffer: src, operations: [...padOps, "original"] }];
    const normalized = await applyJimpVariant(src, (img) => {
        try {
            img.normalize?.();
        }
        catch { }
    });
    if (normalized)
        variants.push({ name: "enhanced", buffer: normalized, operations: [...padOps, "normalize"] });
    const grayNorm = await applyJimpVariant(src, (img) => {
        try {
            img.greyscale?.();
        }
        catch { }
        try {
            img.normalize?.();
        }
        catch { }
    });
    if (grayNorm)
        variants.push({ name: "grayscale", buffer: grayNorm, operations: [...padOps, "greyscale", "normalize"] });
    const gentle = await applyJimpVariant(src, (img) => {
        try {
            img.greyscale?.();
        }
        catch { }
        try {
            img.contrast?.(0.1);
        }
        catch { }
        try {
            img.normalize?.();
        }
        catch { }
        try {
            if (img.bitmap.width < 800) {
                const ratio = 1200 / img.bitmap.width;
                img.resize?.({ w: 1200, h: Math.round(img.bitmap.height * ratio) });
            }
        }
        catch { }
    });
    if (gentle)
        variants.push({ name: "thresholded", buffer: gentle, operations: [...padOps, "greyscale", "contrast", "normalize", "resize-if-small"] });
    return variants;
}
function pickBestVariant(scored) {
    if (scored.length === 0)
        return null;
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return sorted[0].variant;
}
