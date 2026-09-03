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
exports.ChandraProvider = void 0;
class ChandraProvider {
    constructor() {
        this.name = "chandra";
    }
    async processImage(imageBuffer, _opts) {
        if (!imageBuffer || imageBuffer.length === 0)
            throw new Error("Empty buffer");
        const fs = await Promise.resolve().then(() => __importStar(require("fs")));
        const os = await Promise.resolve().then(() => __importStar(require("os")));
        const path = await Promise.resolve().then(() => __importStar(require("path")));
        const { spawn } = await Promise.resolve().then(() => __importStar(require("child_process")));
        const tmp = path.join(os.tmpdir(), `chandra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
        fs.writeFileSync(tmp, imageBuffer);
        const safeTmp = tmp.replace(/\\/g, "\\\\");
        const pyCode = `
 import json, sys, warnings, os
 warnings.filterwarnings("ignore")
 os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
 os.environ["TRANSFORMERS_VERBOSITY"] = "error"
 from PIL import Image
 import torch
 from transformers import AutoModelForImageTextToText, AutoProcessor
 from chandra.model.hf import generate_hf
 from chandra.model.schema import BatchInputItem
 has_cuda = torch.cuda.is_available()
 dtype = torch.bfloat16 if has_cuda else torch.float32
 kwargs = {"trust_remote_code": True}
 if has_cuda:
   kwargs["dtype"] = dtype
   kwargs["device_map"] = "auto"
 else:
   kwargs["dtype"] = dtype
 print(json.dumps({"cuda": has_cuda, "dtype": str(dtype)}), file=sys.stderr)
 model = AutoModelForImageTextToText.from_pretrained("datalab-to/chandra-ocr-2", **kwargs, trust_remote_code=True)
 model.eval()
 model.processor = AutoProcessor.from_pretrained("datalab-to/chandra-ocr-2", trust_remote_code=True)
 batch = [BatchInputItem(image=Image.open(r"${safeTmp}"), prompt_type="ocr_layout")]
 result = generate_hf(batch, model)[0]
 text = result.raw if hasattr(result, 'raw') else str(result)
 sys.stdout.write(json.dumps({"text": text}))
 sys.stdout.flush()
 `;
        const out = await new Promise((res, rej) => {
            let buf = "";
            let err = "";
            const p = spawn("python", ["-c", pyCode], { windowsHide: true });
            p.stdout?.on("data", (d) => (buf += d.toString()));
            p.stderr?.on("data", (d) => (err += d.toString()));
            p.on("close", (code) => {
                if (code !== 0 && !buf.trim())
                    rej(new Error(err.slice(0, 800) || `chandra exit ${code}`));
                else
                    res(buf);
            });
            p.on("error", (e) => rej(e));
            setTimeout(() => { try {
                p.kill();
            }
            catch { } rej(new Error("Chandra timeout after 120s — model too heavy for 6GB VRAM, try CPU or VLLM server")); }, 120000);
        });
        try {
            fs.unlinkSync(tmp);
        }
        catch { }
        const jsonLine = out.trim().split("\n").reverse().find((l) => l.trim().startsWith("{") && l.includes("\"text\"")) || "";
        if (!jsonLine)
            throw new Error("Chandra produced no output — is chandra-ocr[hf] installed and model downloaded? First run downloads ~3GB.");
        const parsed = JSON.parse(jsonLine);
        if (!parsed.text || !String(parsed.text).trim())
            throw new Error("Chandra returned empty text");
        const text = String(parsed.text);
        const lines = text.split("\n").filter(Boolean);
        const elements = lines.map((line, idx) => ({
            text: line.trim(),
            confidence: 0.93,
            boundingBox: { x: 20, y: 40 + idx * 26, width: 600, height: 22 },
        }));
        return {
            elements,
            rawText: text,
            provider: this.name + "(native-hf)",
            processedAt: new Date().toISOString(),
            pageWidth: 640,
            pageHeight: 40 + lines.length * 26 + 20,
        };
    }
}
exports.ChandraProvider = ChandraProvider;
