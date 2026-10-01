import React, { useState } from 'react';
import { X, FileCode, FormInput, UploadCloud, CheckCircle2, AlertCircle, HardDrive, KeyRound } from 'lucide-react';
import type { GoogleCredential } from '../types';

interface AddDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLetters: string[];
  credentials: GoogleCredential;
  onSaveCredentials: (clientId: string, clientSecret: string) => Promise<boolean>;
  onStartAuth: (driveLetter: string, accountName: string) => void;
}

export const AddDriveModal: React.FC<AddDriveModalProps> = ({
  isOpen,
  onClose,
  availableLetters,
  credentials,
  onSaveCredentials,
  onStartAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [accountName, setAccountName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState(availableLetters[0] || 'G:');
  const [clientId, setClientId] = useState(credentials.clientId || '');
  const [clientSecret, setClientSecret] = useState(credentials.clientSecret || '');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle credentials.json file upload / drop
  const handleFileUpload = (file: File) => {
    setJsonError(null);
    setJsonSuccess(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const creds = parsed.installed || parsed.web;
        if (!creds || !creds.client_id || !creds.client_secret) {
          throw new Error('Format credentials.json tidak valid. Pastikan berisi "client_id" dan "client_secret".');
        }
        setClientId(creds.client_id);
        setClientSecret(creds.client_secret);
        setJsonSuccess(`Berhasil membaca kredensial! Client ID: ${creds.client_id.substring(0, 15)}...`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal membaca file JSON.';
        setJsonError(msg);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Save credentials first if provided or changed
      if (clientId && clientSecret) {
        const ok = await onSaveCredentials(clientId.trim(), clientSecret.trim());
        if (!ok) {
          setIsSubmitting(false);
          return;
        }
      }
      // Start Google OAuth flow with target drive letter and account name
      onStartAuth(selectedLetter, accountName || 'Google Drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Tambah Akun Google Drive</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pasang drive baru ke Windows File Explorer</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Drive Letter & Account Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Huruf Drive (Drive Letter)
              </label>
              <select
                value={selectedLetter}
                onChange={(e) => setSelectedLetter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                required
              >
                {availableLetters.map((letter) => (
                  <option key={letter} value={letter}>
                    Drive {letter} (Tersedia)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Label Akun / Nama Drive
              </label>
              <input
                type="text"
                placeholder="Contoh: Kerja, Arsip, Personal"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Credentials Section with Tabs */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Kredensial Google OAuth 2.0
              </span>

              {/* Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'form' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FormInput className="w-3 h-3" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'json' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  Upload JSON
                </button>
              </div>
            </div>

            {/* Tab 1: Form Manual */}
            {activeTab === 'form' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    required={!credentials.configured}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="GOCSPX-xxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    required={!credentials.configured}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Drag & Drop JSON */}
            {activeTab === 'json' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-colors"
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />
                <UploadCloud className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Tarik & lepas file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">credentials.json</code> ke sini
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">atau klik untuk memilih file dari komputer</p>

                {jsonSuccess && (
                  <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{jsonSuccess}</span>
                  </div>
                )}

                {jsonError && (
                  <div className="mt-3 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <span>Sambungkan ke Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
