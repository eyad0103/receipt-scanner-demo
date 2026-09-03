# Receipt Scanner — Demo: Scan → Result → Save

Main feature sample. Pick a receipt image → upload to backend → see OCR + parsed total → saved.

## Run backend (tesseract = primary, best for you)

```bat
cd F:\receipt-scanner
run.bat
```

Backend → http://localhost:3000 · Frontend → http://localhost:5173

## Try demo

1. Open `demo.html` in browser (backend must be on :3000)
2. Pick a receipt image → **Scan receipt**
3. See preview + JSON (OCR text, merchant, total, items) + saved id
4. Saved ids also in `localStorage.demoSaved`

Or CLI: `demo-scan.bat` uploads latest `uploads\*.png` and prints parsed result.

## API

```bash
curl -X POST http://localhost:3000/api/receipts/upload \
  -H "x-user-id: user_demo" -H "X-OCR-Provider: tesseract" \
  -F "image=@receipt.png"
GET http://localhost:3000/api/receipts/<id>
```

Default engine: **tesseract** (fast, offline). PaddleOCR-VL / Chandra removed from default — tesseract is primary.
