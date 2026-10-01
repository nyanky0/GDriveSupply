import React, { useState } from 'react';
import { Power, ShieldAlert, X, Loader2, CheckCircle2 } from 'lucide-react';

interface ShutdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShutdownModal: React.FC<ShutdownModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleShutdown = async (withWinFsp: boolean) => {
    setLoading(true);
    try {
      await fetch('/api/system/shutdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withWinFsp }),
      });
      setDone(true);
    } catch {
      // If network terminates because server is shutting down, it's successful!
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Matikan GDrive Supply
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih opsi penghentian layanan
              </p>
            </div>
          </div>
          {!done && (
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                Layanan Berhasil Dimatikan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semua drive telah dilepas dengan aman. Anda dapat menutup tab browser ini.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Melepas drive dan menghentikan proses...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: App Only */}
              <button
                onClick={() => handleShutdown(false)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200">
                    Matikan GDrive Supply Saja
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    Standar
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Melepas semua drive Google Drive dan mematikan aplikasi. Driver WinFsp tetap standby di sistem Windows.
                </p>
              </button>

              {/* Option 2: App + WinFsp */}
              <button
                onClick={() => handleShutdown(true)}
                className="w-full text-left p-4 rounded-xl border border-red-200/80 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-800/70 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-red-600 dark:text-red-400">
                    Matikan Bersama Service WinFsp
                  </span>
                  <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-medium">
                    <ShieldAlert className="w-3 h-3" /> Lengkap
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Melepas drive, mematikan aplikasi, dan sekaligus menghentikan background service WinFsp (WinFsp.Launcher).
                </p>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && !loading && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
