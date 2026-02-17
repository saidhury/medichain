#!/usr/bin/env pwsh
# Medical Chain MVP - Complete Setup Script
# Run as: .\setup.ps1

param(
    [switch]$SkipBlockchain,
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$SkipEncryption,
    [switch]$DeployContract,
    [switch]$Reset
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green "[✓] $args" }
function Write-Information { Write-ColorOutput Cyan "[ℹ] $args" }
function Write-Warning { Write-ColorOutput Yellow "[⚠] $args" }
function Write-Error { Write-ColorOutput Red "[✗] $args" }
function Write-Step { Write-ColorOutput Magenta "`n[→] $args`n" }

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-ColorOutput Green @"
╔══════════════════════════════════════════════════════════════╗
║           Medical Chain MVP - Setup Script                   ║
║    Blockchain-Based Medical Record System                    ║
╚══════════════════════════════════════════════════════════════╝
"@

# Check prerequisites
Write-Step "Checking Prerequisites"

$prerequisites = @(
    @{ Name = "Node.js"; Command = "node"; Args = "--version"; InstallUrl = "https://nodejs.org/" },
    @{ Name = "Python"; Command = "python"; Args = "--version"; InstallUrl = "https://python.org/" },
    @{ Name = "Git"; Command = "git"; Args = "--version"; InstallUrl = "https://git-scm.com/" }
)

foreach ($prereq in $prerequisites) {
    try {
        $version = & $prereq.Command $prereq.Args 2>$null
        Write-Success "$($prereq.Name) found: $version"
    } catch {
        Write-Error "$($prereq.Name) not found. Please install from: $($prereq.InstallUrl)"
        exit 1
    }
}

# Check if .env exists, if not copy from example
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Warning ".env file not found. Copying from .env.example"
        Copy-Item ".env.example" ".env"
        Write-Warning "Please edit .env file with your actual API keys before continuing!"
        Write-Information "Press Enter to continue after editing .env, or Ctrl+C to exit..."
        Read-Host
    } else {
        Write-Error ".env.example not found. Please create it first."
        exit 1
    }
}

# Load environment variables
Write-Information "Loading environment variables..."
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Reset if requested
if ($Reset) {
    Write-Warning "Reset flag detected. Cleaning up previous installations..."
    Remove-Item -Recurse -Force "venv" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "backend\venv" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "encryption_service\venv" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "blockchain\node_modules" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "frontend\node_modules" -ErrorAction SilentlyContinue
    Write-Success "Cleanup complete"
}

# =============================================================================
# BLOCKCHAIN SETUP
# =============================================================================
if (-not $SkipBlockchain) {
    Write-Step "Setting up Blockchain (Hardhat + Solidity)"
    
    Set-Location "$RootDir\blockchain"
    
    if (-not (Test-Path "node_modules")) {
        Write-Information "Installing npm dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    } else {
        Write-Information "node_modules exists, skipping npm install"
    }
    
    Write-Information "Compiling smart contracts..."
    npx hardhat compile
    
    if ($DeployContract) {
        Write-Information "Deploying contract to Sepolia..."
        if (-not $env:PRIVATE_KEY -or $env:PRIVATE_KEY -eq "your_wallet_private_key_here") {
            Write-Error "PRIVATE_KEY not set in .env file. Cannot deploy."
        } else {
            npx hardhat run scripts/deploy.js --network sepolia
            
            if (Test-Path "deployment-info.json") {
                $deployInfo = Get-Content "deployment-info.json" | ConvertFrom-Json
                Write-Success "Contract deployed at: $($deployInfo.contractAddress)"
                
                # Update root .env with contract address
                $envContent = Get-Content "$RootDir\.env"
                $envContent = $envContent -replace "CONTRACT_ADDRESS=.*", "CONTRACT_ADDRESS=$($deployInfo.contractAddress)"
                $envContent = $envContent -replace "VITE_CONTRACT_ADDRESS=.*", "VITE_CONTRACT_ADDRESS=$($deployInfo.contractAddress)"
                Set-Content "$RootDir\.env" $envContent
                Write-Success "Updated .env with new contract address"
            }
        }
    }
    
    Set-Location $RootDir
    Write-Success "Blockchain setup complete"
}

# =============================================================================
# ENCRYPTION SERVICE SETUP
# =============================================================================
if (-not $SkipEncryption) {
    Write-Step "Setting up Encryption Service (FastAPI)"
    
    Set-Location "$RootDir\encryption_service"
    
    # Create and activate virtual environment
    if (-not (Test-Path "venv")) {
        Write-Information "Creating Python virtual environment..."
        python -m venv venv
    }
    
    Write-Information "Activating virtual environment..."
    & .\venv\Scripts\Activate.ps1
    
    Write-Information "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -ne 0) { throw "pip install failed for encryption service" }
    
    # Create startup script
    @"
@echo off
cd /d "$RootDir\encryption_service"
call venv\Scripts\activate.bat
uvicorn main:app --reload --port 8001 --host 0.0.0.0
pause
"@ | Set-Content "start.bat" -Encoding ASCII
    
    Write-Success "Encryption service setup complete (Port: 8001)"
    Set-Location $RootDir
}

