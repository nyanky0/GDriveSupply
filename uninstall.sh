#!/usr/bin/env bash
# uninstall.sh - Menghapus instalasi CLI dan service GDriveSupply di Linux
set -e

echo "[*] Menghentikan service GDriveSupply jika aktif..."
gdrive-supply stop 2>/dev/null || pkill -TERM -x GDriveSupply 2>/dev/null || true

echo "[*] Menonaktifkan systemd user service..."
systemctl --user disable --now gdrive-supply.service 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/gdrive-supply.service"
systemctl --user daemon-reload 2>/dev/null || true

echo "[*] Menghapus symlink CLI global..."
rm -f "$HOME/.local/bin/gdrive-supply"
rm -f "$HOME/.config/GDriveSupply/install_dir"

echo "[✓] GDriveSupply CLI & service berhasil dihapus dari sistem."
