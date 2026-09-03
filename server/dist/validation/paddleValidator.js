"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWithPaddle = validateWithPaddle;
const paddleProvider_1 = require("../ocr/paddleProvider");
const parser_1 = require("../receipt-parser/parser");
async function validateWithPaddle(primaryDoc, primaryParsed, imageBuffer) {
    const paddle = new paddleProvider_1.PaddleOcrProvider();
    let paddleDoc = null;
    let paddleParsed = null;
    const issues = [];
    let agreement = 0;
    let adjustment = 0;
    try {
        const hasArabic = /[\u0600-\u06FF]/.test(primaryDoc.rawText);
        paddleDoc = await paddle.processImage(imageBuffer, { languageHint: hasArabic ? "ara" : "eng" });
        if (!paddleDoc || paddleDoc.elements.length === 0)
            return { agreement: 0, paddleDoc: null, paddleParsed: null, issues: ["Paddle produced no text"], confidenceAdjustment: 0 };
        paddleParsed = (0, parser_1.parseReceipt)(paddleDoc);
        const pMerch = (paddleParsed.merchant.value || "").toLowerCase();
        const tMerch = (primaryParsed.merchant.value || "").toLowerCase();
        if (pMerch && tMerch && pMerch !== tMerch) {
            issues.push(`Merchant mismatch: Tesseract "${tMerch}" vs Paddle "${pMerch}"`);
            adjustment -= 0.08;
        }
        else if (pMerch === tMerch && pMerch) {
            agreement += 0.2;
            adjustment += 0.05;
        }
        const pTotal = paddleParsed.total.value;
        const tTotal = primaryParsed.total.value;
        if (pTotal !== null && tTotal !== null) {
            const diff = Math.abs(pTotal - tTotal);
            if (diff < 0.5) {
                agreement += 0.3;
                adjustment += 0.07;
            }
            else if (diff < 5) {
                issues.push(`Total differs: ${tTotal} vs Paddle ${pTotal}`);
                adjustment -= 0.05;
            }
            else {
                issues.push(`Total strong mismatch: ${tTotal} vs Paddle ${pTotal}`);
                adjustment -= 0.12;
            }
        }
        const pItems = paddleParsed.items.length;
        const tItems = primaryParsed.items.length;
        if (Math.abs(pItems - tItems) <= 1 && pItems > 0) {
            agreement += 0.2;
            adjustment += 0.03;
        }
        else if (pItems !== tItems) {
            issues.push(`Item count differs: ${tItems} vs Paddle ${pItems}`);
            adjustment -= 0.04;
        }
        const itemNames = primaryParsed.items.map((i) => i.name.toLowerCase());
        for (const pi of paddleParsed.items) {
            if (itemNames.some((n) => n.includes(pi.name.toLowerCase().slice(0, 3))))
                agreement += 0.05;
        }
        agreement = Math.max(0, Math.min(1, agreement));
    }
    catch (e) {
        issues.push(`Paddle validation error: ${e instanceof Error ? e.message : String(e)}`);
    }
    return { agreement, paddleDoc, paddleParsed, issues, confidenceAdjustment: Math.max(-0.15, Math.min(0.1, adjustment)) };
}
