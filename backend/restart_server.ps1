# Script to properly restart the backend server
Write-Host "=== Backend Restart Script ===" -ForegroundColor Cyan

# Step 1: Kill any existing Node processes on port 5000
Write-Host "`n[1/4] Checking for processes on port 5000..." -ForegroundColor Yellow
$processIds = netstat -ano | Select-String ":5000" | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
} | Select-Object -Unique

if ($processIds) {
    Write-Host "Found processes: $processIds" -ForegroundColor Yellow
    foreach ($pid in $processIds) {
        if ($pid -and $pid -match '^\d+$') {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $pid" -ForegroundColor Green
            } catch {
                Write-Host "Could not kill process $pid (may not exist)" -ForegroundColor Gray
            }
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "No processes found on port 5000" -ForegroundColor Green
}

# Step 2: Navigate to backend directory
Write-Host "`n[2/4] Navigating to backend directory..." -ForegroundColor Yellow
Set-Location -Path "e:\hoc\Ky9\DOAN\W9\FARMHUB_V2\backend"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

# Step 3: Check environment file
Write-Host "`n[3/4] Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" | Select-String "GEMINI_API_KEY"
    if ($envContent) {
        Write-Host "✅ GEMINI_API_KEY is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GEMINI_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
}

# Step 4: Start the server
Write-Host "`n[4/4] Starting backend server..." -ForegroundColor Yellow
Write-Host "Running: npm run dev" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

npm run dev
