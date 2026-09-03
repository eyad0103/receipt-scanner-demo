"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverview = getOverview;
exports.getItemHistory = getItemHistory;
const receiptRepository_1 = require("../repositories/receiptRepository");
const errors_1 = require("../utils/errors");
async function getOverview(req, res) {
    const userId = req.userId;
    const receipts = receiptRepository_1.receiptRepository.getAllForAnalytics(userId);
    const totalSpending = receipts.reduce((a, r) => a + (r.total.value || 0), 0);
    const receiptCount = receipts.length;
    const averageReceiptValue = receiptCount === 0 ? 0 : Math.round((totalSpending / receiptCount) * 100) / 100;
    const byMerchant = new Map();
    for (const r of receipts) {
        const m = r.merchantName.value || "Unknown";
        const cur = byMerchant.get(m) || { total: 0, count: 0 };
        cur.total += r.total.value || 0;
        cur.count++;
        byMerchant.set(m, cur);
    }
    const byDate = new Map();
    for (const r of receipts) {
        const d = (r.purchaseDate.value || r.createdAt).slice(0, 10);
        const cur = byDate.get(d) || { total: 0, count: 0 };
        cur.total += r.total.value || 0;
        cur.count++;
        byDate.set(d, cur);
    }
    res.json({
        totalSpending: Math.round(totalSpending * 100) / 100,
        currency: receipts[0]?.currency || "EGP",
        receiptCount,
        averageReceiptValue,
        spendingByMerchant: [...byMerchant.entries()]
            .map(([merchant, v]) => ({ merchant, total: Math.round(v.total * 100) / 100, count: v.count }))
            .sort((a, b) => b.total - a.total),
        spendingOverTime: [...byDate.entries()]
            .map(([date, v]) => ({ date, total: Math.round(v.total * 100) / 100, count: v.count }))
            .sort((a, b) => a.date.localeCompare(b.date)),
    });
}
async function getItemHistory(req, res) {
    const userId = req.userId;
    const raw = req.params.itemName;
    const itemName = Array.isArray(raw) ? raw[0] : raw;
    if (!itemName)
        throw errors_1.Errors.notFound("Item name required");
    const history = receiptRepository_1.receiptRepository.findItemHistory(userId, decodeURIComponent(String(itemName)));
    res.json({
        item: itemName,
        count: history.length,
        history: history.map(({ receipt, item }) => ({
            receiptId: receipt.id,
            merchant: receipt.merchantName.value,
            purchaseDate: receipt.purchaseDate.value,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            currency: receipt.currency,
        })),
    });
}
