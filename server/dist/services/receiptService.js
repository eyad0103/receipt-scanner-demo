"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptService = exports.ReceiptService = void 0;
exports.getPipelineDebug = getPipelineDebug;
const config_1 = require("../config");
const ocrService_1 = require("../ocr/ocrService");
const orientationDetector_1 = require("../image-processing/orientationDetector");
const variants_1 = require("../image-processing/variants");
const handwritingProvider_1 = require("../ocr/handwritingProvider");
const lineReconstructor_1 = require("../receipt-parser/lineReconstructor");
const semanticClassifier_1 = require("../receipt-parser/semanticClassifier");
const parser_1 = require("../receipt-parser/parser");
const validator_1 = require("../validation/validator");
const paddleValidator_1 = require("../validation/paddleValidator");
const receiptRepository_1 = require("../repositories/receiptRepository");
const qrDetector_1 = require("../utils/qrDetector");
const timeout_1 = require("../utils/timeout");
const debugStore = new Map();
function getPipelineDebug(receiptId) {
    return debugStore.get(receiptId);
}
function scoreDoc(doc) {
    if (!doc || doc.elements.length === 0)
        return 0;
    const avg = doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length;
    const words = doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length;
    const nums = (doc.rawText.match(/\d+[.,]?\d*/g) || []).length;
    return doc.elements.length * 0.4 + avg * 10 + words * 0.6 + nums * 0.8;
}
class ReceiptService {
    constructor() {
        this.baseOcr = ocrService_1.OcrService.create(config_1.config.ocr.provider);
    }
    async processReceipt(receiptId, imageBuffer, forcedProvider) {
        const ocrForThis = forcedProvider ? ocrService_1.OcrService.create(forcedProvider) : this.baseOcr;
        receiptRepository_1.receiptRepository.setProcessingStatus(receiptId, "processing", ocrForThis.providerName);
        const debug = {
            orientation: { angle: 0, candidates: [] },
            variants: [],
            selectedVariant: "original",
            lineCount: 0,
            lines: [],
            qrCodes: [],
            rawOcrElements: 0,
            handwritingFallback: false,
            paddleValidation: null,
        };
        try {
            const baseForOrientation = forcedProvider ? ocrService_1.OcrService.create(forcedProvider) : ocrService_1.OcrService.create(config_1.config.ocr.provider);
            const orientation = await (0, orientationDetector_1.detectBestOrientation)(imageBuffer, baseForOrientation);
            debug.orientation = { angle: orientation.angle, candidates: orientation.candidates.map((c) => ({ angle: c.angle, score: c.score, metrics: c.metrics })) };
            const oriented = await (0, orientationDetector_1.correctOrientation)(imageBuffer, orientation.angle);
            const variants = await (0, variants_1.generateVariants)(oriented);
            const scored = [];
            const lightProvider = (forcedProvider ? ocrService_1.OcrService.create(forcedProvider) : ocrService_1.OcrService.create(config_1.config.ocr.provider));
            for (const v of variants) {
                let doc = null;
                try {
                    doc = await (0, timeout_1.withTimeout)(lightProvider.processImage(v.buffer), 90000, `variant:${v.name}`);
                }
                catch {
                    doc = null;
                }
                const s = scoreDoc(doc);
                scored.push({ variant: v, doc, score: s });
                debug.variants.push({ name: v.name, operations: v.operations, score: s });
            }
            scored.sort((a, b) => b.score - a.score);
            const best = scored[0];
            debug.selectedVariant = best?.variant.name || "original";
            let ocrDoc = best?.doc || null;
            let bufferToOcr = best?.variant.buffer || oriented;
            if (!ocrDoc || ocrDoc.elements.length === 0) {
                ocrDoc = orientation.bestDoc;
                bufferToOcr = oriented;
            }
            if (!ocrDoc)
                throw new Error("OCR produced no text");
            debug.rawOcrElements = ocrDoc.elements.length;
            const cleanedLines = (0, lineReconstructor_1.reconstructLines)(ocrDoc.elements);
            const classified = (0, semanticClassifier_1.classifyLines)(cleanedLines);
            debug.lineCount = classified.length;
            debug.lines = classified.map((l) => ({ text: l.text, confidence: l.confidence, bbox: l.bbox, klass: l.klass }));
            const avgConf = ocrDoc.elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, ocrDoc.elements.length);
            let finalDoc = ocrDoc;
            if (avgConf < 0.55 || ocrDoc.elements.length < 2) {
                const hw = new handwritingProvider_1.HandwritingOcrProvider(this.baseOcr);
                const hwDoc = await (0, timeout_1.withTimeout)(hw.processImage(bufferToOcr), 90000, "handwriting-fallback");
                const hwAvg = hwDoc.elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, hwDoc.elements.length);
                if (hwAvg > avgConf) {
                    finalDoc = hwDoc;
                    debug.handwritingFallback = true;
                    const hwLines = (0, lineReconstructor_1.reconstructLines)(hwDoc.elements);
                    const hwClass = (0, semanticClassifier_1.classifyLines)(hwLines);
                    debug.lines = hwClass.map((l) => ({ text: l.text, confidence: l.confidence, bbox: l.bbox, klass: l.klass }));
                    debug.rawOcrElements = hwDoc.elements.length;
                    debug.lineCount = hwClass.length;
                }
            }
            receiptRepository_1.receiptRepository.saveOcrResult(receiptId, finalDoc);
            const qrCodes = await (0, qrDetector_1.detectQrCodes)(bufferToOcr).catch(() => (0, qrDetector_1.detectQrCodes)(imageBuffer)).catch(() => []);
            debug.qrCodes = qrCodes;
            const parsed = (0, parser_1.parseReceipt)(finalDoc);
            const validation = (0, validator_1.validateReceipt)(parsed);
            let paddleValidation = null;
            try {
                paddleValidation = await (0, paddleValidator_1.validateWithPaddle)(finalDoc, parsed, bufferToOcr);
                if (paddleValidation) {
                    debug.paddleValidation = { agreement: paddleValidation.agreement, issues: paddleValidation.issues, adjustment: paddleValidation.confidenceAdjustment };
                    validation.warnings.push(...paddleValidation.issues.map((i) => `[Paddle] ${i}`));
                    validation.confidenceAdjustment += paddleValidation.confidenceAdjustment;
                }
            }
            catch { }
            const confidence = (0, validator_1.computeConfidence)(parsed, validation);
            const review = (0, validator_1.needsReview)(confidence, validation);
            const receipt = receiptRepository_1.receiptRepository.getById(receiptId);
            if (!receipt)
                throw new Error("Receipt not found during processing");
            receipt.merchantName = parsed.merchant;
            receipt.purchaseDate = parsed.date;
            receipt.purchaseTime = parsed.time;
            receipt.currency = parsed.currency;
            receipt.subtotal = parsed.subtotal;
            receipt.tax = parsed.tax;
            receipt.discount = parsed.discount;
            receipt.total = parsed.total;
            receipt.paymentMethod = parsed.paymentMethod;
            receipt.receiptNumber = parsed.receiptNumber;
            receipt.confidence = confidence;
            receipt.processedImageReference = `processed_${receiptId}_o${orientation.angle}_${debug.selectedVariant}`;
            receiptRepository_1.receiptRepository.setItems(receiptId, parsed.items.map((it) => ({
                name: it.name,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.totalPrice,
                confidence: it.confidence,
                boundingBox: it.boundingBox,
            })));
            receiptRepository_1.receiptRepository.setQrCodes(receiptId, qrCodes);
            const finalStatus = review || validation.errors.length > 0 ? "needs_review" : "completed";
            receiptRepository_1.receiptRepository.setProcessingStatus(receiptId, finalStatus, `${ocrForThis.providerName}+o${orientation.angle}/${debug.selectedVariant}${debug.handwritingFallback ? "+hw" : ""}`);
            receiptRepository_1.receiptRepository.updateReceipt(receiptId, { confidence, status: finalStatus });
            debugStore.set(receiptId, debug);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const code = msg.includes("OCR") ? "OCR_FAILED" : "PARSER_FAILED";
            receiptRepository_1.receiptRepository.setProcessingStatus(receiptId, "failed", ocrForThis.providerName, { code, message: msg });
            debugStore.set(receiptId, debug);
        }
    }
}
exports.ReceiptService = ReceiptService;
exports.receiptService = new ReceiptService();
