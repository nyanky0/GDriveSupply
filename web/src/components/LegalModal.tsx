import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, ExternalLink } from 'lucide-react';


interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Kebijakan Privasi & Ketentuan Layanan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kepatuhan Standar Google API Services User Data Policy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'privacy'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Kebijakan Privasi (Privacy Policy)
          </button>
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'terms'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Ketentuan Layanan (Terms of Service)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {tab === 'privacy' ? (
            <>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium">
                <strong>Prinsip Inti:</strong> GDrive Supply adalah perangkat lunak open-source lokal murni (Local-First Daemon). Kami <strong>TIDAK PERNAH</strong> mengumpulkan, mentransmisikan, atau menyimpan data file Anda ke server pihak ketiga mana pun.
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  1. Data yang Diakses dan Cara Penggunaannya
                </h3>
                <p>
                  GDrive Supply meminta akses ke Google Drive API (<code>https://www.googleapis.com/auth/drive</code>) semata-mata untuk mengintegrasikan file cloud Anda sebagai virtual disk drive di sistem operasi Microsoft Windows Anda melalui perantara driver WinFsp.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                  <li><strong>Profil & Email Pengguna:</strong> Digunakan untuk menampilkan identitas akun yang terhubung dan kuota penyimpanan pada dashboard lokal Anda.</li>
                  <li><strong>Konten File & Metadata:</strong> Ditransfer langsung secara terenkripsi (TLS 1.3) antara mesin Windows Anda dan server resmi Google saat Anda membuka atau menyimpan file di Windows Explorer.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  2. Penyimpanan Kredensial & Enkripsi (Windows DPAPI)
                </h3>
                <p>
                  Seluruh token otentikasi (OAuth Client ID, Secret, dan Refresh Token) disimpan secara terenkripsi menggunakan <strong>Windows Data Protection API (DPAPI)</strong> di direktori lokal pengguna (<code>%APPDATA%\GDriveSupply\config.json</code>). Kunci enkripsi terikat pada kredensial login Windows pengguna lokal dan tidak dapat diekstrak oleh akun lain.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  3. Kepatuhan Kebijakan Pengguna Google (Limited Use)
                </h3>
                <p>
                  Penggunaan dan transfer informasi yang diterima dari Google API oleh GDrive Supply ke aplikasi lain sepenuhnya mematuhi{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 font-semibold underline inline-flex items-center gap-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  , termasuk persyaratan Limited Use. Kami tidak menggunakan data Anda untuk melatih model kecerdasan buatan (AI) umum atau membagikannya dengan pengiklan.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  4. Pencabutan Akses
                </h3>
                <p>
                  Anda memiliki kendali penuh. Anda dapat menghapus akun drive kapan saja dari dashboard lokal, atau mencabut izin secara langsung melalui portal akun Google resmi di{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 font-semibold underline inline-flex items-center gap-1"
                  >
                    myaccount.google.com/permissions
                    <ExternalLink className="w-3 h-3" />
                  </a>.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  1. Penerimaan Ketentuan
                </h3>
                <p>
                  Dengan menjalankan perangkat lunak GDrive Supply pada komputer Anda, Anda menyetujui ketentuan ini. Perangkat lunak ini disediakan untuk memfasilitasi pemasangan akun Google Drive pribadi Anda ke dalam sistem berkas lokal Windows.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  2. Tanggung Jawab Pengguna
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                  <li>Anda bertanggung jawab menjaga kerahasiaan Master Password lokal dan keamanan kredensial Google API Console Anda sendiri.</li>
                  <li>Anda wajib memastikan penggunaan Google Drive Anda tidak melanggar ketentuan layanan resmi Google LLC.</li>
                  <li>Anda memahami bahwa fitur Kill Switch akan menghapus konfigurasi lokal jika salah memasukkan password sebanyak 5 kali berturut-turut.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  3. Batasan Tanggung Jawab
                </h3>
                <p>
                  GDrive Supply didistribusikan secara &apos;sebagaimana adanya&apos; (AS IS) tanpa jaminan apa pun, baik tersurat maupun tersirat. Pengembang tidak bertanggung jawab atas kehilangan data lokal, gangguan konektivitas jaringan, atau pembatasan kuota yang diberlakukan oleh Google.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  4. Lisensi & Kode Sumber
                </h3>
                <p>
                  GDrive Supply adalah proyek perangkat lunak sumber terbuka (Open-Source). Anda dapat memeriksa kode sumber, melakukan audit independen, dan berkontribusi melalui repositori resmi GitHub.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
