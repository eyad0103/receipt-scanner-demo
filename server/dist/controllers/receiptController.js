"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadReceipt = uploadReceipt;
exports.getReceipt = getReceipt;
exports.listReceipts = listReceipts;
exports.patchReceipt = patchReceipt;
const receiptRepository_1 = require("../repositories/receiptRepository");
const receiptService_1 = require("../services/receiptService");
const usageService_1 = require("../services/usageService");
const validator_1 = require("../image-processing/validator");
const queue_1 = require("../jobs/queue");
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
queue_1.jobQueue.register("process_receipt", async ({ receiptId, buffer, ocrProvider }) => {
    await receiptService_1.receiptService.processReceipt(receiptId, buffer, ocrProvider);
});
function toApiReceipt(r) {
    return {
        id: r.id,
        merchant: r.merchantName.value,
        merchantConfidence: r.merchantName.confidence,
        date: r.purchaseDate.value,
        dateConfidence: r.purchaseDate.confidence,
        time: r.purchaseTime.value,
        timeConfidence: r.purchaseTime.confidence,
        currency: r.currency,
        subtotal: r.subtotal.value,
        subtotalConfidence: r.subtotal.confidence,
        tax: r.tax.value,
        taxConfidence: r.tax.confidence,
        discount: r.discount.value,
        discountConfidence: r.discount.confidence,
        total: r.total.value,
        totalConfidence: r.total.confidence,
        paymentMethod: r.paymentMethod.value,
        receiptNumber: r.receiptNumber.value,
        status: r.status,
        confidence: r.confidence,
        items: r.items.map((it) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            confidence: it.confidence,
        })),
        qrCodes: r.qrCodes,
        imageReference: r.imageReference,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
