"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const receipts_1 = __importDefault(require("./routes/receipts"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const debug_1 = __importDefault(require("./routes/debug"));
const training_1 = __importDefault(require("./routes/training"));
const convo_1 = __importDefault(require("./routes/convo"));
const errorHandler_1 = require("./middleware/errorHandler");
const security_1 = require("./middleware/security");
const receiptRepository_1 = require("./repositories/receiptRepository");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(security_1.sanitizeInput);
    app.use(security_1.noCache);
    app.set("trust proxy", 1);
    const generalLimiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.maxGeneral,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
    });
    const uploadLimiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.maxUploads,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: "RATE_LIMITED", message: "Too many uploads, try again later" } },
    });
    app.use(generalLimiter);
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    app.get("/api/usage", (req, res) => {
        const userId = req.headers["x-user-id"] || "user_demo";
        const used = receiptRepository_1.receiptRepository.getUsage(userId);
        res.json({ used, limit: config_1.config.subscription.freeScansPerMonth, remaining: Math.max(0, config_1.config.subscription.freeScansPerMonth - used) });
    });
    app.use("/uploads", express_1.default.static("uploads"));
    app.use("/api/receipts", uploadLimiter, receipts_1.default);
    app.use("/api/analytics", analytics_1.default);
    app.use("/api/items", analytics_1.default);
    if (process.env.NODE_ENV !== "production")
        app.use("/api/debug", debug_1.default);
    app.use("/api/training", training_1.default);
    app.use("/api/convo", convo_1.default);
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
