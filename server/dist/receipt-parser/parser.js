"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReceipt = parseReceipt;
const fieldExtractor_1 = require("./fieldExtractor");
const itemParser_1 = require("./itemParser");
const patterns_1 = require("./patterns");
const lineReconstructor_1 = require("./lineReconstructor");
const semanticClassifier_1 = require("./semanticClassifier");
function parseReceipt(doc) {
    const lines = (0, lineReconstructor_1.reconstructLines)(doc.elements);
    const classified = (0, semanticClassifier_1.classifyLines)(lines);
    const merchant = (0, fieldExtractor_1.extractMerchant)(doc);
    const date = (0, fieldExtractor_1.extractDate)(doc);
    const time = (0, fieldExtractor_1.extractTime)(doc);
    const currency = (0, fieldExtractor_1.extractCurrency)(doc);
    const items = (0, itemParser_1.parseItemsFromLines)(classified, doc);
    const subtotal = (0, fieldExtractor_1.extractMoneyFieldFromLines)(classified, patterns_1.isSubtotalLine);
    const tax = (0, fieldExtractor_1.extractMoneyFieldFromLines)(classified, patterns_1.isTaxLine);
    const discount = (0, fieldExtractor_1.extractMoneyFieldFromLines)(classified, patterns_1.isDiscountLine);
    let total = (0, fieldExtractor_1.extractMoneyFieldFromLines)(classified, patterns_1.isTotalLine);
    if (total.value === null && items.length > 0) {
        const bottom = [...classified].sort((a, b) => b.bbox.y - a.bbox.y).slice(0, 3);
        for (const l of bottom) {
            const m = l.text.match(/(\d+[.,]\d{2})/);
            if (m) {
                const v = parseFloat(m[1].replace(",", "."));
                if (!isNaN(v) && v > 0) {
                    total = { value: v, confidence: l.confidence * 0.7 };
                    break;
                }
            }
        }
    }
    const confidences = [
        merchant.confidence,
        date.confidence,
        time.confidence,
        total.confidence,
        ...items.map((i) => i.confidence),
    ].filter((c) => c > 0);
    const overallConfidence = confidences.length === 0 ? 0.3 : confidences.reduce((a, b) => a + b, 0) / confidences.length;
    return {
        merchant,
        date,
        time,
        currency,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: (0, fieldExtractor_1.extractPaymentMethod)(doc),
        receiptNumber: (0, fieldExtractor_1.extractReceiptNumber)(doc),
        overallConfidence: Math.round(overallConfidence * 100) / 100,
    };
}
