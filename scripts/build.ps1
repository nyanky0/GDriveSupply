# Build Script for GDriveSupply
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "D:\Projects\GDriveSupply" }

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Building GDrive Supply (Single Binary) " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Find go executable
$goCmd = "go"
if (Test-Path "D:\Projects\go-sdk\go\bin\go.exe") {
    $goCmd = "D:\Projects\go-sdk\go\bin\go.exe"
} elseif (Test-Path "C:\Program Files\Go\bin\go.exe") {
    $goCmd = "C:\Program Files\Go\bin\go.exe"
}

# 1. Generate Icons, Windows Executable Resource (.syso) & System Tray Helper
Write-Host "`n[1/3] Generating Icons, Resources & System Tray Helper..." -ForegroundColor Yellow
Set-Location $projectRoot
python "$projectRoot\scripts\generate_icons.py"
& $goCmd run github.com/akavel/rsrc@latest -ico "$projectRoot\cmd\app\app.ico" -o "$projectRoot\cmd\app\rsrc_windows_amd64.syso"

$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $cscPath)) {
    $cscPath = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (Test-Path $cscPath) {
    Write-Host "Compiling embedded Windows System Tray helper..." -ForegroundColor Gray
    & $cscPath /out:"$projectRoot\internal\tray\tray_helper.exe" /target:winexe /win32icon:"$projectRoot\cmd\app\app.ico" /r:System.Windows.Forms.dll,System.Drawing.dll "$projectRoot\internal\tray\tray_helper.cs" | Out-Null
}

# 2. Build Frontend
Write-Host "`n[2/3] Building Vite + React Frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\web"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    exit 1
}

# Sync dist to Go embedded package cleanly
$uiDist = "$projectRoot\internal\ui\dist"
if (Test-Path $uiDist) {
    Remove-Item -Path $uiDist -Recurse -Force
}
New-Item -ItemType Directory -Path $uiDist | Out-Null
Copy-Item -Path "$projectRoot\web\dist\*" -Destination $uiDist -Recurse -Force

# 3. Build Go Executable with embedded icon
Write-Host "`n[3/3] Compiling Golang Single Binary..." -ForegroundColor Yellow
Set-Location $projectRoot

& $goCmd mod tidy
& $goCmd build -ldflags="-s -w -H=windowsgui" -o "GDriveSupply.exe" ./cmd/app
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: GDriveSupply.exe generated successfully at $projectRoot\GDriveSupply.exe" -ForegroundColor Green
} else {
    & $goCmd build -o "GDriveSupply.exe" ./cmd/app
}
