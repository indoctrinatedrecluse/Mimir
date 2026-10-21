import React, { useState, useEffect } from 'react';
import { RealmId, Tab } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  X,
  Feather,
  RotateCcw,
  Compass,
} from 'lucide-react';

export interface Runestone {
  id: string;
  title: string;
  url: string;
  realm: RealmId;
  rune: string;
  dateAdded: string;
}

export interface FateThread {
  id: string;
  title: string;
  url: string;
  realm: RealmId;
  timestamp: string;
}

const DEFAULT_RUNESTONES: Runestone[] = [
  {
    id: 'rune-1',
    title: 'GitHub — The Forge of Open Source',
    url: 'https://github.com',
    realm: 'asgard',
    rune: 'ᚨ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-2',
    title: 'Rust Programming Language Lore',
    url: 'https://doc.rust-lang.org',
    realm: 'asgard',
    rune: 'ᚱ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-3',
    title: 'DuckDuckGo — Untracked Wisdom Search',
    url: 'https://duckduckgo.com',
    realm: 'midgard',
    rune: 'ᛗ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-4',
    title: 'Norse Mythology Eddas & Lore Archive',
    url: 'https://en.wikipedia.org/wiki/Poetic_Edda',
    realm: 'alfheim',
    rune: 'ᛞ',
    dateAdded: 'Dawn of Creation',
  },
];

interface MuninnVaultProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  currentTab?: Tab;
  onNavigate: (url: string) => void;
}

