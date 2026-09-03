@echo off
title Receipt Scanner - Demo
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
  echo Starting backend...
  start "Receipt Backend :3000" cmd /k "cd /d F:\receipt-scanner && node dist/server.js"
  timeout /t 4 /nobreak >nul
)
echo Opening demo...
start "" "%~dp0demo.html"
echo Done. Scan -^> Result -^> Save.
