"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataset_1 = require("../training/dataset");
const learner_1 = require("../training/learner");
const router = (0, express_1.Router)();
router.get("/stats", (_req, res) => {
    const all = (0, dataset_1.loadDataset)();
    const dict = (0, dataset_1.getProductDictionary)();
    res.json({ verifiedCount: all.length, uniqueProducts: dict.size, topProducts: [...dict.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) });
});
router.post("/seed", (req, res) => {
    const n = Math.min(100, parseInt(req.query.n || "30", 10) || 30);
    (0, learner_1.trainFromSynthetic)(n);
    res.json({ seeded: n, total: (0, dataset_1.loadDataset)().length });
});
router.get("/dataset", (_req, res) => {
    res.json((0, dataset_1.loadDataset)().slice(-20));
});
exports.default = router;
