import React from 'react';
import { Database, HardDrive, CheckCircle2, AlertTriangle, Download, ExternalLink, BookOpen } from 'lucide-react';
import { formatBytes, calculatePercentage } from '../utils/format';
import type { SystemStatus } from '../types';

interface StorageOverviewProps {
  status: SystemStatus;
  onInstallWinFsp?: () => void;
  isInstallingWinFsp?: boolean;
  onOpenTutorial?: () => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  status,
  onInstallWinFsp,
  isInstallingWinFsp,
  onOpenTutorial,
}) => {
  const percentage = calculatePercentage(status.usedStorage, status.totalStorage);

  const getMeterColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-slate-900 dark:bg-slate-100';
  };

  return (
    <div className="space-y-4">
      {/* WinFsp Missing Banner */}
      {status.winfspInstalled === false && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                Driver WinFsp Belum Terpasang di Komputer
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 max-w-2xl leading-relaxed">
                Akun Google Drive Anda sudah berhasil tersambung! Namun, Windows File Explorer memerlukan driver <strong>WinFsp (Windows File System Proxy)</strong> agar drive dapat muncul sebagai partisi harddisk di <em>This PC</em>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            {onInstallWinFsp && (
              <button
                type="button"
                onClick={onInstallWinFsp}
                disabled={isInstallingWinFsp}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstallingWinFsp ? 'Membuka Installer...' : 'Download & Pasang WinFsp'}</span>
              </button>
            )}

            <a
              href="https://winfsp.dev/rel/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Situs Resmi winfsp.dev</span>
            </a>

            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Panduan</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Storage Bar */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Total Kapasitas Teragregasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Akumulasi kuota penyimpanan dari seluruh akun Google Drive yang terhubung.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Drive Aktif:</span>
              <strong className="font-semibold text-slate-900 dark:text-white">{status.activeDrivesCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tersedia:</span>
              <strong className="font-semibold text-slate-900 dark:text-white">{formatBytes(status.freeStorage)}</strong>
            </div>
          </div>
        </div>

        {/* Progress Bar Meter */}
        <div className="space-y-2">
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(percentage)}`}
              style={{ width: `${Math.max(percentage, status.totalStorage > 0 ? 2 : 0)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-1 font-mono">
            <span>
              Terpakai: <strong className="text-slate-900 dark:text-white font-semibold">{formatBytes(status.usedStorage)}</strong> ({percentage}%)
            </span>
            <span>
              Total: <strong className="text-slate-900 dark:text-white font-semibold">{formatBytes(status.totalStorage)}</strong>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
