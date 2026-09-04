"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
function withTimeout(p, ms, label = "op") {
    let t;
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    const settle = p.then((v) => { if (t)
        clearTimeout(t); return v; }, (e) => { if (t)
        clearTimeout(t); throw e; });
    return Promise.race([settle, timeout]);
}
