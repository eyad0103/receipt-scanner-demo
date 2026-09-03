"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.noCache = noCache;
exports.validateReceiptId = validateReceiptId;
const errors_1 = require("../utils/errors");
function sanitizeInput(req, _res, next) {
    const clean = (obj) => {
        if (typeof obj === "string")
            return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 10000);
        if (Array.isArray(obj))
            return obj.map(clean);
        if (obj && typeof obj === "object") {
            const out = {};
            for (const [k, v] of Object.entries(obj)) {
                if (k.startsWith("__") || k.includes("$"))
                    continue;
                out[k.slice(0, 100)] = clean(v);
            }
            return out;
        }
        return obj;
    };
    if (req.body)
        req.body = clean(req.body);
    if (req.query && typeof req.query === "object") {
        for (const k of Object.keys(req.query)) {
            if (k.startsWith("__") || k.includes("$"))
                delete req.query[k];
            else {
                const v = req.query[k];
                if (typeof v === "string")
                    req.query[k] = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 200);
            }
        }
    }
    next();
}
function noCache(_req, res, next) {
    res.setHeader("Cache-Control", "no-store");
    next();
}
function validateReceiptId(req, _res, next) {
    const raw = req.params.receiptId;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (id && !/^rcpt_[a-z0-9]{6,12}$/.test(String(id))) {
        next(new errors_1.AppError("NOT_FOUND", "Receipt not found", 404));
        return;
    }
    next();
}
