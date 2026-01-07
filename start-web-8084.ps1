# Start Customer App on Port 8084
# Uses HTTP for localhost (camera works - localhost is secure context)
# For network IP access with camera, use start-web-8084-https.ps1

Write-Host "Starting Canny Carrot Customer App on port 8084 (HTTP)..." -ForegroundColor Cyan
Write-Host ""

# Set port environment variable
$env:PORT = "8084"

# Start Expo with web (HTTP - works fine for localhost)
npx expo start --web --port 8084

Write-Host ""
Write-Host "App should be available at:" -ForegroundColor Green
Write-Host "  - Local: http://localhost:8084 (camera works)" -ForegroundColor Yellow
Write-Host "  - Network: http://192.168.0.36:8084 (camera won't work - use HTTPS script)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Camera works on localhost with HTTP" -ForegroundColor Green
Write-Host "      For network IP with camera, use: .\start-web-8084-https.ps1" -ForegroundColor Cyan

