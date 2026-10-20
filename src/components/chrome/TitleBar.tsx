import React from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { Minus, Square, X, Compass } from 'lucide-react';

interface TitleBarProps {
  activeRealm: RealmId;
  onOpenRealmSelector: () => void;
  isMaximized?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeRealm,
  onOpenRealmSelector,
  isMaximized = false,
}) => {
  const currentRealm = REALMS[activeRealm];

  const handleMinimize = () => {
    runicAudio.playClick(600);
    mimirIpc.send({ type: 'WINDOW_MINIMIZE' });
  };

  const handleMaximize = () => {
    runicAudio.playClick(750);
    mimirIpc.send({ type: 'WINDOW_MAXIMIZE' });
  };

  const handleClose = () => {
    runicAudio.playTabClose();
    mimirIpc.send({ type: 'WINDOW_CLOSE' });
  };

  return (
    <header className="relative z-30 flex h-9 w-full select-none items-center justify-between border-b border-white/5 bg-[#070a10]/90 px-3 backdrop-blur-md">
      {/* Left: Branding & Realm Switcher */}
      <div className="flex items-center space-x-3">
        {/* Mímir Sigil */}
        <div className="flex items-center space-x-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.4)]">
            ᛗ
          </div>
          <span className="text-xs font-black tracking-widest text-slate-200">
            MÍMIR
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-cyan-400/80">
            ALPHA
          </span>
        </div>

        {/* Divider */}
        <div className="h-3 w-[1px] bg-white/10" />

        {/* Realm Button */}
        <button
          onClick={() => {
            runicAudio.playRunicHum();
            onOpenRealmSelector();
          }}
          className="group flex items-center space-x-1.5 rounded-sm border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[11px] transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]"
        >
          <span
            className="text-xs font-bold"
            style={{ color: currentRealm.accentColor }}
          >
            {currentRealm.rune}
          </span>
          <span className="font-medium text-slate-300 group-hover:text-white">
            {currentRealm.name}
          </span>
          <Compass className="h-3 w-3 text-slate-500 transition-transform group-hover:rotate-45 group-hover:text-cyan-400" />
        </button>
      </div>

      {/* Center Drag Region */}
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-[10px] font-medium tracking-wider text-slate-500/60 uppercase">
          Mímisbrunnr Conduit
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleMinimize}
          className="flex h-6 w-7 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Minimize to Nether"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-6 w-7 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          title={isMaximized ? 'Restore Viewport' : 'Maximize Realm'}
        >
          <Square className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-6 w-7 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-rose-500/80 hover:text-white hover:shadow-[0_0_12px_rgba(244,63,94,0.5)]"
          title="Close Mímir"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
