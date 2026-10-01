import React, { useState } from 'react';
import { X, BookOpen, ExternalLink, Copy, Check, ChevronRight, ChevronLeft, AlertTriangle, UserPlus, CheckCircle2 } from 'lucide-react';


interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUri: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUri(text);
    setTimeout(() => setCopiedUri(null), 2000);
  };

  const steps = [
    {
      step: 1,
      title: 'Buat Project di Google Cloud Console',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Buka portal Google Cloud Console untuk membuat proyek gratis tempat aplikasi menghubungkan Google Drive.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="font-mono text-xs text-slate-800">https://console.cloud.google.com/projectcreate</span>
            <a
              href="https://console.cloud.google.com/projectcreate"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Buka Tab Baru <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1">
            <li>Beri nama proyek, misalnya: <strong className="text-slate-900">GDrive-Personal</strong>.</li>
            <li>Klik tombol <strong className="text-slate-900">Create</strong> dan tunggu hingga proyek selesai dibuat.</li>
            <li>Pastikan proyek baru tersebut aktif terpilih di dropdown atas console.</li>
          </ol>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Aktifkan Google Drive API & Layar Persetujuan',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Aplikasi butuh izin Google Drive API untuk mengelola drive secara langsung.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="font-mono text-xs text-slate-800">Library &gt; Google Drive API</span>
            <a
              href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Aktifkan API <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1">
            <li>Klik tombol biru <strong className="text-slate-900">Enable</strong> (Aktifkan) Google Drive API.</li>
            <li>Buka menu <strong className="text-slate-900">OAuth consent screen</strong> di sidebar kiri.</li>
            <li>Pilih User Type: <strong className="text-slate-900">External</strong> lalu klik <strong className="text-slate-900">Create</strong>.</li>
            <li>Isi nama aplikasi (misal: <em>GDrive Manager</em>) dan email support Anda.</li>
          </ol>

          {/* Test Users Highlight */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-950">
              <UserPlus className="w-4 h-4 text-amber-700" />
              <span>LANGKAH WAJIB: Tambahkan Email ke &quot;Test users&quot;</span>
            </div>
            <p className="leading-relaxed">
              Pada bagian <strong>Test users</strong> (di halaman OAuth consent screen), klik <strong>+ ADD USERS</strong> dan masukkan semua alamat email Google yang akan disambungkan. Jika dilewati, Google akan memblokir login dengan error <em>&quot;Access blocked&quot;</em>!
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Buat Kredensial OAuth 2.0 Client ID',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Buat Client ID agar aplikasi di komputer Anda dapat meminta izin akses drive secara aman.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="font-mono text-xs text-slate-800">APIs &amp; Services &gt; Credentials</span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Halaman Credentials <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1">
            <li>Klik <strong className="text-slate-900">+ Create Credentials</strong> ➜ Pilih <strong className="text-slate-900">OAuth client ID</strong>.</li>
            <li>Application type: Pilih <strong className="text-slate-900">Web application</strong>.</li>
            <li>Pada bagian <strong>Authorized redirect URIs</strong>, klik <strong>+ ADD URI</strong> dan masukkan <strong>KEDUA</strong> URL berikut (wajib keduanya untuk mencegah error <code>redirect_uri_mismatch</code>):</li>
          </ol>

          {/* Copyable Redirect URIs */}
          <div className="space-y-1.5 pt-1">
            {[
              'http://127.0.0.1:4040/api/auth/callback',
              'http://localhost:4040/api/auth/callback',
            ].map((uri) => (
              <div key={uri} className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 border border-slate-300 rounded-lg">
                <span className="font-mono text-xs text-slate-800 truncate select-all">{uri}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(uri)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {copiedUri === uri ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUri === uri ? 'Tersalin' : 'Salin URI'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'Download credentials.json & Sambungkan Drive',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Setelah Client ID dibuat, Anda dapat mengunduh file JSON atau menyalin Client ID &amp; Secret ke aplikasi ini.
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1">
            <li>Klik ikon unduh <strong className="text-slate-900">Download JSON</strong> di samping Client ID yang baru dibuat, lalu simpan sebagai <code className="bg-slate-200 px-1 rounded">credentials.json</code>.</li>
            <li>Klik tombol <strong className="text-blue-600 font-semibold">+ Tambah Drive</strong> di dashboard aplikasi ini.</li>
            <li>Tarik &amp; lepas file <code className="bg-slate-200 px-1 rounded">credentials.json</code> atau paste kodenya secara manual.</li>
            <li>Pilih huruf drive yang diinginkan (misal: <strong>X:\</strong>).</li>
            <li>Klik <strong>Sambungkan ke Google</strong> dan setujui izin akses di browser.</li>
          </ol>
        </div>
      ),
    },
    {
      step: 5,
      title: 'Solusi Error Google Verification & Layar Persetujuan',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          {/* Error 1: Access Blocked */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Jika Muncul: &quot;Access blocked: App has not completed verification&quot;</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              <strong>Penyebab:</strong> Status project Google Cloud Anda masih <em>Testing</em>, dan alamat email yang sedang login <u>belum terdaftar</u> sebagai Test User.
            </p>
            <div className="pt-1 text-xs text-rose-900 space-y-1">
              <strong>Cara Mengatasi:</strong>
              <ol className="list-decimal list-inside pl-1 space-y-0.5 text-rose-800">
                <li>
                  Buka{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials/consent"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold text-rose-950 inline-flex items-center gap-0.5"
                  >
                    OAuth consent screen <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Scroll ke bawah ke bagian <strong>Test users</strong>.</li>
                <li>Klik <strong>+ ADD USERS</strong> ➜ Masukkan email Google Anda ➜ Klik <strong>Save</strong>.</li>
                <li>Coba klik login kembali di aplikasi ini. Layar blokir akan hilang seketika!</li>
              </ol>
            </div>
          </div>

          {/* Warning 2: Google hasn't verified */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Jika Muncul: &quot;Google belum memverifikasi aplikasi ini&quot;</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Ini adalah konfirmasi standar dari Google karena ini adalah aplikasi pribadi buatan Anda sendiri:
            </p>
            <ol className="list-decimal list-inside pl-1 space-y-0.5 text-xs text-emerald-800">
              <li>Klik tombol <strong>Lanjutkan</strong> (atau <em>Advanced</em> ➜ <em>Go to GDrive Manager (unsafe)</em>).</li>
              <li>Beri <strong>tanda centang (checklist)</strong> pada kotak izin: <em>&quot;Lihat, edit, buat, dan hapus semua file Google Drive Anda&quot;</em>.</li>
              <li>Klik <strong>Lanjutkan</strong>. Akun Google Anda resmi tersambung!</li>
            </ol>
          </div>

          {/* Guide 3: WinFsp Driver Installation */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-900 text-xs">
              <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Langkah Terakhir: Instalasi Driver WinFsp (Wajib 1x)</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Agar partisi drive (misal <strong>Z:\</strong>) dapat muncul di <em>This PC</em> Windows File Explorer layaknya harddisk fisik lokal, Windows membutuhkan driver <strong>WinFsp (Windows File System Proxy)</strong>.
            </p>
            <div className="pt-1 text-xs text-blue-900 space-y-1">
              <strong>Cara Pasang Cepat (1 Menit):</strong>
              <ol className="list-decimal list-inside pl-1 space-y-0.5 text-blue-800">
                <li>
                  Klik tombol <strong>Download &amp; Pasang WinFsp</strong> di banner atas dashboard, atau unduh manual dari{' '}
                  <a
                    href="https://winfsp.dev/rel/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold text-blue-950 inline-flex items-center gap-0.5"
                  >
                    winfsp.dev/rel <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Jalankan file installer <code className="bg-blue-100 px-1 rounded">winfsp-xxx.msi</code> lalu klik <em>Next ➜ Next ➜ Install</em>.</li>
                <li>Setelah instalasi selesai, klik tombol <strong>[ Mount ]</strong> pada kartu drive Anda di dashboard.</li>
                <li>Selesai! Drive langsung muncul dan siap digunakan di Windows File Explorer.</li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
  ];


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Panduan Setup &amp; Solusi Error</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi Google Cloud Console &amp; Penanganan Izin Akses</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  currentStep === step
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : currentStep > step
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title={`Langkah ${step}`}
              >
                {step === 5 ? '⚠️' : step}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {currentStep === 5 ? 'Panduan Solusi Error' : `Langkah ${currentStep} dari 4`}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-3">
            {steps[currentStep - 1].title}
          </h4>
          <div className="dark:text-slate-300 text-slate-700">
            {steps[currentStep - 1].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-colors"
            >
              Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
            >
              Tutup Panduan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
