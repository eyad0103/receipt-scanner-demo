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
exports.TesseractOcrProvider = void 0;
const mockProvider_1 = require("./mockProvider");
function mapWordsToElements(words) {
    return words
        .filter((w) => w.text && w.text.trim().length > 0)
        .map((w) => ({
        text: w.text.trim(),
        confidence: Math.max(0, Math.min(1, (w.confidence ?? 80) / 100)),
        boundingBox: {
            x: w.bbox.x0,
            y: w.bbox.y0,
            width: Math.max(1, w.bbox.x1 - w.bbox.x0),
            height: Math.max(1, w.bbox.y1 - w.bbox.y0),
        },
    }));
}
function fallbackToLines(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((line, idx) => ({
        text: line,
        confidence: 0.85,
        boundingBox: { x: 20, y: 40 + idx * 32, width: 600, height: 28 },
    }));
}
class TesseractOcrProvider {
    constructor() {
        this.name = "tesseract";
        this.fallback = new mockProvider_1.MockOcrProvider();
    }
    async processImage(imageBuffer, opts) {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error("Empty image buffer");
        }
        const langs = opts?.languageHint || "eng+ara";
        try {
            const mod = await Promise.resolve(`${"tesseract.js"}`).then(s => __importStar(require(s))).catch(() => null);
            if (!mod) {
                // eslint-disable-next-line no-console
                console.warn("[tesseract] tesseract.js not installed, falling back to mock");
                return this.fallback.processImage(imageBuffer, opts);
            }
            const createWorker = mod.createWorker || mod.default?.createWorker || mod.default;
            if (typeof createWorker !== "function") {
                console.warn("[tesseract] createWorker not found, falling back to mock");
                return this.fallback.processImage(imageBuffer, opts);
            }
            let worker = null;
            try {
                try {
                    worker = await createWorker(langs);
                }
                catch {
                    worker = await createWorker("eng+ara");
                }
                if (worker.load && worker.loadLanguage && worker.initialize) {
                    await worker.load();
                    await worker.loadLanguage(langs);
                    await worker.initialize(langs);
                }
                else if (worker.loadLanguage && worker.initialize) {
                    await worker.loadLanguage(langs);
                    await worker.initialize(langs);
                }
                if (worker.setParameters) {
                    try {
                        await worker.setParameters({
                            tessedit_pageseg_mode: "6",
                            preserve_interword_spaces: "1",
                            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-: EGP$€£",
                        });
                    }
                    catch { }
                }
                const result = await worker.recognize(imageBuffer);
                const data = result?.data || result || {};
                let elements = [];
                if (Array.isArray(data.words) && data.words.length > 0) {
                    elements = mapWordsToElements(data.words);
                }
                else if (data.text) {
                    elements = fallbackToLines(String(data.text));
                }
                if (elements.length === 0 && data.text) {
                    elements = fallbackToLines(String(data.text));
                }
                if (elements.length === 0) {
                    console.warn("[tesseract] no elements detected, falling back to mock");
                    return this.fallback.processImage(imageBuffer, opts);
                }
                const rawText = typeof data.text === "string" ? data.text : elements.map((e) => e.text).join("\n");
                let pageWidth;
                let pageHeight;
                if (elements.length > 0) {
                    const maxX = Math.max(...elements.map((e) => e.boundingBox.x + e.boundingBox.width));
                    const maxY = Math.max(...elements.map((e) => e.boundingBox.y + e.boundingBox.height));
                    pageWidth = maxX + 20;
                    pageHeight = maxY + 20;
                }
                return {
                    elements,
                    rawText,
                    provider: this.name,
                    processedAt: new Date().toISOString(),
                    pageWidth,
                    pageHeight,
                };
            }
            finally {
                if (worker) {
                    try {
                        await worker.terminate();
                    }
                    catch { }
                }
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`[tesseract] OCR failed (${msg}), falling back to mock`);
            return this.fallback.processImage(imageBuffer, opts);
        }
    }
}
exports.TesseractOcrProvider = TesseractOcrProvider;
