"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const FILE = path_1.default.join(process.cwd(), "data", "convo.json");
function load() {
    try {
        return JSON.parse(fs_1.default.readFileSync(FILE, "utf8"));
    }
    catch {
        return [];
    }
}
function save(all) { fs_1.default.mkdirSync(path_1.default.dirname(FILE), { recursive: true }); fs_1.default.writeFileSync(FILE, JSON.stringify(all, null, 2)); }
router.get("/", (_req, res) => {
    res.json(load());
});
router.post("/", (req, res) => {
    const text = String(req.body?.text || "").trim().slice(0, 2000);
    if (!text)
        return res.status(400).json({ error: "empty" });
    const all = load();
    all.push({ id: `msg_${Date.now()}`, role: "user", text, at: new Date().toISOString() });
    save(all);
    console.log(`[convo] user reply: ${text.slice(0, 120)}`);
    res.json({ ok: true, count: all.length });
});
router.post("/assistant", (req, res) => {
    const text = String(req.body?.text || "").trim().slice(0, 4000);
    if (!text)
        return res.status(400).json({ error: "empty" });
    const all = load();
    all.push({ id: `msg_${Date.now()}`, role: "assistant", text, at: new Date().toISOString() });
    save(all);
    res.json({ ok: true });
});
exports.default = router;
