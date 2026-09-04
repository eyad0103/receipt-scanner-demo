"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessQuality = assessQuality;
const variants_1 = require("./variants");
function laplacianVariance(gray, w, h) {
    const step = Math.max(1, Math.floor((w * h) / 30000));
    let sum = 0, sumSq = 0, n = 0;
    for (let y = 1; y < h - 1; y += step) {
        for (let x = 1; x < w - 1; x += step) {
            const i = y * w + x;
            if (i - w < 0 || i + w >= gray.length || i + 1 >= gray.length)
                continue;
            const lap = Math.abs(4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w]);
            if (!isFinite(lap))
                continue;
            sum += lap;
            sumSq += lap * lap;
            n++;
        }
    }
    if (!n)
        return 9999;
    const mean = sum / n;
    const v = sumSq / n - mean * mean;
    return isFinite(v) ? v : 9999;
}
async function assessQuality(buffer) {
    const issues = [];
    let width = 0, height = 0, mean = 128, blur = 9999, std = 60, coverage = 1;
    try {
        const J = await (0, variants_1.loadJimp)();
        if (!J)
            return { score: 50, width, height, meanBrightness: mean, blurVariance: blur, contrastStd: std, receiptCoverage: coverage, issues, passed: true };
        const src = await J.read(buffer);
        width = src.bitmap.width;
        height = src.bitmap.height;
        const data = src.bitmap.data;
        if (!data || !width || !height)
            throw new Error("undecodable");
        const step = Math.max(1, Math.floor((width * height) / 40000));
        const gray = [];
        let sum = 0, n = 0, dark = 0;
        for (let i = 0; i < width * height; i += step) {
            const o = i * 4;
            const g = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
            gray.push(g);
            sum += g;
            n++;
            if (g < 100)
                dark++;
        }
        mean = sum / Math.max(1, n);
        let sq = 0;
        for (const g of gray)
            sq += (g - mean) * (g - mean);
        std = Math.sqrt(sq / Math.max(1, gray.length));
        const gw = Math.max(3, Math.round(width / step));
        const gh = Math.max(3, Math.ceil(gray.length / gw));
        blur = laplacianVariance(gray, gw, gh);
        if (!isFinite(blur))
            blur = 9999;
        coverage = 1 - dark / Math.max(1, n);
    }
    catch {
        return { score: 50, width, height, meanBrightness: mean, blurVariance: blur, contrastStd: std, receiptCoverage: coverage, issues, passed: true };
    }
    if (width < 120 || height < 80 || width * height < 30000) {
        issues.push({ code: "TOO_SMALL", message: "Receipt is too small in the frame", advice: "Move closer so the receipt fills the screen, then retake.", fatal: true });
    }
    else if (width < 350 && blur < 60) {
        issues.push({ code: "TOO_SMALL", message: "Small and soft — text may not survive OCR", advice: "Move closer so the receipt fills the screen, then retake.", fatal: true });
    }
    if (blur < 12) {
        issues.push({ code: "BLURRY", message: "Photo looks blurry", advice: "Hold steady, tap to focus on the text, and retake.", fatal: mean < 70 });
    }
    if (mean < 60) {
        issues.push({ code: "TOO_DARK", message: "Photo is too dark", advice: "Turn on flash or move to better light, then retake.", fatal: blur < 12 });
    }
    if (mean > 215 && std < 25) {
        issues.push({ code: "OVEREXPOSED", message: "Photo looks washed out", advice: "Turn off flash and avoid glare on the paper.", fatal: false });
    }
    if (std < 18 && mean >= 60) {
        issues.push({ code: "LOW_CONTRAST", message: "Text barely stands out from paper", advice: "More even lighting helps — avoid shadows across the receipt.", fatal: false });
    }
    if (coverage > 0.97 && width * height > 800 * 800) {
        issues.push({ code: "RECEIPT_TINY", message: "Receipt may be too far away", advice: "Move closer so the receipt fills most of the frame.", fatal: false });
    }
    const fatal = issues.some((i) => i.fatal);
    const score = Math.max(0, Math.min(100, Math.round(100 - issues.length * 18 - (fatal ? 30 : 0))));
    return { score, width, height, meanBrightness: Math.round(mean), blurVariance: Math.round(blur), contrastStd: Math.round(std), receiptCoverage: Math.round(coverage * 100) / 100, issues, passed: !fatal };
}
