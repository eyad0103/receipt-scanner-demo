"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseItems = parseItems;
exports.parseItemsFromLines = parseItemsFromLines;
const patterns_1 = require("./patterns");
const normalize_1 = require("../utils/normalize");
function priceFromText(text) {
    const { amount } = (0, normalize_1.normalizePrice)(text);
    return amount;
}
function stripCurrencyAffix(text) {
    let t = text
        .replace(/^\s*[$€£]\s*/, "")
        .replace(/\s*[$€£]\s*$/, "")
        .replace(/\s+(EGP|L\.?E\.?|USD|SAR|AED|KWD|QAR|BHD|جنيه|ر\.?س\.?)\s*$/i, "");
    const pre = t.replace(/^(EGP|L\.?E\.?|USD|SAR|AED|جنيه)\s+/i, "");
    if (pre !== t && /[A-Za-z\u0600-\u06FF]{2,}.*\d|\d.*[A-Za-z\u0600-\u06FF]{2,}/.test(pre))
        t = pre;
    return t.trim();
}
function cleanName(name) {
    return name
        .replace(/\s*[-–—:]\s*$/g, "")
        .replace(/^\s*[-–—:]\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function parseItemLine(el) {
    let text = stripCurrencyAffix(el.text.trim());
    if (!text)
        return null;
    try {
        const { correctProductName } = require("../training/learner");
        const dict = require("../training/dataset").getProductDictionary();
        if (dict.size > 5) {
            const words = text.split(/\s+/);
            const first = words[0];
            if (first && first.length >= 3 && words.length <= 2) {
                const corr = correctProductName(first, dict);
                if (corr.wasCorrected)
                    text = text.replace(first, corr.corrected.charAt(0).toUpperCase() + corr.corrected.slice(1));
            }
        }
    }
    catch { }
    if ((0, patterns_1.isTotalLine)(text) || (0, patterns_1.isSubtotalLine)(text) || (0, patterns_1.isTaxLine)(text) || (0, patterns_1.isDiscountLine)(text))
        return null;
    if ((0, patterns_1.isSkipLine)(text))
        return null;
    const fullMatch = text.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+[.,]\d{2})\s*[=]?\s*(\d+[.,]\d{2})$/i);
    if (fullMatch) {
        const name = cleanName(fullMatch[1]);
        const qty = parseFloat(fullMatch[2].replace(",", "."));
        const unit = parseFloat(fullMatch[3].replace(",", "."));
        const total = parseFloat(fullMatch[4].replace(",", "."));
        if (name.length < 2)
            return null;
        return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.92, boundingBox: el.boundingBox };
    }
    const qtyTotalMatch = text.match(/^(.*?)\s+(\d+)\s+(\d+[.,]?\d*)$/);
    if (qtyTotalMatch) {
        const name = cleanName(qtyTotalMatch[1]);
        const qty = parseInt(qtyTotalMatch[2], 10);
        const rawTotal = qtyTotalMatch[3];
        const { amount: total } = (0, normalize_1.normalizePrice)(rawTotal);
        if (name.length < 2 || qty > 100 || total === null)
            return null;
        if (/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT)/i.test(name))
            return null;
        const unit = qty > 0 ? Math.round((total / qty) * 100) / 100 : null;
        return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.88, boundingBox: el.boundingBox };
    }
    const leadingQtyMatch = text.match(/^(\d+)\s+(.*?)\s+(\d+[.,]?\d*)$/);
    if (leadingQtyMatch) {
        const qty = parseInt(leadingQtyMatch[1], 10);
        const name = cleanName(leadingQtyMatch[2]);
        const rawTotal = leadingQtyMatch[3];
        const { amount: total } = (0, normalize_1.normalizePrice)(rawTotal);
        if (name.length < 2 || qty > 100 || total === null)
            return null;
        if (/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT)/i.test(name))
            return null;
        const unit = qty > 0 ? Math.round((total / qty) * 100) / 100 : null;
        return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.88, boundingBox: el.boundingBox };
    }
    const dashMatch = text.match(/^(.*?)\s*[-–—:]\s*(\d+[.,]?\d*)$/);
    if (dashMatch && /[A-Za-z\u0600-\u06FF]/.test(dashMatch[1])) {
        const name = cleanName(dashMatch[1]);
        const { amount: total } = (0, normalize_1.normalizePrice)(dashMatch[2]);
        if (name.length >= 2 && total !== null) {
            if (name.split(/\s+/).length <= 15 && total > 0 && total < 100000) {
                if (!/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT|BILL|SIGNATURE|CASH|CHANGE)/i.test(name)) {
                    return { name, quantity: 1, unitPrice: total, totalPrice: total, confidence: el.confidence * 0.85, boundingBox: el.boundingBox };
                }
            }
        }
    }
    const simpleMatch = text.match(/^(.*?)\s+(\d+[.,]?\d*)$/);
    if (simpleMatch) {
        const name = cleanName(simpleMatch[1]);
        const rawTotal = simpleMatch[2];
        const { amount: total } = (0, normalize_1.normalizePrice)(rawTotal);
        if (name.length < 2 || total === null)
            return null;
        if (name.split(/\s+/).length > 8)
            return null;
        if (total <= 0 || total > 100000)
            return null;
        if (/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT|BILL|SIGNATURE)/i.test(name))
            return null;
        return { name, quantity: 1, unitPrice: total, totalPrice: total, confidence: el.confidence * 0.82, boundingBox: el.boundingBox };
    }
    return null;
}
function parseItems(doc) {
    const sorted = [...doc.elements].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    const items = [];
    let inItemZone = false;
    const yThreshold = doc.pageHeight ? doc.pageHeight * 0.15 : 120;
    const bottomThreshold = doc.pageHeight ? doc.pageHeight * 0.75 : 600;
    for (const el of sorted) {
        if (el.boundingBox.y < yThreshold)
            continue;
        if (el.boundingBox.y > bottomThreshold) {
            if ((0, patterns_1.isTotalLine)(el.text) || (0, patterns_1.isSubtotalLine)(el.text))
                break;
        }
        const parsed = parseItemLine(el);
        if (parsed) {
            items.push(parsed);
            inItemZone = true;
        }
        else if (inItemZone && items.length > 0) {
            if ((0, patterns_1.isTotalLine)(el.text) || (0, patterns_1.isSubtotalLine)(el.text) || (0, patterns_1.isTaxLine)(el.text))
                break;
        }
    }
    if (items.length === 0) {
        for (const el of sorted) {
            const p = parseItemLine(el);
            if (p)
                items.push(p);
        }
    }
    return items.filter((it) => {
        const price = it.totalPrice;
        return price > 0 && price < 100000;
    });
}
function parseItemsFromLines(lines, doc) {
    const yThreshold = doc.pageHeight ? doc.pageHeight * 0.12 : 80;
    const bottomThreshold = doc.pageHeight ? doc.pageHeight * 0.78 : 700;
    const items = [];
    let inZone = false;
    for (const l of lines) {
        const y = l.bbox.y;
        if (y < yThreshold)
            continue;
        if (y > bottomThreshold) {
            if ((0, patterns_1.isTotalLine)(l.text) || (0, patterns_1.isSubtotalLine)(l.text))
                break;
        }
        if (l.klass === "TOTAL" || l.klass === "SUBTOTAL" || l.klass === "TAX" || l.klass === "DISCOUNT")
            continue;
        if ((0, patterns_1.isDiscountLine)(l.text) || (0, patterns_1.isSkipLine)(l.text))
            continue;
        const fakeEl = { text: l.text, confidence: l.confidence, boundingBox: l.bbox };
        const parsed = parseItemLine(fakeEl);
        if (parsed) {
            items.push(parsed);
            inZone = true;
        }
        else if (inZone && items.length > 0) {
            if ((0, patterns_1.isTotalLine)(l.text) || (0, patterns_1.isSubtotalLine)(l.text) || (0, patterns_1.isTaxLine)(l.text))
                break;
        }
    }
    if (items.length === 0) {
        for (const l of lines) {
            if ((0, patterns_1.isTotalLine)(l.text) || (0, patterns_1.isSubtotalLine)(l.text) || (0, patterns_1.isTaxLine)(l.text) || (0, patterns_1.isDiscountLine)(l.text))
                continue;
            const p = parseItemLine({ text: l.text, confidence: l.confidence, boundingBox: l.bbox });
            if (p)
                items.push(p);
        }
    }
    return items.filter((it) => it.totalPrice > 0 && it.totalPrice < 100000);
}
