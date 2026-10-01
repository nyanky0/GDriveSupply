import React, { useState } from 'react';
import { X, KeyRound, Check, AlertCircle, Save } from 'lucide-react';
import type { GoogleCredential } from '../types';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: GoogleCredential;
  onSave: (clientId: string, clientSecret: string) => Promise<boolean>;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSave,
}) => {
  const [clientId, setClientId] = useState(credentials.clientId || '');
  const [clientSecret, setClientSecret] = useState(credentials.clientSecret || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const ok = await onSave(clientId.trim(), clientSecret.trim());
      if (ok) {
        setFeedback({ type: 'success', message: 'Kredensial Google OAuth berhasil disimpan!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: 'Gagal menyimpan kredensial.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Pengaturan Kredensial API</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Google OAuth 2.0 Client ID &amp; Secret</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Kredensial ini digunakan untuk menghubungkan akun Google Drive Anda. Kredensial dienkripsi dengan aman di harddisk lokal menggunakan Windows DPAPI.
          </p>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Google Client ID
            </label>
            <input
              type="text"
              required
              placeholder="xxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Google Client Secret
            </label>
            <input
              type="password"
              required
              placeholder="GOCSPX-xxxxxxxxxxxxxx"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Kredensial</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
