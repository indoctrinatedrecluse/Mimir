import React from 'react';
import { Shield, ShieldCheck, Volume2, VolumeX, Lock, Globe, Sparkles } from 'lucide-react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';

export interface MobileHeaderStripProps {
  activeRealm: RealmId;
  currentUrl: string;
  currentTitle?: string;
  isLoading?: boolean;
  isAmbientPlaying?: boolean;
  isCloakActive?: boolean;
  blockedTrackersCount?: number;
  onOpenRealmSelector: () => void;
  onOpenOmnibar: () => void;
  onToggleAmbient: () => void;
  onOpenCloak?: () => void;
}

export const MobileHeaderStrip: React.FC<MobileHeaderStripProps> = ({
  activeRealm,
  currentUrl,
  currentTitle,
  isLoading = false,
  isAmbientPlaying = false,
  isCloakActive = false,
  blockedTrackersCount = 0,
  onOpenRealmSelector,
  onOpenOmnibar,
  onToggleAmbient,
  onOpenCloak,
}) => {
  const currentRealm = REALMS[activeRealm] || REALMS.midgard;
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const isInternal = !currentUrl || currentUrl.startsWith('mimir://') || currentUrl === 'about:blank';
  const isHttps = currentUrl.startsWith('https://');

  const displayHost = isInternal
    ? currentUrl === 'mimir://newtab'
      ? 'Bifröst Sanctum'
      : currentUrl.replace('mimir://', '')
    : currentUrl.replace(/^https?:\/\//i, '').split('/')[0];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 select-none border-b border-white/[0.08] bg-[#05070a]/90 backdrop-blur-xl transition-all duration-300"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex h-10 items-center justify-between px-3">
        {/* Left: Active Realm Rune Pill */}
        <button
          type="button"
          onClick={() => {
            runicAudio.playClick(650);
            onOpenRealmSelector();
          }}
          className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-mono transition-all hover:bg-white/[0.08] active:scale-95 shadow-sm"
          style={{
            borderColor: `${theme.accentColor}40`,
            boxShadow: `0 0 10px ${theme.glowColor}`,
          }}
          title={`Active Realm: ${currentRealm.name} (${currentRealm.norseName})`}
        >
          <span
            className="text-sm font-bold"
            style={{ color: theme.accentColor }}
          >
            {currentRealm.rune}
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
            {currentRealm.name}
          </span>
        </button>

        {/* Center: Security Ward & Domain Capsule (Tappable for Omnibar) */}
        <button
          type="button"
          onClick={() => {
            runicAudio.playClick(700);
            onOpenOmnibar();
          }}
          className="mx-2 flex max-w-[180px] flex-1 items-center justify-center space-x-1.5 rounded-full border border-slate-800 bg-[#070b14]/90 px-3 py-1 text-xs transition-all active:scale-98 hover:border-slate-700"
        >
          {isInternal ? (
            <Sparkles className="h-3 w-3 shrink-0 text-cyan-400" />
          ) : isHttps ? (
            <Lock className="h-3 w-3 shrink-0 text-emerald-400" />
          ) : (
            <Globe className="h-3 w-3 shrink-0 text-amber-400" />
          )}

          <span className="truncate font-mono text-[11px] text-slate-300">
            {displayHost || 'Enter Rune or URL'}
          </span>
        </button>

        {/* Right: Svalinn Ward / Cloak & Ambient Audio Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Svalinn Cloak / Tor Proxy Indicator */}
          {onOpenCloak && (
            <button
              type="button"
              onClick={() => {
                runicAudio.playClick(600);
                onOpenCloak();
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                isCloakActive
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-200'
              }`}
              title={isCloakActive ? 'Svalinn Cloak Active' : 'Svalinn Cloak Inactive'}
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Ambient Music Toggle */}
          <button
            type="button"
            onClick={() => {
              runicAudio.playClick(800);
              onToggleAmbient();
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
              isAmbientPlaying
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse'
                : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-200'
            }`}
            title={isAmbientPlaying ? 'Halt Ambient Runic Drones' : 'Awaken Ambient Runic Drones'}
          >
            {isAmbientPlaying ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Runic Load Progress Filament */}
      {isLoading && (
        <div className="h-[2px] w-full overflow-hidden bg-slate-800">
          <div
            className="h-full w-full animate-pulse transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.accentColor} 50%, #ffffff 100%)`,
            }}
          />
        </div>
      )}
    </header>
  );
};
