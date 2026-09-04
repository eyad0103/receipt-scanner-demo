"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProductName = normalizeProductName;
exports.productMatchKey = productMatchKey;
exports.areProductsSimilar = areProductsSimilar;
exports.normalizePrice = normalizePrice;
exports.parseQuantityToken = parseQuantityToken;
exports.correctOcrText = correctOcrText;
const UNIT_MAP = {
    ml: "ml",
    "ml.": "ml",
    l: "l",
    lt: "l",
    g: "g",
    kg: "kg",
    pcs: "pcs",
    pc: "pcs",
};
const ARABIC_DIGITS = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "٫": ".",
    "٬": "",
    "،": "",
};
function toWesternDigits(s) {
    return s.replace(/[٠١٢٣٤٥٦٧٨٩٫٬،]/g, (c) => ARABIC_DIGITS[c] ?? c);
}
function normalizeProductName(name) {
    let n = name.toLowerCase().trim();
    n = n.replace(/[^\p{L}\p{N}\s./-]/gu, " ");
    n = n.replace(/\s+/g, " ").trim();
    n = n.replace(/(\d+)\s*(ml|l|g|kg|pcs|pc)\b/gi, (_, num, unit) => {
        const u = UNIT_MAP[unit.toLowerCase()] || unit.toLowerCase();
        return `${num}${u}`;
    });
    return n;
}
function productMatchKey(name) {
    return normalizeProductName(name);
}
function areProductsSimilar(a, b) {
    const na = productMatchKey(a);
    const nb = productMatchKey(b);
    if (na === nb)
        return true;
    const tokensA = new Set(na.split(" "));
    const tokensB = new Set(nb.split(" "));
    let inter = 0;
    for (const t of tokensA)
        if (tokensB.has(t))
            inter++;
    const union = tokensA.size + tokensB.size - inter;
    const jaccard = union === 0 ? 0 : inter / union;
    return jaccard >= 0.7;
}
function normalizePrice(raw) {
    const western = toWesternDigits(raw);
    const trimmed = western.trim();
    const currencyMatch = trimmed.match(/(EGP|LE|USD|\$|SAR|€|£|جنيه|ر\.س)/i);
    let currency = null;
    if (currencyMatch) {
        const m = currencyMatch[1].toUpperCase();
        if (m === "$")
            currency = "USD";
        else if (m === "LE" || m.includes("جنيه"))
            currency = "EGP";
        else if (m.includes("ر"))
            currency = "SAR";
        else
            currency = m.replace("$", "USD").replace("LE", "EGP");
    }
    let cleaned = trimmed.replace(/[^0-9.,-]/g, "");
    if (!cleaned)
        return { amount: null, currency };
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned))
        cleaned = cleaned.replace(/,/g, "");
    else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned))
        cleaned = cleaned.replace(/\./g, "");
    else
        cleaned = cleaned.replace(/,/g, ".");
    const parts = cleaned.split(".");
    let numericStr;
    if (parts.length > 2) {
        const last = parts.pop();
        numericStr = parts.join("") + "." + last;
    }
    else {
        numericStr = cleaned;
    }
    let amount = parseFloat(numericStr);
    if (isNaN(amount))
        return { amount: null, currency };
    const hasDecimal = /[.,]/.test(trimmed);
    if (!hasDecimal && /^\d{3,5}$/.test(cleaned) && amount >= 100) {
        if (amount >= 10000 && amount < 100000) {
            amount = Math.round((amount / 100) * 100) / 100;
        }
        else if (amount >= 1000 && amount < 10000) {
            const maybeCents = amount / 100;
            const maybeTens = amount / 10;
            if (maybeCents >= 5 && maybeCents <= 500) {
                amount = Math.round(maybeCents * 100) / 100;
            }
        }
        else if (amount >= 100 && amount < 1000) {
            amount = Math.round((amount / 100) * 100) / 100;
        }
    }
    return { amount: Math.round(amount * 100) / 100, currency };
}
function parseQuantityToken(token) {
    const western = toWesternDigits(token);
    const m = western.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|\*|×)?$/i);
    if (!m)
        return null;
    const v = parseFloat(m[1].replace(",", "."));
    return isNaN(v) ? null : v;
}
function correctOcrText(text) {
    return toWesternDigits(text).trim();
}
