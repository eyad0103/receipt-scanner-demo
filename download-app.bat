@echo off
title Download Receipt Scanner App (from Releases)
echo Downloading full app v1.0 from GitHub Releases...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/eyad0103/receipt-scanner/archive/refs/tags/v1.0.zip' -OutFile '%TEMP%\receipt-scanner.zip'"
if errorlevel 1 (echo [ERROR] download failed & pause & exit /b 1)
echo Extracting to F:\receipt-scanner ...
powershell -NoProfile -Command "Expand-Archive -Path '%TEMP%\receipt-scanner.zip' -DestinationPath '%TEMP%\rs' -Force; $d=Get-ChildItem '%TEMP%\rs' -Directory | Select-Object -First 1; New-Item -ItemType Directory -Force -Path 'F:\receipt-scanner' | Out-Null; Copy-Item ($d.FullName+'\*') 'F:\receipt-scanner' -Recurse -Force"
echo.
echo Done. Next: open F:\receipt-scanner and run install.bat, then run.bat
pause
