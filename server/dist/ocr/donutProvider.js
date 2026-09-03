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
exports.DonutProvider = void 0;
class DonutProvider {
    constructor() {
        this.name = "donut";
    }
    async processImage(imageBuffer, _opts) {
        if (!imageBuffer || imageBuffer.length === 0)
            throw new Error("Empty buffer");
        const mod = await Promise.resolve(`${"@xenova/transformers"}`).then(s => __importStar(require(s))).catch(() => null);
        if (!mod || !mod.DonutProcessor)
            throw new Error("Donut not installed — run: npm i @xenova/transformers and download naver-clova-ix/donut-base-finetuned-cord-v2. No fallback in test mode.");
        const { DonutProcessor, DonutForConditionalGeneration } = mod;
        const processor = await DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2");
        const model = await DonutForConditionalGeneration.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2");
        const jimpMod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
        const Jimp = jimpMod.Jimp || jimpMod.default || jimpMod;
        const img = await Jimp.read(imageBuffer);
        const inputs = await processor(img);
        const outputs = await model.generate(inputs);
        const text = String(outputs || "");
        if (!text.trim())
            throw new Error("Donut returned empty");
        const lines = text.split("\n").filter(Boolean);
        const elements = lines.map((line, idx) => ({
            text: line.trim(),
            confidence: 0.92,
            boundingBox: { x: 20, y: 40 + idx * 26, width: 600, height: 22 },
        }));
        return {
            elements,
            rawText: text,
            provider: this.name,
            processedAt: new Date().toISOString(),
            pageWidth: 640,
            pageHeight: 40 + lines.length * 26 + 20,
        };
    }
}
exports.DonutProvider = DonutProvider;
