import React from 'react';
import { ShieldCheck, X, CheckCircle2, Lock, Zap, ServerOff, FileCheck2 } from 'lucide-react';

interface AntiBannedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AntiBannedModal: React.FC<AntiBannedModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Keamanan & Status Anti-Banned Google
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mengapa GDrive Supply 100% Aman & Terhindar dari Banned
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-semibold mb-1">
                Ya, 100% Anti-Banned & Legal Menurut Ketentuan Google
              </strong>
              GDrive Supply tidak menggunakan trik eksploitasi, bypass web scraping, ataupun token ilegal. Seluruh komunikasi tunduk sepenuhnya pada <em>Google API Services User Data Policy</em>.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-500" />
                API Resmi Google Drive v3
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Menggunakan REST endpoints resmi Google (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">googleapis.com/drive/v3</code>), sama persis seperti integrasi aplikasi resmi Google Workspace.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                OAuth Client ID Milik Sendiri
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Kredensial dibuat di Google Cloud Console Anda pribadi. Kuota API (20.000 request/menit) dialokasikan khusus untuk Anda tanpa risiko berbagi dengan pihak asing.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1.5">
                <ServerOff className="w-4 h-4 text-purple-500" />
                Zero-VPS (Direct Encrypted)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Transfer file langsung dari laptop Anda ke Google Cloud via HTTPS TLS 1.3. Tidak ada server perantara yang bisa menyadap atau memicu anomali IP login.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Enkripsi Windows DPAPI
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Token OAuth disimpan di harddisk lokal menggunakan Windows Data Protection API (DPAPI). Hanya akun Windows Anda yang dapat mendekripsi token tersebut.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
