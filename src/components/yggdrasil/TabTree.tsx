import React from 'react';
import { Tab, RealmId } from '@/types';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { NorseKnotworkRibbon } from '@/components/themes/NorsePatterns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Volume2, VolumeX, ChevronLeft, ChevronRight, History, Terminal, Pin, PinOff, Copy } from 'lucide-react';

interface TabTreeProps {
  tabs: Tab[];
  activeTabId: string;
  activeRealm: RealmId;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette?: () => void;
  onTogglePinTab?: (id: string) => void;
  onDuplicateTab?: (id: string) => void;
}

export const TabTree: React.FC<TabTreeProps> = ({
  tabs,
  activeTabId,
  activeRealm,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onTogglePinTab,
  onDuplicateTab,
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-white/10 bg-[#060911]/95 backdrop-blur-2xl transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Top Header: Yggdrasil Tree / Collapse Toggle */}
      <div className="flex h-10 items-center justify-between border-b border-white/5 px-3">
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center space-x-2">
              <span
                className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: theme.accentColor }}
              >
                YGGDRASIL
              </span>
              <span className="rounded bg-white/5 px-1 py-0.2 text-[9px] font-mono text-slate-400">
                {tabs.length}
              </span>
            </div>
            <span className="text-[8px] font-mono tracking-wider text-slate-500 uppercase">
              Threads of Fate
            </span>
          </div>
        )}

        <button
          onClick={() => {
            runicAudio.playClick(500);
            onToggleCollapse();
          }}
          className={`flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/10 hover:text-white ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Tree' : 'Collapse into Runes'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Knotwork accent strip */}
      <div className="h-[2px] w-full opacity-20" style={{ color: theme.accentColor }}>
        <NorseKnotworkRibbon opacity={0.4} />
      </div>

      {/* Command Palette Trigger Button (Just above tabs) */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        {!isCollapsed ? (
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onOpenCommandPalette?.();
            }}
            className="group flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#090e18]/80 px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:border-white/20 hover:bg-[#0d1424] hover:text-white"
            style={{
              borderColor: `${theme.accentColor}25`,
            }}
            title="Open Hliðskjálf Command Palette (Ctrl+K)"
          >
            <div className="flex items-center space-x-2">
              <Terminal className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
              <span className="text-[11px] font-mono tracking-wide">Seek Command...</span>
            </div>
            <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-mono text-slate-500 group-hover:text-slate-300 border border-white/5">
              Ctrl+K
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onOpenCommandPalette?.();
            }}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg border border-white/10 bg-[#090e18]/80 text-slate-400 transition-all hover:border-white/25 hover:bg-[#0d1424] hover:text-white"
            style={{
              borderColor: `${theme.accentColor}30`,
              color: theme.accentColor,
            }}
            title="Command Palette (Ctrl+K)"
          >
            <Terminal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs List with Framer Motion Spring Physics */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        <AnimatePresence initial={false}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="relative"
              >
                {/* Active Glow Backdrop */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 rounded-lg border shadow-lg backdrop-blur-md"
                    style={{
                      background: `linear-gradient(90deg, ${theme.accentColor}25 0%, ${theme.accentColor}08 100%)`,
                      borderColor: `${theme.accentColor}60`,
                      boxShadow: `0 0 15px ${theme.glowColor}`,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}

                <div
                  onClick={() => {
                    if (!isActive) {
                      runicAudio.playClick(700);
                      onSelectTab(tab.id);
                      mimirIpc.send({ type: 'SWITCH_TAB', payload: { tabId: tab.id } });
                    }
                  }}
                  className={`group relative flex h-10 cursor-pointer items-center rounded-lg px-2 text-xs transition-colors ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                  title={`${tab.title} (${tab.url})`}
                >
                  {/* Left Runic Sigil Frame */}
                  <div
                    className={`relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all border ${
                      isActive
                        ? 'shadow-md font-black'
                        : 'border-white/5 bg-white/[0.03] text-slate-500 group-hover:text-slate-300'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${theme.accentColor}20` : undefined,
                      borderColor: isActive ? `${theme.accentColor}60` : undefined,
                      color: isActive ? theme.accentColor : undefined,
                    }}
                  >
                    {tab.rune}
                    {tab.isPinned && (
                      <span
                        className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.accentColor }}
                        title="Pinned Branch"
                      />
                    )}
                  </div>

                  {/* Expanded Content: Title & Audio indicator */}
                  {!isCollapsed && (
                    <div className="ml-2.5 flex flex-1 items-center justify-between overflow-hidden">
                      <div className="flex flex-col truncate pr-1">
                        <div className="flex items-center space-x-1">
                          {tab.isPinned && (
                            <Pin className="h-2.5 w-2.5 shrink-0 opacity-70" style={{ color: theme.accentColor }} />
                          )}
                          <span className="truncate text-[11px] font-semibold tracking-wide">
                            {tab.title}
                          </span>
                        </div>
                        <span className="truncate text-[9px] font-mono text-slate-500">
                          {tab.url.replace(/^https?:\/\//, '') || 'Sacred Spring'}
                        </span>
                      </div>

                      {/* Right icons: Pin, Duplicate, Audio, Close */}
                      <div className="flex items-center space-x-1 pl-1">
                        {tab.isMuted && (
                          <VolumeX className="h-3 w-3 text-slate-500" />
                        )}
                        {!tab.isMuted && isActive && (
                          <Volume2 className="h-3 w-3 animate-pulse" style={{ color: theme.accentColor }} />
                        )}

                        {/* Quick Pin Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runicAudio.playClick(650);
                            onTogglePinTab?.(tab.id);
                          }}
                          className={`flex h-5 w-5 items-center justify-center rounded transition-all ${
                            tab.isPinned
                              ? 'text-amber-400 opacity-90 hover:text-amber-300'
                              : 'text-slate-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100'
                          }`}
                          title={tab.isPinned ? "Unpin Branch" : "Pin Branch of Fate"}
                        >
                          {tab.isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                        </button>

                        {/* Duplicate Tab Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runicAudio.playClick(600);
                            onDuplicateTab?.(tab.id);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded text-slate-500 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                          title="Duplicate Branch of Fate"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>

                        {/* Close Tab Button */}
                        {!tab.isPinned && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runicAudio.playTabClose();
                              onCloseTab(tab.id);
                              mimirIpc.send({ type: 'CLOSE_TAB', payload: { tabId: tab.id } });
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-500 opacity-0 transition-all hover:bg-rose-500/20 hover:text-rose-400 group-hover:opacity-100"
                            title="Sever Branch (Close Tab)"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Section: Muninn History & "Grow Branch" */}
      <div className="border-t border-white/5 p-2 space-y-1.5">
        <button
          onClick={() => {
            runicAudio.playClick(950);
            onNewTab();
          }}
          className="flex h-9 w-full items-center justify-center space-x-2 rounded-lg border border-dashed border-white/10 text-slate-400 transition-all hover:bg-white/5 hover:text-white active:scale-98"
          style={{
            borderColor: `${theme.accentColor}35`,
          }}
          title="Grow New Branch (+ Tab)"
        >
          <Plus className="h-4 w-4" style={{ color: theme.accentColor }} />
          {!isCollapsed && (
            <span className="text-[11px] font-bold tracking-wider">
              GROW BRANCH
            </span>
          )}
        </button>

        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 pt-1 text-[9px] font-mono text-slate-500">
            <span className="flex items-center space-x-1">
              <History className="h-2.5 w-2.5" />
              <span>MUNINN RECALL</span>
            </span>
            <span style={{ color: theme.accentColor }}>{theme.primaryRune}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
