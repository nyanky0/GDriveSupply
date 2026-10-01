@echo off
cd /d "%~dp0"
if exist "GDriveSupply.exe" (
    start "" "GDriveSupply.exe"
) else (
    echo GDriveSupply.exe belum di-compile. Menjalankan build terlebih dahulu...
    call build.bat
    if exist "GDriveSupply.exe" (
        start "" "GDriveSupply.exe"
    )
)
