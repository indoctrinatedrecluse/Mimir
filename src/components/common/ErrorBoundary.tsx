import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mímir Sanctum Unhandled Rift:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handlePurgeAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `=== MÍMIR RUNIC DIAGNOSTIC DUMP ===\nTimestamp: ${new Date().toISOString()}\nError: ${error?.name}: ${error?.message}\n\nStack:\n${error?.stack || 'No stack trace'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'No component stack'}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, copied } = this.state;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a] text-slate-100 p-6 select-none font-sans">
          {/* Subtle cosmic vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative w-full max-w-2xl bg-[#090d14]/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6 text-left">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-red-500/20 pb-5">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-red-400 tracking-wider uppercase font-semibold">ᚦ Runic Anomaly Detected</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs text-slate-400 font-mono">Valhalla Sentinel</span>
                </div>
                <h1 className="text-xl font-bold text-slate-100 mt-1">A Rift Has Formed in Mímir's Loom</h1>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed">
              A runtime anomaly interrupted the sanctum initialization. The core engine prevented a total lockup and preserved your local vault data.
            </p>

            {/* Error Message Box */}
            <div className="bg-[#030508] border border-red-900/40 rounded-xl p-4 font-mono text-xs text-red-300 overflow-x-auto max-h-48 select-text">
              <div className="flex items-center gap-2 text-slate-400 mb-2 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-red-400" />
                <span>{error?.name || 'Error'}: {error?.message || 'Unknown runtime error'}</span>
              </div>
              {error?.stack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed mt-2 opacity-80">
                  {error.stack}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold tracking-wide transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reawaken Sanctum</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyError}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Inscription'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handlePurgeAndReload}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-900/50 text-xs font-medium transition-all cursor-pointer"
                title="Clears corrupted local workspace data and reloads clean"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Purge Cache & Reawaken</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
