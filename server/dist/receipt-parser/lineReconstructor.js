"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanElements = cleanElements;
exports.associateColumns = associateColumns;
exports.reconstructLines = reconstructLines;
function verticalCenter(e) {
    return e.boundingBox.y + e.boundingBox.height / 2;
}
function avgHeight(elements) {
    if (elements.length === 0)
        return 20;
    return elements.reduce((a, b) => a + b.boundingBox.height, 0) / elements.length;
}
function cleanElements(elements) {
    return elements.filter((e) => {
        const t = e.text.trim();
        if (!t)
            return false;
        if (t.length === 1 && /[-—_|\\/]/.test(t) && e.confidence < 0.6)
            return false;
        const area = e.boundingBox.width * e.boundingBox.height;
        if (area < 80 && e.confidence < 0.5)
            return false;
        const aspect = e.boundingBox.width / Math.max(1, e.boundingBox.height);
        if (aspect > 25 && t.length < 3)
            return false;
        if (e.boundingBox.width < 4 || e.boundingBox.height < 6)
            return false;
        return true;
    });
}
const PRICE_ONLY = /^\s*[$€£]?\s*\d+[.,]?\d*\s*[$€£]?\s*$/;
function associateColumns(lines) {
    const sorted = [...lines].sort((a, b) => a.yCenter - b.yCenter);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
        const l = sorted[i];
        const els = [...l.elements].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
        let text = els.map((e) => e.text).join(" ");
        const qm = text.match(/\bx\s*(\d{1,2})\b|\b(\d{1,2})\s*x\b/i);
        if (qm) {
            const q = qm[1] || qm[2];
            text = (`${q} ` + text.replace(qm[0], " ").replace(/\s+/g, " ")).trim();
        }
        const hasPrice = /(\d+[.,]\d{2}|\d+)\s*[$€£]?\s*$/.test(text);
        const next = sorted[i + 1];
        if (!hasPrice && next && PRICE_ONLY.test(next.text)) {
            const gap = next.yCenter - l.yCenter;
            if (gap < Math.max(l.height, next.height) * 1.8) {
                text = `${text} ${next.text.trim()}`;
                const conf = (l.confidence + next.confidence) / 2;
                const minX = Math.min(l.bbox.x, next.bbox.x);
                const minY = Math.min(l.bbox.y, next.bbox.y);
                const maxX = Math.max(l.bbox.x + l.bbox.width, next.bbox.x + next.bbox.width);
                const maxY = Math.max(l.bbox.y + l.bbox.height, next.bbox.y + next.bbox.height);
                out.push({ ...l, elements: [...l.elements, ...next.elements], text, confidence: conf, bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } });
                i++;
                continue;
            }
        }
        out.push({ ...l, text });
    }
    return out;
}
function reconstructLines(elements, opts) {
    const cleaned = cleanElements(elements);
    if (cleaned.length === 0)
        return [];
    const sorted = [...cleaned].sort((a, b) => verticalCenter(a) - verticalCenter(b));
    const threshold = opts?.threshold ?? 0.6;
    const lines = [];
    let current = [sorted[0]];
    let curAvgH = sorted[0].boundingBox.height;
    for (let i = 1; i < sorted.length; i++) {
        const el = sorted[i];
        const curCenter = current.reduce((a, b) => a + verticalCenter(b), 0) / current.length;
        const elCenter = verticalCenter(el);
        const avgH = (curAvgH + el.boundingBox.height) / 2;
        const diff = Math.abs(elCenter - curCenter);
        if (diff < avgH * threshold) {
            current.push(el);
            curAvgH = avgHeight(current);
        }
        else {
            lines.push(current);
            current = [el];
            curAvgH = el.boundingBox.height;
        }
    }
    lines.push(current);
    return lines.map((els, idx) => {
        const sortedEls = [...els].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
        const text = sortedEls.map((e) => e.text).join(" ");
        const confidence = sortedEls.reduce((a, b) => a + b.confidence, 0) / sortedEls.length;
        const minX = Math.min(...sortedEls.map((e) => e.boundingBox.x));
        const minY = Math.min(...sortedEls.map((e) => e.boundingBox.y));
        const maxX = Math.max(...sortedEls.map((e) => e.boundingBox.x + e.boundingBox.width));
        const maxY = Math.max(...sortedEls.map((e) => e.boundingBox.y + e.boundingBox.height));
        return {
            id: `line_${idx}`,
            elements: sortedEls,
            text,
            confidence,
            bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
            yCenter: sortedEls.reduce((a, b) => a + verticalCenter(b), 0) / sortedEls.length,
            height: avgHeight(sortedEls),
        };
    }).sort((a, b) => a.yCenter - b.yCenter);
}
