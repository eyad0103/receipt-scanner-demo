# Receipt Scanner — Demo: Scan → Result → Save

Main features only. Pick a receipt image → upload → see OCR + parsed total → saved.

## Download (Releases)

**Option A — release zip (easiest, no git):**
Download `receipt-scanner-demo-v1.0.zip` from
https://github.com/eyad0103/receipt-scanner-demo/releases/tag/v1.0
→ extract → double-click `run-demo.bat` (starts server + opens demo).
Or get it with one file: `download-demo.bat` downloads + extracts everything to `F:\receipt-scanner-demo` for you.

**Option B — clone:**
```
```
git clone https://github.com/eyad0103/receipt-scanner-demo
```

**Option B — no files at all, paste this in a terminal:**
```bat
cd /d F:\receipt-scanner
node dist/server.js
```
then open `demo.html` from this repo page (click file → Raw → save as `.html`, or copy its source below into notepad → save as demo.html).

**Option C — PowerShell:** right-click `run-demo.ps1` → Run with PowerShell
(or `powershell -ExecutionPolicy Bypass -File run-demo.ps1`).

Then: pick image → **Scan receipt** → result + saved id. Backend → http://localhost:3000.

## API

```bash
curl -X POST http://localhost:3000/api/receipts/upload \
  -H "x-user-id: user_demo" -H "X-OCR-Provider: tesseract" \
  -F "image=@receipt.png"
GET http://localhost:3000/api/receipts/<id>
```

Default engine: **tesseract** (fast, offline).

## Is it safe? Full source of every file

This repo has only 5 small text files — no exe, no installer, no obfuscation.
Click any file above to read every line. Summary:

| File | Lines | Does |
|---|---|---|
| `demo.html` | ~120 | Plain HTML+CSS+JS. File picker → `POST localhost:3000/api/receipts/upload` → shows merchant/total/items JSON → saves id to `localStorage`. No network except your own localhost backend. |
| `run-demo.bat` | ~10 | Checks `localhost:3000/health`; if down, starts `node dist/server.js`; opens `demo.html`. |
| `run-demo.ps1` | ~12 | Same as the .bat, for when browsers block .bat downloads. |
| `demo-scan.bat` | ~12 | Uploads latest `uploads\*.png` via curl and prints the JSON result. |
| `login-github.bat` | ~3 | Runs `gh auth login` (used once by the author to publish). |

To verify: open `demo.html` in notepad — readable source, no minified blobs, no external scripts, no tracking.
Full source of `demo.html` is viewable here: https://github.com/eyad0103/receipt-scanner-demo/blob/master/demo.html
