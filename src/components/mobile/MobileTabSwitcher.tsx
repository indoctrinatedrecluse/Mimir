import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab, YggdrasilWorkspace } from '@/types';
import { Plus, X, Globe, Moon, Trash2, Search, AlertCircle } from 'lucide-react';
import { runicAudio } from '@/core/audio/runicAudio';

interface MobileTabSwitcherProps {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string;
  workspaces: YggdrasilWorkspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onClose: () => void;
}

interface SwitcherErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SwitcherErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void; onNewTab: () => void },
  SwitcherErrorBoundaryState
> {
  state: SwitcherErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): SwitcherErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MobileTabSwitcher internal disturbance caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070a]/98 p-6 text-center text-slate-100 select-none">
          <AlertCircle className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
          <h2 className="text-base font-bold font-mono tracking-wider text-cyan-300">
            ᛏ BRANCH WEAVE REALIGNED
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs font-mono">
            A temporary disturbance in tab synchronization was contained.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onNewTab();
                this.props.onClose();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-[#05070a] text-xs font-bold"
            >
              New Sanctuary
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MobileTabSwitcherContent: React.FC<MobileTabSwitcherProps> = ({
  isOpen,
  tabs,
  activeTabId,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const safeTabs = useMemo(() => (Array.isArray(tabs) ? tabs : []), [tabs]);
  const safeWorkspaces = useMemo(() => (Array.isArray(workspaces) ? workspaces : []), [workspaces]);

  const handlePurgeInactive = () => {
    runicAudio.playClick(400);
    safeTabs.forEach((t) => {
      if (t && t.id && t.id !== activeTabId) {
        onCloseTab(t.id);
      }
    });
  };

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return safeTabs;
    const q = searchQuery.toLowerCase().trim();
    return safeTabs.filter((t) => {
      if (!t) return false;
      const title = typeof t.title === 'string' ? t.title.toLowerCase() : '';
      const url = typeof t.url === 'string' ? t.url.toLowerCase() : '';
      const realm = typeof t.realm === 'string' ? t.realm.toLowerCase() : '';
      return title.includes(q) || url.includes(q) || realm.includes(q);
    });
  }, [safeTabs, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#05070a]/98 backdrop-blur-2xl text-slate-100 select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold text-sm tracking-widest">ᛏ YGGDRASIL BRANCHES</span>
          <span className="text-xs text-slate-500 font-mono">({safeTabs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {safeTabs.length > 1 && (
            <button
              type="button"
              onClick={handlePurgeInactive}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/80 text-xs font-semibold transition-colors"
              title="Purge inactive branches"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              runicAudio.playClick(600);
              onNewTab();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
          <button
            type="button"
            onClick={() => {
              runicAudio.playClick(400);
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Workspace Quick-Pills */}
      {safeWorkspaces.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
          {safeWorkspaces.map((ws) => {
            if (!ws || !ws.id) return null;
            const isActive = ws.id === activeWorkspaceId;
            const wsName = typeof ws.name === 'string' && ws.name.trim() ? ws.name.trim().split(' ')[0] : 'Branch';
            const wsColor = ws.color || '#38bdf8';
            const wsRune = ws.rune || 'ᛏ';
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => {
                  runicAudio.playClick(700);
                  onSelectWorkspace(ws.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white border font-bold shadow-md'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                style={{ borderColor: isActive ? wsColor : undefined }}
              >
                <span style={{ color: wsColor }}>{wsRune}</span>
                <span>{wsName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Search Filter */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches by title, URL or realm (ᛋ)..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-0.5 rounded text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tabs */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
        {filteredTabs.length === 0 && (
          <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center">
            <Search className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">
              {searchQuery ? `No branches match "${searchQuery}" (ᚺ)` : 'No open branches found'}
            </span>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 text-xs text-cyan-400 font-mono hover:underline"
              >
                Clear filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNewTab()}
                className="mt-3 px-3 py-1 text-xs text-cyan-400 font-mono hover:underline"
              >
                Open new tab
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {filteredTabs.map((tab) => {
            if (!tab || !tab.id) return null;
            const isActive = tab.id === activeTabId;
            const tabUrl = typeof tab.url === 'string' && tab.url ? tab.url : 'mimir://newtab';
            const tabTitle = typeof tab.title === 'string' && tab.title.trim() ? tab.title : 'Bifröst Portal';
            const tabRealm = typeof tab.realm === 'string' ? tab.realm : 'midgard';
            const isInternal = tabUrl.startsWith('mimir://') || tabUrl === 'about:blank';
            const displayHost = isInternal
              ? tabUrl === 'mimir://newtab'
                ? 'Bifröst Portal'
                : tabUrl
              : tabUrl.replace(/^https?:\/\//i, '');

            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.16 }}
                onClick={() => {
                  runicAudio.playClick(600);
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={`relative flex flex-col justify-between h-44 rounded-2xl p-3 border cursor-pointer select-none transition-all ${
                  isActive
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-cyan-400 shrink-0">
                      {isInternal ? 'ᛗ' : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {tabTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      runicAudio.playClick(450);
                      onCloseTab(tab.id);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 shrink-0 transition-colors"
                    title="Close tab"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Thumbnail / Preview */}
                <div className="flex-1 my-2 rounded-xl bg-[#030508] border border-slate-800/40 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-full">
                    {displayHost}
                  </span>
                  {tab.isSleeping && (
                    <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono">
                      <Moon className="w-2.5 h-2.5" />
                      <span>Slumber</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Realm Badge */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="capitalize">{tabRealm}</span>
                  {isActive ? (
                    <span className="text-cyan-400 font-bold">Active</span>
                  ) : (
                    <span className="text-slate-600 hover:text-red-400 text-[10px] transition-colors">
                      Tap to switch
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Floating Bar */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            runicAudio.playChime();
            onNewTab();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#05070a] font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Sanctuary Branch</span>
        </button>
      </div>
    </div>
  );
};

export const MobileTabSwitcher: React.FC<MobileTabSwitcherProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <SwitcherErrorBoundary onClose={props.onClose} onNewTab={props.onNewTab}>
      <MobileTabSwitcherContent {...props} />
    </SwitcherErrorBoundary>
  );
};

