"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReceipt = validateReceipt;
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
