# Build Script for GDriveSupply
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "D:\Projects\GDriveSupply" }

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Building GDrive Supply (Single Binary) " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "`n[1/2] Building Vite + React Frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\web"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    exit 1
}

# Sync dist to Go embedded package
$uiDir = "$projectRoot\internal\ui"
if (!(Test-Path $uiDir)) {
    New-Item -ItemType Directory -Path $uiDir | Out-Null
}
Copy-Item -Path "$projectRoot\web\dist" -Destination "$uiDir\dist" -Recurse -Force

# 2. Build Go Executable
Write-Host "`n[2/2] Compiling Golang Single Binary..." -ForegroundColor Yellow
Set-Location $projectRoot

# Find go executable
$goCmd = "go"
if (Test-Path "D:\Projects\go-sdk\go\bin\go.exe") {
    $goCmd = "D:\Projects\go-sdk\go\bin\go.exe"
} elseif (Test-Path "C:\Program Files\Go\bin\go.exe") {
    $goCmd = "C:\Program Files\Go\bin\go.exe"
}

& $goCmd mod tidy
& $goCmd build -ldflags="-s -w -H=windowsgui" -o "GDriveSupply.exe" ./cmd/app
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: GDriveSupply.exe generated successfully at $projectRoot\GDriveSupply.exe" -ForegroundColor Green
} else {
    & $goCmd build -o "GDriveSupply.exe" ./cmd/app
}
