"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const mockProvider_1 = require("./mockProvider");
const tesseractProvider_1 = require("./tesseractProvider");
const paddleProvider_1 = require("./paddleProvider");
const donutProvider_1 = require("./donutProvider");
const chandraProvider_1 = require("./chandraProvider");
const config_1 = require("../config");
class OcrService {
    constructor(provider) {
        this.provider = provider;
    }
    get providerName() {
        return this.provider.name;
    }
    async processImage(imageBuffer) {
        const primary = this.provider.name;
        try {
            return await this.provider.processImage(imageBuffer);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`[ocrService] provider ${primary} failed: ${msg}, trying fallback`);
            if (primary !== "mock") {
                const fallback = new mockProvider_1.MockOcrProvider();
                try {
                    const fb = await fallback.processImage(imageBuffer);
                    return { ...fb, provider: `${primary}+mock-fallback` };
                }
                catch { }
            }
            throw e;
        }
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
