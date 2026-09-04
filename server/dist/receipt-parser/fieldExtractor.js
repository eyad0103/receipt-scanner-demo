"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMerchant = extractMerchant;
exports.extractDate = extractDate;
exports.extractTime = extractTime;
exports.extractCurrency = extractCurrency;
exports.extractMoneyField = extractMoneyField;
exports.extractMoneyFieldFromLines = extractMoneyFieldFromLines;
exports.extractPaymentMethod = extractPaymentMethod;
exports.extractReceiptNumber = extractReceiptNumber;
const patterns_1 = require("./patterns");
const normalize_1 = require("../utils/normalize");
function topElements(doc, n = 5) {
    return [...doc.elements].sort((a, b) => a.boundingBox.y - b.boundingBox.y).slice(0, n);
}
function extractMerchant(doc) {
    const tops = topElements(doc, 5);
    for (const el of tops) {
        const lower = el.text.toLowerCase();
        for (const m of patterns_1.KNOWN_MERCHANTS) {
            if (lower.includes(m)) {
                return { value: el.text.trim(), confidence: Math.min(0.98, el.confidence + 0.05) };
            }
        }
    }
    const first = tops[0];
    if (first && first.text.length >= 2 && first.boundingBox.y < 200) {
        return { value: first.text.trim(), confidence: first.confidence * 0.85 };
    }
    return { value: null, confidence: 0.3 };
}
function extractDate(doc) {
    for (const el of doc.elements) {
        for (const pat of patterns_1.DATE_PATTERNS) {
            const m = el.text.match(pat);
            if (m) {
                const normalized = normalizeDate(m[0]);
                return { value: normalized, confidence: el.confidence * 0.96 };
            }
        }
    }
    for (const pat of patterns_1.DATE_PATTERNS) {
        const m = doc.rawText.match(pat);
        if (m)
            return { value: normalizeDate(m[0]), confidence: 0.75 };
    }
    return { value: null, confidence: 0.2 };
}
const MONTHS = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};
function normalizeDate(raw) {
    const m1 = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m1)
        return `${m1[3]}-${m1[2]}-${m1[1]}`;
    const m2 = raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m2)
        return `${m2[1]}-${m2[2]}-${m2[3]}`;
    const m3 = raw.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i);
    if (m3)
        return `${m3[3]}-${MONTHS[m3[2].slice(0, 3).toLowerCase()] || "01"}-${m3[1].padStart(2, "0")}`;
    const m4 = raw.match(/(\d{2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(\d{4})/i);
    if (m4)
        return `${m4[3]}-${MONTHS[m4[2].slice(0, 3).toLowerCase()] || "01"}-${m4[1]}`;
    return raw;
}
function extractTime(doc) {
    for (const el of doc.elements) {
        for (const pat of patterns_1.TIME_PATTERNS) {
            const m = el.text.match(pat);
            if (m) {
                return { value: m[0].trim(), confidence: el.confidence * 0.94 };
            }
        }
    }
    return { value: null, confidence: 0.2 };
}
function extractCurrency(doc) {
    const text = doc.rawText.toUpperCase();
    if (text.includes("EGP") || text.includes("LE"))
        return "EGP";
    if (text.includes("SAR"))
        return "SAR";
    if (text.includes("USD") || text.includes("$"))
        return "USD";
    if (text.includes("€"))
        return "EUR";
    return "EGP";
}
function extractMoneyField(doc, predicate) {
    for (const el of doc.elements) {
        if (predicate(el.text)) {
            const { amount } = (0, normalize_1.normalizePrice)(el.text);
            if (amount !== null)
                return { value: amount, confidence: el.confidence * 0.96 };
        }
    }
    return { value: null, confidence: 0.3 };
}
function extractMoneyFieldFromLines(lines, predicate) {
    for (const l of lines) {
        if (predicate(l.text)) {
            const { amount } = (0, normalize_1.normalizePrice)(l.text);
            if (amount !== null)
                return { value: amount, confidence: l.confidence * 0.96 };
        }
    }
    return { value: null, confidence: 0.3 };
}
function extractPaymentMethod(doc) {
    const keywords = /(cash|visa|mastercard|card|mada)/i;
    for (const el of doc.elements) {
        const m = el.text.match(keywords);
        if (m)
            return { value: m[1].toLowerCase(), confidence: el.confidence * 0.85 };
    }
    return { value: null, confidence: 0.2 };
}
function extractReceiptNumber(doc) {
    const pat = /(receipt|invoice|bill)\s*(no|#|number)?\s*[:\-]?\s*(\w[\w\-]*)/i;
    for (const el of doc.elements) {
        const m = el.text.match(pat);
        if (m)
            return { value: m[3], confidence: el.confidence * 0.85 };
    }
    return { value: null, confidence: 0.2 };
}
