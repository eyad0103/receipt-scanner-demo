# Receipt Scanner Demo launcher (same as run-demo.bat, for when browsers block .bat)
# Usage: right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File run-demo.ps1
try { $r = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -UseBasicParsing; Write-Host "Backend already running." }
catch {
  Write-Host "Starting backend..."
  Start-Process cmd -ArgumentList '/k "cd /d F:\receipt-scanner && node dist/server.js"'
  Start-Sleep -Seconds 4
}
Write-Host "Opening demo..."
Start-Process "$PSScriptRoot\demo.html"
Write-Host "Done. Scan -> Result -> Save."
