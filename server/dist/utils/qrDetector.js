"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectQrCodes = detectQrCodes;
async function detectQrCodes(imageBuffer) {
    if (!imageBuffer || imageBuffer.length < 10)
        return [];
    try {
        const jimpMod = await Promise.resolve(`${"jimp"}`).then(s => __importStar(require(s))).catch(() => null);
        const Jimp = jimpMod?.default || jimpMod?.Jimp || jimpMod;
        if (!Jimp || typeof Jimp.read !== "function")
            return [];
        const qrMod = await Promise.resolve(`${"qrcode-reader"}`).then(s => __importStar(require(s))).catch(() => null);
        const QrCode = qrMod?.default || qrMod;
        if (!QrCode)
            return [];
        const image = await Jimp.read(imageBuffer);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        try {
            if (typeof image.grayscale === "function")
                image.grayscale();
            else if (typeof image.greyscale === "function")
                image.greyscale();
        }
        catch { }
        const qr = new QrCode();
        const result = await new Promise((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    resolve([]);
                }
            }, 3000);
            qr.callback = (err, value) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeout);
                if (err || !value || !value.result) {
                    resolve([]);
                    return;
                }
                const res = {
                    type: "qr",
                    value: String(value.result),
                    confidence: 0.95,
                    boundingBox: { x: 0, y: 0, width, height },
                };
                resolve([res]);
            };
            try {
                qr.decode(image.bitmap);
            }
            catch {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    resolve([]);
                }
            }
        });
        return result;
    }
    catch {
        return [];
    }
}
