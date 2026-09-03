"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptRepository = void 0;
const uuid_1 = require("uuid");
const normalize_1 = require("../utils/normalize");
const receipts = new Map();
const processings = new Map();
const ocrRecords = new Map();
const usageMap = new Map();
function nowIso() {
    return new Date().toISOString();
}
function genId(prefix) {
    return `${prefix}_${(0, uuid_1.v4)().slice(0, 8)}`;
}
exports.receiptRepository = {
    createReceipt(userId, imageReference) {
        const id = genId("rcpt");
        const now = nowIso();
        const receipt = {
            id,
            userId,
            merchantName: { value: null, confidence: 0 },
            purchaseDate: { value: null, confidence: 0 },
            purchaseTime: { value: null, confidence: 0 },
            currency: "EGP",
            subtotal: { value: null, confidence: 0 },
            tax: { value: null, confidence: 0 },
            discount: { value: null, confidence: 0 },
            total: { value: null, confidence: 0 },
            paymentMethod: { value: null, confidence: 0 },
            receiptNumber: { value: null, confidence: 0 },
            status: "uploaded",
            confidence: 0,
            imageReference,
            processedImageReference: null,
            items: [],
            qrCodes: [],
            createdAt: now,
            updatedAt: now,
        };
        receipts.set(id, receipt);
        const proc = {
            id: genId("proc"),
            receiptId: id,
            processingStatus: "uploaded",
            ocrProvider: "",
            processingStartedAt: null,
            processingCompletedAt: null,
            errorCode: null,
            errorMessage: null,
        };
        processings.set(id, proc);
        return receipt;
    },
    getById(id) {
        return receipts.get(id);
    },
    getByIdForUser(id, userId) {
        const r = receipts.get(id);
        if (!r || r.userId !== userId)
            return undefined;
        return r;
    },
    updateReceipt(id, patch) {
        const r = receipts.get(id);
        if (!r)
            return undefined;
        Object.assign(r, patch, { updatedAt: nowIso() });
        receipts.set(id, r);
        return r;
    },
    setProcessingStatus(receiptId, status, provider, error) {
        const proc = processings.get(receiptId);
        if (proc) {
            proc.processingStatus = status;
            if (provider)
                proc.ocrProvider = provider;
            if (status === "processing")
                proc.processingStartedAt = nowIso();
            if (status === "completed" || status === "failed" || status === "needs_review")
                proc.processingCompletedAt = nowIso();
            if (error) {
                proc.errorCode = error.code;
                proc.errorMessage = error.message;
            }
        }
        const r = receipts.get(receiptId);
        if (r) {
            r.status = status;
            r.updatedAt = nowIso();
        }
    },
    saveOcrResult(receiptId, doc) {
        const rec = {
            id: genId("ocr"),
            receiptId,
            provider: doc.provider,
            rawDocument: doc,
            createdAt: nowIso(),
        };
        ocrRecords.set(rec.id, rec);
        return rec;
    },
    getOcrByReceiptId(receiptId) {
        for (const r of ocrRecords.values())
            if (r.receiptId === receiptId)
                return r;
        return undefined;
    },
    setItems(receiptId, items) {
        const r = receipts.get(receiptId);
        if (!r)
            return [];
        const now = nowIso();
        const mapped = items.map((it) => ({
            id: genId("item"),
            receiptId,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            confidence: it.confidence,
            boundingBox: it.boundingBox,
            createdAt: now,
        }));
        r.items = mapped;
        r.updatedAt = now;
        return mapped;
    },
    setQrCodes(receiptId, codes) {
        const r = receipts.get(receiptId);
        if (r)
            r.qrCodes = codes;
    },
    listForUser(userId, filters) {
        let all = [...receipts.values()].filter((r) => r.userId === userId);
        if (filters.merchant) {
            const m = filters.merchant.toLowerCase();
            all = all.filter((r) => (r.merchantName.value || "").toLowerCase().includes(m));
        }
        if (filters.from) {
            all = all.filter((r) => r.purchaseDate.value ? r.purchaseDate.value >= filters.from : true);
        }
        if (filters.to) {
            all = all.filter((r) => r.purchaseDate.value ? r.purchaseDate.value <= filters.to : true);
        }
        if (filters.status) {
            all = all.filter((r) => r.status === filters.status);
        }
        if (filters.search) {
            const s = filters.search.toLowerCase();
            all = all.filter((r) => (r.merchantName.value || "").toLowerCase().includes(s) ||
                r.id.toLowerCase().includes(s) ||
                r.items.some((it) => it.name.toLowerCase().includes(s)) ||
                (r.purchaseDate.value || "").includes(s));
        }
        const sortBy = filters.sortBy || "createdAt";
        const order = filters.sortOrder || "desc";
        all.sort((a, b) => {
            let av = "";
            let bv = "";
            if (sortBy === "createdAt") {
                av = a.createdAt;
                bv = b.createdAt;
            }
            else if (sortBy === "purchaseDate") {
                av = a.purchaseDate.value || "";
                bv = b.purchaseDate.value || "";
            }
            else if (sortBy === "total") {
                av = a.total.value || 0;
                bv = b.total.value || 0;
            }
            else if (sortBy === "merchant") {
                av = a.merchantName.value || "";
                bv = b.merchantName.value || "";
            }
            if (av < bv)
                return order === "asc" ? -1 : 1;
            if (av > bv)
                return order === "asc" ? 1 : -1;
            return 0;
        });
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 20));
        const total = all.length;
        const start = (page - 1) * limit;
        const data = all.slice(start, start + limit);
        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    },
    getProcessing(receiptId) {
        return processings.get(receiptId);
    },
    findItemHistory(userId, itemName) {
        const key = (0, normalize_1.productMatchKey)(itemName);
        const results = [];
        for (const r of receipts.values()) {
            if (r.userId !== userId)
                continue;
            if (r.status !== "completed" && r.status !== "needs_review")
                continue;
            for (const it of r.items) {
                if ((0, normalize_1.productMatchKey)(it.name) === key || (0, normalize_1.areProductsSimilar)(it.name, itemName)) {
                    results.push({ receipt: r, item: it });
                }
            }
        }
        return results.sort((a, b) => (b.receipt.purchaseDate.value || "").localeCompare(a.receipt.purchaseDate.value || ""));
    },
    getAllForAnalytics(userId) {
        return [...receipts.values()].filter((r) => r.userId === userId && (r.status === "completed" || r.status === "needs_review"));
    },
    incrementUsage(userId) {
        const month = new Date().toISOString().slice(0, 7);
        const key = `${userId}:${month}`;
        const cur = usageMap.get(key) || { count: 0, month };
        cur.count++;
        usageMap.set(key, cur);
        return cur.count;
    },
    getUsage(userId) {
        const month = new Date().toISOString().slice(0, 7);
        return usageMap.get(`${userId}:${month}`)?.count || 0;
    },
    clearAll() {
        receipts.clear();
        processings.clear();
        ocrRecords.clear();
        usageMap.clear();
    },
};
