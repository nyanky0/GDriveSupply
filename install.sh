#!/usr/bin/env bash
# install.sh - 1-Click Installer for GDriveSupply on Linux
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$PROJECT_DIR/GDriveSupply"

echo "=========================================================="
echo "          GDriveSupply - Linux Installer                  "
echo "=========================================================="

# 1. Cek FUSE driver
echo -e "\n[1/4] Memeriksa driver FUSE..."
if ! command -v fusermount3 >/dev/null 2>&1 && ! command -v fusermount >/dev/null 2>&1; then
    echo "[!] PERINGATAN: Driver FUSE (fuse3) belum terpasang."
    echo "    Pasang FUSE melalui package manager distro Anda:"
    echo "    - Arch Linux   : sudo pacman -S fuse3"
    echo "    - Ubuntu/Debian: sudo apt install fuse3"
    echo "    - Fedora       : sudo dnf install fuse3"
else
    echo "[✓] Driver FUSE terdeteksi aktif."
fi

# 2. Build Binary jika belum ada
echo -e "\n[2/4] Memeriksa binary aplikasi..."
if [ ! -f "$BIN" ]; then
    echo "[*] Mengompilasi GDriveSupply via build.sh..."
    "$PROJECT_DIR/build.sh"
else
    echo "[✓] Binary GDriveSupply sudah siap."
fi

# 3. Daftarkan install dir & CLI global gdrive-supply
echo -e "\n[3/4] Mendaftarkan CLI global 'gdrive-supply'..."
mkdir -p "$HOME/.config/GDriveSupply"
echo "$PROJECT_DIR" > "$HOME/.config/GDriveSupply/install_dir"

INSTALL_BIN_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_BIN_DIR"
chmod +x "$PROJECT_DIR/scripts/gdrive-supply" "$PROJECT_DIR/start.sh" "$PROJECT_DIR/stop.sh" "$PROJECT_DIR/build.sh"
ln -sf "$PROJECT_DIR/scripts/gdrive-supply" "$INSTALL_BIN_DIR/gdrive-supply"

echo "[✓] Command 'gdrive-supply' berhasil dipasang ke $INSTALL_BIN_DIR/gdrive-supply"

if [[ ":$PATH:" != *":$INSTALL_BIN_DIR:"* ]]; then
    echo "[!] Catatan: '$INSTALL_BIN_DIR' belum ada di PATH shell Anda."
    echo "    Tambahkan baris berikut ke ~/.bashrc atau ~/.zshrc:"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# 4. Opsi autostart systemd
echo -e "\n[4/4] Konfigurasi Autostart Service..."
AUTO_YES=false
if [[ "$1" == "-y" || "$1" == "--yes" ]]; then
    AUTO_YES=true
fi

if [ "$AUTO_YES" = true ]; then
    "$PROJECT_DIR/scripts/setup_autostart_linux.sh"
elif [ -t 0 ]; then
    read -p "Apakah Anda ingin GDriveSupply otomatis aktif saat boot/login? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        "$PROJECT_DIR/scripts/setup_autostart_linux.sh"
    else
        echo "[i] Autostart dilewati. Anda bisa mengaktifkannya kapan saja dengan: gdrive-supply enable"
    fi
else
    echo "[i] Mode non-interaktif: Autostart dilewati. Aktifkan manual dengan: gdrive-supply enable"
fi

echo -e "\n=========================================================="
echo " [✓] INSTALASI SELESAI!"
echo "=========================================================="
echo " Anda sekarang dapat menggunakan perintah berikut dari mana saja:"
echo "   gdrive-supply start    - Menyalakan aplikasi di latar belakang"
echo "   gdrive-supply status   - Memeriksa status dan partisi virtual drive"
echo "   gdrive-supply open     - Membuka Web Dashboard di browser"
echo "   gdrive-supply stop     - Menghentikan aplikasi secara bersih"
echo "=========================================================="
