import React from 'react';
import { AlertTriangle, RefreshCw, Play, Trash2, Terminal, ExternalLink } from 'lucide-react';
import type { DriveAccount } from '../types';

interface ErrorDrivesBoxProps {
  errorDrives: DriveAccount[];
  onReauth: (drive: DriveAccount) => void;
  onMount: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLogs: () => void;
  onOpenTutorial: () => void;
  isActionLoadingId?: string | null;
}

export const ErrorDrivesBox: React.FC<ErrorDrivesBoxProps> = ({
  errorDrives,
  onReauth,
  onMount,
  onDelete,
  onOpenLogs,
  onOpenTutorial,
  isActionLoadingId,
}) => {
  if (errorDrives.length === 0) return null;

  return (
    <section className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 sm:p-6 space-y-5">
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/60 dark:border-rose-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Drive Mati & Membutuhkan Pembaruan
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
                {errorDrives.length} Akun Bermasalah
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Drive berikut terputus karena kendala token atau perubahan kredensial. Anda dapat memperbarui otorisasi akun tanpa kehilangan pengaturan huruf drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-white/80 dark:bg-slate-900/80 hover:bg-rose-100 dark:hover:bg-rose-950 transition cursor-pointer"
            title="Buka log diagnostik sistem"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Lihat Log Detail</span>
          </button>
        </div>
      </div>

      {/* Grid of Error Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {errorDrives.map((drive) => {
          const isUnauthorizedClient =
            drive.errorMessage?.toLowerCase().includes('unauthorized_client') ||
            drive.errorMessage?.toLowerCase().includes('invalid_grant');
          const isWinFspError = drive.errorMessage?.toLowerCase().includes('winfsp');

          const displayName = drive.volumeLabel || drive.accountName || `GDrive_${drive.driveLetter.replace(':', '')}`;

          return (
            <div
              key={drive.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-300/80 dark:border-rose-800/60 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-mono font-bold text-base">
                      {drive.driveLetter}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {displayName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={drive.email}>
                        {drive.email}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    Mati / Error
                  </span>
                </div>

                {/* Diagnostic message box */}
                <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-xs space-y-2">
                  <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {isUnauthorizedClient
                      ? 'Kredensial OAuth Tidak Cocok (Unauthorized Client)'
                      : isWinFspError
                      ? 'Driver WinFsp Memerlukan Perhatian'
                      : 'Kendala Koneksi Google Drive'}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {isUnauthorizedClient ? (
                      <>
                        Token akun ini dibuat menggunakan <strong>Client ID Google OAuth sebelumnya</strong>. Karena kredensial di aplikasi telah diperbarui, Google mewajibkan akun ini untuk diotorisasi ulang agar cocok dengan Client ID aktif.
                      </>
                    ) : (
                      drive.errorMessage || 'Terjadi gangguan saat menghubungkan drive.'
                    )}
                  </p>

                  {isUnauthorizedClient && (
                    <div className="pt-1 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                      👉 <strong>Solusi:</strong> Klik tombol <strong>&quot;Perbarui Otorisasi (Update)&quot;</strong> di bawah untuk menautkan ulang akun secara instan dengan huruf drive <strong>{drive.driveLetter}</strong> tetap tersimpan!
                    </div>
                  )}

                  {isWinFspError && (
                    <button
                      type="button"
                      onClick={onOpenTutorial}
                      className="inline-flex items-center gap-1 font-semibold text-rose-800 dark:text-rose-300 hover:underline pt-0.5 cursor-pointer"
                    >
                      Buka panduan driver WinFsp <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Primary Update Button */}
                  <button
                    type="button"
                    onClick={() => onReauth(drive)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl shadow-xs transition cursor-pointer"
                    title="Perbarui izin token Google OAuth akun ini"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Perbarui Otorisasi (Update)</span>
                  </button>

                  {/* Retry mount */}
                  <button
                    type="button"
                    onClick={() => onMount(drive.id)}
                    disabled={isActionLoadingId === drive.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
                    title="Coba pasang ulang partisi drive"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Coba Mount</span>
                  </button>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDelete(drive.id)}
                  disabled={isActionLoadingId === drive.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                  title="Hapus akun dari daftar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
