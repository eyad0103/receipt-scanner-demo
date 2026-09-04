"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReceipt = validateReceipt;
exports.reconcileArithmetic = reconcileArithmetic;
exports.computeConfidence = computeConfidence;
exports.needsReview = needsReview;
const config_1 = require("../config");
function validateReceipt(parsed) {
    const errors = [];
    const warnings = [];
    let confidenceAdjustment = 0;
    for (const item of parsed.items) {
        if (item.unitPrice !== null && item.quantity > 0) {
            const expected = Math.round(item.quantity * item.unitPrice * 100) / 100;
            const diff = Math.abs(expected - item.totalPrice);
            const tolerance = config_1.config.validation.tolerance * Math.max(expected, 1);
            if (diff > tolerance && diff > 0.05) {
                warnings.push(`Item "${item.name}" math mismatch: ${item.quantity} x ${item.unitPrice} != ${item.totalPrice}`);
                confidenceAdjustment -= 0.05;
            }
        }
        if (item.quantity <= 0) {
            errors.push(`Item "${item.name}" has invalid quantity`);
            confidenceAdjustment -= 0.1;
        }
        if (item.totalPrice <= 0) {
            warnings.push(`Item "${item.name}" has non-positive price`);
            confidenceAdjustment -= 0.05;
        }
    }
    if (parsed.items.length === 0) {
        warnings.push("No items detected");
        confidenceAdjustment -= 0.15;
    }
    const sumItems = parsed.items.reduce((a, b) => a + b.totalPrice, 0);
    const tax = parsed.tax.value || 0;
    const discount = parsed.discount.value || 0;
    const expectedTotal = Math.round((sumItems + tax - discount) * 100) / 100;
    if (parsed.total.value !== null && parsed.items.length > 0) {
        const diff = Math.abs(expectedTotal - parsed.total.value);
        const tolerance = config_1.config.validation.tolerance * Math.max(parsed.total.value, 1) + 0.5;
        if (diff > tolerance) {
            warnings.push(`Total mismatch: items(${sumItems}) + tax(${tax}) - discount(${discount}) = ${expectedTotal} vs total ${parsed.total.value}`);
            confidenceAdjustment -= 0.1;
        }
    }
    if (parsed.subtotal.value !== null && parsed.items.length > 0) {
        const diff = Math.abs(parsed.subtotal.value - sumItems);
        if (diff > config_1.config.validation.tolerance * Math.max(sumItems, 1) + 0.5) {
            warnings.push(`Subtotal mismatch: sum of items ${sumItems} vs subtotal ${parsed.subtotal.value}`);
            confidenceAdjustment -= 0.05;
        }
    }
    const valid = errors.length === 0;
    return { valid, errors, warnings, confidenceAdjustment };
}
function reconcileArithmetic(parsed) {
    const out = { fixedItems: [], filledTotal: null, filledSubtotal: null, balanced: false, warnings: [], confidenceBoost: 0 };
    const r2 = (n) => Math.round(n * 100) / 100;
    const sum = () => r2(parsed.items.reduce((a, b) => a + b.totalPrice, 0));
    const tax = parsed.tax.value || 0;
    const discount = parsed.discount.value || 0;
    const tol = (v) => config_1.config.validation.tolerance * Math.max(Math.abs(v), 1) + 0.5;
    if (parsed.items.length > 0) {
        const s = sum();
        if (parsed.subtotal.value === null) {
            parsed.subtotal = { value: s, confidence: 0.6, source: "arithmetic" };
            out.filledSubtotal = s;
            out.warnings.push(`Subtotal missing — summed from items: ${s}`);
        }
        else if (Math.abs(parsed.subtotal.value - s) > tol(s)) {
            out.warnings.push(`Subtotal ${parsed.subtotal.value} disagrees with items sum ${s} — trusting items`);
            parsed.subtotal = { value: s, confidence: 0.55, source: "arithmetic-corrected" };
            out.filledSubtotal = s;
        }
    }
    if (parsed.total.value === null) {
        const base = (parsed.subtotal.value ?? sum()) + tax - discount;
        if (parsed.items.length > 0 || parsed.subtotal.value !== null) {
            parsed.total = { value: r2(base), confidence: 0.6, source: "arithmetic" };
            out.filledTotal = parsed.total.value;
            out.warnings.push(`Total missing — computed: ${out.filledTotal}`);
        }
    }
    if (parsed.total.value !== null && parsed.items.length > 0) {
        const expected = r2(sum() + tax - discount);
        const diff = Math.abs(expected - parsed.total.value);
        if (diff <= tol(parsed.total.value)) {
            out.balanced = true;
            out.confidenceBoost += 0.08;
            out.warnings.push(`Arithmetic checks out: items + tax - discount = total (${expected})`);
        }
        else {
            for (const it of parsed.items) {
                for (const f of [10, 0.1]) {
                    const alt = r2(sum() - it.totalPrice + r2(it.totalPrice * f));
                    if (Math.abs(r2(alt + tax - discount) - parsed.total.value) <= tol(parsed.total.value)) {
                        const from = it.totalPrice;
                        it.totalPrice = r2(it.totalPrice * f);
                        if (it.unitPrice !== null && it.quantity > 0)
                            it.unitPrice = r2(it.totalPrice / it.quantity);
                        it.confidence = Math.min(1, it.confidence + 0.05);
                        out.fixedItems.push({ name: it.name, from, to: it.totalPrice });
                        out.warnings.push(`Fixed "${it.name}" by decimal shift ${from} → ${it.totalPrice} so the math balances`);
                        out.confidenceBoost += 0.03;
                        break;
                    }
                }
                if (out.fixedItems.length > 0)
                    break;
            }
            if (out.fixedItems.length === 0) {
                out.warnings.push(`Still off: items + tax - discount = ${expected} vs total ${parsed.total.value} — needs a look`);
            }
            else {
                out.balanced = true;
            }
        }
    }
    return out;
}
function computeConfidence(parsed, validation) {
    let c = parsed.overallConfidence + validation.confidenceAdjustment;
    c = Math.max(0, Math.min(1, c));
    return Math.round(c * 100) / 100;
}
function needsReview(confidence, validation) {
    if (validation.errors.length > 0)
        return true;
    if (confidence < config_1.config.validation.reviewThreshold)
        return true;
    if (validation.warnings.length >= 2)
        return true;
    return false;
}
