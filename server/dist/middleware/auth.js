"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
function authMiddleware(req, _res, next) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
        const token = header.slice(7);
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            req.userId = payload.userId;
            next();
            return;
        }
        catch {
            next(errors_1.Errors.unauthorized("Invalid token"));
            return;
        }
    }
    const fallback = req.headers["x-user-id"] || req.query.userId;
    if (fallback) {
        req.userId = String(fallback);
        next();
        return;
    }
    req.userId = "user_demo";
    next();
}
function requireAuth(req, _res, next) {
    if (!req.userId) {
        next(errors_1.Errors.unauthorized());
        return;
    }
    next();
}
