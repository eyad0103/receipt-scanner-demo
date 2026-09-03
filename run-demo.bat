@echo off
title Receipt Scanner - Demo (standalone)
cd /d "%~dp0server"
if not exist node_modules (
  echo First run: installing server deps...
  call npm install --no-audit --no-fund
)
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
  echo Starting demo server...
  start "Receipt Demo :3000" cmd /k "cd /d "%~dp0server" && node dist/server.js"
  timeout /t 4 /nobreak >nul
)
echo Opening demo...
start "" "%~dp0demo.html"
echo Done. Scan -^> Result -^> Save.
