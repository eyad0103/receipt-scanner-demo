"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoundingBox = createBoundingBox;
exports.avgConfidence = avgConfidence;
function createBoundingBox(x, y, width, height) {
    return { x, y, width, height };
}
function avgConfidence(doc) {
    if (doc.elements.length === 0)
        return 0;
    return doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length;
}
