"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
        return;
    }
    if (err instanceof Error) {
        if (err.status === 429) {
            res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests" } });
            return;
        }
        if (err.message.includes("Unexpected field") || err.message.includes("LIMIT_FILE_SIZE")) {
            res.status(400).json({ error: { code: "INVALID_IMAGE", message: err.message } });
            return;
        }
    }
    console.error(`[error] ${err instanceof Error ? err.stack || err.message : String(err)}`);
    res.status(500).json({ error: { code: "DATABASE_ERROR", message: "Internal server error" } });
}
function notFoundHandler(_req, res) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
}
