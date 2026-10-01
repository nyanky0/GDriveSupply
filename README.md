# ☁️ GDrive Supply

> **Aggregator Multi-Akun Google Drive Menjadi Partisi Harddisk Lokal Windows (Zero-VPS, Rp 0, Direct Client-to-Cloud)**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg)
![Go](https://img.shields.io/badge/backend-Go%201.22-00ADD8.svg)
![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Tailwind%20v4-61DAFB.svg)
![Kernel](https://img.shields.io/badge/driver-WinFsp%20VFS-008080.svg)

---

## 📌 Ringkasan Arsitektur

**GDrive Supply** adalah aplikasi desktop Windows berkinerja tinggi yang menggabungkan banyak akun Google Drive menjadi partisi harddisk virtual lokal terpisah di File Explorer (*This PC*, misalnya drive `X:`, `Y:`, `Z:`). 

Setiap akun memiliki partisi drive tersendiri dengan kapasitas penuh (misalnya 5 TB, 2 TB, atau 15 GB gratis). Seluruh lalu lintas data ditransfer langsung antara komputer Anda dan Google Cloud Storage via HTTPS TLS 1.3 (**Zero-VPS Bandwidth**), sehingga Anda tidak memerlukan server perantara dan biaya operasional bulanan adalah **Rp 0**.

```
[ Komputer Lokal Windows ] 
   │ 
   ├── 📁 File Explorer (This PC -> Z:\ Kyo Toram Drive)
   │      └── Driver Kernel WinFsp (User-mode VFS)
   │
   └── ⚡ Single Binary GDriveSupply.exe
          ├── 🌐 Embedded Web Dashboard (http://127.0.0.1:4040)
          ├── 🔒 Windows DPAPI Encrypted Storage (%APPDATA%\GDriveSupply)
          ├── 🛡️ Single-Instance Named Mutex Guard
          └── 📌 Native Windows System Tray Notification Icon
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

8. **Keamanan Windows DPAPI**
   - Client Secret dan Refresh Token dienkripsi menggunakan *Windows Data Protection API* (DPAPI). Token yang tersimpan di `%APPDATA%\GDriveSupply\config.json` tidak dapat dibaca oleh komputer atau pengguna Windows lain.

---

## 🛠️ Prasyarat Sistem

1. **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit).
2. **Driver WinFsp**: Wajib terpasang untuk membuat partisi drive virtual di Windows File Explorer.
   - Unduh dari situs resmi: [https://winfsp.dev/rel/](https://winfsp.dev/rel/) (disarankan versi `winfsp-2.0` ke atas).
3. **Akun Google**: Akun Google pribadi / Google Workspace dengan kuota penyimpanan aktif.

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
5. Di bagian **Authorized redirect URIs**, klik **+ ADD URI** dan masukkan:
   ```text
   http://localhost:4040/api/auth/callback
   ```
6. Klik **Create**. Salin **Client ID** dan **Client Secret** Anda, atau unduh file `credentials.json`.

---

## 💻 Panduan Kompilasi & Menjalankan Aplikasi

Jika Anda ingin mengompilasi dari source code:

### Prasyarat Pengembang:
- Go 1.22 atau lebih baru (`go version`)
- Node.js 18+ & npm (`node -v`)

### 1. Clone Repository:
```powershell
git clone https://github.com/nyanky0/GDriveSupply.git
cd GDriveSupply
```

### 2. Build Single Binary:
Jalankan skrip build otomatis PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1
```
Skrip ini akan:
1. Membangun bundle frontend React + Vite ke folder `internal/ui/dist`.
2. Mengompilasi kode backend Go menjadi satu file eksekutabel tunggal `GDriveSupply.exe` dengan flag GUI Windows (`-H=windowsgui`).

### 3. Menjalankan Aplikasi:
Cukup klik dua kali file `GDriveSupply.exe` atau jalankan:
```cmd
run.bat
```
Aplikasi akan:
- Membuka Web Dashboard di browser default: [http://localhost:4040](http://localhost:4040).
- Memunculkan ikon GDrive Supply di System Tray pojok kanan bawah Windows.
- Mengotomatisasi auto-mount seluruh akun Google Drive yang aktif.

---

## 📁 Struktur Proyek

```text
GDriveSupply/
├── cmd/
│   └── app/
│       └── main.go              # Entry point Go, HTTP server & message loop tray
├── internal/
│   ├── api/
│   │   └── handlers.go          # REST API endpoints (mount, rename, shutdown, OAuth)
│   ├── config/
│   │   ├── config.go            # Store manajemen konfigurasi & migrasi
│   │   └── dpapi_windows.go     # Enkripsi rahasia via Windows DPAPI CryptProtectData
│   ├── mount/
│   │   ├── supervisor.go        # Manajemen proses VFS rclone & TokenSource OAuth2
│   │   └── winfsp_windows.go    # Deteksi & installer otomatis WinFsp
│   ├── sysutil/
│   │   ├── drive_windows.go     # Alokasi huruf drive Windows (A:-Z:)
│   │   └── mutex_windows.go     # Win32 Named Mutex single-instance guard
│   ├── tray/
│   │   └── tray_windows.go      # Win32 Shell_NotifyIconW native system tray
│   └── ui/
│       ├── embed.go             # Go standard library //go:embed dist
│       └── dist/                # Output build React terintegrasi
├── web/                         # Frontend Vite + React 19 + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddDriveModal.tsx
│   │   │   ├── AntiBannedModal.tsx
│   │   │   ├── CredentialsModal.tsx
│   │   │   ├── DriveCard.tsx
│   │   │   ├── Logo.tsx         # Logo Google Drive Ribbon gradasi monokrom
│   │   │   ├── Navbar.tsx       # Navigasi, theme toggle & shutdown
│   │   │   ├── RenameDriveModal.tsx
│   │   │   ├── ShutdownModal.tsx
│   │   │   ├── StorageOverview.tsx
│   │   │   └── TutorialModal.tsx
│   │   ├── App.tsx              # Root component & theme observer
│   │   └── types.ts
│   └── package.json
├── scripts/
│   └── build.ps1                # Skrip kompilasi otomatis frontend + backend
├── build.bat                    # Shortcut build Windows
├── run.bat                      # Shortcut jalankan aplikasi
├── .gitignore                   # Proteksi kredensial, token & binary lokal
└── README.md                    # Dokumentasi utama proyek
```

---

## 🔒 Kebijakan Keamanan & Privasi

- **Kredensial Tidak Pernah Masuk Git**: File `.gitignore` dikonfigurasi secara ketat untuk mengabaikan file konfigurasi (`config.json`), token OAuth, file binary, dan file konfigurasi sementara (`rclone_*.conf`).
- **Enkripsi Hardware**: Token refresh OAuth diamankan menggunakan Windows DPAPI yang terikat secara kriptografis pada akun Windows lokal Anda.
- **Zero-Telemetri**: Tidak ada analitik pihak ketiga atau pelacakan server luar. Semua request hanya berjalan antara PC lokal Anda dan server resmi Google Cloud.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi [MIT](LICENSE). Silakan gunakan, pelajari, dan kembangkan secara bebas!
