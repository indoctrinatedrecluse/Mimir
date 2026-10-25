import React, { useState, useEffect } from 'react';
import { BookmarkItem, bookmarkManager } from '@/core/bookmarks/bookmarkManager';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import {
  Bookmark,
  Plus,
  ExternalLink,
  Columns,
  Trash2,
  Globe,
  Folder,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RunicBookmarksBarProps {
  activeRealm: RealmId;
  currentUrl?: string;
  currentTitle?: string;
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
  onOpenSplitGaze?: (url: string) => void;
}

export const RunicBookmarksBar: React.FC<RunicBookmarksBarProps> = ({
  activeRealm,
  currentUrl,
  currentTitle,
  onNavigate,
  onOpenNewTab,
  onOpenSplitGaze,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [contextMenuBookmark, setContextMenuBookmark] = useState<{
    item: BookmarkItem;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    return bookmarkManager.subscribe((items, visible) => {
      setBookmarks(items);
      setIsVisible(visible);
    });
  }, []);

  // Close context menu on global click
  useEffect(() => {
    const handleClose = () => setContextMenuBookmark(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  if (!isVisible) return null;

  const currentTheme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const handleContextMenu = (e: React.MouseEvent, item: BookmarkItem) => {
    e.preventDefault();
    e.stopPropagation();
    runicAudio.playClick(600);
    setContextMenuBookmark({
      item,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleQuickAdd = () => {
    if (!currentUrl || currentUrl === 'mimir://newtab' || currentUrl === 'about:blank') return;
    runicAudio.playChime();
    bookmarkManager.toggleBookmark(currentUrl, currentTitle, activeRealm);
  };

  return (
    <>
      <div
        className="relative z-20 flex h-8 w-full select-none items-center justify-between border-b border-white/10 px-3 transition-colors overflow-hidden"
        style={{
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: Bookmark Staves List */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0 pr-2">
          {/* Leading Stave Sigil */}
          <div
            className="flex items-center space-x-1 text-[10px] font-mono font-bold pr-2 pl-0.5 border-r border-white/10 shrink-0"
            style={{ color: currentTheme.accentColor }}
            title="Havamal Staves (Bookmarks Bar — Ctrl+Shift+B)"
          >
            <Bookmark className="h-3 w-3" />
            <span className="text-[9px] tracking-wider hidden sm:inline">STAVES</span>
          </div>

          {bookmarks.map((bm) => {
            const bmTheme = REALM_THEMES[bm.realm] || currentTheme;
            return (
              <button
                key={bm.id}
                type="button"
                onClick={() => {
                  runicAudio.playClick(800);
                  onNavigate(bm.url);
                }}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    // Middle click: new tab
                    runicAudio.playChime();
                    onOpenNewTab(bm.url);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, bm)}
                className="group flex items-center space-x-1.5 rounded px-2 py-0.5 text-xs text-slate-300 transition-all hover:bg-white/10 hover:text-white shrink-0 max-w-[170px]"
                title={`${bm.title}\n${bm.url}\n(Right-click for options, Middle-click for New Tab)`}
              >
                {/* Runic Glyph Badge */}
                <span
                  className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-mono font-bold shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${bmTheme.accentColor}20`,
                    color: bmTheme.accentColor,
                    border: `1px solid ${bmTheme.accentColor}40`,
                  }}
                >
                  {bm.rune || 'ᛗ'}
                </span>

                {/* Bookmark Title */}
                <span className="truncate text-[11px] font-medium tracking-wide">
                  {bm.title}
                </span>
              </button>
            );
          })}

          {bookmarks.length === 0 && (
            <span className="text-[10px] text-slate-500 font-mono italic pl-2">
              No Havamal Staves carved yet. Click + to anchor current page.
            </span>
          )}
        </div>

        {/* Right Controls: Quick Add & Dismiss */}
        <div className="flex items-center space-x-1 shrink-0 pl-1 border-l border-white/10">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="flex items-center space-x-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Carve Stave: Bookmark current active page"
          >
            <Plus className="h-3 w-3 text-cyan-400" />
            <span className="hidden md:inline text-[9px] font-semibold">CARVE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              runicAudio.playClick(500);
              bookmarkManager.setBarVisible(false);
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
            title="Hide Bookmarks Ribbon (Ctrl+Shift+B)"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Floating Stave Context Menu */}
      <AnimatePresence>
        {contextMenuBookmark && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-52 rounded-lg border border-white/15 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl"
            style={{
              top: Math.min(contextMenuBookmark.y + 4, window.innerHeight - 170),
              left: Math.min(contextMenuBookmark.x, window.innerWidth - 220),
              boxShadow: `0 0 25px ${currentTheme.accentColor}25, 0 10px 30px rgba(0,0,0,0.8)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 border-b border-white/10 mb-1">
              <p className="text-[10px] font-bold text-slate-200 truncate">
                {contextMenuBookmark.item.title}
              </p>
              <p className="text-[9px] font-mono text-slate-500 truncate">
                {contextMenuBookmark.item.url}
              </p>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(750);
                onNavigate(contextMenuBookmark.item.url);
                setContextMenuBookmark(null);
              }}
              className="flex w-full items-center space-x-2 rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>Channel in Current Tab</span>
            </button>

            <button
              onClick={() => {
                runicAudio.playChime();
                onOpenNewTab(contextMenuBookmark.item.url);
                setContextMenuBookmark(null);
              }}
              className="flex w-full items-center space-x-2 rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span>Open in New Fate Thread</span>
            </button>

            {onOpenSplitGaze && (
              <button
                onClick={() => {
                  runicAudio.playClick(700);
                  onOpenSplitGaze(contextMenuBookmark.item.url);
                  setContextMenuBookmark(null);
                }}
                className="flex w-full items-center space-x-2 rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Columns className="h-3.5 w-3.5 text-amber-400" />
                <span>Split-Gaze Channel</span>
              </button>
            )}

            <div className="my-1 border-t border-white/10" />

            <button
              onClick={() => {
                runicAudio.playClick(400);
                bookmarkManager.removeBookmark(contextMenuBookmark.item.id);
                setContextMenuBookmark(null);
              }}
              className="flex w-full items-center space-x-2 rounded px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Sever Runestone (Delete)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
