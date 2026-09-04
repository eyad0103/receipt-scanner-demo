"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockProvider_1 = require("./mockProvider");
const tesseractProvider_1 = require("./tesseractProvider");
const paddleProvider_1 = require("./paddleProvider");
const donutProvider_1 = require("./donutProvider");
const chandraProvider_1 = require("./chandraProvider");
const config_1 = require("../config");
const preprocessor_1 = require("../image-processing/preprocessor");
const variants_1 = require("./variants");
const jimp_1 = require("jimp");
class OcrService {
    constructor(provider) {
        this.provider = provider;
    }
    get providerName() {
        return this.provider.name;
    }
    async processImage(imageBuffer, options) {
        const { variants = true, fallbackToMock = true } = options;
        // Step 1: Assess image quality
        try {
            const mod: any = await import("jimp" as string);
            const Jimp: any = mod?.default || mod?.Jimp || mod;
            let qualityScore = 50;
            let issues = [];
            if (Jimp && imageBuffer && imageBuffer.length > 10) {
                const img = await Jimp.read(imageBuffer);
                const w = img.bitmap ? img.bitmap.width : 0;
                const h = img.bitmap ? img.bitmap.height : 0;
                if (w && h) {
                    const data = img.bitmap.data;
                    let sum = 0, dark = 0, n = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        sum += g; n++;
                        if (g < 100) dark++;
                    }
                    const mean = sum / Math.max(1, n);
                    qualityScore = Math.max(0, Math.min(100, Math.round(100 - (dark / n) * 100)));
                    if (n > 0 && mean < 60) issues.push("TOO_DARK");
                    if (mean > 215) issues.push("OVEREXPOSED");
                }
            }
            // Step 2: Generate preprocessing variants if enabled
            let workingBuffer = imageBuffer;
            let usedVariant = "original";
            if (variants) {
                const variantsList = (0, variants_1.generateVariants)(imageBuffer);
                if (variantsList.length > 0) {
                    const best = (0, variants_1.pickBestVariant)(variantsList.map(v => ({
                        variant: v,
                        doc: null,
                        score: 0
                    })));
                    if (best) {
                        workingBuffer = best.buffer;
                        usedVariant = best.name;
                    }
                }
            }
            // Step 3: Try primary OCR provider
            const primary = this.provider.name;
            try {
                const doc = await this.provider.processImage(workingBuffer, options);
                return { doc, quality: qualityScore, issues: [] };
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.warn(`[ocrService] provider ${primary} failed: ${msg}`);
                // Step 4: Try fallback provider if enabled
                if (fallbackToMock && primary !== "mock") {
                    try {
                        const fallback = new mockProvider_1.MockOcrProvider();
                        const fb = await fallback.processImage(workingBuffer, options);
                        return { fb, quality: 50, issues: [`${primary} failed, used mock fallback`] };
                    } catch (fbError) {
                        console.warn(`[ocrService] Mock fallback also failed: ${fbError}`);
                    }
                }
            }
            // Step 5: If variants enabled, try different provider on different variants
            if (variants) {
                const providers = [this.provider, new tesseractProvider_1.TesseractOcrProvider(), new mockProvider_1.MockOcrProvider()];
                for (const provider of providers) {
                    for (const v of variants_1.generateVariants(imageBuffer)) {
                        try {
                            const doc = await provider.processImage(v.buffer, options);
                            return { doc, quality: qualityScore, issues: [`used ${v.name} variant with ${provider.name}`] };
                        } catch {
                            continue;
                        }
                    }
                }
            }
            return { doc: null, quality: 0, issues: ["All OCR providers failed"] };
        } catch (e) {
            console.warn("[ocrService] Quality assessment failed:", e);
            // Fallback to original behavior
            return this.processFallback(imageBuffer, options);
        }
    }
    processFallback(imageBuffer, options) {
        const primary = this.provider.name;
        if (fallbackToMock && primary !== "mock") {
            try {
                const fallback = new mockProvider_1.MockOcrProvider();
                const fb = fallback.processImage(imageBuffer, options);
                return { fb, quality: 50, issues: [`${primary} failed, used mock fallback`] };
            } catch { }
        }
        return { doc: null, quality: 0, issues: ["All OCR providers failed"] };
    }
    static create(providerName) {
        const name = providerName || config_1.config.ocr?.provider || "tesseract";
        let provider;
        switch (name) {
            case "chandra":
                provider = new chandraProvider_1.ChandraProvider();
                break;
            case "donut":
                provider = new donutProvider_1.DonutProvider();
                break;
            case "paddle":
                provider = new paddleProvider_1.PaddleOcrProvider();
                break;
            case "tesseract":
                provider = new tesseractProvider_1.TesseractOcrProvider();
                break;
            case "mock":
                provider = new mockProvider_1.MockOcrProvider();
                break;
            default:
                provider = new tesseractProvider_1.TesseractOcrProvider();
                break;
        }
        return new OcrService(provider);
    }
}
exports.OcrService = OcrService;