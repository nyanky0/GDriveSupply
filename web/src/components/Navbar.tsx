import React from 'react';
import { BookOpen, KeyRound, Plus, RefreshCw, Power, ShieldCheck, Sun, Moon, Laptop, Shield, FileText } from 'lucide-react';
import { Logo } from './Logo';

export type ThemeMode = 'system' | 'dark' | 'light';

interface NavbarProps {
  onOpenTutorial: () => void;
  onOpenCredentials: () => void;
  onOpenAddDrive: () => void;
  onOpenShutdown: () => void;
  onOpenAntiBanned: () => void;
  onOpenSecurity: () => void;
  onOpenLegal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  credentialsConfigured: boolean;
  passwordEnabled: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTutorial,
  onOpenCredentials,
  onOpenAddDrive,
  onOpenShutdown,
  onOpenAntiBanned,
  onOpenSecurity,
  onOpenLegal,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Logo size={36} showText={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={`Mode Tampilan: ${theme} (Klik untuk ganti: Sistem / Gelap / Terang)`}
          >
            {renderThemeIcon()}
            <span className="capitalize hidden md:inline">{theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Security / Password Button */}
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

          {/* Anti-Banned Status Info */}
          <button
            type="button"
            onClick={onOpenAntiBanned}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            title="Pelajari mengapa GDrive Supply 100% Anti-Banned"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Anti-Banned</span>
          </button>

          {/* Panduan Setup */}
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {/* Legal / Kebijakan Privasi */}
          <button
            type="button"
            onClick={onOpenLegal}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Kebijakan Privasi & Ketentuan Layanan"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Legal</span>
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

          {/* Tambah Drive */}
          <button
            type="button"
            onClick={onOpenAddDrive}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Drive</span>
          </button>

          {/* Shutdown Button */}
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
