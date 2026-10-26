import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Moon,
  Sun,
  X,
  Search,
  RefreshCw,
  Trash2,
  Zap,
  HardDrive,
  ShieldAlert,
  Sliders,
  Volume2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Tab } from '@/types';
import { heimdallWatch } from '@/core/system/heimdallWatchManager';
import { SystemTelemetryPayload, ProcessItem } from '@/core/ipc/bridge';
import { slumberEngine } from '@/core/tabs/slumberEngine';
import { workspaceManager } from '@/core/workspaces/workspaceManager';

interface HeimdallsWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onHibernateTab: (tab: Tab) => void;
  onAwakenTab: (tab: Tab) => void;
  onHibernateAllBackgroundTabs: () => void;
}

type ViewMode = 'tabs' | 'processes';

export const HeimdallsWatchModal: React.FC<HeimdallsWatchModalProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onHibernateTab,
  onAwakenTab,
  onHibernateAllBackgroundTabs,
}) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetryPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [searchQuery, setSearchQuery] = useState('');
  const [reclaimNotice, setReclaimNotice] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const unsubTelem = heimdallWatch.subscribe((telem) => {
      setTelemetry(telem);
    });

    const unsubReclaim = heimdallWatch.onReclaim((bytes) => {
      setReclaimNotice(`Reclaimed ${heimdallWatch.formatBytes(bytes)} from system working sets!`);
      setIsPurging(false);
      setTimeout(() => {
        setReclaimNotice(null);
      }, 4000);
    });

    return () => {
      unsubTelem();
      unsubReclaim();
    };
  }, [isOpen]);

  // Keyboard shortcut: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Purge Working Sets
  const handlePurge = () => {
    setIsPurging(true);
    heimdallWatch.purgeWorkingSets();
  };

  // Tab stats
  const totalTabs = tabs.length;
  const sleepingTabs = tabs.filter((t) => t.isSleeping).length;
  const activeTabs = totalTabs - sleepingTabs;

  // Estimated memory saved by slumbering tabs
  const estimatedSavingsMb = useMemo(() => {
    return tabs
      .filter((t) => t.isSleeping)
      .reduce((sum, t) => sum + slumberEngine.estimateTabMemoryMb(t), 0);
  }, [tabs]);

  // Filter tabs
  const filteredTabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tabs;
    return tabs.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.url.toLowerCase().includes(q) ||
        t.realm.toLowerCase().includes(q) ||
        (t.workspaceId && workspaceManager.getWorkspace(t.workspaceId)?.name.toLowerCase().includes(q))
    );
  }, [tabs, searchQuery]);

  // Filter native processes
  const filteredProcesses = useMemo(() => {
    if (!telemetry?.processes) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return telemetry.processes;
    return telemetry.processes.filter(
      (p) =>
        p.pid.toString().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    );
  }, [telemetry, searchQuery]);

  if (!isOpen) return null;

  const mimirRamBytes = telemetry?.total_mimir_memory_bytes || 240 * 1024 * 1024;
  const systemRamBytes = telemetry?.total_system_ram_bytes || 16 * 1024 * 1024 * 1024;
  const availRamBytes = telemetry?.available_system_ram_bytes || 8 * 1024 * 1024 * 1024;
  const ramLoadPercent = telemetry?.memory_load_percent || 50;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[86vh] flex flex-col rounded-2xl bg-[#080c14]/95 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100 overflow-hidden font-sans"
        role="dialog"
        aria-label="Heimdall's Watch Resource Manager"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-black/40 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="font-serif font-black text-xl leading-none">ᚺ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-amber-200 uppercase flex items-center gap-2">
                  Heimdall’s Watch
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono lowercase">
                    sovereign-task-mgr
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                All-seeing vigilance over Mímir core threads, WebView2 conduits, and memory realms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1 text-xs">
              <button
                onClick={() => setViewMode('tabs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'tabs'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tabs & Realms ({tabs.length})</span>
              </button>
              <button
                onClick={() => setViewMode('processes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'processes'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>OS Processes ({telemetry?.processes.length || 1})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close Heimdall's Watch (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-white/5 bg-black/20">
          {/* Card 1: Total Mímir Footprint */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-amber-500/20 shadow-inner">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Mímir Footprint
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {heimdallWatch.formatBytes(mimirRamBytes)}
              </div>
              <div className="text-[10px] text-slate-500">
                Core + {telemetry?.child_process_count || 1} WebViews
              </div>
            </div>
          </div>

          {/* Card 2: System RAM Load */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-cyan-500/20 shadow-inner">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                System RAM Load
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                {ramLoadPercent}%
                <span className="text-xs font-normal text-slate-400">
                  ({heimdallWatch.formatBytes(systemRamBytes - availRamBytes)} / {heimdallWatch.formatBytes(systemRamBytes)})
                </span>
              </div>
              <div className="text-[10px] text-emerald-400">
                {heimdallWatch.formatBytes(availRamBytes)} free
              </div>
            </div>
          </div>

          {/* Card 3: Einherjar Slumber Reclaimed */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-emerald-500/20 shadow-inner">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Slumber Preserved
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                ~{estimatedSavingsMb} MB
              </div>
              <div className="text-[10px] text-slate-400">
                {sleepingTabs} of {totalTabs} tabs slumbering
              </div>
            </div>
          </div>

          {/* Card 4: Sovereign Actions */}
          <div className="flex flex-col justify-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <button
              onClick={handlePurge}
              disabled={isPurging}
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-700/20 hover:from-amber-600/50 hover:to-amber-700/40 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
              title="Force Windows OS to trim and flush working sets across Mímir and all WebViews"
            >
              <Zap className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
              <span>{isPurging ? 'Purging...' : 'Purge Working Sets'}</span>
            </button>

            <button
              onClick={() => {
                onHibernateAllBackgroundTabs();
                setTimeout(() => heimdallWatch.refresh(), 300);
              }}
              disabled={activeTabs <= 1}
              className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs transition-all disabled:opacity-40"
              title="Cast all inactive background tabs into Einherjar Slumber immediately"
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Slumber Inactive Tabs</span>
            </button>
          </div>
        </div>

        {/* Reclaim Notification Alert */}
        {reclaimNotice && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{reclaimNotice}</span>
            </div>
            <button
              onClick={() => setReclaimNotice(null)}
              className="text-emerald-400/60 hover:text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === 'tabs'
                  ? 'Filter by tab title, URL, realm, or workspace...'
                  : 'Filter by PID, process name, or role...'
              }
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => heimdallWatch.refresh()}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <span className="text-slate-600">|</span>
            <span>
              Showing{' '}
              <strong className="text-white">
                {viewMode === 'tabs' ? filteredTabs.length : filteredProcesses.length}
              </strong>{' '}
              entries
            </span>
          </div>
        </div>

        {/* Content Table / List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-white/10">
          {viewMode === 'tabs' ? (
            /* Tab View */
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2 border-b border-white/10">
                <span className="col-span-6">Tab / Conduit</span>
                <span className="col-span-2 text-center">Realm / Branch</span>
                <span className="col-span-2 text-center">Status / Memory</span>
                <span className="col-span-2 text-right">Sovereign Action</span>
              </div>

              {filteredTabs.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No tabs match "{searchQuery}"
                </div>
              ) : (
                filteredTabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  const isSleeping = tab.isSleeping;
                  const estimatedMb = slumberEngine.estimateTabMemoryMb(tab);
                  const ws = tab.workspaceId ? workspaceManager.getWorkspace(tab.workspaceId) : null;

                  return (
                    <div
                      key={tab.id}
                      className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : isSleeping
                          ? 'bg-purple-950/20 border-purple-800/30 text-slate-400'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Column 1: Title, URL, Favicon */}
                      <div className="col-span-6 flex items-center gap-3 min-w-0 pr-4">
                        <div
                          className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                          onClick={() => {
                            onSwitchTab(tab.id);
                            onClose();
                          }}
                        >
                          {tab.favicon ? (
                            <img src={tab.favicon} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <span className="font-serif text-xs text-amber-400 font-bold">ᛗ</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            onClick={() => {
                              onSwitchTab(tab.id);
                              onClose();
                            }}
                            className="text-sm font-medium text-slate-200 hover:text-amber-300 cursor-pointer truncate flex items-center gap-2"
                          >
                            <span>{tab.title || 'Untitled Sanctuary'}</span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                                ACTIVE
                              </span>
                            )}
                            {tab.isPinned && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                                PINNED
                              </span>
                            )}
                            {tab.audioPlaying && (
                              <span className="text-amber-400 animate-pulse flex items-center gap-0.5 text-[10px]">
                                <Volume2 className="w-3 h-3" />
                                <span>AUDIO</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate font-mono">
                            {tab.url || 'mimir://newtab'}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Realm / Workspace */}
                      <div className="col-span-2 flex flex-col items-center justify-center gap-1 text-center">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 capitalize">
                          {tab.realm || 'midgard'}
                        </span>
                        {ws && (
                          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                            <span>{ws.rune}</span>
                            <span>{ws.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Column 3: Status & Memory */}
                      <div className="col-span-2 flex flex-col items-center justify-center text-center">
                        {isSleeping ? (
                          <div className="flex items-center gap-1 text-xs text-purple-400 font-mono">
                            <Moon className="w-3 h-3" />
                            <span>Slumbering (0 MB)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>~{estimatedMb} MB</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {isSleeping ? `Saved ~${estimatedMb}MB` : 'Active memory'}
                        </span>
                      </div>

                      {/* Column 4: Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {isSleeping ? (
                          <button
                            onClick={() => onAwakenTab(tab)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1 transition-all"
                            title="Awaken tab from Einherjar Slumber"
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span>Awaken</span>
                          </button>
                        ) : !isActive ? (
                          <button
                            onClick={() => onHibernateTab(tab)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-1 transition-all"
                            title="Cast tab into Einherjar Slumber to reclaim memory"
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>Slumber</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => onCloseTab(tab.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-200 text-xs transition-all"
                          title="Slay thread (Close tab)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Native Processes View */
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2 border-b border-white/10">
                <span className="col-span-2">PID</span>
                <span className="col-span-4">Process Name & Role</span>
                <span className="col-span-2 text-center">Working Set (RAM)</span>
                <span className="col-span-2 text-center">Commit Memory</span>
                <span className="col-span-2 text-right">Sovereign Action</span>
              </div>

              {filteredProcesses.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No processes match "{searchQuery}"
                </div>
              ) : (
                filteredProcesses.map((proc) => {
                  const isMain = proc.is_main;

                  return (
                    <div
                      key={proc.pid}
                      className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all ${
                        isMain
                          ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* PID */}
                      <div className="col-span-2 font-mono text-xs text-amber-400 font-bold">
                        {proc.pid}
                      </div>

                      {/* Process Name & Role */}
                      <div className="col-span-4 min-w-0 pr-4">
                        <div className="text-sm font-medium text-slate-200 truncate flex items-center gap-2">
                          <span>{proc.name}</span>
                          {isMain && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                              HOST
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">
                          {proc.role}
                        </div>
                      </div>

                      {/* Working Set RAM */}
                      <div className="col-span-2 text-center font-mono text-sm font-semibold text-cyan-300">
                        {heimdallWatch.formatBytes(proc.working_set_bytes)}
                      </div>

                      {/* Commit Memory */}
                      <div className="col-span-2 text-center font-mono text-xs text-slate-400">
                        {heimdallWatch.formatBytes(proc.commit_bytes)}
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex items-center justify-end">
                        {isMain ? (
                          <span className="text-[11px] text-slate-500 italic">Immortal Host</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Slay process PID ${proc.pid} (${proc.name})?`)) {
                                heimdallWatch.slayProcess(proc.pid);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1 transition-all"
                            title="Terminate process"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Slay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer / Telemetry Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/50 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Gjallarhorn Telemetry Active</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Total Session Reclaimed:{' '}
              <strong className="text-emerald-300 font-mono">
                {heimdallWatch.formatBytes(heimdallWatch.getTotalSessionReclaimed())}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-500">
              Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Shift+Esc</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
