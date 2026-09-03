"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageService = void 0;
const config_1 = require("../config");
const receiptRepository_1 = require("../repositories/receiptRepository");
exports.usageService = {
    checkQuota(_userId, _plan = "free") {
        return;
        // quota check disabled for dev: unlimited scans
        // if (_plan === "premium") return;
        // const used = receiptRepository.getUsage(_userId);
        // if (used >= config.subscription.freeScansPerMonth) {
        //   throw Errors.quotaExceeded(`Free limit of ${config.subscription.freeScansPerMonth} scans/month reached`);
        // }
    },
    recordScan(userId) {
        return receiptRepository_1.receiptRepository.incrementUsage(userId);
    },
    getUsage(userId) {
        const used = receiptRepository_1.receiptRepository.getUsage(userId);
        const limit = config_1.config.subscription.freeScansPerMonth;
        return { used, limit, remaining: Math.max(0, limit - used) };
    },
};
