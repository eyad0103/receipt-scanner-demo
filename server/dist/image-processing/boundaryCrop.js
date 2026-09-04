"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectReceiptBounds = detectReceiptBounds;
const variants_1 = require("./variants");
async function detectReceiptBounds(buffer) {
    const fallback = async () => {
        try {
            const J = await (0, variants_1.loadJimp)();
            if (!J)
                throw new Error("nojimp");
            const probe = await J.read(buffer);
            return { buffer, bounds: { x: 0, y: 0, w: probe.bitmap.width, h: probe.bitmap.height, cropped: false } };
        }
        catch {
            return { buffer, bounds: { x: 0, y: 0, w: 0, h: 0, cropped: false } };
        }
    };
    try {
        const J = await (0, variants_1.loadJimp)();
        if (!J)
            return fallback();
        const src = await J.read(buffer);
        const W = src.bitmap.width, H = src.bitmap.height;
        if (!W || !H)
            return fallback();
        const data = src.bitmap.data;
        const cols = Math.min(120, W), rows = Math.min(160, H);
        const colInk = new Array(cols).fill(0);
        const rowInk = new Array(rows).fill(0);
        const colN = new Array(cols).fill(0);
        const rowN = new Array(rows).fill(0);
        const lum = (x, y) => {
            const o = (y * W + x) * 4;
            return 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
        };
        for (let y = 0; y < H - 1; y += 2) {
            for (let x = 0; x < W - 1; x += 2) {
                const g = lum(x, y);
                const edge = Math.abs(g - lum(x + 1, y)) + Math.abs(g - lum(x, y + 1));
                const ink = edge > 24 ? 1 : 0;
                const cx = Math.min(cols - 1, Math.floor((x / W) * cols));
                const ry = Math.min(rows - 1, Math.floor((y / H) * rows));
                colInk[cx] += ink;
                colN[cx]++;
                rowInk[ry] += ink;
                rowN[ry]++;
            }
        }
        const colD = colInk.map((v, i) => v / Math.max(1, colN[i]));
        const rowD = rowInk.map((v, i) => v / Math.max(1, rowN[i]));
        const maxD = Math.max(...colD, ...rowD, 0.001);
        const thr = maxD * 0.12;
        let x0 = 0, x1 = cols - 1, y0 = 0, y1 = rows - 1;
        while (x0 < x1 && colD[x0] < thr)
            x0++;
        while (x1 > x0 && colD[x1] < thr)
            x1--;
        while (y0 < y1 && rowD[y0] < thr)
            y0++;
        while (y1 > y0 && rowD[y1] < thr)
            y1--;
        const padX = Math.round(cols * 0.02), padY = Math.round(rows * 0.02);
        x0 = Math.max(0, x0 - padX);
        x1 = Math.min(cols - 1, x1 + padX);
        y0 = Math.max(0, y0 - padY);
        y1 = Math.min(rows - 1, y1 + padY);
        const bx = Math.floor((x0 / cols) * W), bx1 = Math.ceil(((x1 + 1) / cols) * W);
        const by = Math.floor((y0 / rows) * H), by1 = Math.ceil(((y1 + 1) / rows) * H);
        const bw = bx1 - bx, bh = by1 - by;
        const areaRatio = (bw * bh) / (W * H);
        if (areaRatio > 0.8 || bw < W * 0.25 || bh < H * 0.25) {
            return { buffer, bounds: { x: 0, y: 0, w: W, h: H, cropped: false } };
        }
        const crop = await J.read(buffer);
        crop.crop({ x: bx, y: by, w: bw, h: bh });
        const out = await (0, variants_1.encodeJimp)(J, crop);
        if (!out)
            return { buffer, bounds: { x: 0, y: 0, w: W, h: H, cropped: false } };
        return { buffer: out, bounds: { x: bx, y: by, w: bw, h: bh, cropped: true } };
    }
    catch {
        return fallback();
    }
}
