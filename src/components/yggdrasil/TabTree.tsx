import React from 'react';
import { Tab, RealmId } from '@/types';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';

interface TabTreeProps {
  tabs: Tab[];
  activeTabId: string;
  activeRealm: RealmId;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const TabTree: React.FC<TabTreeProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-white/5 bg-[#070a11]/90 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Top Header: Yggdrasil Tree / Collapse Toggle */}
      <div className="flex h-10 items-center justify-between border-b border-white/5 px-2.5">
        {!isCollapsed && (
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400">
              YGGDRASIL
            </span>
            <span className="text-[10px] text-slate-500">({tabs.length})</span>
          </div>
        )}

        <button
          onClick={() => {
            runicAudio.playClick(500);
            onToggleCollapse();
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-cyan-400 ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Tree' : 'Collapse into Runes'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Tabs List with Framer Motion Spring Physics */}
      <div className="flex-1 space-y-1 overflow-y-auto p-1.5">
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
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,245,255,0.2)]"
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
                  className={`group relative flex h-9 cursor-pointer items-center rounded-md px-2 text-xs transition-colors ${
                    isActive
                      ? 'text-cyan-300 font-medium'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                  title={`${tab.title} (${tab.url})`}
                >
                  {/* Left Runic Sigil */}
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(0,245,255,0.5)]'
                        : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {tab.rune}
                  </div>

                  {/* Expanded Content: Title & Audio indicator */}
                  {!isCollapsed && (
                    <div className="ml-2.5 flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate text-[11px] tracking-wide">
                        {tab.title}
                      </span>

                      {/* Right icons: Audio / Close */}
                      <div className="flex items-center space-x-1 pl-1">
                        {tab.isMuted && (
                          <VolumeX className="h-3 w-3 text-slate-500" />
                        )}
                        {!tab.isMuted && isActive && (
                          <Volume2 className="h-3 w-3 text-cyan-400 animate-pulse" />
                        )}

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
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom: "Grow Branch" (+ New Tab) */}
      <div className="border-t border-white/5 p-1.5">
        <button
          onClick={() => {
            runicAudio.playClick(950);
            onNewTab();
          }}
          className={`flex h-8 w-full items-center justify-center space-x-1.5 rounded-md border border-dashed border-white/10 text-slate-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(0,245,255,0.2)] active:scale-98`}
          title="Grow New Branch (+ Tab)"
        >
          <Plus className="h-3.5 w-3.5" />
          {!isCollapsed && <span className="text-[11px] font-medium">Grow Branch</span>}
        </button>
      </div>
    </aside>
  );
};
