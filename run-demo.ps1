# Receipt Scanner Demo launcher - standalone, everything needed is in this repo.
# Usage: right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File run-demo.ps1
Set-Location "$PSScriptRoot\server"
if (-not (Test-Path "node_modules")) { Write-Host "First run: installing server deps..."; npm install --no-audit --no-fund }
try { $r = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -UseBasicParsing; Write-Host "Server already running." }
catch {
  Write-Host "Starting demo server..."
  Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory "$PSScriptRoot\server" -WindowStyle Normal
  Start-Sleep -Seconds 4
}
Write-Host "Opening demo..."
Start-Process "$PSScriptRoot\demo.html"
Write-Host "Done. Scan -> Result -> Save."
