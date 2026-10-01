# Script untuk mendaftarkan GDriveManager ke Startup Windows
$WshShell = New-Object -comObject WScript.Shell
$StartupFolder = [System.Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupFolder "GDriveManager.lnk"
$TargetPath = "D:\Projects\GDriveManager\GDriveManager.exe"

if (!(Test-Path $TargetPath)) {
    Write-Warning "File GDriveManager.exe belum dibuat! Jalankan build.ps1 terlebih dahulu."
    exit 1
}

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = "D:\Projects\GDriveManager"
$Shortcut.Description = "GDrive Manager Multi-Account Local Drive Service"
$Shortcut.Save()

Write-Host "BERHASIL: GDriveManager telah didaftarkan ke Startup Windows!" -ForegroundColor Green
Write-Host "Lokasi shortcut: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Aplikasi akan otomatis berjalan di background saat Windows menyala."
