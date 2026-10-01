import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Terminal, Download, Copy, Trash2, RefreshCw, Search, Check, Play, Pause } from 'lucide-react';
import type { LogEntry } from '../types';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState(5000);
  const [logPath, setLogPath] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '2000');
      if (levelFilter !== 'ALL') params.set('level', levelFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.entries || []);
        if (data.maxCapacity) setTotalCapacity(data.maxCapacity);
        if (data.logFilePath) setLogPath(data.logFilePath);
      }
    } catch {
      // Ignore network hiccup
    } finally {
      setIsLoading(false);
    }
  }, [levelFilter, searchQuery]);

  // Initial and periodic fetch when open
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetchLogs();

    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, fetchLogs]);

  // Auto scroll to bottom if user is at bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If within 40px of bottom, stick to bottom
    shouldAutoScrollRef.current = scrollHeight - (scrollTop + clientHeight) < 40;
  };

  const handleCopy = () => {
    const rawText = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] [${l.module}] ${l.message}`
      )
      .join('\n');

    navigator.clipboard.writeText(rawText);
    setIsCopied(true);
    onShowToast(`Berhasil menyalin ${logs.length} baris log ke clipboard.`);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleClear = async () => {
    if (!window.confirm('Bersihkan seluruh buffer catatan log di memori dan disk?')) return;
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        onShowToast('Buffer log berhasil dibersihkan.');
        fetchLogs();
      }
    } catch {
      onShowToast('Gagal membersihkan log.', 'error');
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    } catch {
      return ts;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Log Diagnostik & Aktivitas Sistem
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-medium">
                  {logs.length} / {totalCapacity} baris
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md hidden sm:block">
                {logPath ? `Tersimpan di: ${logPath}` : 'Pencatatan real-time proses mount, kernel WinFsp, dan VFS'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={autoRefresh ? 'Jeda pembaruan otomatis' : 'Mulai pembaruan otomatis (Live)'}
            >
              {autoRefresh ? <Pause className="w-3.5 h-3.5 text-emerald-500" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{autoRefresh ? 'Live Tail' : 'Paused'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                fetchLogs();
              }}
              disabled={isLoading}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Perbarui Log Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Salin semua log ke clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCopied ? 'Tersalin!' : 'Salin'}</span>
            </button>

            {/* Download Button */}
            <a
              href="/api/logs/download"
              download="gdrive_supply.log"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Unduh file log mentah (.log)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </a>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
              title="Bersihkan Buffer Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="p-3 sm:px-6 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {lvl === 'ALL' ? 'SEMUA' : lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci log..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Terminal Window */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-4 sm:p-5 flex-1 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-200 space-y-1 select-text selection:bg-purple-900 selection:text-white min-h-[350px]"
        >
          {logs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <span>Tidak ada catatan log yang cocok dengan filter.</span>
            </div>
          ) : (
            logs.map((log) => {
              const levelColor =
                log.level === 'ERROR'
                  ? 'text-red-400 bg-red-950/60 border-red-800/60'
                  : log.level === 'WARN'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                  : log.level === 'DEBUG'
                  ? 'text-sky-400 bg-sky-950/60 border-sky-800/60'
                  : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-0.5 leading-relaxed hover:bg-slate-900/90 rounded px-1.5 transition-colors font-mono"
                >
                  {/* Timestamp */}
                  <span className="text-slate-500 shrink-0 select-none text-[11px]">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* Level Badge */}
                  <span
                    className={`shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded border ${levelColor}`}
                  >
                    {log.level}
                  </span>

                  {/* Module Tag */}
                  <span className="text-purple-400 shrink-0 font-semibold text-[11px]">
                    [{log.module}]
                  </span>

                  {/* Message */}
                  <span
                    className={`break-all ${
                      log.level === 'ERROR'
                        ? 'text-red-300 font-semibold'
                        : log.level === 'WARN'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Menampilkan {logs.length} entri riwayat</span>
          <span className="font-mono text-slate-500">Auto-tail: {autoRefresh ? 'Aktif' : 'Mati'}</span>
        </div>
      </div>
    </div>
  );
};
