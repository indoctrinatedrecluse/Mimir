import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab, YggdrasilWorkspace } from '@/types';
import { Plus, X, Globe, Moon, Check, Sparkles, Trash2 } from 'lucide-react';
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

export const MobileTabSwitcher: React.FC<MobileTabSwitcherProps> = ({
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
  if (!isOpen) return null;

  const handlePurgeInactive = () => {
    runicAudio.playClick(400);
    tabs.forEach((t) => {
      if (t.id !== activeTabId) {
        onCloseTab(t.id);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a]/98 backdrop-blur-2xl text-slate-100 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold text-sm tracking-widest">ᛏ YGGDRASIL BRANCHES</span>
          <span className="text-xs text-slate-500 font-mono">({tabs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {tabs.length > 1 && (
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
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>

      {/* Workspace Quick-Pills */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspaceId;
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
              style={{ borderColor: isActive ? ws.color : undefined }}
            >
              <span style={{ color: ws.color }}>{ws.rune}</span>
              <span>{ws.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Tabs with Swipe to Dismiss */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isInternal = tab.url.startsWith('mimir://');

            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7, x: -120 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.65}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 85) {
                    runicAudio.playClick(450);
                    onCloseTab(tab.id);
                  }
                }}
                onClick={() => {
                  runicAudio.playClick(600);
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={`relative flex flex-col justify-between h-44 rounded-2xl p-3 border cursor-pointer select-none transition-shadow ${
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
                      {tab.title || 'Untitled'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      runicAudio.playClick(450);
                      onCloseTab(tab.id);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Thumbnail / Preview */}
                <div className="flex-1 my-2 rounded-xl bg-[#030508] border border-slate-800/40 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-full">
                    {tab.url.replace(/^https?:\/\//i, '')}
                  </span>
                  {tab.isSleeping && (
                    <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono">
                      <Moon className="w-2.5 h-2.5" />
                      <span>Slumber</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Realm Badge & Swipe hint */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="capitalize">{tab.realm}</span>
                  {isActive ? (
                    <span className="text-cyan-400 font-bold">Active</span>
                  ) : (
                    <span className="text-slate-600 text-[9px]">↔ swipe</span>
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