function q(req, key) {
    const v = req.query[key];
    if (Array.isArray(v))
        return v[0];
    return v;
}
async function uploadReceipt(req, res) {
    const userId = req.userId;
    usageService_1.usageService.checkQuota(userId);
    const file = req.file;
    (0, validator_1.validateUpload)(file);
    const fs = await Promise.resolve().then(() => __importStar(require("fs")));
    const path = await Promise.resolve().then(() => __importStar(require("path")));
    const dir = path.join(process.cwd(), "uploads");
    try {
        fs.mkdirSync(dir, { recursive: true });
    }
    catch { }
    const f = file;
    const ocrProvider = req.headers["x-ocr-provider"] || req.headers["X-OCR-Provider"] || undefined;
    const receipt = receiptRepository_1.receiptRepository.createReceipt(userId, f.originalname);
    const ext = path.extname(f.originalname) || ".png";
    const savedPath = path.join(dir, `${receipt.id}${ext}`);
    try {
        fs.writeFileSync(savedPath, f.buffer);
        receipt.imageReference = savedPath;
        receiptRepository_1.receiptRepository.updateReceipt(receipt.id, { imageReference: savedPath });
    }
    catch { }
    if (ocrProvider)
        receiptRepository_1.receiptRepository.updateReceipt(receipt.id, { ocrProvider });
    try {
        const dbPath = path.join(dir, "db.json");
        const entry = { id: receipt.id, userId, originalName: f.originalname, savedPath, size: f.buffer.length, mime: f.mimetype, ocrProvider: ocrProvider || "tesseract", uploadedAt: new Date().toISOString() };
        let arr = [];
        try {
            arr = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        }
        catch { }
        arr.push(entry);
        fs.writeFileSync(dbPath, JSON.stringify(arr.slice(-1000), null, 2));
    }
    catch { }
    usageService_1.usageService.recordScan(userId);
    receiptRepository_1.receiptRepository.setProcessingStatus(receipt.id, "processing");
    await queue_1.jobQueue.add("process_receipt", { receiptId: receipt.id, buffer: file.buffer, ocrProvider });
    res.status(201).json({ receiptId: receipt.id, status: "processing" });
}
async function getReceipt(req, res) {
    const userId = req.userId;
    const receiptId = String(req.params.receiptId);
    const receipt = receiptRepository_1.receiptRepository.getByIdForUser(receiptId, userId);
    if (!receipt)
        throw errors_1.Errors.notFound("Receipt not found");
    const processing = receiptRepository_1.receiptRepository.getProcessing(receiptId);
    const ocr = receiptRepository_1.receiptRepository.getOcrByReceiptId(receiptId);
    res.json({
        ...toApiReceipt(receipt),
        processing: processing || null,
        ocr: ocr ? { provider: ocr.provider, rawText: ocr.rawDocument.rawText, elements: ocr.rawDocument.elements } : null,
    });
}
async function listReceipts(req, res) {
    const userId = req.userId;
    const page = parseInt(q(req, "page") || "1", 10);
    const limit = parseInt(q(req, "limit") || "20", 10);
    const result = receiptRepository_1.receiptRepository.listForUser(userId, {
        page,
        limit,
        merchant: q(req, "merchant"),
        from: q(req, "from"),
        to: q(req, "to"),
        search: q(req, "search") || q(req, "q"),
        sortBy: q(req, "sortBy"),
        sortOrder: q(req, "sortOrder"),
        status: q(req, "status"),
    });
    res.json({
        data: result.data.map(toApiReceipt),
        pagination: result.pagination,
    });
}
const patchSchema = zod_1.z.object({
    merchant: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    time: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().nullable().optional(),
    tax: zod_1.z.number().nullable().optional(),
    discount: zod_1.z.number().nullable().optional(),
    total: zod_1.z.number().nullable().optional(),
    paymentMethod: zod_1.z.string().nullable().optional(),
    receiptNumber: zod_1.z.string().nullable().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().optional(),
        name: zod_1.z.string(),
        quantity: zod_1.z.number(),
        unitPrice: zod_1.z.number().nullable().optional(),
        totalPrice: zod_1.z.number(),
    }))
        .optional(),
    status: zod_1.z.enum(["completed", "needs_review"]).optional(),
});
async function patchReceipt(req, res) {
    const userId = req.userId;
    const receiptId = String(req.params.receiptId);
    const receipt = receiptRepository_1.receiptRepository.getByIdForUser(receiptId, userId);
    if (!receipt)
        throw errors_1.Errors.notFound("Receipt not found");
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ error: { code: "VALIDATION_FAILED", message: "Invalid body", details: parsed.error.flatten() } });
        return;
    }
    const body = parsed.data;
    if (body.merchant !== undefined)
        receipt.merchantName = { value: body.merchant, confidence: 1 };
    if (body.date !== undefined)
        receipt.purchaseDate = { value: body.date, confidence: 1 };
    if (body.time !== undefined)
        receipt.purchaseTime = { value: body.time, confidence: 1 };
    if (body.currency !== undefined)
        receipt.currency = body.currency;
    if (body.subtotal !== undefined)
        receipt.subtotal = { value: body.subtotal, confidence: 1 };
    if (body.tax !== undefined)
        receipt.tax = { value: body.tax, confidence: 1 };
    if (body.discount !== undefined)
        receipt.discount = { value: body.discount, confidence: 1 };
    if (body.total !== undefined)
        receipt.total = { value: body.total, confidence: 1 };
    if (body.paymentMethod !== undefined)
        receipt.paymentMethod = { value: body.paymentMethod, confidence: 1 };
    if (body.receiptNumber !== undefined)
        receipt.receiptNumber = { value: body.receiptNumber, confidence: 1 };
    if (body.items !== undefined) {
        receiptRepository_1.receiptRepository.setItems(receiptId, body.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice ?? null,
            totalPrice: it.totalPrice,
            confidence: 1,
        })));
    }
    const newStatus = body.status || "completed";
    receiptRepository_1.receiptRepository.setProcessingStatus(receiptId, newStatus);
    receiptRepository_1.receiptRepository.updateReceipt(receiptId, { confidence: 1 });
    try {
        const { saveExample } = await Promise.resolve().then(() => __importStar(require("../training/dataset")));
        const ocr = receiptRepository_1.receiptRepository.getOcrByReceiptId(receiptId);
        saveExample({
            id: receiptId,
            ocrText: ocr?.rawDocument.rawText || "",
            ocrElements: (ocr?.rawDocument.elements || []).map((e) => ({ text: e.text, confidence: e.confidence })),
            corrected: {
                merchant: receipt.merchantName.value,
                items: (body.items || receipt.items).map((it) => ({ name: it.name, quantity: it.quantity, totalPrice: it.totalPrice })),
                total: receipt.total.value,
            },
            createdAt: new Date().toISOString(),
        });
    }
    catch { }
    const updated = receiptRepository_1.receiptRepository.getByIdForUser(receiptId, userId);
    res.json(toApiReceipt(updated));
}
