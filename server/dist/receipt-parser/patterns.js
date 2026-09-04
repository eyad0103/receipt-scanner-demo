"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWN_MERCHANTS = exports.SKIP_KEYWORDS = exports.PAYMENT_KEYWORDS = exports.DISCOUNT_KEYWORDS = exports.TAX_KEYWORDS = exports.SUBTOTAL_KEYWORDS = exports.TOTAL_KEYWORDS = exports.SIMPLE_PRICE_LINE = exports.QUANTITY_LINE = exports.QUANTITY_PRICE_LINE = exports.PRICE_PATTERN = exports.TIME_PATTERNS = exports.DATE_PATTERNS = void 0;
exports.arabicToWestern = arabicToWestern;
exports.normalizePriceString = normalizePriceString;
exports.isTotalLine = isTotalLine;
exports.isSubtotalLine = isSubtotalLine;
exports.isTaxLine = isTaxLine;
exports.isDiscountLine = isDiscountLine;
exports.isSkipLine = isSkipLine;
exports.extractPriceValue = extractPriceValue;
const AR = "٠١٢٣٤٥٦٧٨٩";
const AR_RANGE = "٠-٩";
const DIG = `0-9${AR_RANGE}`;
function arabicToWestern(s) {
    const map = {
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
        "٬": ",",
        "،": ",",
    };
    return s.replace(/[٠١٢٣٤٥٦٧٨٩٫٬،]/g, (ch) => map[ch] || ch);
}
function normalizePriceString(raw) {
    return arabicToWestern(raw).replace(/[٫٬،]/g, ".");
}
exports.DATE_PATTERNS = [
    new RegExp(`\\b([${DIG}]{2})[\\/\\-]([${DIG}]{2})[\\/\\-]([${DIG}]{4})\\b`),
    new RegExp(`\\b([${DIG}]{4})[\\/\\-]([${DIG}]{2})[\\/\\-]([${DIG}]{2})\\b`),
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    /\b(\d{2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(\d{4})/i,
    new RegExp(`\\b([${DIG}]{1,2})[\\/\\-]([${DIG}]{1,2})[\\/\\-]([${DIG}]{2,4})\\b`),
];
exports.TIME_PATTERNS = [
    new RegExp(`\\b([${DIG}]{1,2}):([${DIG}]{2})(?::([${DIG}]{2}))?\\s*(AM|PM|ص|م)?\\b`, "i"),
];
exports.PRICE_PATTERN = new RegExp(`(\\$|EGP|LE|جنيه|ر\\.س|SAR|€|£)?\\s*([${DIG}]+[.,٫٬]?[${DIG}]*\\.?[${DIG}]{0,2}|[${DIG}]+)\\s*(EGP|LE|جنيه|ر\\.س|SAR|€|£|\\$)?`, "i");
exports.QUANTITY_PRICE_LINE = new RegExp(`^(.*?)\\s+([${DIG}]+(?:[.,٫][${DIG}]+)?)\\s*[x×*]?\\s*([${DIG}]+[.,٫][${DIG}]{2})\\s*[=]?\\s*([${DIG}]+[.,٫][${DIG}]{2})$`, "i");
exports.QUANTITY_LINE = new RegExp(`^(.*?)\\s+([${DIG}]+)\\s+([${DIG}]+[.,٫][${DIG}]{2})$`);
exports.SIMPLE_PRICE_LINE = new RegExp(`^(.*?)\\s+([${DIG}]+[.,٫][${DIG}]{2})$`);
exports.TOTAL_KEYWORDS = /(total|grand total|amount due|balance due|net total|الإجمالي|المجموع|اجمالي)/i;
exports.SUBTOTAL_KEYWORDS = /(subtotal|sub total|sub-total|المجموع الفرعي)/i;
exports.TAX_KEYWORDS = /(tax|vat|value added tax|ضريبة|القيمة المضافة|\bTX\b)/i;
exports.DISCOUNT_KEYWORDS = /(discount|disc\.|reduction|promo|خصم|تخفيض)/i;
exports.PAYMENT_KEYWORDS = /(cash|visa|LVISA|mastercard|card|payment|mada|نقدا|نقدي|بطاقة|SA:|4535|XXX|SAPP|SIGNATURE)/i;
exports.SKIP_KEYWORDS = /(address|phone|tel|tax no|vat no|receipt|invoice|thank|welcome|store|branch|www\.|http|@|العنوان|هاتف|visa|LVISA|mastercard|SA:|4535|XXX|SAPP|SIGNATURE|VISA|MASTERCARD|\bTIP\b|شكرا)/i;
exports.KNOWN_MERCHANTS = ["carrefour", "metro", "spinneys", "lulu", "hyper", "panda", "bim", "kazyon", "كارفور", "بنده", "العثيم", "هايبر"];
function isTotalLine(text) {
    const t = arabicToWestern(text);
    return exports.TOTAL_KEYWORDS.test(t) && !exports.SUBTOTAL_KEYWORDS.test(t);
}
function isSubtotalLine(text) {
    return exports.SUBTOTAL_KEYWORDS.test(arabicToWestern(text));
}
function isTaxLine(text) {
    return exports.TAX_KEYWORDS.test(arabicToWestern(text));
}
function isDiscountLine(text) {
    return exports.DISCOUNT_KEYWORDS.test(arabicToWestern(text));
}
function isSkipLine(text) {
    return exports.SKIP_KEYWORDS.test(arabicToWestern(text));
}
function extractPriceValue(text) {
    const norm = normalizePriceString(text);
    const cleaned = norm.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
    if (!cleaned)
        return null;
    const parts = cleaned.split(".");
    let numericStr;
    if (parts.length > 2) {
        const last = parts.pop();
        numericStr = parts.join("") + "." + last;
    }
    else {
        numericStr = cleaned;
    }
    const v = parseFloat(numericStr);
    if (isNaN(v))
        return null;
    return Math.round(v * 100) / 100;
}
