# health-check.ps1 - Complete System Health Check
param([switch]$Verbose)

$services = @(
    @{ Name = "Encryption Service"; Url = "http://localhost:8001/health"; Port = 8001 },
    @{ Name = "Django Backend"; Url = "http://localhost:8000/api/users/doctors/list/"; Port = 8000 },
    @{ Name = "React Frontend"; Url = "http://localhost:5173"; Port = 5173 }
)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MEDICAL CHAIN MVP - HEALTH CHECK" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

foreach ($svc in $services) {
    Write-Host "Checking $($svc.Name) (Port $($svc.Port))... " -NoNewline
    
    # Check if port is listening
    $portCheck = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
    
    if (-not $portCheck) {
        Write-Host "❌ NOT RUNNING" -ForegroundColor Red
        $allHealthy = $false
        continue
    }
    
    # Try HTTP request
    try {
        $response = Invoke-WebRequest -Uri $svc.Url -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ HEALTHY" -ForegroundColor Green
        
        if ($Verbose) {
            Write-Verbose "Response Status: $($response.StatusCode)"
            if ($response.Content) {
                $preview = $response.Content.Substring(0, [Math]::Min(100, $response.Content.Length))
                Write-Verbose "Response Content Preview: $preview..."
            }
        }
    } catch {
        Write-Host "⚠️  PORT OPEN BUT ERROR" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        $allHealthy = $false
    }
}

# Check .env configuration
Write-Host ""
Write-Host "Configuration Check:" -ForegroundColor Cyan
$envFile = Get-Content ".env" -ErrorAction SilentlyContinue

if ($envFile) {
    $contractAddress = ($envFile | Select-String "CONTRACT_ADDRESS=").Line -replace "CONTRACT_ADDRESS=", ""
    $rpcUrl         = ($envFile | Select-String "SEPOLIA_RPC_URL=").Line -replace "SEPOLIA_RPC_URL=", ""
    $pinataKey      = ($envFile | Select-String "PINATA_API_KEY=").Line -replace "PINATA_API_KEY=", ""
    
    if ($contractAddress -and $contractAddress -ne "0x0000000000000000000000000000000000000000" -and $contractAddress -notmatch "your_") {
        Write-Host "   Contract Address: ✅ Set" -ForegroundColor Green
    } else {
        Write-Host "   Contract Address: ❌ Not configured" -ForegroundColor Red
        $allHealthy = $false
    }
    
    if ($rpcUrl -and $rpcUrl -notmatch "your_") {
        Write-Host "   Sepolia RPC: ✅ Set" -ForegroundColor Green
    } else {
        Write-Host "   Sepolia RPC: ❌ Not configured" -ForegroundColor Red
        $allHealthy = $false
    }
    
    if ($pinataKey -and $pinataKey -notmatch "your_") {
        Write-Host "   Pinata API: ✅ Set" -ForegroundColor Green
    } else {
        Write-Host "   Pinata API: ❌ Not configured" -ForegroundColor Yellow
        $allHealthy = $false
    }
} else {
    Write-Host "   .env file: ❌ Not found" -ForegroundColor Red
    $allHealthy = $false
}

# Summary
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:5173"
    Write-Host "   Backend:   http://localhost:8000/api/"
    Write-Host "   Admin:     http://localhost:8000/admin/ (admin/admin123)"
    Write-Host "   Encryption: http://localhost:8001"
} else {
    Write-Host "❌ SOME ISSUES DETECTED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure all services are started:"
    Write-Host "      .\start-all.bat"
    Write-Host "   2. Check individual services:"
    Write-Host "      .\start-encryption.bat"
    Write-Host "      .\start-backend.bat"
    Write-Host "      .\start-frontend.bat"
    Write-Host "   3. Check .env file has valid API keys"
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
