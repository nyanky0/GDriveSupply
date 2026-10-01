import React from 'react';
import { FolderOpen, Play, Square, Trash2, AlertCircle, RefreshCw, ExternalLink, Pencil } from 'lucide-react';

import { formatBytes, calculatePercentage } from '../utils/format';
import type { DriveAccount } from '../types';

interface DriveCardProps {
  drive: DriveAccount;
  onMount: (id: string) => void;
  onUnmount: (id: string) => void;
  onOpenExplorer: (driveLetter: string) => void;
  onRename: (drive: DriveAccount) => void;
  onDelete: (id: string) => void;
  isActionLoading?: boolean;
}

export const DriveCard: React.FC<DriveCardProps> = ({
  drive,
  onMount,
  onUnmount,
  onOpenExplorer,
  onRename,
  onDelete,
  isActionLoading,
}) => {
  const percentage = calculatePercentage(drive.usedStorage, drive.totalStorage);
  const displayName = drive.volumeLabel || drive.accountName || `GDrive_${drive.driveLetter.replace(':', '')}`;

  const getStatusBadge = () => {
    switch (drive.status) {
      case 'mounted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terpasang
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
            Sinkronisasi
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Error
          </span>
        );
      case 'unmounted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Terputus
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div>
        {/* Header: Drive Letter, Name, Rename Button & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white font-mono font-bold text-lg tracking-wider">
              {drive.driveLetter}
            </div>
            <div>
              <div className="flex items-center gap-1.5 group">
                <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {displayName}
                </h3>
                <button
                  type="button"
                  onClick={() => onRename(drive)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Ubah nama drive di Windows File Explorer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5" title={drive.email}>
                {drive.email}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Error message if any */}
        {drive.status === 'error' && drive.errorMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              drive.errorMessage.toLowerCase().includes('winfsp')
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="leading-relaxed">{drive.errorMessage}</p>
              {drive.errorMessage.toLowerCase().includes('winfsp') && (
                <a
                  href="https://winfsp.dev/rel/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 hover:underline pt-0.5"
                >
                  Download WinFsp Installer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Storage Bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
            <span>Kapasitas:</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentage >= 90 ? 'bg-rose-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-slate-900 dark:bg-slate-200'
              }`}
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-0.5">
            <span>{formatBytes(drive.usedStorage)} terpakai</span>
            <span>{formatBytes(drive.totalStorage)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {drive.status === 'mounted' ? (
            <button
              type="button"
              onClick={() => onUnmount(drive.id)}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
              title="Lepas drive dari Windows Explorer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Unmount</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onMount(drive.id)}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 shadow-xs"
              title="Pasang drive ke Windows Explorer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mount</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenExplorer(drive.driveLetter)}
            disabled={drive.status !== 'mounted'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40"
            title="Buka drive di Windows File Explorer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Buka Explorer</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDelete(drive.id)}
          disabled={isActionLoading}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          title="Hapus akun dari daftar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
