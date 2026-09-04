"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const variants_1 = require("./variants");
const preprocessor_1 = require("../image-processing/preprocessor");
const jimp_1 = require("jimp");
class MockOcrProvider {
    constructor() {
        this.name = "mock";
    }
    async processImage(imageBuffer, _opts) {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error("Empty image buffer");
        }
        try {
            const J = (0, jimp_1.default) || (0, jimp_1.Jimp) || jimp_1.default;
            if (J) {
                const img = await J.read(imageBuffer);
                const w = img.bitmap ? img.bitmap.width : 0;
                const h = img.bitmap ? img.bitmap.height : 0;
                let out = imageBuffer;
                try {
                    if (typeof img.grayscale === "function") {
                        img.grayscale();
                    }
                } catch {}
                try {
                    if (typeof img.contrast === "function") {
                        img.contrast(0.3);
                    }
                } catch {}
                try {
                    const m = Math.max(0, Math.min(255, Math.round(0.2 * 255)));
                    if (typeof img.threshold === "function") {
                        img.threshold({ max: m, replace: 255, autoGreyscale: false });
                    }
                } catch {}
                try {
                    if (typeof img.normalize === "function") {
                        img.normalize();
                    }
                } catch {}
                try {
                    if (typeof img.convolute === "function") {
                        const kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
                        img.convolve(kernel);
                    }
                } catch {}
                try {
                    out = await img.getBufferAsync ? img.getBufferAsync("image/jpeg") : await new Promise((resolve, reject) => {
                        img.getBuffer("image/jpeg", (err, buf) => {
                            if (err) reject(err);
                            else resolve(buf);
                        });
                    });
                } catch {}
                if (out && out.length > 10 && out.length < imageBuffer.length * 2) {
                    imageBuffer = out;
                }
            }
        } catch {}
        const effectiveWidth = 640;
        const effectiveHeight = 800;
        const baseConfidence = 0.85;
        const sampleMerchants = ["Carrefour", "Spinneys", "Lulu", "Panda", "Metro", "Hyper One", "Al Raya", "Abdullah", "Al Jazira"];
        const sampleItems = ["Chips", "Chocolate", "Rice", "Oil", "Sugar", "Eggs", "Salt", "Pepper", "Soap", "Shampoo"];
        const merchantIdx = Math.floor(Math.random() * sampleMerchants.length);
        const itemCount = 3 + Math.floor(Math.random() * 5);
        let subtotal = 0;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            const name = sampleItems[Math.floor(Math.random() * sampleItems.length)];
            const price = (10 + Math.random() * 90).toFixed(2);
            items.push({ text: name + " " + (i + 1), confidence: baseConfidence, boundingBox: { x: 100, y: 200 + i * 35, width: 500, height: 28 } });
            subtotal += parseFloat(price);
        }
        const total = (subtotal + (10 + Math.random() * 20)).toFixed(2);
        const elements = [
            { text: sampleMerchants[merchantIdx], confidence: baseConfidence, boundingBox: { x: 100, y: 80, width: 200, height: 30 } },
            { text: "02/09/2026", confidence: baseConfidence, boundingBox: { x: 100, y: 140, width: 150, height: 25 } },
            { text: "14:37", confidence: baseConfidence, boundingBox: { x: 280, y: 140, width: 100, height: 25 } },
            ...items,
            { text: "Subtotal " + Math.round(subtotal).toFixed(2), confidence: baseConfidence, boundingBox: { x: 100, y: 350, width: 500, height: 25 } },
            { text: "Total " + total, confidence: 0.99, boundingBox: { x: 100, y: 400, width: 500, height: 30 } },
            { text: "EGP", confidence: 0.9, boundingBox: { x: 550, y: 440, width: 50, height: 25 } },
        ];
        return {
            elements,
            rawText: [
                sampleMerchants[merchantIdx],
                "02/09/2026",
                "14:37",
                ...items.map((it) => it.text + " " + Math.round((Math.random() * 50 + 10)).toFixed(2)),
                "Subtotal " + Math.round(subtotal).toFixed(2),
                "Total " + total,
                "EGP",
            ].join("\n"),
            provider: this.name,
            processedAt: new Date().toISOString(),
            pageWidth: effectiveWidth,
            pageHeight: effectiveHeight,
        };
    }
}
exports.MockOcrProvider = MockOcrProvider;