import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, XCircle, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { Logo } from './Logo';
import type { AuthStatus } from '../types';

interface LockScreenProps {
  authStatus: AuthStatus;
  onAuthenticated: () => void;
  onRefreshStatus: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  authStatus,
  onAuthenticated,
  onRefreshStatus,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [factoryResetOccurred, setFactoryResetOccurred] = useState(false);

  // Password complexity checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isComplexityValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
  const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.status === 403 || data.status === 'factory_reset') {
        setFactoryResetOccurred(true);
        setErrorMessage(data.message || '5 kali salah password berturut-turut. Sistem telah melakukan reset darurat ke kondisi pabrik.');
        onRefreshStatus();
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.message || 'Password salah.');
        onRefreshStatus();
        return;
      }

      setPassword('');
      onAuthenticated();
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat memverifikasi password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplexityValid || !isConfirmValid) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal menyimpan password master.');
        return;
      }

      setPassword('');
      setConfirmPassword('');
      onAuthenticated();
    } catch {
      setErrorMessage('Gagal menghubungi server untuk mendaftarkan password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (factoryResetOccurred) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-500/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Reset Darurat Berhasil Dijalankan
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Aplikasi mendeteksi 5 kali percobaan password yang salah secara berturut-turut. Seluruh kredensial lokal, drive yang terhubung, dan konfigurasi telah dihapus bersih demi menjaga keamanan akun Google Drive Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setFactoryResetOccurred(false);
              setErrorMessage(null);
              window.location.reload();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }

  const isSetupMode = !authStatus.passwordConfigured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={48} showText={false} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
            GDrive Supply
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSetupMode ? 'Konfigurasi Password Master Awal' : 'Akses Terkunci — Masukkan Password Master'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Failure Warning Meter */}
        {!isSetupMode && authStatus.failedAttempts > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Percobaan tersisa: {authStatus.remainingAttempts} dari {authStatus.maxAttempts}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
              Darurat pada 5x
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={isSetupMode ? handleSetup : handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {isSetupMode ? 'Password Master Baru' : 'Password Master'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Setup Mode Additional Confirm Input */}
          {isSetupMode && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Konfirmasi Password Master
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ketik ulang password baru..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                />
              </div>

              {/* Realtime Complexity Criteria */}
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kriteria Keamanan Password:
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Min. 8 Karakter
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Besar (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Kecil (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Angka (0-9)
                  </span>
                  <span className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Simbol Khusus (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Kill Switch Security Notice */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pemberitahuan Keamanan:</span> 
            {' '}Aplikasi ini dilengkapi <strong>Kill Switch</strong> otomatis. Jika salah memasukkan password sebanyak 5 kali berturut-turut, semua drive akan langsung di-unmount dan seluruh kredensial lokal akan dihapus permanen.
          </div>

          <button
            type="submit"
            disabled={isLoading || (isSetupMode && (!isComplexityValid || !isConfirmValid))}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{isSetupMode ? 'Simpan & Aktifkan Password' : 'Buka Kunci Aplikasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
