import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Download, Share2, Plus, X, Globe, Eye } from 'lucide-react';
import { RealmId } from '@/types';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';

export interface MobileContextMenuData {
  type: 'link' | 'image' | 'text';
  targetUrl: string;
  tabId?: string;
}

interface MobileContextMenuSheetProps {
  data: MobileContextMenuData | null;
  activeRealm: RealmId;
  onClose: () => void;
  onOpenNewTab: (url: string) => void;
  onOpenBackgroundTab?: (url: string) => void;
}

export const MobileContextMenuSheet: React.FC<MobileContextMenuSheetProps> = ({
  data,
  activeRealm,
  onClose,
  onOpenNewTab,
  onOpenBackgroundTab,
}) => {
  if (!data) return null;

  const url = data.targetUrl;
  const isImage = data.type === 'image';
  const displayHost = url.replace(/^https?:\/\//i, '').split('/')[0];

  const handleCopyLink = async () => {
    runicAudio.playClick(800);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
    }
    onClose();
  };

  const handleOpenNew = () => {
    runicAudio.playClick(600);
    onOpenNewTab(url);
    onClose();
  };

  const handleOpenBackground = () => {
    runicAudio.playClick(500);
    if (onOpenBackgroundTab) {
      onOpenBackgroundTab(url);
    } else {
      mimirIpc.send({
        type: 'CREATE_TAB',
        payload: { url, realm: activeRealm },
      });
    }
    onClose();
  };

  const handleDownload = () => {
    runicAudio.playChime();
    mimirIpc.send({
      type: 'DOWNLOAD_URL',
      payload: { url },
    });
    onClose();
  };

  const handleShare = () => {
    runicAudio.playClick(700);
    if (mimirIpc.isAndroid()) {
      mimirIpc.send({
        type: 'SHARE_URL',
        payload: { url, title: displayHost },
      });
    } else if (navigator.share) {
      navigator.share({ url, title: displayHost }).catch(() => {});
    } else {
      handleCopyLink();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-t-3xl border-t border-slate-700/80 bg-[#070b14]/98 p-5 text-slate-100 shadow-2xl backdrop-blur-2xl z-10"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Top Drag Pill */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700/60" />

          {/* Header Preview */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-3 overflow-hidden pr-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                {isImage ? <Eye className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-200 truncate font-mono">
                  {displayHost}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono max-w-[260px]">
                  {url}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action List */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex w-full items-center space-x-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/80 active:bg-cyan-950/40 active:text-cyan-300 transition-all"
            >
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>Open in New Branch (ᚦ)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBackground}
              className="flex w-full items-center space-x-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/80 active:bg-cyan-950/40 active:text-cyan-300 transition-all"
            >
              <ExternalLink className="h-4 w-4 text-teal-400" />
              <span>Open in Background (ᛉ)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center space-x-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/80 active:bg-cyan-950/40 active:text-cyan-300 transition-all"
            >
              <Copy className="h-4 w-4 text-amber-400" />
              <span>Copy Runic Link (ᚲ)</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center space-x-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/80 active:bg-cyan-950/40 active:text-cyan-300 transition-all"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{isImage ? 'Download Image via Svalinn (ᛗ)' : 'Download Linked File (ᛗ)'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center space-x-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/80 active:bg-cyan-950/40 active:text-cyan-300 transition-all"
            >
              <Share2 className="h-4 w-4 text-purple-400" />
              <span>Share with Bifröst Conduit (ᛋ)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
