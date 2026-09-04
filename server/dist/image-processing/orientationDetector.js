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
exports.detectBestOrientation = detectBestOrientation;
exports.correctOrientation = correctOrientation;
const variants_1 = require("./variants");
const timeout_1 = require("../utils/timeout");
function scoreDocument(doc) {
    if (!doc || doc.elements.length === 0 || (doc.provider || "").toLowerCase().includes("mock"))
        return 0;
    const regions = doc.elements.length;
    const avgConf = doc.elements.reduce((a, b) => a + b.confidence, 0) / regions;
    const wordCount = doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length;
    const numericTokens = (doc.rawText.match(/\d+[.,]?\d*/g) || []).length;
    const yVals = doc.elements.map((e) => e.boundingBox.y + e.boundingBox.height / 2);
    const sorted = [...yVals].sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < sorted.length; i++)
        gaps += sorted[i] - sorted[i - 1];
    const avgGap = gaps / Math.max(1, sorted.length - 1);
    const spatialConsistency = avgGap > 5 && avgGap < 200 ? 1 : 0.5;
    return regions * 0.3 + avgConf * 10 + wordCount * 0.5 + numericTokens * 0.7 + spatialConsistency * 2;
}
async function rotateBuffer(buffer, angle) {
    if (angle === 0)
        return buffer;
    try {
        const mod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
        const Jimp = mod?.default || mod?.Jimp || mod;
        const J = Jimp;
        if (!J || typeof J.read !== "function")
            return buffer;
        const img = await J.read(buffer);
        img.rotate(angle);
        const mime = J.MIME_JPEG || "image/jpeg";
        return await img.getBufferAsync(mime);
    }
    catch {
        return buffer;
    }
}
async function detectBestOrientation(original, provider, opts) {
    const angles = [0, 90, 180, 270];
    const candidates = [];
    const small = await (0, variants_1.downscaleForOcr)(original, 1200);
    for (const angle of angles) {
        const rotated = await rotateBuffer(small, angle);
        let doc = null;
        try {
            doc = await (0, timeout_1.withTimeout)(provider.processImage(rotated, opts), 45000, `orientation@${angle}`);
        }
        catch {
            doc = null;
        }
        const metrics = doc
            ? {
                regions: doc.elements.length,
                avgConfidence: doc.elements.length ? doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length : 0,
                wordCount: doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length,
                numericTokens: (doc.rawText.match(/\d+[.,]?\d*/g) || []).length,
                spatialConsistency: 0,
            }
            : { regions: 0, avgConfidence: 0, wordCount: 0, numericTokens: 0, spatialConsistency: 0 };
        if (doc) {
            const yVals = doc.elements.map((e) => e.boundingBox.y + e.boundingBox.height / 2);
            const sorted = [...yVals].sort((a, b) => a - b);
            let gaps = 0;
            for (let i = 1; i < sorted.length; i++)
                gaps += sorted[i] - sorted[i - 1];
            const avgGap = gaps / Math.max(1, sorted.length - 1);
            metrics.spatialConsistency = avgGap > 5 && avgGap < 200 ? 1 : 0.5;
        }
        const score = scoreDocument(doc);
        candidates.push({ angle, score, doc, metrics });
    }
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best.score < 1.5 && candidates.some((c) => c.angle === 0)) {
        const zero = candidates.find((c) => c.angle === 0);
        return { angle: zero.angle, candidates, bestDoc: zero.doc };
    }
    return { angle: best.angle, candidates, bestDoc: best.doc };
}
async function correctOrientation(buffer, angle) {
    return rotateBuffer(buffer, angle);
}
