"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyLines = classifyLines;
const patterns_1 = require("./patterns");
const DATE_RE = /(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
const TIME_RE = /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i;
const PRICE_RE = /(\d+[.,]\d{2}|\d+)/;
const CURRENCY_RE = /(EGP|LE|USD|\$|SAR|€|£)/i;
function score(line, yIndex, totalLines) {
    const t = line.text.trim();
    const lower = t.toLowerCase();
    if (/^\d[\d\s\-]+$/.test(t.replace(/[.,]/g, "")) && t.replace(/\D/g, "").length >= 8)
        return { klass: "UNKNOWN", conf: line.confidence * 0.3 };
    if (/\b(TX|TAX)\b/i.test(t) && /\d/.test(t))
        return { klass: "TAX", conf: line.confidence * 0.9 };
    if (/^\d+\s+\d+$/.test(t.trim()) && t.replace(/\D/g, "").length <= 4)
        return { klass: "UNKNOWN", conf: line.confidence * 0.3 };
    if ((0, patterns_1.isTotalLine)(t))
        return { klass: "TOTAL", conf: line.confidence * 0.95 };
    if ((0, patterns_1.isSubtotalLine)(t))
        return { klass: "SUBTOTAL", conf: line.confidence * 0.95 };
    if ((0, patterns_1.isTaxLine)(t))
        return { klass: "TAX", conf: line.confidence * 0.95 };
    if ((0, patterns_1.isDiscountLine)(t))
        return { klass: "DISCOUNT", conf: line.confidence * 0.9 };
    if (DATE_RE.test(t) && TIME_RE.test(t))
        return { klass: "DATE", conf: line.confidence * 0.9 };
    if (DATE_RE.test(t))
        return { klass: "DATE", conf: line.confidence * 0.92 };
    if (TIME_RE.test(t) && t.length < 15)
        return { klass: "TIME", conf: line.confidence * 0.92 };
    if (/(payment|cash|visa|mastercard|card|mada)/i.test(t))
        return { klass: "PAYMENT", conf: line.confidence * 0.85 };
    if (/(receipt|invoice|bill)\s*(no|#|number)?/i.test(t))
        return { klass: "RECEIPT_ID", conf: line.confidence * 0.85 };
    if ((0, patterns_1.isSkipLine)(t) && !PRICE_RE.test(t))
        return { klass: "UNKNOWN", conf: 0.4 };
    const hasPrice = PRICE_RE.test(t);
    const hasQty = /\b\d+\s*[x×*]\s*\d+[.,]\d{2}\b/i.test(t) || /^\s*.+\s+\d+\s+\d+[.,]\d{2}\s*$/.test(t);
    if (hasPrice && t.split(/\s+/).length >= 2) {
        const isTop = yIndex < 2 && totalLines > 4;
        if (isTop && !hasQty && t.length < 30 && !CURRENCY_RE.test(t) && totalLines > 3) {
            return { klass: "MERCHANT", conf: line.confidence * 0.75 };
        }
        if (hasQty || (t.match(/\d/g) || []).length >= 2) {
            return { klass: "ITEM", conf: line.confidence * 0.88 };
        }
    }
    if (yIndex === 0 && t.length >= 2 && t.length < 40)
        return { klass: "MERCHANT", conf: line.confidence * 0.7 };
    return { klass: "UNKNOWN", conf: line.confidence * 0.5 };
}
function classifyLines(lines) {
    return lines.map((l, idx) => {
        const { klass, conf } = score(l, idx, lines.length);
        return { ...l, klass, classConfidence: conf };
    });
}
