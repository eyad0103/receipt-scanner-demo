"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const receiptController_1 = require("../controllers/receiptController");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: config_1.config.upload.maxSizeBytes },
    fileFilter: (_req, file, cb) => {
        if (config_1.config.upload.allowedMimeTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error("Unsupported file type"));
    },
});
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post("/upload", upload.single("image"), (req, res, next) => {
    (0, receiptController_1.uploadReceipt)(req, res).catch(next);
});
router.get("/", (req, res, next) => {
    (0, receiptController_1.listReceipts)(req, res).catch(next);
});
router.get("/:receiptId", (req, res, next) => {
    (0, receiptController_1.getReceipt)(req, res).catch(next);
});
router.patch("/:receiptId", (req, res, next) => {
    (0, receiptController_1.patchReceipt)(req, res).catch(next);
});
exports.default = router;