# =============================================================================
# BACKEND SETUP
# =============================================================================
if (-not $SkipBackend) {
    Write-Step "Setting up Django Backend"
    
    Set-Location "$RootDir\backend"
    
    # Create and activate virtual environment
    if (-not (Test-Path "venv")) {
        Write-Information "Creating Python virtual environment..."
        python -m venv venv
    }
    
    Write-Information "Activating virtual environment..."
    & .\venv\Scripts\Activate.ps1
    
    Write-Information "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -ne 0) { throw "pip install failed for backend" }
    
    Write-Information "Running Django migrations..."
    python manage.py migrate
    
    # Create superuser if doesn't exist
    $superuserScript = @"
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medicalchain.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@medicalchain.local', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"@
    Write-Information "Creating superuser (admin/admin123)..."
    $superuserScript | python manage.py shell
    
    # Create startup script
    @"
@echo off
cd /d "$RootDir\backend"
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
pause
"@ | Set-Content "start.bat" -Encoding ASCII
    
    Write-Success "Backend setup complete (Port: 8000)"
    Set-Location $RootDir
}

# =============================================================================
# FRONTEND SETUP
# =============================================================================
if (-not $SkipFrontend) {
    Write-Step "Setting up Frontend (React + Vite)"
    
    Set-Location "$RootDir\frontend"
    
    if (-not (Test-Path "node_modules")) {
        Write-Information "Installing npm dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    } else {
        Write-Information "node_modules exists, skipping npm install"
    }
    
    # Copy .env to frontend
    if (Test-Path "$RootDir\.env") {
        $envContent = Get-Content "$RootDir\.env"
        $frontendEnv = @()
        foreach ($line in $envContent) {
            if ($line -match '^(VITE_|NODE_)') {
                $frontendEnv += $line
            }
        }
        $frontendEnv | Set-Content ".env.local" -Encoding UTF8
        Write-Success "Created .env.local for frontend"
    }
    
    # Create startup script
    @"
@echo off
cd /d "$RootDir\frontend"
npm run dev
pause
"@ | Set-Content "start.bat" -Encoding ASCII
    
    Write-Success "Frontend setup complete (Port: 5173)"
    Set-Location $RootDir
}

# =============================================================================
# CREATE MASTER START SCRIPT
# =============================================================================
Write-Step "Creating Master Launch Script"

$masterScript = @"
@echo off
echo Starting Medical Chain MVP...
echo.

start "Encryption Service (8001)" cmd /k "cd /d $RootDir\encryption_service && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8001 --host 0.0.0.0"
timeout /t 2 >nul

start "Django Backend (8000)" cmd /k "cd /d $RootDir\backend && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"
timeout /t 2 >nul

start "React Frontend (5173)" cmd /k "cd /d $RootDir\frontend && npm run dev"
timeout /t 2 >nul

echo.
echo All services started!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api/
echo - Encryption: http://localhost:8001
echo.
pause
"@

$masterScript | Set-Content "start-all.bat" -Encoding ASCII

# Create individual service scripts
$services = @(
    @{ Name = "encryption"; Port = 8001; Dir = "encryption_service"; Cmd = "uvicorn main:app --reload --port 8001 --host 0.0.0.0" },
    @{ Name = "backend"; Port = 8000; Dir = "backend"; Cmd = "python manage.py runserver 0.0.0.0:8000" },
    @{ Name = "frontend"; Port = 5173; Dir = "frontend"; Cmd = "npm run dev" }
)

foreach ($svc in $services) {
    $script = @"
@echo off
echo Starting $($svc.Name) on port $($svc.Port)...
cd /d "$RootDir\$($svc.Dir)"
"@
    if ($svc.Name -ne "frontend") {
        $script += "`ncall venv\Scripts\activate.bat"
    }
    $script += "`n$($svc.Cmd)`npause"
    $script | Set-Content "start-$($svc.Name).bat" -Encoding ASCII
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-ColorOutput Green @"

╔══════════════════════════════════════════════════════════════╗
║                  SETUP COMPLETE!                             ║
╚══════════════════════════════════════════════════════════════╝

Project Structure:
  📁 Root: $RootDir

Services Ready:
  🔐 Encryption Service: http://localhost:8001
  🐍 Django Backend:     http://localhost:8000/api/
  ⚛️  React Frontend:     http://localhost:5173

Quick Start:
  📦 Run all services:    .\start-all.bat
  🚀 Or individually:
     - .\start-encryption.bat
     - .\start-backend.bat
     - .\start-frontend.bat

Next Steps:
  1. Ensure .env file has correct API keys
  2. Run: .\start-all.bat
  3. Open MetaMask and connect to Sepolia testnet
  4. Get Sepolia ETH from: https://sepoliafaucet.com/
  5. Visit http://localhost:5173 and connect wallet

Admin Access:
  Django Admin: http://localhost:8000/admin/
  Username: admin
  Password: admin123

"@

if (-not $DeployContract -and -not $SkipBlockchain) {
    Write-Warning "Contract not deployed. To deploy run:"
    Write-Information "   .\setup.ps1 -DeployContract"
    Write-Information "Or manually deploy and update CONTRACT_ADDRESS in .env"
}