export const MuninnVault: React.FC<MuninnVaultProps> = ({
  isOpen,
  onClose,
  activeRealm,
  currentTab,
  onNavigate,
}) => {
  const [activeView, setActiveView] = useState<'runestones' | 'history'>('runestones');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRealmFilter, setSelectedRealmFilter] = useState<RealmId | 'all'>('all');

  const realm = REALMS[activeRealm];
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Runestones persistence
  const [runestones, setRunestones] = useState<Runestone[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_runestones');
      return saved ? JSON.parse(saved) : DEFAULT_RUNESTONES;
    } catch {
      return DEFAULT_RUNESTONES;
    }
  });

  // Fate Threads (History) persistence
  const [threads, setThreads] = useState<FateThread[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_fate_threads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save runestones
  useEffect(() => {
    try {
      localStorage.setItem('mimir_runestones', JSON.stringify(runestones));
    } catch (e) {
      console.error('Failed to save runestones', e);
    }
  }, [runestones]);

  // Record history when current tab changes
  useEffect(() => {
    if (currentTab && currentTab.url && currentTab.url !== 'mimir://newtab' && currentTab.url !== 'about:blank') {
      const newThread: FateThread = {
        id: `thread-${Date.now()}`,
        title: currentTab.title || currentTab.url,
        url: currentTab.url,
        realm: currentTab.realm || activeRealm,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads((prev) => {
        // Prevent immediate duplicates
        if (prev.length > 0 && prev[0].url === newThread.url) return prev;
        const updated = [newThread, ...prev.slice(0, 99)];
        try {
          localStorage.setItem('mimir_fate_threads', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [currentTab?.url, currentTab?.title]);

  const handleAddCurrentTab = () => {
    if (!currentTab || !currentTab.url || currentTab.url === 'mimir://newtab') return;
    runicAudio.playChime();

    const newRune: Runestone = {
      id: `rune-${Date.now()}`,
      title: currentTab.title || currentTab.url,
      url: currentTab.url,
      realm: activeRealm,
      rune: currentTab.rune || realm.rune,
      dateAdded: new Date().toLocaleDateString(),
    };

    setRunestones((prev) => [newRune, ...prev]);
  };

  const handleDeleteRunestone = (id: string) => {
    runicAudio.playClick(400);
    setRunestones((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearHistory = () => {
    runicAudio.playClick(350);
    setThreads([]);
    localStorage.removeItem('mimir_fate_threads');
  };

  const filteredRunestones = runestones.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.url.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRealm = selectedRealmFilter === 'all' || r.realm === selectedRealmFilter;
    return matchesSearch && matchesRealm;
  });

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.url.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRealm = selectedRealmFilter === 'all' || t.realm === selectedRealmFilter;
    return matchesSearch && matchesRealm;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 flex h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070b14]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            style={{
              borderColor: `${theme.accentColor}35`,
              boxShadow: `0 0 40px -10px ${theme.glowColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center space-x-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${theme.accentColor}60`,
                    backgroundColor: `${theme.accentColor}15`,
                    color: theme.accentColor,
                  }}
                >
                  <Feather className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">
                      MUNINN’S VAULT
                    </h2>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      MEMORY & RUNESTONES
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sacred archives of visited threads and carved runestones across the Nine Realms.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    runicAudio.playClick(600);
                    setActiveView('runestones');
                  }}
                  className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeView === 'runestones'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  style={{
                    color: activeView === 'runestones' ? theme.accentColor : undefined,
                  }}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>RUNESTONES ({runestones.length})</span>
                </button>

                <button
                  onClick={() => {
                    runicAudio.playClick(600);
                    setActiveView('history');
                  }}
                  className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeView === 'history'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  style={{
                    color: activeView === 'history' ? theme.accentColor : undefined,
                  }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>THREADS OF FATE ({threads.length})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {activeView === 'runestones' ? (
                  <button
                    onClick={handleAddCurrentTab}
                    disabled={!currentTab?.url || currentTab.url === 'mimir://newtab'}
                    className="flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: `${theme.accentColor}25`,
                      color: theme.accentColor,
                      border: `1px solid ${theme.accentColor}40`,
                    }}
                    title="Carve current tab into permanent Runestones"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Carve Tab</span>
                  </button>
                ) : (
                  <button
                    onClick={handleClearHistory}
                    disabled={threads.length === 0}
                    className="flex items-center space-x-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Sever Threads</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-2.5">
              <div className="relative flex flex-1 items-center max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
                <Search className="h-3.5 w-3.5 text-slate-500 mr-2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={`Search ${activeView}...`}
                  className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 outline-none"
                />
              </div>

              {/* Realm Selector Filter */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedRealmFilter('all')}
                  className={`rounded px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors ${
                    selectedRealmFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All Realms
                </button>
                {(Object.keys(REALMS) as RealmId[]).map((rId) => {
                  const r = REALMS[rId];
                  const isSelected = selectedRealmFilter === rId;
                  return (
                    <button
                      key={rId}
                      onClick={() => setSelectedRealmFilter(rId)}
                      className={`flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-mono transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span style={{ color: r.accentColor }}>{r.rune}</span>
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {activeView === 'runestones' ? (
                filteredRunestones.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500">
                    <Bookmark className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No runestones carved in this realm yet.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Navigate to any site and click "Carve Tab" to anchor it forever.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRunestones.map((runeItem) => {
                      const rConfig = REALMS[runeItem.realm] || REALMS.midgard;
                      return (
                        <div
                          key={runeItem.id}
                          className="group relative flex items-center justify-between rounded-xl border border-white/5 bg-[#090e1a]/80 p-3.5 hover:border-white/20 hover:bg-[#0d1527] transition-all shadow-md"
                        >
                          <div
                            onClick={() => {
                              runicAudio.playChime();
                              onNavigate(runeItem.url);
                              onClose();
                            }}
                            className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                          >
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-lg border font-black text-base shrink-0"
                              style={{
                                borderColor: `${rConfig.accentColor}50`,
                                backgroundColor: `${rConfig.accentColor}15`,
                                color: rConfig.accentColor,
                              }}
                            >
                              {runeItem.rune}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {runeItem.title}
                              </span>
                              <span className="truncate text-[10px] text-slate-500 font-mono">
                                {runeItem.url}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 ml-2">
                            <span
                              className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase"
                              style={{
                                backgroundColor: `${rConfig.accentColor}15`,
                                color: rConfig.accentColor,
                              }}
                            >
                              {rConfig.name}
                            </span>
                            <button
                              onClick={() => handleDeleteRunestone(runeItem.id)}
                              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Runestone"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : filteredThreads.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500">
                  <Clock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No threads woven in memory yet.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    As you voyage through the web, Muninn records every gateway you pass.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredThreads.map((thread) => {
                    const rConfig = REALMS[thread.realm] || REALMS.midgard;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => {
                          runicAudio.playChime();
                          onNavigate(thread.url);
                          onClose();
                        }}
                        className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/20 hover:bg-white/[0.05] transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <span
                            className="font-mono text-xs font-bold shrink-0"
                            style={{ color: rConfig.accentColor }}
                          >
                            {rConfig.rune}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-xs font-medium text-slate-200 group-hover:text-cyan-300">
                              {thread.title}
                            </span>
                            <span className="truncate text-[10px] text-slate-500 font-mono">
                              {thread.url}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono ml-3 shrink-0">
                          <span>{thread.timestamp}</span>
                          <span
                            className="rounded px-1.5 py-0.2 uppercase"
                            style={{ color: rConfig.accentColor }}
                          >
                            {rConfig.name}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
