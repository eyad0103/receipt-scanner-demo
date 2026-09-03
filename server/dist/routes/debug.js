"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receiptService_1 = require("../services/receiptService");
const receiptRepository_1 = require("../repositories/receiptRepository");
const router = (0, express_1.Router)();
router.get("/ocr/:receiptId", (req, res) => {
    const id = String(req.params.receiptId);
    const receipt = receiptRepository_1.receiptRepository.getById(id);
    if (!receipt)
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Receipt not found" } });
    const ocr = receiptRepository_1.receiptRepository.getOcrByReceiptId(id);
    const proc = receiptRepository_1.receiptRepository.getProcessing(id);
    const debug = (0, receiptService_1.getPipelineDebug)(id);
    res.json({
        receiptId: id,
        status: receipt.status,
        confidence: receipt.confidence,
        originalImage: receipt.imageReference,
        correctedImage: receipt.processedImageReference,
        processing: proc,
        ocr: ocr
            ? {
                provider: ocr.provider,
                rawText: ocr.rawDocument.rawText,
                elements: ocr.rawDocument.elements,
                pageWidth: ocr.rawDocument.pageWidth,
                pageHeight: ocr.rawDocument.pageHeight,
            }
            : null,
        debug: debug || null,
        parsed: {
            merchant: receipt.merchantName,
            date: receipt.purchaseDate,
            time: receipt.purchaseTime,
            currency: receipt.currency,
            subtotal: receipt.subtotal,
            tax: receipt.tax,
            discount: receipt.discount,
            total: receipt.total,
            items: receipt.items,
            qrCodes: receipt.qrCodes,
        },
    });
});
router.get("/ocr/:receiptId/boxes.svg", (req, res) => {
    const id = String(req.params.receiptId);
    const ocr = receiptRepository_1.receiptRepository.getOcrByReceiptId(id);
    if (!ocr)
        return res.status(404).send("No OCR");
    const els = ocr.rawDocument.elements;
    const W = ocr.rawDocument.pageWidth || 700;
    const H = ocr.rawDocument.pageHeight || 900;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="white"/>`;
    for (const e of els) {
        const c = e.confidence > 0.8 ? "#10B981" : e.confidence > 0.6 ? "#F59E0B" : "#EF4444";
        svg += `<rect x="${e.boundingBox.x}" y="${e.boundingBox.y}" width="${e.boundingBox.width}" height="${e.boundingBox.height}" fill="none" stroke="${c}" stroke-width="1.5"/><text x="${e.boundingBox.x}" y="${Math.max(10, e.boundingBox.y - 2)}" font-size="10" fill="${c}">${e.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")} (${e.confidence.toFixed(2)})</text>`;
    }
    svg += `</svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
});
exports.default = router;
