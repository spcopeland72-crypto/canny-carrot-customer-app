# Start Customer App on Port 8084 with HTTPS (for Network Camera Access)
# HTTPS is required for camera access on network IP addresses
# WARNING: Browsers will show security warnings for self-signed certificate

Write-Host "Starting Canny Carrot Customer App on port 8084 with HTTPS..." -ForegroundColor Cyan
Write-Host ""

# Set port environment variable
$env:PORT = "8084"

# Start Expo with web and HTTPS
npx expo start --web --https --port 8084

Write-Host ""
Write-Host "App should be available at:" -ForegroundColor Green
Write-Host "  - Local: https://localhost:8084" -ForegroundColor Yellow
Write-Host "  - Network: https://192.168.0.36:8084" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Browsers will show security warnings" -ForegroundColor Red
Write-Host ""
Write-Host "To accept the certificate:" -ForegroundColor Cyan
Write-Host "  Chrome/Edge: Click 'Advanced' → 'Proceed to 192.168.0.36 (unsafe)'" -ForegroundColor White
Write-Host "  Firefox: Click 'Advanced' → 'Accept the Risk and Continue'" -ForegroundColor White
Write-Host "  Safari: Tap 'Advanced' → 'Proceed to 192.168.0.36'" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Use HTTP version on localhost (camera works there)" -ForegroundColor Yellow
Write-Host "  Run: .\start-web-8084.ps1 and use http://localhost:8084" -ForegroundColor Yellow

