#!/usr/bin/env bash
# setup_autostart_linux.sh - Mendaftarkan GDriveSupply sebagai systemd user service
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$DIR/GDriveSupply"

if [ ! -f "$BIN" ]; then
    echo "[!] Binary $BIN belum ada. Menjalankan build.sh..."
    "$DIR/build.sh"
fi

SYSTEMD_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"
SERVICE_FILE="$SYSTEMD_DIR/gdrive-supply.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=GDrive Supply - Multi-Account Local Drive Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=$BIN
Restart=on-failure
RestartSec=5
KillMode=process
TimeoutStopSec=10

[Install]
WantedBy=default.target
EOF

echo "[*] Reload systemd user daemon..."
systemctl --user daemon-reload

echo "[*] Mengaktifkan dan menyalakan gdrive-supply.service..."
systemctl --user enable --now gdrive-supply.service

echo ""
echo "=========================================================="
echo " [✓] BERHASIL: GDriveSupply telah didaftarkan ke systemd! "
echo "=========================================================="
echo " - Status Service: systemctl --user status gdrive-supply"
echo " - Matikan Service: systemctl --user stop gdrive-supply"
echo " - Nyalakan Service: systemctl --user start gdrive-supply"
echo " - Nonaktifkan Autostart: systemctl --user disable gdrive-supply"
echo ""
echo "Aplikasi akan otomatis menyala di background saat login tanpa perlu membuka terminal."
