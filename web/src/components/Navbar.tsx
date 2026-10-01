import React from 'react';
import {
  BookOpen,
  KeyRound,
  Plus,
  RefreshCw,
  Power,
  Sun,
  Moon,
  Laptop,
  Shield,
  Terminal,
  HardDrive,
} from 'lucide-react';
import { Logo } from './Logo';

export type ThemeMode = 'system' | 'dark' | 'light';

interface NavbarProps {
  activeTab: 'drives' | 'docs';
  onSelectTab: (tab: 'drives' | 'docs') => void;
  drivesCount: number;
  onOpenCredentials: () => void;
  onOpenAddDrive: () => void;
  onOpenShutdown: () => void;
  onOpenSecurity: () => void;
  onOpenLogs: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  credentialsConfigured: boolean;
  passwordEnabled: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  drivesCount,
  onOpenCredentials,
  onOpenAddDrive,
  onOpenShutdown,
  onOpenSecurity,
  onOpenLogs,
  onRefresh,
  isRefreshing,
  credentialsConfigured,
  passwordEnabled,
  theme,
  onToggleTheme,
}) => {
  const renderThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4 text-purple-400" />;
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'system':
      default:
        return <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tab Navigation */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Logo size={34} showText={true} />

          {/* Primary View Tab Bar */}
          <nav
            role="tablist"
            className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drives'}
              onClick={() => onSelectTab('drives')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'drives'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Drive Terpasang</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200/80 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300">
                {drivesCount}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'docs'}
              onClick={() => onSelectTab('docs')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Dokumentasi &amp; Solusi</span>
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={`Mode Tampilan: ${theme} (Klik untuk ganti: Sistem / Gelap / Terang)`}
          >
            {renderThemeIcon()}
            <span className="capitalize hidden xl:inline">
              {theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Refresh Status */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Security / Master Password */}
          <button
            type="button"
            onClick={onOpenSecurity}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              passwordEnabled
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
            title="Keamanan & Master Password"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{passwordEnabled ? 'Terkunci' : 'Keamanan'}</span>
          </button>

          {/* Diagnostic Logs */}
          <button
            type="button"
            onClick={onOpenLogs}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Lihat Log Diagnostik & Aktivitas Sistem"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Log</span>
          </button>

          {/* Kredensial API */}
          <button
            type="button"
            onClick={onOpenCredentials}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              credentialsConfigured
                ? 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                : 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-300 dark:border-amber-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Kredensial</span>
            {!credentialsConfigured && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Tambah Drive Primary CTA */}
          <button
            type="button"
            onClick={onOpenAddDrive}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-semibold">Tambah Drive</span>
          </button>

          {/* Shutdown Power Button */}
          <button
            type="button"
            onClick={onOpenShutdown}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
            title="Matikan Layanan GDrive Supply"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
