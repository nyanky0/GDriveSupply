#!/usr/bin/env bash
# start.sh - Menjalankan GDriveSupply di latar belakang secara detached

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$DIR/GDriveSupply"

if [ ! -f "$BIN" ]; then
    echo "[!] Binary $BIN belum ada. Menjalankan build.sh..."
    "$DIR/build.sh"
fi

# Cek apakah dijalankan lewat systemd user service jika terpasang
if systemctl --user is-enabled gdrive-supply.service >/dev/null 2>&1; then
    echo "[+] Memulai GDriveSupply via systemd user service..."
    systemctl --user start gdrive-supply.service
    sleep 1
    echo "[✓] Service gdrive-supply aktif. (Terminal ini aman ditutup)"
    echo "[*] Web Dashboard: http://127.0.0.1:4040"
    xdg-open "http://127.0.0.1:4040" >/dev/null 2>&1 &
    exit 0
fi

# Cek apakah sudah berjalan
if pgrep -x "GDriveSupply" > /dev/null 2>&1; then
    echo "[i] GDriveSupply sudah aktif berjalan (PID: $(pgrep -x GDriveSupply | head -n1))."
    echo "[*] Web Dashboard: http://127.0.0.1:4040"
    xdg-open "http://127.0.0.1:4040" >/dev/null 2>&1 &
    exit 0
fi

echo "[+] Memulai GDriveSupply di background..."
nohup "$BIN" > /dev/null 2>&1 &
disown

# Beri jeda 1 detik lalu cek status
sleep 1
if pgrep -x "GDriveSupply" > /dev/null 2>&1; then
    echo "[✓] GDriveSupply berhasil aktif! (Terminal ini aman ditutup)"
    echo "[*] Web Dashboard: http://127.0.0.1:4040"
    xdg-open "http://127.0.0.1:4040" >/dev/null 2>&1 &
else
    echo "[!] GDriveSupply gagal berjalan. Periksa log di ~/.config/GDriveSupply/logs/app.log"
    exit 1
fi
