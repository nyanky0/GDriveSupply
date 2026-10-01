import React, { useState } from 'react';
import { HardDrive, X, Loader2, Check, Sparkles } from 'lucide-react';
import type { DriveAccount } from '../types';

interface RenameDriveModalProps {
  isOpen: boolean;
  drive: DriveAccount | null;
  onClose: () => void;
  onRenamed: (updatedDrive: DriveAccount) => void;
}

export const RenameDriveModal: React.FC<RenameDriveModalProps> = ({
  isOpen,
  drive,
  onClose,
  onRenamed,
}) => {
  if (!isOpen || !drive) return null;

  const [name, setName] = useState(
    drive.volumeLabel || drive.accountName || `GDrive_${drive.driveLetter.replace(':', '')}`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/drives/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: drive.id, name: name.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Gagal mengubah nama drive' }));
        throw new Error(errData.error || 'Gagal mengubah nama drive');
      }

      const updated = await res.json();
      onRenamed(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Kustomisasi Nama Drive ({drive.driveLetter})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {drive.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama / Label Volume di Windows File Explorer
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Contoh: Work Drive (${drive.driveLetter})`}
              maxLength={32}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Nama ini akan langsung terlihat di <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">This PC ➔ {drive.driveLetter}</code>
            </p>
          </div>

          {drive.status === 'mounted' && (
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              ⚡ <strong>Auto-Remount Aktif:</strong> Saat disimpan, drive akan otomatis di-remount dalam ~1-2 detik agar nama baru langsung aktif di Windows Explorer tanpa perlu restart.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menerapkan...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Simpan & Terapkan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
