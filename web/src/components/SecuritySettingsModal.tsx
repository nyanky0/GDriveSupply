import React, { useState } from 'react';
import { X, Shield, ShieldCheck, ShieldAlert, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react';

import type { AuthStatus } from '../types';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authStatus: AuthStatus;
  onRefreshStatus: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  authStatus,
  onRefreshStatus,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'toggle' | 'change' | 'emailer'>('toggle');

  // Toggle State
  const [togglePassword, setTogglePassword] = useState('');
  const [toggleConfirmPassword, setToggleConfirmPassword] = useState('');
  const [showTogglePassword, setShowTogglePassword] = useState(false);
  const [isTogglingLoading, setIsTogglingLoading] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingLoading, setIsChangingLoading] = useState(false);
  const [changeErrorMessage, setChangeErrorMessage] = useState<string | null>(null);

  // Complexity logic for Toggle Form
  const toggleHasMin = togglePassword.length >= 8;
  const toggleHasUpper = /[A-Z]/.test(togglePassword);
  const toggleHasLower = /[a-z]/.test(togglePassword);
  const toggleHasDigit = /[0-9]/.test(togglePassword);
  const toggleHasSpecial = /[^A-Za-z0-9]/.test(togglePassword);
  const isToggleComplexityValid = toggleHasMin && toggleHasUpper && toggleHasLower && toggleHasDigit && toggleHasSpecial;
  const isToggleConfirmMatch = togglePassword === toggleConfirmPassword && toggleConfirmPassword.length > 0;

  // Complexity logic for Change Form
  const changeHasMin = newPassword.length >= 8;
  const changeHasUpper = /[A-Z]/.test(newPassword);
  const changeHasLower = /[a-z]/.test(newPassword);
  const changeHasDigit = /[0-9]/.test(newPassword);
  const changeHasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isChangeComplexityValid = changeHasMin && changeHasUpper && changeHasLower && changeHasDigit && changeHasSpecial;
  const isChangeConfirmMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;

  if (!isOpen) return null;

  const handleToggleOff = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan proteksi password master? Seluruh hash password akan dihapus permanen dari sistem dan aplikasi dapat diakses tanpa login.')) {
      return;
    }

    setIsTogglingLoading(true);
    try {
      const res = await fetch('/api/auth/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Proteksi password berhasil dinonaktifkan.');
        onRefreshStatus();
      } else {
        onShowToast(data.error || 'Gagal menonaktifkan password', 'error');
      }
    } catch {
      onShowToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsTogglingLoading(false);
    }
  };

  const handleToggleOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isToggleComplexityValid || !isToggleConfirmMatch) return;

    setIsTogglingLoading(true);
    try {
      const res = await fetch('/api/auth/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          password: togglePassword,
          confirmPassword: toggleConfirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast('Proteksi password master aktif.');
        setTogglePassword('');
        setToggleConfirmPassword('');
        onRefreshStatus();
      } else {
        onShowToast(data.error || 'Gagal mengaktifkan password', 'error');
      }
    } catch {
      onShowToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsTogglingLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !isChangeComplexityValid || !isChangeConfirmMatch) return;

    setIsChangingLoading(true);
    setChangeErrorMessage(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (res.status === 403 || data.status === 'factory_reset') {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        setChangeErrorMessage(data.error || 'Gagal mengubah password');
        onRefreshStatus();
        return;
      }

      onShowToast('Password master berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onRefreshStatus();
      setActiveTab('toggle');
    } catch {
      setChangeErrorMessage('Terjadi gangguan jaringan saat mengubah password.');
    } finally {
      setIsChangingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Keamanan & Password Master
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengaturan kunci akses web, session lock, dan kill switch
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('toggle')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'toggle'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Status Proteksi
          </button>
          {authStatus.passwordEnabled && (
            <button
              type="button"
              onClick={() => setActiveTab('change')}
              className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'change'
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Ubah Password
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('emailer')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'emailer'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Security Emailer (Rekomendasi)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'toggle' && (
            <div className="space-y-6">
              {/* Current Status Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${authStatus.passwordEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {authStatus.passwordEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {authStatus.passwordEnabled ? 'Proteksi Password Aktif' : 'Proteksi Password Nonaktif'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {authStatus.passwordEnabled
                        ? 'Web terkunci dengan master password & sesi browser terlindungi.'
                        : 'Web dapat diakses langsung dari browser tanpa kata sandi.'}
                    </div>
                  </div>
                </div>

                {authStatus.passwordEnabled && (
                  <button
                    type="button"
                    onClick={handleToggleOff}
                    disabled={isTogglingLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Nonaktifkan
                  </button>
                )}
              </div>

              {/* Turning ON Form */}
              {!authStatus.passwordEnabled && (
                <form onSubmit={handleToggleOn} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Aktifkan Proteksi Password Baru
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showTogglePassword ? 'text' : 'password'}
                        value={togglePassword}
                        onChange={(e) => setTogglePassword(e.target.value)}
                        placeholder="Minimal 8 karakter (huruf besar, kecil, angka, simbol)"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTogglePassword(!showTogglePassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showTogglePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type={showTogglePassword ? 'text' : 'password'}
                      value={toggleConfirmPassword}
                      onChange={(e) => setToggleConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru..."
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  {/* Complexity Checklist */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <span className={`flex items-center gap-1.5 ${toggleHasMin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Min. 8 Karakter
                    </span>
                    <span className={`flex items-center gap-1.5 ${toggleHasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Besar (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${toggleHasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Kecil (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${toggleHasDigit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Angka (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 col-span-2 ${toggleHasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Simbol Khusus (!@#$%^&*...)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isTogglingLoading || !isToggleComplexityValid || !isToggleConfirmMatch}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isTogglingLoading ? 'Menyimpan...' : 'Simpan & Aktifkan Proteksi'}
                  </button>
                </form>
              )}

              {/* Zero-Storage Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300">Prinsip Zero-Residual Storage:</strong>
                {' '}Saat proteksi dimatikan, hash password dan data otentikasi akan langsung dihapus bersih dari disk. Kami tidak menyimpan sisa hash enkripsi saat fitur nonaktif.
              </div>
            </div>
          )}

          {activeTab === 'change' && authStatus.passwordEnabled && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {changeErrorMessage && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 font-medium">
                  {changeErrorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Masukkan password master saat ini"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Password baru yang kuat..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="Ketik ulang password baru..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                />
              </div>

              {/* Complexity Checklist */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                <span className={`flex items-center gap-1.5 ${changeHasMin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Min. 8 Karakter
                </span>
                <span className={`flex items-center gap-1.5 ${changeHasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Besar (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 ${changeHasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Huruf Kecil (a-z)
                </span>
                <span className={`flex items-center gap-1.5 ${changeHasDigit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Angka (0-9)
                </span>
                <span className={`flex items-center gap-1.5 col-span-2 ${changeHasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Simbol Khusus (!@#$%^&*...)
                </span>
              </div>

              <button
                type="submit"
                disabled={isChangingLoading || !oldPassword || !isChangeComplexityValid || !isChangeConfirmMatch}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {isChangingLoading ? 'Menyimpan Perubahan...' : 'Perbarui Password Master'}
              </button>
            </form>
          )}

          {activeTab === 'emailer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">
                  <Mail className="w-4 h-4" />
                  Arsitektur Security Emailer
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  Fitur notifikasi darurat ini dirancang untuk mengirimkan peringatan instan ke email Anda saat terjadi aktivitas mencurigakan pada GDrive Supply.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <strong className="text-slate-900 dark:text-white block mb-1">1. Skenario Pemicu Notifikasi:</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                    <li><strong>3x Percobaan Password Salah:</strong> Peringatan dini sebelum Kill Switch aktif.</li>
                    <li><strong>5x Salah (Emergency Wipe Triggered):</strong> Notifikasi bahwa seluruh kredensial lokal baru saja dihapus demi perlindungan akun.</li>
                    <li><strong>Pemasangan Akun / Drive Baru:</strong> Konfirmasi setiap ada akun Google baru yang dikaitkan ke sistem.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <strong className="text-slate-900 dark:text-white block mb-1">2. Pilihan Transport (Zero Third-Party Leaks):</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                    <li><strong>Native Gmail OAuth Send:</strong> Memanfaatkan token Google Drive yang sudah ada dengan menambahkan scope <code>gmail.send</code> tanpa perlu memasukkan password email tambahan.</li>
                    <li><strong>Custom SMTP (App Password):</strong> Konfigurasi SMTP langsung dari server lokal Anda ke penyedia email pilihan.</li>
                    <li><strong>Webhook / Push Notification:</strong> Dukungan Telegram / Discord Webhook untuk notifikasi instan langsung ke HP Anda.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
