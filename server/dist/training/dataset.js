"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDataset = loadDataset;
exports.saveExample = saveExample;
exports.getProductDictionary = getProductDictionary;
exports.getMerchantDictionary = getMerchantDictionary;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_PATH = path_1.default.join(process.cwd(), "data", "verified.json");
function ensureDir() {
    try {
        fs_1.default.mkdirSync(path_1.default.dirname(DATA_PATH), { recursive: true });
    }
    catch { }
}
function loadDataset() {
    try {
        if (!fs_1.default.existsSync(DATA_PATH))
            return [];
        return JSON.parse(fs_1.default.readFileSync(DATA_PATH, "utf8"));
    }
    catch {
        return [];
    }
}
function saveExample(ex) {
    ensureDir();
    const all = loadDataset();
    all.push(ex);
    fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(all.slice(-500), null, 2));
}
function getProductDictionary() {
    const all = loadDataset();
    const map = new Map();
    for (const ex of all) {
        for (const it of ex.corrected.items) {
            const k = it.name.toLowerCase().trim();
            map.set(k, (map.get(k) || 0) + 1);
        }
    }
    return map;
}
function getMerchantDictionary() {
    const all = loadDataset();
    const map = new Map();
    for (const ex of all)
        if (ex.corrected.merchant) {
            const k = ex.corrected.merchant.toLowerCase().trim();
            map.set(k, (map.get(k) || 0) + 1);
        }
    return map;
}
