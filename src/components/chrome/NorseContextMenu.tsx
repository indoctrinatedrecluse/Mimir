import React, { useEffect, useRef } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc, NativeContextMenuEvent } from '@/core/ipc/bridge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Copy,
  Bookmark,
  Download,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Printer,
  Code,
  Columns,
  Image as ImageIcon,
  Check,
  Sparkles,
  Languages,
  Link2,
  Volume2,
  Repeat,
  BookOpen,
  FileText,
} from 'lucide-react';

interface NorseContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  eventData: NativeContextMenuEvent | null;
  onOpenInNewTab: (url: string) => void;
  onOpenInSplitGaze?: (url: string) => void;
  onDownloadUrl: (url: string, filename?: string) => void;
  onBookmarkUrl: (url: string, title?: string) => void;
  onSearchQuery: (query: string) => void;
  onAskHuginn?: (prompt: string) => void;
  onOpenReader?: () => void;
  onOpenMimirsEye?: () => void;
}

export const NorseContextMenu: React.FC<NorseContextMenuProps> = ({
  isOpen,
  onClose,
  activeRealm,
  eventData,
  onOpenInNewTab,
  onOpenInSplitGaze,
  onDownloadUrl,
  onBookmarkUrl,
  onSearchQuery,
  onAskHuginn,
  onOpenReader,
  onOpenMimirsEye,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Auto-dismiss on click outside or Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !eventData) return null;

  // Bounds clamping
  const menuWidth = 260;
  const menuHeight = 360;
  const x = Math.min(Math.max(10, eventData.x), window.innerWidth - menuWidth - 10);
  const y = Math.min(Math.max(10, eventData.y), window.innerHeight - menuHeight - 10);

  const copyToClipboard = (text: string) => {
    runicAudio.playClick(800);
    navigator.clipboard.writeText(text);
    onClose();
  };

  const handleAction = (cb: () => void) => {
    runicAudio.playClick(600);
    cb();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.94, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.12 }}
        style={{
          position: 'fixed',
          left: x,
          top: y,
          borderColor: `${theme.accentColor}50`,
          boxShadow: `0 16px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px -5px ${theme.glowColor}`,
        }}
        className="z-50 w-64 rounded-xl border bg-[#080d18]/98 p-1.5 backdrop-blur-2xl text-xs text-slate-200 select-none"
      >
        {/* Menu Header with Norse rune */}
        <div className="flex items-center justify-between px-2.5 py-1 text-[9px] font-mono tracking-widest text-slate-500 uppercase border-b border-white/5 mb-1">
          <span>RUNIC CONDUIT • ACTIONS</span>
          <span style={{ color: theme.accentColor }}>{theme.primaryRune}</span>
        </div>

        {/* 1. Selection Options */}
        {eventData.selectedText && (
          <div className="border-b border-white/5 pb-1 mb-1">
            {onAskHuginn && (
              <button
                onClick={() => handleAction(() => onAskHuginn(`Explain or analyze this passage from the Nine Realms: "${eventData.selectedText}"`))}
                className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors font-medium"
                style={{ color: theme.accentColor }}
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span className="truncate">Ask Huginn AI</span>
              </button>
            )}
            <button
              onClick={() => copyToClipboard(eventData.selectedText!)}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-cyan-400" />
              <span className="truncate">Copy Selection</span>
            </button>
            <button
              onClick={() => copyToClipboard(`[${eventData.selectedText}](${eventData.linkUrl || eventData.pageUrl})`)}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
            >
              <Link2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="truncate">Copy as Markdown Link</span>
            </button>
            <button
              onClick={() => handleAction(() => onSearchQuery(`translate: ${eventData.selectedText}`))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
            >
              <Languages className="h-3.5 w-3.5 text-cyan-400" />
              <span className="truncate">Translate Rune / Text</span>
            </button>
            <button
              onClick={() => handleAction(() => onSearchQuery(eventData.selectedText!))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Search className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
              <span className="truncate">Seek "{eventData.selectedText}"</span>
            </button>
          </div>
        )}

        {/* 2. Link Options */}
        {eventData.linkUrl && (
          <div className="border-b border-white/5 pb-1 mb-1">
            <button
              onClick={() => handleAction(() => onOpenInNewTab(eventData.linkUrl!))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors font-medium text-slate-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
              <span>Open in New Branch</span>
            </button>
            {onOpenInSplitGaze && (
              <button
                onClick={() => handleAction(() => onOpenInSplitGaze(eventData.linkUrl!))}
                className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Columns className="h-3.5 w-3.5 text-cyan-400" />
                <span>Open in Split-Gaze</span>
              </button>
            )}
            <button
              onClick={() => copyToClipboard(eventData.linkUrl!)}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy Link Rune</span>
            </button>
            <button
              onClick={() => copyToClipboard(`[${eventData.selectedText || eventData.pageTitle || 'Link'}](${eventData.linkUrl})`)}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
            >
              <Link2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Copy as Markdown Link</span>
            </button>
            <button
              onClick={() => handleAction(() => onBookmarkUrl(eventData.linkUrl!, 'Linked Rune'))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5 text-amber-400" />
              <span>Carve Runestone (Bookmark)</span>
            </button>
            <button
              onClick={() => handleAction(() => onDownloadUrl(eventData.linkUrl!))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Acquire Link Artifact</span>
            </button>
          </div>
        )}

        {/* 3. Image Options */}
        {eventData.imageUrl && (
          <div className="border-b border-white/5 pb-1 mb-1">
            <button
              onClick={() => handleAction(() => onOpenInNewTab(eventData.imageUrl!))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
              <span>Open Image in New Branch</span>
            </button>
            <button
              onClick={() => handleAction(() => onDownloadUrl(eventData.imageUrl!))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Save Sacred Image Artifact</span>
            </button>
            <button
              onClick={() => copyToClipboard(eventData.imageUrl!)}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy Image Address</span>
            </button>
          </div>
        )}

        {/* 4. Page Navigation & Common Tools */}
        <div className="space-y-0.5">
          <button
            onClick={() => handleAction(() => mimirIpc.send({ type: 'GO_BACK' }))}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <div className="flex items-center space-x-2.5">
              <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Back across Bifröst</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">Alt+←</span>
          </button>
          <button
            onClick={() => handleAction(() => mimirIpc.send({ type: 'GO_FORWARD' }))}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <div className="flex items-center space-x-2.5">
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span>Forward</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">Alt+→</span>
          </button>
          <button
            onClick={() => handleAction(() => mimirIpc.send({ type: 'REFRESH' }))}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <div className="flex items-center space-x-2.5">
              <RotateCw className="h-3.5 w-3.5 text-slate-400" />
              <span>Refresh Sacred Spring</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">Ctrl+R</span>
          </button>
          <button
            onClick={() => handleAction(() => mimirIpc.send({ type: 'PRINT' }))}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <div className="flex items-center space-x-2.5">
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>Inscribe Parchment (Print)</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">Ctrl+P</span>
          </button>
          {onOpenReader && (
            <button
              onClick={() => handleAction(() => onOpenReader())}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-amber-300"
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Enter Reader Sanctum</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">Alt+R</span>
            </button>
          )}
          {onOpenMimirsEye && (
            <button
              onClick={() => handleAction(() => onOpenMimirsEye())}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-cyan-300"
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Inscribe to Mímir’s Eye</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">Ctrl+Shift+C</span>
            </button>
          )}
          <button
            onClick={() => handleAction(() => mimirIpc.send({ type: 'SHOW_DEVTOOLS' }))}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:text-white transition-colors text-cyan-300 border-t border-white/5 pt-1.5 mt-1"
          >
            <div className="flex items-center space-x-2.5">
              <Code className="h-3.5 w-3.5 text-cyan-400" />
              <span>Inspect Runic Weave</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">F12</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
