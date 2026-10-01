import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Lock,
  ServerOff,
  Zap,
  BookOpen,
  FileText,
  KeyRound,
  AlertCircle,
  Search,
} from 'lucide-react';

interface DocsAndSolutionsProps {
  onOpenCredentials: () => void;
  onOpenAddDrive: () => void;
}

export const DocsAndSolutions: React.FC<DocsAndSolutionsProps> = ({
  onOpenCredentials,
  onOpenAddDrive,
}) => {
  const [subTab, setSubTab] = useState<'troubleshooting' | 'setup' | 'security' | 'legal'>('troubleshooting');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const troubleshootingList = [
    {
      id: 'redirect_uri_mismatch',
      severity: 'error' as const,
      badge: 'Google OAuth',
      title: 'Error 400: redirect_uri_mismatch',
      subtitle: 'Google menolak proses login dengan pesan "You can\'t sign in because this app sent an invalid request"',
      rootCause:
        'Google OAuth 2.0 memeriksa parameter redirect_uri secara karakter-per-karakter (strict match). Jika Anda membuka web lewat 127.0.0.1 tetapi di Google Cloud Console hanya didaftarkan localhost (atau sebaliknya, atau tanpa akhiran path /api/auth/callback), Google langsung memblokir permintaan otorisasi.',
      solution: (
        <div className="space-y-3">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Tambahkan <strong>KEDUA</strong> URL berikut ke bagian <em>Authorized redirect URIs</em> pada Client ID Anda di Google Cloud Console:
          </p>
          <div className="space-y-2">
            {[
              'http://127.0.0.1:4040/api/auth/callback',
              'http://localhost:4040/api/auth/callback',
            ].map((uri) => (
              <div
                key={uri}
                className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <code className="text-xs font-mono text-slate-900 dark:text-white select-all">{uri}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(uri)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  {copiedText === uri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === uri ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            ))}
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Jangan lupa klik tombol <strong>SAVE</strong> di Google Cloud Console setelah menambahkan URI di atas.
            </span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              Buka Google Credentials <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'unauthorized_client',
      severity: 'error' as const,
      badge: 'Token Mismatch',
      title: 'oauth2: "unauthorized_client" "Unauthorized"',
      subtitle: 'Drive berstatus Error saat auto-mount atau polling latar belakang',
      rootCause:
        'Refresh token akun Google Drive terikat secara kriptografis pada OAuth Client ID spesifik yang menerbitkannya. Jika Anda mengganti Google Client ID di menu Kredensial API, token akun lama akan ditolak oleh Google API karena ada perbedaan Client ID penerbit.',
      solution: (
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Masalah ini sangat mudah diselesaikan dengan fitur pembaruan in-place 1-klik:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400">
            <li>Buka tab <strong>Kelola Drive</strong>.</li>
            <li>Lihat kartu drive yang bermasalah di dalam kotak <strong>Daftar Drive Bermasalah / Membutuhkan Pembaruan</strong>.</li>
            <li>Klik tombol <strong>Perbarui Otorisasi (Update)</strong> pada kartu tersebut.</li>
            <li>Selesaikan persetujuan di tab browser Google yang terbuka. Token baru akan otomatis terpasang menggantikan token lama dan drive langsung ter-mount!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'test_users_verification',
      severity: 'warning' as const,
      badge: 'Google Consent Screen',
      title: 'Google Belum Memverifikasi Aplikasi Ini / Access Blocked',
      subtitle: 'Muncul peringatan "Aplikasi ini saat ini sedang diuji" atau akses diblokir Google',
      rootCause:
        'Status aplikasi di Google Cloud Console masih berstatus "Testing" (belum diverifikasi oleh Google untuk publik). Pada mode ini, Google mewajibkan semua akun email yang ingin login didaftarkan terlebih dahulu ke daftar Test Users.',
      solution: (
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Untuk menambahkan email Anda ke daftar Test Users (hanya 30 detik):
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400">
            <li>Buka Google Cloud Console: <strong>APIs &amp; Services &gt; OAuth consent screen</strong>.</li>
            <li>Gulir ke bawah ke bagian <strong>Test users</strong>.</li>
            <li>Klik tombol <strong>+ ADD USERS</strong>.</li>
            <li>Ketik semua alamat email Google yang ingin Anda sambungkan ke GDrive Supply.</li>
            <li>Klik <strong>Save</strong>. Sekarang akun Anda bebas login tanpa diblokir!</li>
          </ol>
          <div className="pt-1">
            <a
              href="https://console.cloud.google.com/apis/credentials/consent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Buka OAuth Consent Screen <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'winfsp_missing',
      severity: 'warning' as const,
      badge: 'Virtual Disk Driver',
      title: 'Driver WinFsp Belum Terpasang (Virtual Drive Tidak Muncul)',
      subtitle: 'Partisi drive (Z:, Y:, dll.) tidak muncul di Windows File Explorer',
      rootCause:
        'GDrive Supply menggunakan Rclone VFS untuk memetakan cloud storage menjadi virtual drive Windows native. Windows membutuhkan driver kernel Windows File System Proxy (WinFsp) agar partisi virtual dapat dikenali oleh Windows Explorer.',
      solution: (
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Unduh installer resmi WinFsp atau jalankan perintah instalasi otomatis di bawah ini:
          </p>
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <code className="text-xs font-mono text-slate-900 dark:text-white">winget install WinFsp.WinFsp</code>
            <button
              type="button"
              onClick={() => copyToClipboard('winget install WinFsp.WinFsp')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              {copiedText === 'winget install WinFsp.WinFsp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'winget install WinFsp.WinFsp' ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <div className="pt-1 flex items-center gap-3">
            <a
              href="https://winfsp.dev/rel/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Unduh Installer WinFsp (.msi) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'single_instance_guard',
      severity: 'info' as const,
      badge: 'Sistem & Arsitektur',
      title: 'Aplikasi Tidak Terbuka Dua Kali (Single-Instance Guard)',
      subtitle: 'Mengapa menjalankan GDriveSupply.exe lagi tidak membuka jendela terminal baru?',
      rootCause:
        'GDrive Supply dilindungi oleh Windows Named Mutex (Local\\GDriveSupply_SingleInstance_Mutex). Menjalankan dua instance secara bersamaan akan menyebabkan tabrakan port :4040 dan lock file cache Rclone VFS rusak.',
      solution: (
        <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Ketika Anda mengklik file executable saat aplikasi sudah berjalan:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400">
            <li>Proses baru mendeteksi Mutex yang sudah aktif.</li>
            <li>Proses baru langsung meluncurkan browser ke dashboard <code>http://127.0.0.1:4040</code>.</li>
            <li>Proses kedua langsung keluar secara bersih (graceful exit) demi menjaga stabilitas sistem.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'master_password_policy',
      severity: 'info' as const,
      badge: 'Keamanan Akun',
      title: 'Kebijakan Master Password & Reset Darurat (Zero-Residual)',
      subtitle: 'Aturan 5x percobaan salah password dan prinsip penghapusan hash instan',
      rootCause:
        'Untuk melindungi token Google Drive Anda dari akses fisik pihak yang tidak bertanggung jawab, sistem menerapkan perlindungan proteksi brute-force bertingkat.',
      solution: (
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <p>
            <strong>Prinsip Keamanan GDrive Supply:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400">
            <li><strong>Maksimal 5 Kali Salah:</strong> Jika salah memasukkan password 5 kali berturut-turut, sistem memicu Factory Reset darurat (seluruh virtual drive diputus dan kredensial lokal dihapus bersih demi menjaga keamanan akun Anda).</li>
            <li><strong>Zero-Residual Storage:</strong> Saat fitur password dimatikan (OFF), seluruh hash password dan session token dihapus permanen dari memori dan file konfigurasi. Tidak ada data hash yang disimpan saat fitur tidak aktif.</li>
            <li><strong>Enkripsi Kuat:</strong> Algoritma <strong>bcrypt</strong> (cost 12) menjamin ketahanan terhadap serangan offline dictionary attack.</li>
          </ul>
        </div>
      ),
    },
  ];

  const filteredIssues = troubleshootingList.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Pusat Dokumentasi, Panduan &amp; Troubleshooting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dokumentasi &amp; Solusi Masalah GDrive Supply
          </h1>
          <p className="text-sm text-slate-300/90 leading-relaxed">
            Temukan panduan lengkap menghubungkan akun Google Drive, cara setup Google Cloud Console,
            serta solusi instan untuk seluruh kemungkinan kode error integrasi API.
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={() => setSubTab('troubleshooting')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'troubleshooting'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Katalog Masalah &amp; Solusi ({troubleshootingList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('setup')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'setup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Panduan Setup Google Console</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('security')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'security'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Status Anti-Banned &amp; Arsitektur</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('legal')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'legal'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Kebijakan Privasi &amp; Legal</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Troubleshooting Catalog */}
      {subTab === 'troubleshooting' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Daftar Masalah, Penyebab &amp; Solusi Step-by-Step
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih dan cari masalah yang sedang Anda alami untuk membaca akar penyebab teknis dan solusinya
              </p>
            </div>
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari error atau masalah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Title & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          item.severity === 'error'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : item.severity === 'warning'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {item.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : item.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <HelpCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  {/* Root Cause Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">
                      🔍 Akar Penyebab Masalah (Root Cause):
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.rootCause}</p>
                  </div>

                  {/* Solution Box */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Langkah Solusi:
                    </span>
                    <div>{item.solution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Setup Google Console */}
      {subTab === 'setup' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Panduan Pembuatan Kredensial Google Cloud Console (Step-by-Step)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ikuti 4 langkah mudah berikut untuk mendapatkan Client ID &amp; Secret gratis dari Google Cloud Console
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Buat Project di Google Cloud
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Buka portal Google Cloud Console untuk membuat project gratis tempat aplikasi menghubungkan Google Drive.
              </p>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  console.cloud.google.com/projectcreate
                </span>
                <a
                  href="https://console.cloud.google.com/projectcreate"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Buka Link
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Aktifkan API &amp; Test Users
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aktifkan <strong>Google Drive API</strong> di menu Library. Lalu di menu <strong>OAuth consent screen</strong>, pilih <em>External</em> dan tambahkan email Google Anda ke bagian <strong>Test users</strong>.
              </p>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  APIs &amp; Services &gt; Library
                </span>
                <a
                  href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Aktifkan Drive API
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Buat OAuth Client ID &amp; Redirect URIs
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pilih Application Type <strong>Web application</strong>. Di bagian <strong>Authorized redirect URIs</strong>, masukkan:
              </p>
              <div className="space-y-1.5">
                {[
                  'http://127.0.0.1:4040/api/auth/callback',
                  'http://localhost:4040/api/auth/callback',
                ].map((uri) => (
                  <div
                    key={uri}
                    className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <code className="text-[11px] font-mono select-all text-slate-800 dark:text-slate-200 truncate">{uri}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(uri)}
                      className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    >
                      {copiedText === uri ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Simpan Kredensial &amp; Tambah Drive
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Salin <strong>Client ID</strong> dan <strong>Client Secret</strong> yang diberikan Google, lalu simpan di menu pengaturan aplikasi ini.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCredentials}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Buka Pengaturan Kredensial
                </button>
                <button
                  type="button"
                  onClick={onOpenAddDrive}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  + Tambah Drive Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Anti-Banned Status */}
      {subTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-semibold mb-1">
                Jaminan 100% Anti-Banned &amp; Kepatuhan Resmi Google API
              </strong>
              GDrive Supply tidak menggunakan reverse-engineering atau web scraping yang melanggar ToS Google. Seluruh interaksi menggunakan API Google Drive v3 resmi dengan kuota dedicated milik Anda pribadi.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>REST API Resmi v3</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Terkoneksi langsung ke endpoint resmi <code>googleapis.com/drive/v3</code>, sama seperti integrasi Google Workspace resmi.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Client ID Dedicated</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Kredensial dibuat di Google Cloud Console pribadi Anda, sehingga kuota API tidak terbagi dan bebas dari anomali IP bersama.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                <ServerOff className="w-4 h-4 text-purple-500" />
                <span>Zero-Cloud Relay</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Transfer file langsung antara komputer Anda dan server Google via TLS 1.3 terenkripsi tanpa melewati VPS perantara.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Enkripsi Windows DPAPI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Token OAuth dan konfigurasi dienkripsi dengan Windows Data Protection API (DPAPI) yang terikat pada login Windows Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Legal & Privacy */}
      {subTab === 'legal' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Kebijakan Privasi &amp; Ketentuan Layanan (Privacy &amp; Terms)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kepatuhan Standar Google API Services User Data Policy
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Prinsip Privasi Utama: Local-First Open-Source Daemon
            </h3>
            <p>
              GDrive Supply adalah perangkat lunak open-source mandiri yang berjalan secara lokal (Local-First Daemon). Pengembang <strong>TIDAK PERNAH</strong> mengumpulkan, mentransmisikan, menyimpan, atau melihat data file, folder, maupun isi akun Google Drive Anda.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li><strong>Scope Akses:</strong> Hanya menggunakan izin Google Drive untuk menampilkan virtual drive di Windows Explorer melalui driver WinFsp.</li>
              <li><strong>Zero Telemetry:</strong> Tidak ada pelacakan analitik pihak ketiga atau pelaporan data rahasia.</li>
              <li><strong>Hak Penghapusan Penuh:</strong> Anda dapat mencabut otorisasi atau menghapus seluruh drive dan kredensial kapan saja dengan 1 klik atau melalui Factory Reset.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
