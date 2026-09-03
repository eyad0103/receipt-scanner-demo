@echo off
title Download Receipt Scanner Demo (from Releases)
echo Downloading demo v1.0 zip from GitHub Releases...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/eyad0103/receipt-scanner-demo/releases/download/v1.0/receipt-scanner-demo-v1.0.zip' -OutFile '%TEMP%\receipt-scanner-demo.zip'"
if errorlevel 1 (echo [ERROR] download failed & pause & exit /b 1)
echo Extracting to F:\receipt-scanner-demo ...
powershell -NoProfile -Command "Expand-Archive -Path '%TEMP%\receipt-scanner-demo.zip' -DestinationPath 'F:\receipt-scanner-demo' -Force"
echo.
echo Done. Next: open F:\receipt-scanner-demo and double-click run-demo.bat
echo (start app: run-demo.bat ^| full app: download-app.bat)
pause
