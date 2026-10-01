import { useState, useEffect, useCallback } from 'react';
import { Navbar, type ThemeMode } from './components/Navbar';
import { StorageOverview } from './components/StorageOverview';
import { DriveCard } from './components/DriveCard';
import { AddDriveModal } from './components/AddDriveModal';
import { TutorialModal } from './components/TutorialModal';
import { CredentialsModal } from './components/CredentialsModal';
import { RenameDriveModal } from './components/RenameDriveModal';
import { ShutdownModal } from './components/ShutdownModal';
import { AntiBannedModal } from './components/AntiBannedModal';
import { LockScreen } from './components/LockScreen';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { LegalModal } from './components/LegalModal';
import { LogsModal } from './components/LogsModal';
import { ErrorDrivesBox } from './components/ErrorDrivesBox';
import { DocsAndSolutions } from './components/DocsAndSolutions';
import { HardDrive, Plus, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DriveAccount, SystemStatus, GoogleCredential, AuthStatus } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'drives' | 'docs'>('drives');
  const [drives, setDrives] = useState<DriveAccount[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    totalStorage: 0,
    usedStorage: 0,
    freeStorage: 0,
    activeDrivesCount: 0,
    availableLetters: ['G:', 'H:', 'X:', 'Y:', 'Z:'],
  });
  const [credentials, setCredentials] = useState<GoogleCredential>({
    clientId: '',
    clientSecret: '',
    configured: false,
  });

  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    passwordEnabled: false,
    passwordConfigured: false,
    authenticated: true,
    failedAttempts: 0,
    maxAttempts: 5,
    remainingAttempts: 5,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isInstallingWinFsp, setIsInstallingWinFsp] = useState(false);

  // Theme Management (Default: system)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('gdrive_supply_theme') as ThemeMode;
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('gdrive_supply_theme', theme);

    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'system') return 'dark';
      if (prev === 'dark') return 'light';
      return 'system';
    });
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [renameTargetDrive, setRenameTargetDrive] = useState<DriveAccount | null>(null);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [isAntiBannedOpen, setIsAntiBannedOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data);
        return data;
      }
    } catch {
      // Offline preview
    }
    return null;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.status === 401) {
        // Auth required
        fetchAuthStatus();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDrives(data.drives || []);
        setSystemStatus(data.systemStatus || {
          totalStorage: 0,
          usedStorage: 0,
          freeStorage: 0,
          activeDrivesCount: 0,
          availableLetters: ['G:', 'H:', 'X:', 'Y:', 'Z:'],
        });
        setCredentials(data.credentials || { clientId: '', clientSecret: '', configured: false });
      }
    } catch {
      console.warn('Backend API currently unreachable, running in local preview mode.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchAuthStatus]);

  useEffect(() => {
    fetchAuthStatus();
    fetchStatus();
    // Auto poll status every 10 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAuthStatus, fetchStatus]);

  // Handle URL query parameters for OAuth success/error callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const msg = params.get('message');
    if (authParam === 'success') {
      showToast('Berhasil menghubungkan akun Google Drive!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchStatus();
    } else if (authParam === 'error') {
      showToast(msg || 'Gagal otorisasi akun Google.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchStatus]);

  const handleMount = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/drives/mount/${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('Drive berhasil dipasang ke Windows File Explorer.');
        await fetchStatus();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal memasang drive.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi backend API.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnmount = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/drives/unmount/${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('Drive berhasil dilepas.');
        await fetchStatus();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal melepas drive.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi backend API.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun drive ini dari daftar?')) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/drives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Akun drive berhasil dihapus.');
        await fetchStatus();
      } else {
        showToast('Gagal menghapus drive.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi backend API.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenExplorer = async (id: string) => {
    try {
      await fetch(`/api/drives/open/${id}`, { method: 'POST' });
    } catch {
      showToast('Gagal membuka Windows File Explorer', 'error');
    }
  };

  const handleSaveCredentials = async (clientId: string, clientSecret: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/config/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      if (res.ok) {
        showToast('Kredensial OAuth berhasil disimpan secara terenkripsi (DPAPI)!');
        setIsCredentialsModalOpen(false);
        await fetchStatus();
        return true;
      } else {
        showToast('Gagal menyimpan kredensial.', 'error');
        return false;
      }
    } catch {
      showToast('Gagal menghubungi backend API.', 'error');
      return false;
    }
  };

  const handleStartAuth = (letter: string, name: string) => {
    window.location.href = `/api/auth/start?letter=${encodeURIComponent(letter)}&name=${encodeURIComponent(name)}`;
  };

  const handleInstallWinFsp = async () => {
    setIsInstallingWinFsp(true);
    try {
      const res = await fetch('/api/winfsp/install', { method: 'POST' });
      if (res.ok) {
        showToast('Sedang menyiapkan installer WinFsp di Windows Anda...');
      } else {
        showToast('Gagal memicu pemasangan WinFsp.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi backend API.', 'error');
    } finally {
      setTimeout(() => setIsInstallingWinFsp(false), 3000);
    }
  };

  const handleDriveRenamed = (updated: DriveAccount) => {
    setDrives((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    showToast(`Nama drive berhasil diubah menjadi "${updated.volumeLabel || updated.accountName}"`);
    fetchStatus();
  };

  const handleReauth = (drive: DriveAccount) => {
    const letter = drive.driveLetter;
    const name = drive.volumeLabel || drive.accountName || 'Google Drive';
    const reauthId = drive.id;
    window.location.href = `/api/auth/start?letter=${encodeURIComponent(letter)}&name=${encodeURIComponent(name)}&reauth_id=${encodeURIComponent(reauthId)}`;
  };

  // Deterministic stable sorting by DriveLetter
  const sortedDrives = [...drives].sort((a, b) => a.driveLetter.localeCompare(b.driveLetter));
  const activeDrives = sortedDrives.filter((d) => d.status !== 'error');
  const errorDrives = sortedDrives.filter((d) => d.status === 'error');

  // If password lock is active and user is not authenticated
  const isLocked = authStatus.passwordEnabled && !authStatus.authenticated;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Lock Screen Overlay */}
      {isLocked && (
        <LockScreen
          authStatus={authStatus}
          onAuthenticated={() => {
            fetchAuthStatus();
            fetchStatus();
          }}
          onRefreshStatus={fetchAuthStatus}
        />
      )}

      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        drivesCount={drives.length}
        onOpenCredentials={() => setIsCredentialsModalOpen(true)}
        onOpenAddDrive={() => setIsAddModalOpen(true)}
        onOpenShutdown={() => setIsShutdownOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenLogs={() => setIsLogsModalOpen(true)}
        onRefresh={() => {
          setIsRefreshing(true);
          fetchStatus();
        }}
        isRefreshing={isRefreshing}
        credentialsConfigured={credentials.configured}
        passwordEnabled={authStatus.passwordEnabled}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                : 'bg-rose-900 text-white border-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {activeTab === 'drives' ? (
          <>
            {/* Storage Summary */}
            <StorageOverview
              status={systemStatus}
              onInstallWinFsp={handleInstallWinFsp}
              isInstallingWinFsp={isInstallingWinFsp}
              onOpenTutorial={() => setActiveTab('docs')}
            />

            {/* Section 1: Daftar Google Drive Terpasang (Aktif) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  Daftar Google Drive Terpasang (Aktif)
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {activeDrives.length} Akun Aktif
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : activeDrives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeDrives.map((drive) => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      onMount={handleMount}
                      onUnmount={handleUnmount}
                      onOpenExplorer={handleOpenExplorer}
                      onRename={(d) => setRenameTargetDrive(d)}
                      onDelete={handleDelete}
                      isActionLoading={actionLoadingId === drive.id}
                    />
                  ))}
                </div>
              ) : drives.length > 0 ? (
                <div className="p-6 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada drive aktif saat ini. Periksa daftar drive yang membutuhkan perhatian di bawah.
                </div>
              ) : null}
            </section>

            {/* Section 2: Box Khusus Drive Bermasalah / Mati */}
            <ErrorDrivesBox
              errorDrives={errorDrives}
              onReauth={handleReauth}
              onMount={handleMount}
              onDelete={handleDelete}
              onOpenLogs={() => setIsLogsModalOpen(true)}
              onOpenTutorial={() => setActiveTab('docs')}
              isActionLoadingId={actionLoadingId}
            />

            {/* Global Empty State (If absolutely no drives exist) */}
            {!isLoading && drives.length === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <HardDrive className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Belum Ada Drive Terpasang</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Hubungkan akun Google Drive Anda untuk menjadikannya partisi harddisk lokal di Windows File Explorer.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('docs')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Lihat Panduan Setup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Drive Pertama</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <DocsAndSolutions
            onOpenCredentials={() => setIsCredentialsModalOpen(true)}
            onOpenAddDrive={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GDrive Supply • Direct Client-to-Cloud Service • Zero-VPS Bandwidth</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors underline cursor-pointer"
            >
              Pusat Solusi &amp; Kebijakan Privasi
            </button>
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">• WinFsp Driver</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddDriveModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        availableLetters={systemStatus.availableLetters}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
        onStartAuth={handleStartAuth}
      />

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        redirectUri={`${window.location.origin}/api/auth/callback`}
      />

      <CredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        credentials={credentials}
        onSave={handleSaveCredentials}
      />

      <RenameDriveModal
        isOpen={!!renameTargetDrive}
        drive={renameTargetDrive}
        onClose={() => setRenameTargetDrive(null)}
        onRenamed={handleDriveRenamed}
      />

      <ShutdownModal
        isOpen={isShutdownOpen}
        onClose={() => setIsShutdownOpen(false)}
      />

      <AntiBannedModal
        isOpen={isAntiBannedOpen}
        onClose={() => setIsAntiBannedOpen(false)}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        authStatus={authStatus}
        onRefreshStatus={fetchAuthStatus}
        onShowToast={showToast}
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}

export default App;
