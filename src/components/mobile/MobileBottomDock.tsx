import React from 'react';
import { ChevronLeft, ChevronRight, Layers, Menu, Shield, Globe } from 'lucide-react';
import { RealmId } from '@/types';
import { MimirSigil } from '@/components/brand/MimirSigil';

interface MobileBottomDockProps {
  currentUrl: string;
  tabCount: number;
  activeRealm: RealmId;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onOpenOmnibar: () => void;
  onOpenTabs: () => void;
  onOpenMenu: () => void;
  onOpenNewTab: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  currentUrl,
  tabCount,
  activeRealm,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onOpenOmnibar,
  onOpenTabs,
  onOpenMenu,
  onOpenNewTab,
  onNextTab,
  onPrevTab,
}) => {
  const isInternal = currentUrl.startsWith('mimir://') || !currentUrl;
  const displayHost = isInternal
    ? currentUrl === 'mimir://newtab'
      ? 'Bifröst Portal'
      : currentUrl.replace('mimir://', '')
    : currentUrl.replace(/^https?:\/\//i, '').split('/')[0];

  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 45 && onPrevTab) {
      onPrevTab();
    } else if (deltaX < -45 && onNextTab) {
      onNextTab();
    }
    setTouchStartX(null);
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b12]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2.5 py-2 flex items-center justify-between gap-1.5 select-none transition-all"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* 1. Back button */}
      <button
        type="button"
        onClick={onGoBack}
        disabled={!canGoBack}
        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
          canGoBack
            ? 'text-slate-200 active:bg-slate-800/80 hover:text-cyan-400'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title="Go Back (ᚢ)"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 2. Forward button */}
      <button
        type="button"
        onClick={onGoForward}
        disabled={!canGoForward}
        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
          canGoForward
            ? 'text-slate-200 active:bg-slate-800/80 hover:text-cyan-400'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title="Go Forward (ᚦ)"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 3. Center Omnibar Capsule Trigger (Swipe left/right to cycle tabs) */}
      <button
        type="button"
        onClick={onOpenOmnibar}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 mx-1.5 h-10 px-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center gap-2 active:border-cyan-500/50 shadow-inner group overflow-hidden transition-all text-left"
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {isInternal ? (
            <MimirSigil className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Globe className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <span className="text-xs font-mono text-slate-300 truncate max-w-[170px]">
          {displayHost || 'Search or inscribe rune...'}
        </span>
      </button>

      {/* 4. Tab Switcher button */}
      <button
        type="button"
        onClick={onOpenTabs}
        className="relative p-2 rounded-xl text-slate-300 active:bg-slate-800/80 hover:text-cyan-400 transition-all flex items-center justify-center"
        title="Yggdrasil Branches & Tabs (ᛏ)"
      >
        <Layers className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-cyan-500 text-[#05070a] font-mono text-[10px] font-bold flex items-center justify-center shadow-sm">
          {tabCount > 9 ? '9+' : tabCount}
        </span>
      </button>

      {/* 5. Mobile Menu button */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="p-2 rounded-xl text-slate-300 active:bg-slate-800/80 hover:text-cyan-400 transition-all flex items-center justify-center"
        title="Nine Realms & Sanctuary Menu (☰)"
      >
        <Menu className="w-5 h-5" />
      </button>
    </nav>
  );
};
