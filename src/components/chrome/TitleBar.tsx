import React from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { NorseKnotworkRibbon, ValknutSvg, AegishjalmrSvg } from '@/components/themes/NorsePatterns';
import { MimirSigil } from '@/components/brand/MimirSigil';
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
  const realmTheme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

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

  const futharkSeq = "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛋ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ ";

  return (
    <header
      className="relative z-30 flex h-10 w-full select-none items-center justify-between border-b border-white/10 px-3 transition-colors duration-500 overflow-hidden shadow-lg animate-aurora"
      style={{
        background: realmTheme.titlebarBg,
      }}
    >
      {/* Background Decorative Theme Layer (Firefox-style Animated Norse Banner) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Faint Stave Watermark */}
        <div
          className="absolute -right-6 -top-4 opacity-15 transition-transform duration-700"
          style={{ color: realmTheme.accentColor }}
        >
          {realmTheme.stave === 'valknut' ? (
            <ValknutSvg size={105} />
          ) : (
            <AegishjalmrSvg size={105} />
          )}
        </div>

        {/* Scrolling Animated Futhark Ribbon across top */}
        <div className="absolute top-0 inset-x-0 overflow-hidden whitespace-nowrap opacity-25">
          <div className="inline-block animate-futhark-scroll font-mono text-[10px] tracking-[0.4em]" style={{ color: realmTheme.accentColor }}>
            {futharkSeq.repeat(6)}
          </div>
        </div>

        {/* Ambient Realm Glow Pulse */}
        <div
          className="absolute inset-y-0 left-1/3 w-1/3 blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: realmTheme.accentColor }}
        />

        {/* Norse Knotwork Ribbon along bottom border */}
        <div className="absolute bottom-0 inset-x-0" style={{ color: realmTheme.knotworkColor }}>
          <NorseKnotworkRibbon opacity={0.35} />
        </div>
      </div>

      {/* Left: Branding & Realm Conduit */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* Animated Colorful Mímir Sigil */}
        <div className="flex items-center space-x-2">
          <MimirSigil size={26} animated={true} showRings={false} />
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-black tracking-widest text-slate-100">
              MÍMIR
            </span>
            <span
              className="rounded px-1.5 py-0.2 text-[8px] font-mono tracking-wider font-semibold border"
              style={{
                backgroundColor: `${realmTheme.accentColor}15`,
                borderColor: `${realmTheme.accentColor}40`,
                color: realmTheme.accentColor,
              }}
            >
              RUNIC CONDUIT
            </span>
          </div>
        </div>

        {/* Knotwork divider */}
        <div className="h-4 w-[1px] bg-white/10" />

        {/* Realm Selector Pill */}
        <button
          onClick={() => {
            runicAudio.playRunicHum();
            onOpenRealmSelector();
          }}
          className="group flex items-center space-x-2 rounded border px-2.5 py-1 text-[11px] transition-all backdrop-blur-md"
          style={{
            borderColor: `${realmTheme.accentColor}30`,
            backgroundColor: `${realmTheme.accentColor}10`,
          }}
          title="Switch Cosmic Realm (Workspaces & Profiles)"
        >
          <span
            className="text-sm font-black transition-transform group-hover:scale-110"
            style={{ color: realmTheme.accentColor }}
          >
            {currentRealm.rune}
          </span>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-200 group-hover:text-white leading-tight">
              {currentRealm.name}
            </span>
            <span className="text-[8px] font-mono text-slate-400/80 leading-tight">
              {currentRealm.norseName}
            </span>
          </div>
          <Compass
            className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90 ml-1"
            style={{ color: realmTheme.accentColor }}
          />
        </button>
      </div>

      {/* Center Drag Region */}
      <div
        className="flex-1 h-full flex items-center justify-center cursor-default"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center space-x-2 opacity-50 hover:opacity-80 transition-opacity">
          <span className="text-[9px] font-mono tracking-[0.25em] text-slate-300 uppercase">
            ᚱ {realmTheme.subtitle} ᚱ
          </span>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="relative z-10 flex items-center space-x-1">
        <button
          onClick={handleMinimize}
          className="flex h-7 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="Minimize to Nether"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-7 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title={isMaximized ? 'Restore Viewport' : 'Maximize Realm'}
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-7 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-rose-500/80 hover:text-white hover:shadow-[0_0_12px_rgba(244,63,94,0.6)] active:scale-95"
          title="Close Mímir"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
