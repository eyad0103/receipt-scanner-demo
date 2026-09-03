"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVerified = seedVerified;
const dataset_1 = require("./dataset");
function seedVerified() {
    const seeds = [
        { merchant: "Carrefour", items: [{ name: "Pepsi", quantity: 2, totalPrice: 70 }, { name: "Chips", quantity: 1, totalPrice: 35 }, { name: "Chocolate", quantity: 2, totalPrice: 90 }] },
        { merchant: "Metro", items: [{ name: "Milk", quantity: 2, totalPrice: 60 }, { name: "Bread", quantity: 1, totalPrice: 20 }] },
        { merchant: "Spinneys", items: [{ name: "Rice", quantity: 1, totalPrice: 80 }, { name: "Oil", quantity: 1, totalPrice: 55 }] },
        { merchant: "Lulu", items: [{ name: "Water", quantity: 2, totalPrice: 20 }, { name: "Yogurt", quantity: 4, totalPrice: 48 }] },
    ];
    for (const s of seeds) {
        (0, dataset_1.saveExample)({ id: `seed_${s.merchant}`, ocrText: s.items.map(i => `${i.name} ${i.totalPrice}`).join("\n"), ocrElements: s.items.map(i => ({ text: i.name, confidence: 0.9 })), corrected: { merchant: s.merchant, items: s.items, total: s.items.reduce((a, b) => a + b.totalPrice, 0) }, createdAt: new Date().toISOString() });
    }
    const { trainFromSynthetic } = require("./learner");
    trainFromSynthetic(40);
}
