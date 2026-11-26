# ☁️ GDrive Supply

> **Aggregator Multi-Akun Google Drive Menjadi Partisi Harddisk / Direktori Mount Lokal Cross-Platform Windows & Linux (Zero-VPS, Rp 0, Direct Client-to-Cloud)**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-0078D6.svg)
![Go](https://img.shields.io/badge/backend-Go%201.22%2B-00ADD8.svg)
![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Tailwind%20v4-61DAFB.svg)
![Driver](https://img.shields.io/badge/driver-WinFsp%20(Windows)%20%7C%20FUSE%20(Linux)-008080.svg)

---

## 📌 Ringkasan Arsitektur

**GDrive Supply** adalah aplikasi desktop cross-platform (Windows & Linux) berkinerja tinggi yang menggabungkan banyak akun Google Drive menjadi partisi harddisk virtual lokal terpisah di File Explorer Windows (*This PC*, misalnya drive `X:`, `Y:`, `Z:`) atau direktori mount lokal FUSE di Linux (misalnya `~/GDrive/X`, `~/GDrive/Y`). 

Setiap akun memiliki partisi/mount tersendiri dengan kapasitas penuh (misalnya 5 TB, 2 TB, atau 15 GB gratis). Seluruh lalu lintas data ditransfer langsung antara komputer Anda dan Google Cloud Storage via HTTPS TLS 1.3 (**Zero-VPS Bandwidth**), sehingga Anda tidak memerlukan server perantara dan biaya operasional bulanan adalah **Rp 0**.

```
[ Komputer Lokal (Windows / Linux) ] 
   │ 
   ├── 📁 File Explorer / File Manager (Z:\ Kyo Toram Drive / ~/GDrive/Z)
   │      └── Driver Kernel VFS: WinFsp (Windows) / FUSE3 (Linux)
   │
   └── ⚡ Single Binary GDriveSupply (.exe / ELF)
          ├── 🌐 Embedded Web Dashboard (http://127.0.0.1:4040)
          ├── 🔒 Encrypted Storage: DPAPI (%APPDATA%) / AES-256-GCM (~/.config)
          ├── 🛡️ Single-Instance Guard (Named Mutex / File Lock)
          └── 📌 Tray Companion (Windows Tray / Linux Daemon)
                 │
                 └── [ Direct HTTPS TLS 1.3 ] ──────────> ☁️ Google Drive API v3
                                                          (googleapis.com)
```

---

## ✨ Fitur Unggulan (v2.1)

1. **Kustomisasi & Dynamic Rename Drive Instan**
   - Bebas mengubah nama label volume drive kapan saja langsung dari Web Dashboard (misal dari `GDrive_Z` menjadi `Kerja`, `Archive`, `Kyo Toram Drive`, dll).
   - Fitur **Instant Auto-Remount** otomatis menerapkan nama baru ke Windows File Explorer (*This PC*) dalam ~1 detik tanpa perlu merestart PC.

2. **Single-Instance Enforcement (Anti-Duplicate)**
   - Dilindungi oleh Windows Kernel Named Mutex (`Local\GDriveSupply_SingleInstance_Mutex`).
   - Mencegah bentrokan port HTTP `:4040` atau dobel proses; eksekusi kedua otomatis mengarahkan fokus ke browser default dan keluar dengan bersih (code 0).

3. **Native Windows System Tray Icon**
   - Ikon aplikasi aktif di taskbar Windows (dekat jam pojok kanan bawah).
   - **Double-Click**: Membuka Web Dashboard.
   - **Right-Click Context Menu**:
     - 🌐 *Buka Web Dashboard*
     - 📁 *Buka File Explorer*
     - ❌ *Matikan GDrive Supply Saja*
     - 🛑 *Matikan App + WinFsp Service*

4. **Dual Shutdown Options (App Saja vs App + WinFsp)**
   - Fleksibilitas saat mematikan aplikasi:
     - **Matikan App Saja**: Melepas drive Google Drive dan menghentikan background service aplikasi. Driver WinFsp tetap siaga di Windows.
     - **Matikan Bersama Service WinFsp**: Melepas drive, mematikan aplikasi, dan sekaligus menghentikan layanan background driver WinFsp (`WinFsp.Launcher`).

5. **Dark Mode & Light Mode (Default Sistem)**
   - Mengikuti preferensi tema Windows secara otomatis (`prefers-color-scheme`).
   - Dilengkapi tombol toggle manual di bilah navigasi atas (tersimpan di `localStorage`).

6. **Pemeriksaan Driver WinFsp Otomatis**
   - Mendeteksi ketersediaan driver kernel WinFsp pada saat aplikasi pertama kali dijalankan.
   - Jika belum terpasang, Web Dashboard menyajikan tombol **1-Klik Pasang Otomatis** serta tautan unduh resmi ke [winfsp.dev/rel/](https://winfsp.dev/rel/).

7. **100% Anti-Banned & Legal Menurut Google**
   - Menggunakan kredensial **Google OAuth 2.0 Client ID pribadi** milik developer/pengguna di Google Cloud Console.
   - Berkomunikasi melalui endpoint resmi **Google Drive API v3**, bukan web scraping atau token harvester ilegal.
   - Kuota API (20.000 request/menit) dialokasikan khusus dan terisolasi untuk proyek pribadi Anda.

8. **Master Password & Sesi Web Persisten**
   - Proteksi akses dashboard web dengan kata sandi master.
   - Sesi tersimpan aman via HTTP-Only SameSite Cookie (`gdrive_session`), sehingga user tidak perlu login berulang kali saat me-refresh halaman browser.
   - Menggunakan hashing kriptografi kuat **bcrypt** (cost factor 12) dan validasi kompleksitas ketat (minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol khusus).

9. **Brute-Force Panic Reset (Kill Switch Darurat)**
   - Proteksi anti-brute-force otomatis: maksimal 5 kali percobaan salah dalam 1 siklus login.
   - Jika salah 1-4 kali lalu berhasil, counter kegagalan otomatis di-reset ke 0.
   - **Jika salah 5 kali berturut-turut**: Sistem langsung memicu **Factory Reset Darurat** — seluruh virtual drive dilepas (*unmounted*), file konfigurasi `%APPDATA%\GDriveSupply\config.json` dihapus bersih, dan sesi diputus demi melindungi akun Google Drive Anda.

10. **Prinsip Zero-Residual Storage**
    - Fitur password dapat dinonaktifkan di pengaturan kapan saja.
    - Saat dimatikan, seluruh hash password dan kredensial otentikasi langsung dihapus bersih dari disk (kami tidak menyimpan sisa hash enkripsi saat fitur nonaktif).

11. **Keamanan Windows DPAPI & 100% Client-Side**
    - Client Secret dan Refresh Token dienkripsi menggunakan *Windows Data Protection API* (DPAPI). Token yang tersimpan di `%APPDATA%\GDriveSupply\config.json` tidak dapat dibaca oleh komputer atau pengguna Windows lain.
    - Dilengkapi dokumen kepatuhan resmi [PRIVACY.md](PRIVACY.md) dan [TERMS.md](TERMS.md) sesuai *Google API Services User Data Policy*.

12. **High-Capacity Diagnostic Logging Engine & Live Terminal Feed**
    - Sistem pencatatan log performa tinggi berkapasitas besar (ring buffer **5.000 baris** di memori + file log persisten di `%APPDATA%\GDriveSupply\logs\app.log`).
    - Menangkap langsung *stdout* & *stderr* dari rclone VFS, proses mount WinFsp, supervisor, dan request API secara granular.
    - Dilengkapi **Live Terminal Modal** di Web Dashboard: filter level (ALL / ERROR / WARN / INFO / DEBUG), pencarian kata kunci, pause/play live-tail, 1-klik salin ke clipboard, dan tombol unduh file `.log` mentah untuk kemudahan pelaporan bug/feedback.

13. **Layout Tabulasi Terpadu (Kelola Drive vs Dokumentasi & Solusi Masalah)**
    - Bilah navigasi (Navbar) dirampingkan secara elegan dengan memindahkan seluruh dokumentasi, panduan, status anti-banned, dan legal ke dalam tabulasi baru **Dokumentasi & Solusi**.
    - Memisahkan tampilan operasional harian (*Kelola Drive*) dari pusat bantuan teknis (*Pusat Dokumentasi & Solusi*).

14. **Katalog Masalah & Solusi Instan (Built-in Troubleshooting)**
    - Tab Dokumentasi memuat database troubleshooting interaktif yang mencakup akar masalah (*root cause*) dan langkah pemulihan untuk error:
      - `Error 400: redirect_uri_mismatch` (panduan Authorized redirect URIs `127.0.0.1` & `localhost`).
      - `oauth2: "unauthorized_client" "Unauthorized"` (pembaruan in-place 1-klik).
      - `Access blocked: GDApp has not completed verification` (panduan pendaftaran Test users).
      - Driver WinFsp belum terpasang (installer & winget command).
      - Single-instance Named Mutex guard & zero-residual password reset.

15. **Live Native Upload Monitor & Windows Transfer Dialog**
    - Menyelesaikan masalah *"copy cepat tapi upload background tak terlihat"* saat paste berkas ke drive virtual lokal.
    - Terintegrasi langsung dengan rclone Remote Control (`--rc`) dan native Windows Forms dialog yang sangat hemat memori (< 2 MB RAM).
    - **Auto-Show & Auto-Hide**: Muncul otomatis di pojok kanan bawah desktop saat pengunggahan ke Google Cloud dimulai (tanpa mencuri fokus keyboard), menampilkan nama berkas, persentase progress bar, kecepatan (MB/s), ukuran tertransfer, dan estimasi sisa waktu (ETA).
    - Otomatis menampilkan status selesai dan menutup diri begitu upload rampung.
    - Terpantau secara real-time di Web Dashboard melalui widget live transfer.

---

## 🛠️ Prasyarat Sistem

### Windows:
1. **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit).
2. **Driver WinFsp**: Wajib terpasang untuk membuat partisi drive virtual di Windows File Explorer.
   - Unduh dari situs resmi: [https://winfsp.dev/rel/](https://winfsp.dev/rel/) (disarankan versi `winfsp-2.0` ke atas).

### Linux:
1. **Sistem Operasi**: Linux berbasis kernel 5.x / 6.x / 7.x (Arch Linux, Ubuntu, Debian, Fedora, openSUSE, dll).
2. **Driver FUSE (fuse3)**: Wajib terpasang untuk mount filesystem:
   - **Arch / Manjaro**: `sudo pacman -S fuse3`
   - **Ubuntu / Debian**: `sudo apt install fuse3`
   - **Fedora / RHEL**: `sudo dnf install fuse3`
3. Folder mount default akan otomatis dibuat di `~/GDrive/<DriveLetter>` (contoh: `~/GDrive/X`).

### Semua OS:
- **Akun Google**: Akun Google pribadi / Google Workspace dengan kuota penyimpanan aktif.

---

## 🚀 Panduan Setup Google Cloud Console (OAuth 2.0)

Agar aplikasi dapat mengakses akun Google Drive Anda secara legal dan resmi, ikuti langkah berikut:

### Langkah 1: Buat Proyek di Google Cloud Console
1. Buka [https://console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate).
2. Beri nama proyek (misal: `GDrive-Supply-App`) lalu klik **Create**.
3. Pastikan proyek yang baru dibuat sudah aktif terpilih di bilah atas console.

### Langkah 2: Aktifkan Google Drive API
1. Buka menu **APIs & Services** ➔ **Library** (atau kunjungi [https://console.cloud.google.com/apis/library/drive.googleapis.com](https://console.cloud.google.com/apis/library/drive.googleapis.com)).
2. Cari **Google Drive API** lalu klik tombol **Enable**.

### Langkah 3: Konfigurasi OAuth Consent Screen
1. Masuk ke **APIs & Services** ➔ **OAuth consent screen**.
2. Pilih User Type **External** lalu klik **Create**.
3. Isi informasi dasar:
   - App name: `GDrive Supply`
   - User support email: Email Google Anda.
   - Developer contact information: Email Google Anda.
4. Klik **Save and Continue** sampai ke halaman **Test users**.

### ⚠️ PENTING: Tambahkan Test Users (Bypass Error Akses Diblokir)
Jika status publishing aplikasi masih dalam mode **Testing**, Google mewajibkan akun email yang ingin dihubungkan terdaftar sebagai Test User:
1. Pada tab **Test users**, klik **+ ADD USERS**.
2. Masukkan alamat email Google yang ingin Anda jadikan drive lokal.
3. Klik **Save**.
*(Jika langkah ini dilewati, Google akan memunculkan error: `Access blocked: GDApp has not completed the Google verification process`).*

### Langkah 4: Buat OAuth Client ID
1. Buka menu **APIs & Services** ➔ **Credentials**.
2. Klik **+ CREATE CREDENTIALS** ➔ pilih **OAuth client ID**.
3. Pilih Application type: **Web application**.
4. Isi Name: `GDrive Supply Local Client`.
5. Di bagian **Authorized redirect URIs**, klik **+ ADD URI** dan masukkan **KEDUA URL** berikut (wajib keduanya untuk mencegah error `redirect_uri_mismatch`):
   ```text
   http://127.0.0.1:4040/api/auth/callback
   http://localhost:4040/api/auth/callback
   ```
6. Di bagian **Authorized JavaScript origins**, masukkan:
   ```text
   http://127.0.0.1:4040
   http://localhost:4040
   ```
7. Klik **Create**. Salin **Client ID** dan **Client Secret** Anda, lalu masukkan ke dalam menu *Kredensial API* di dashboard GDrive Supply.

---

## 💻 Panduan Kompilasi & Menjalankan Aplikasi

Jika Anda ingin mengompilasi dari source code:

### Prasyarat Pengembang:
- Go 1.22 atau lebih baru (`go version`)
- Node.js 18+ & npm (`node -v`) *(hanya jika ingin mengedit/rebuild frontend)*

### 1. Clone Repository:
```bash
git clone https://github.com/nyanky0/GDriveSupply.git
cd GDriveSupply
```

### 2. Kompilasi & Instalasi:

#### Di Windows:
Jalankan skrip build otomatis PowerShell atau `build.bat`:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1
```
Atau cukup klik dua kali `build.bat`. Menghasilkan file eksekutabel tunggal `GDriveSupply.exe`.

#### Di Linux (1-Click Installer):
Jalankan skrip installer otomatis:
```bash
chmod +x install.sh
./install.sh
```
Skrip ini akan:
1. Memverifikasi ketersediaan driver FUSE (`fuse3`).
2. Mengompilasi source code menjadi binary native `GDriveSupply`.
3. Memasang CLI global `gdrive-supply` ke `~/.local/bin/gdrive-supply`.
4. Mengonfigurasi autostart systemd user service jika diinginkan.

*(Untuk uninstall: jalankan `./uninstall.sh`).*

### 3. Menjalankan Aplikasi:

#### Di Windows:
Cukup klik dua kali `GDriveSupply.exe` atau jalankan:
```cmd
run.bat
```

#### Di Linux:
Kamu bisa mengontrol aplikasi dari mana saja lewat perintah global `gdrive-supply`:
```bash
gdrive-supply start      # Menjalankan di background (terminal aman ditutup)
gdrive-supply stop       # Menghentikan aplikasi & melepas semua virtual drive
gdrive-supply restart    # Restart service
gdrive-supply status     # Cek status PID & daftar partisi mount yang aktif
gdrive-supply open       # Membuka Web Dashboard di browser (http://127.0.0.1:4040)
gdrive-supply logs       # Pantau log aktivitas secara realtime
gdrive-supply enable     # Aktifkan autostart saat login (systemd user service)
gdrive-supply disable    # Matikan autostart
```

Atau menggunakan skrip lokal:
```bash
./start.sh
./stop.sh
./scripts/setup_autostart_linux.sh
```

Aplikasi akan:
- Membuka Web Dashboard di browser default: [http://localhost:4040](http://localhost:4040).
- Berjalan di latar belakang (System Tray di Windows / Headless Daemon di Linux).
- Mengotomatisasi auto-mount seluruh akun Google Drive yang aktif (`X:\` di Windows atau `~/GDrive/X` di Linux).

---

## 📁 Struktur Proyek

```text
GDriveSupply/
├── cmd/
│   └── app/
│       └── main.go              # Entry point Go, HTTP server & loop daemon
├── internal/
│   ├── api/
│   │   └── handlers.go          # REST API endpoints (mount, rename, shutdown, OAuth, auth session)
│   ├── config/
│   │   ├── config.go            # Store konfigurasi cross-platform (%APPDATA% / ~/.config)
│   │   ├── dpapi_windows.go     # Enkripsi Windows via DPAPI CryptProtectData
│   │   └── crypto_other.go      # Enkripsi Linux via AES-256-GCM hardware key
│   ├── logger/
│   │   └── logger.go            # High-capacity diagnostic ring buffer logger
│   ├── mount/
│   │   ├── supervisor.go        # Manajemen proses VFS rclone & TokenSource OAuth2
│   │   ├── winfsp_windows.go    # Deteksi WinFsp di Windows
│   │   ├── vfs_other.go         # Deteksi FUSE di Linux
│   │   ├── proc_windows.go      # Process attributes Windows (CREATE_NO_WINDOW)
│   │   └── proc_other.go        # Process attributes Linux
│   ├── sysutil/
│   │   ├── drives_windows.go    # Alokasi huruf drive Windows (A:-Z:) via kernel32
│   │   ├── drives_other.go      # Alokasi mount folder Linux (~/GDrive/<Slot>)
│   │   ├── mutex_windows.go     # Win32 Named Mutex single-instance guard
│   │   ├── mutex_other.go       # Linux file lock single-instance guard (flock)
│   │   └── token.go             # Cryptographic secure random token generator
│   ├── tray/
│   │   ├── tray_windows.go      # Launcher system tray native Windows
│   │   ├── tray_other.go        # Headless background daemon mode Linux
│   │   ├── tray_helper.cs       # Windows Forms System Tray companion (C#)
│   │   └── tray_helper.exe      # Embedded standalone tray binary Windows (35 KB)
│   └── ui/
│       ├── ui.go                # Go standard library //go:embed dist
│       └── dist/                # Output build React terintegrasi
├── web/                         # Frontend Vite + React 19 + Tailwind CSS v4
├── scripts/
│   ├── build.ps1                # Skrip build PowerShell Windows
│   ├── build.sh                 # Skrip build bash Linux
│   ├── setup_autostart.ps1      # Startup registrasi Windows
│   └── setup_autostart_linux.sh # Systemd user service registrasi Linux
├── install.sh                   # 1-Click installer Linux (CLI & autostart)
├── uninstall.sh                 # Uninstaller Linux
├── build.bat                    # Shortcut build Windows
├── build.sh                     # Skrip build Linux
├── run.bat                      # Shortcut jalankan Windows
├── start.sh                     # Start background detached Linux (terminal aman ditutup)
├── stop.sh                      # Stop background Linux (unmount bersih)
├── .gitignore                   # Proteksi kredensial, token & binary lokal
└── README.md                    # Dokumentasi utama proyek
```

---

## 🏆 Kualitas Kode & Audit (CodeFlow Report)

Berdasarkan audit statis [CodeFlow](https://github.com/nyanky0/GDriveSupply):
- **Health Score**: `97/100 (A)`
- **Security Vulnerabilities**: `0` (Zero issues)
- **Unused Procedures / Dead Code**: `0`
- **Subsystem Mode**: Native Pure GUI Windows Subsystem (`-H=windowsgui`) tanpa konsol CMD popup.
- **System Tray Architecture**: Native embedded companion (`tray_helper.exe`) terisolasi dengan lifecycle monitoring otomatis berbasis parent PID (zero zombie/orphan process).

---

## 🔒 Kebijakan Keamanan & Privasi

- **Kredensial Tidak Pernah Masuk Git**: File `.gitignore` dikonfigurasi secara ketat untuk mengabaikan file konfigurasi (`config.json`), token OAuth, file binary, dan file konfigurasi sementara (`rclone_*.conf`).
- **Enkripsi Hardware**: Token refresh OAuth diamankan menggunakan Windows DPAPI yang terikat secara kriptografis pada akun Windows lokal Anda.
- **Zero-Telemetri**: Tidak ada analitik pihak ketiga atau pelacakan server luar. Semua request hanya berjalan antara PC lokal Anda dan server resmi Google Cloud.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi [MIT](LICENSE). Silakan gunakan, pelajari, dan kembangkan secara bebas!
