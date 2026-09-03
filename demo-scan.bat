@echo off
echo Demo: upload latest receipt to backend and show parsed result
for /f "delims=" %%f in ('dir /b /o-d uploads\*.png 2^>nul') do set LATEST=%%f & goto found
echo No png in uploads\
pause
exit /b 1
:found
echo Uploading uploads\%LATEST% ...
curl -s -X POST http://localhost:3000/api/receipts/upload -H "x-user-id: user_demo" -H "X-OCR-Provider: tesseract" -F "image=@uploads\%LATEST%" > %TEMP%\demo_out.json
type %TEMP%\demo_out.json
echo.
echo Saved. Open demo.html for visual sample.
pause
