import React, { useEffect, useRef, useState } from 'react';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';
import { Tab, RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { YggdrasilRootsSvg, ValknutSvg, AegishjalmrSvg } from '@/components/themes/NorsePatterns';
import { Sparkles, Globe, Columns, ArrowLeftRight, X, Film, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { RealmAtmosphereCanvas } from '@/components/themes/RealmAtmosphereCanvas';
import { RealmVideoBackdrop } from '@/components/themes/RealmVideoBackdrop';
import { SanctumBackdropMode } from '@/types';
import { BifrostCosmicDashboard } from '@/components/viewport/BifrostCosmicDashboard';

interface ContentViewportProps {
  activeTab?: Tab;
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
  onSelectRealm: (realm: RealmId) => void;
  isSplitGaze?: boolean;
  splitTab?: Tab;
  tabs?: Tab[];
  onSelectSplitTab?: (tabId: string) => void;
  onCloseSplitGaze?: () => void;
  onSwapSplitTabs?: () => void;
  onNewTabInSplit?: (realm: RealmId) => void;
  onOpenRealmSelector?: () => void;
  sanctumMode?: SanctumBackdropMode;
  onCycleSanctumMode?: () => void;
  isAnimatedBackground?: boolean;
  onToggleAnimatedBackground?: () => void;
  onOpenWorkspaces?: () => void;
  onOpenProxyCloak?: () => void;
  onOpenHeimdallWatch?: () => void;
  onOpenMimirsEye?: () => void;
  onOpenTreasury?: () => void;
}

export const ContentViewport: React.FC<ContentViewportProps> = ({
  activeTab,
  activeRealm,
  onNavigate,
  onSelectRealm,
  isSplitGaze = false,
  splitTab,
  tabs = [],
  onSelectSplitTab,
  onCloseSplitGaze,
  onSwapSplitTabs,
  onNewTabInSplit,
  onOpenRealmSelector,
  sanctumMode = 'particles',
  onCycleSanctumMode,
  isAnimatedBackground = true,
  onToggleAnimatedBackground,
  onOpenWorkspaces,
  onOpenProxyCloak,
  onOpenHeimdallWatch,
  onOpenMimirsEye,
  onOpenTreasury,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showIframeInDev, setShowIframeInDev] = useState(false);

  const currentMode: SanctumBackdropMode = sanctumMode || (isAnimatedBackground ? 'particles' : 'static');
  const realm = REALMS[activeRealm];
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Synchronize bounding box with Rust/Wry for native WebView2 positioning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateBounds = () => {
      const rect = el.getBoundingClientRect();
      mimirIpc.updateViewportBounds({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(el);
    window.addEventListener('resize', updateBounds);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  const isHome = !activeTab?.url || activeTab.url === 'mimir://newtab' || activeTab.url === 'about:blank';
  const isSplitHome = !splitTab?.url || splitTab.url === 'mimir://newtab' || splitTab.url === 'about:blank';

  const renderSanctum = (tab?: Tab, r = realm, th = theme, isPrimary = true) => (
    <div className="relative flex h-full w-full flex-col items-center justify-between p-4 overflow-y-auto z-10">
      {/* Sanctum Backdrop Layer: Tri-State Engine (Option B: Video / Option A: Particles / Static) */}
      {currentMode === 'video' ? (
        <RealmVideoBackdrop
          realmId={r.id}
          videoUrl={r.videoUrl}
          staticBgUrl={r.bgUrl}
          isActive={isPrimary ? isHome : isSplitHome}
        />
      ) : (
        <>
          <div
            className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ${
              currentMode === 'particles' ? 'animate-realm-drift' : 'scale-100'
            }`}
            style={{
              backgroundImage: `url('${r.bgUrl}')`,
            }}
          >
            {/* Soft radial vignette keeping the center ruler sharp & vibrant while dimming edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(4,7,17,0.35)_60%,rgba(3,5,10,0.85)_100%)] pointer-events-none" />
            {/* Subtle vertical gradient for header and bottom controls */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#030611]/50 via-transparent to-[#020408]/75 pointer-events-none" />
            {/* Subtle realm accent color glow */}
            <div
              className="absolute inset-0 opacity-15 mix-blend-color-dodge transition-opacity duration-700 pointer-events-none"
              style={{ backgroundColor: th.accentColor }}
            />
          </div>

          {/* Atmospheric Realm Canvas Particle Simulation (Option A) */}
          <RealmAtmosphereCanvas realmId={r.id} enabled={currentMode === 'particles'} />
        </>
      )}

      {/* Background Decorative Layer: Yggdrasil Roots & Ambient Knotwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute bottom-0 inset-x-0 w-full h-80 opacity-20 transition-opacity duration-700"
          style={{ color: th.accentColor }}
        >
          <YggdrasilRootsSvg className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none scale-150"
          style={{ color: th.accentColor }}
        >
          {th.stave === 'valknut' ? (
            <ValknutSvg size={450} />
          ) : (
            <AegishjalmrSvg size={450} />
          )}
        </div>
      </div>

      {/* Bifröst Start: Cosmic Dashboard & Dynamic New Tab Portal */}
      <BifrostCosmicDashboard
        activeRealm={r.id}
        onNavigate={onNavigate}
        onOpenWorkspaces={onOpenWorkspaces}
        onOpenProxyCloak={onOpenProxyCloak}
        onOpenHeimdallWatch={onOpenHeimdallWatch}
        onOpenMimirsEye={onOpenMimirsEye}
        onOpenTreasury={onOpenTreasury}
        onOpenRealmSelector={onOpenRealmSelector}
      />

      {/* Bottom Realm Gateways (Quick Cosmic Switcher) */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 pt-2 pb-2">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mr-1">
          REALMS:
        </span>
        {(Object.keys(REALMS) as RealmId[]).map((rId) => {
          const rItem = REALMS[rId];
          const isSelected = isPrimary ? rId === activeRealm : rId === (tab?.realm || r.id);
          return (
            <button
              key={rId}
              onClick={() => {
                runicAudio.playRunicHum();
                onSelectRealm(rId);
              }}
              className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                isSelected
                  ? 'text-white shadow-lg scale-105'
                  : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              style={{
                borderColor: isSelected ? rItem.accentColor : undefined,
                backgroundColor: isSelected ? `${rItem.accentColor}25` : undefined,
                boxShadow: isSelected
                  ? `0 0 16px ${rItem.accentColor}50, inset 0 0 8px ${rItem.accentColor}20`
                  : undefined,
                borderWidth: isSelected ? '1.5px' : '1px',
              }}
            >
              <span className="font-bold text-xs" style={{ color: rItem.accentColor }}>
                {rItem.rune}
              </span>
              <span>{rItem.name}</span>
              {isSelected && (
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse ml-0.5"
                  style={{ backgroundColor: rItem.accentColor }}
                />
              )}
            </button>
          );
        })}

        {/* Tri-Mode Backdrop Selector: Video ➔ Particles ➔ Static */}
        {(onCycleSanctumMode || onToggleAnimatedBackground) && (
          <button
            onClick={() => {
              if (onCycleSanctumMode) onCycleSanctumMode();
              else onToggleAnimatedBackground?.();
            }}
            className="ml-2 flex items-center space-x-1.5 rounded-lg border bg-black/40 px-2.5 py-1 text-[10px] font-mono transition-all hover:bg-black/60 shadow-md backdrop-blur-md"
            style={{
              borderColor: currentMode !== 'static' ? `${th.accentColor}60` : 'rgba(255,255,255,0.12)',
              color: currentMode !== 'static' ? th.accentColor : '#94a3b8',
              boxShadow: currentMode !== 'static' ? `0 0 12px ${th.glowColor}` : undefined,
            }}
            title={
              currentMode === 'video'
                ? 'Active Mode: Cinematic Video (Click to cycle to Living Particles)'
                : currentMode === 'particles'
                ? 'Active Mode: Living Particles & Drift (Click to cycle to Static Artwork)'
                : 'Active Mode: Static Artwork (Click to cycle to Cinematic Video)'
            }
          >
            {currentMode === 'video' ? (
              <Film className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span>
              {currentMode === 'video'
                ? 'SANCTUM: VIDEO (ᚠ)'
                : currentMode === 'particles'
                ? 'SANCTUM: PARTICLES (ᛋ)'
                : 'SANCTUM: STATIC (ᛏ)'}
            </span>
          </button>
        )}

        {/* In-Browser Visuals & Model A Pack Guide Button */}
        {onOpenRealmSelector && (
          <button
            onClick={() => {
              runicAudio.playClick(500);
              onOpenRealmSelector();
            }}
            className="flex items-center space-x-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all shadow-md backdrop-blur-md"
            title="Open Sanctum Visual Modes & Model A Pack Guide"
          >
            <HelpCircle className="h-3 w-3 text-cyan-400" />
            <span className="hidden sm:inline">GUIDE</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderActiveWeb = (tab?: Tab, r = realm, th = theme) => (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl border bg-white/[0.03]"
        style={{ borderColor: th.accentColor, color: th.accentColor }}
      >
        <Globe className="h-7 w-7 animate-pulse" />
      </div>
      <h2 className="mt-4 text-base font-bold tracking-wide text-slate-100">
        {tab?.title || tab?.url}
      </h2>
      <p className="mt-1 text-xs text-slate-400 font-mono">
        Conduit active in realm of {r.name} ({r.norseName})
      </p>

      {!mimirIpc.isNative() && (
        <button
          onClick={() => setShowIframeInDev(!showIframeInDev)}
          className="mt-5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all shadow-md"
        >
          {showIframeInDev ? 'Return to Mímir Sanctum' : 'Toggle Web Preview (IFrame)'}
        </button>
      )}
    </div>
  );

  return (
    <main
      ref={containerRef}
      className="relative flex-1 overflow-hidden select-none"
      style={{
        background: theme.portalBg,
      }}
    >
      {/* Odin's Split-Gaze (Hliðskjálf Dual-Viewport) */}
      {isSplitGaze ? (
        <div className="flex h-full w-full overflow-hidden">
          {/* Left Primary Pane */}
          <div className="flex-1 h-full overflow-hidden relative border-r border-white/10">
            <div className="absolute top-2 left-3 z-30 flex items-center space-x-1.5 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
              <span style={{ color: theme.accentColor }}>{realm.rune}</span>
              <span>PRIMARY GAZE</span>
            </div>
            {isHome ? renderSanctum(activeTab, realm, theme, true) : renderActiveWeb(activeTab, realm, theme)}
          </div>

          {/* Central Runic Control Divider */}
          <div className="relative z-30 flex flex-col items-center justify-center bg-[#050811] border-x border-white/10 px-1 py-4 space-y-3">
            <button
              onClick={onSwapSplitTabs}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors shadow"
              title="Swap Odin's Gaze (Exchange Left & Right Viewports)"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onCloseSplitGaze}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors shadow"
              title="Close Secondary Gaze (Return to Single Viewport)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right Secondary Pane */}
          <div className="flex-1 h-full overflow-hidden relative">
            <div className="absolute top-2 left-3 z-30 flex items-center space-x-1.5 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/30 backdrop-blur-md">
              <span>ᚺ</span>
              <span>SECONDARY GAZE</span>
            </div>

            {splitTab ? (
              isSplitHome ? (
                renderSanctum(splitTab, REALMS[splitTab.realm] || realm, REALM_THEMES[splitTab.realm] || theme, false)
              ) : (
                renderActiveWeb(splitTab, REALMS[splitTab.realm] || realm, REALM_THEMES[splitTab.realm] || theme)
              )
            ) : (
              /* Tab Picker for Secondary Viewport */
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#070b14]/90 backdrop-blur-md">
                <Columns className="h-10 w-10 text-slate-500 mb-3" />
                <h3 className="text-sm font-bold text-slate-200">
                  Select Secondary Gaze
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  Choose a branch of Yggdrasil to monitor alongside your active conduit:
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-sm">
                  {tabs
                    .filter((t) => t.id !== activeTab?.id)
                    .map((t) => {
                      const rConfig = REALMS[t.realm] || realm;
                      return (
                        <button
                          key={t.id}
                          onClick={() => onSelectSplitTab?.(t.id)}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left hover:border-white/20 hover:bg-white/[0.06] transition-all"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span style={{ color: rConfig.accentColor }} className="font-bold">
                              {t.rune || rConfig.rune}
                            </span>
                            <span className="text-xs text-slate-200 truncate">{t.title}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase text-slate-500">
                            {rConfig.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single Standard Viewport */
        isHome ? renderSanctum(activeTab, realm, theme, true) : renderActiveWeb(activeTab, realm, theme)
      )}
    </main>
  );
};


