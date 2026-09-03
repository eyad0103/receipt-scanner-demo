"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOcrProvider = void 0;
class MockOcrProvider {
    constructor() {
        this.name = "mock";
    }
    async processImage(imageBuffer, _opts) {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error("Empty image buffer");
        }
        const elements = [
            { text: "Carrefour", confidence: 0.97, boundingBox: { x: 120, y: 80, width: 300, height: 40 } },
            { text: "02/09/2026", confidence: 0.95, boundingBox: { x: 120, y: 140, width: 200, height: 28 } },
            { text: "14:37", confidence: 0.96, boundingBox: { x: 340, y: 140, width: 100, height: 28 } },
            { text: "Pepsi 2 70.00", confidence: 0.94, boundingBox: { x: 120, y: 230, width: 500, height: 32 } },
            { text: "Chips 35.00", confidence: 0.92, boundingBox: { x: 120, y: 270, width: 500, height: 32 } },
            { text: "Chocolate 2 90.00", confidence: 0.91, boundingBox: { x: 120, y: 310, width: 500, height: 32 } },
            { text: "Subtotal 195.00", confidence: 0.95, boundingBox: { x: 120, y: 370, width: 500, height: 28 } },
            { text: "VAT 20.00", confidence: 0.93, boundingBox: { x: 120, y: 400, width: 500, height: 28 } },
            { text: "Total 215.00", confidence: 0.99, boundingBox: { x: 120, y: 440, width: 500, height: 36 } },
            { text: "EGP", confidence: 0.90, boundingBox: { x: 500, y: 440, width: 60, height: 28 } },
        ];
        return {
            elements,
            rawText: elements.map((e) => e.text).join("\n"),
            provider: this.name,
            processedAt: new Date().toISOString(),
            pageWidth: 640,
            pageHeight: 800,
        };
    }
}
exports.MockOcrProvider = MockOcrProvider;
