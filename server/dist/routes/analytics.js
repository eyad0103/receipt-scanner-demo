"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/overview", (req, res, next) => {
    (0, analyticsController_1.getOverview)(req, res).catch(next);
});
router.get("/items/:itemName/history", (req, res, next) => {
    (0, analyticsController_1.getItemHistory)(req, res).catch(next);
});
exports.default = router;
