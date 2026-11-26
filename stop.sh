#!/usr/bin/env bash
# stop.sh - Menghentikan GDriveSupply dengan graceful shutdown

echo "[*] Menghentikan GDriveSupply dan melepas seluruh partisi virtual..."

# Cek apakah systemd service aktif
if systemctl --user is-active gdrive-supply.service >/dev/null 2>&1; then
    systemctl --user stop gdrive-supply.service
    echo "[✓] Service gdrive-supply berhasil dihentikan."
    exit 0
fi

# Kirim sinyal SIGTERM agar unmount VFS berjalan bersih
pkill -TERM -x "GDriveSupply"

# Tunggu proses benar-benar berhenti (maks 5 detik)
for i in {1..10}; do
    if ! pgrep -x "GDriveSupply" > /dev/null 2>&1; then
        echo "[✓] GDriveSupply dan engine rclone telah berhenti dengan aman."
        exit 0
    fi
    sleep 0.5
done

# Jika masih ada sisa, paksa matikan
pkill -9 -x "GDriveSupply" >/dev/null 2>&1
echo "[✓] Proses telah dihentikan."
