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
exports.HandwritingOcrProvider = void 0;
class HandwritingOcrProvider {
    constructor(primary) {
        this.primary = primary;
        this.name = "handwriting-fallback";
    }
    async processImage(imageBuffer, opts) {
        const base = await this.primary.processImage(imageBuffer, opts);
        const avgConf = base.elements.length ? base.elements.reduce((a, b) => a + b.confidence, 0) / base.elements.length : 0;
        const hasWords = base.elements.some((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text));
        if (avgConf >= 0.55 && hasWords && base.elements.length >= 2)
            return base;
        try {
            const mod = await Promise.resolve(`${"tesseract.js"}`).then(s => __importStar(require(s))).catch(() => null);
            const J = mod?.createWorker || mod;
            const createWorker = mod?.createWorker || J?.createWorker;
            if (typeof createWorker !== "function")
                return base;
            const worker = await createWorker("eng");
            try {
                const w = worker;
                if (w.setParameters) {
                    try {
                        await w.setParameters({ tessedit_pageseg_mode: "1", tessedit_ocr_engine_mode: "1" });
                    }
                    catch { }
                }
                const res = await w.recognize(imageBuffer);
                const words = (res.data.words || []);
                if (words.length === 0)
                    return base;
                const elements = words
                    .filter((w) => w.text.trim())
                    .map((w) => ({
                    text: w.text.trim(),
                    confidence: Math.max(0, Math.min(1, (w.confidence || 60) / 100)) * 0.9,
                    boundingBox: { x: w.bbox.x0, y: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0 },
                }));
                const avgNew = elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, elements.length);
                if (avgNew > avgConf) {
                    return {
                        elements,
                        rawText: res.data.text,
                        provider: this.name,
                        processedAt: new Date().toISOString(),
                        pageWidth: Math.max(...elements.map((e) => e.boundingBox.x + e.boundingBox.width), 0) + 20,
                        pageHeight: Math.max(...elements.map((e) => e.boundingBox.y + e.boundingBox.height), 0) + 20,
                    };
                }
                return base;
            }
            finally {
                try {
                    await worker.terminate();
                }
                catch { }
            }
        }
        catch {
            return base;
        }
    }
}
exports.HandwritingOcrProvider = HandwritingOcrProvider;
