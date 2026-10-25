import React, { useEffect, useRef, useState } from 'react';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';
import { Tab, RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { YggdrasilRootsSvg, ValknutSvg, AegishjalmrSvg } from '@/components/themes/NorsePatterns';
import { MimirSigil } from '@/components/brand/MimirSigil';
import { getRandomHavamal, HavamalStanza } from '@/core/havamal';
import { Compass, Sparkles, Globe, Terminal, Shield, BookOpen, RefreshCw, Feather, Flame, Search, Columns, ArrowLeftRight, X, Plus, Layers, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { RealmAtmosphereCanvas } from '@/components/themes/RealmAtmosphereCanvas';
import { RealmVideoBackdrop } from '@/components/themes/RealmVideoBackdrop';
import { SanctumBackdropMode } from '@/types';

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
  sanctumMode?: SanctumBackdropMode;
  onCycleSanctumMode?: () => void;
  isAnimatedBackground?: boolean;
  onToggleAnimatedBackground?: () => void;
}

const SPEED_DIALS = [
  { name: 'GitHub', norse: 'Forge of Code', url: 'https://github.com', icon: Terminal, rune: 'ᚲ' },
  { name: 'DuckDuckGo', norse: 'Well of Search', url: 'https://duckduckgo.com', icon: Compass, rune: 'ᛗ' },
  { name: 'Rust Docs', norse: 'Iron Lore', url: 'https://doc.rust-lang.org', icon: BookOpen, rune: 'ᚱ' },
  { name: 'YouTube', norse: 'Gjallarhorn Stream', url: 'https://youtube.com', icon: Flame, rune: 'ᚹ' },
];

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
  sanctumMode = 'particles',
  onCycleSanctumMode,
  isAnimatedBackground = true,
  onToggleAnimatedBackground,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showIframeInDev, setShowIframeInDev] = useState(false);
  const [havamal, setHavamal] = useState<HavamalStanza>(getRandomHavamal());
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let url = searchQuery.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      }
    }
    runicAudio.playChime();
    onNavigate(url);
  };

  const cycleHavamal = () => {
    runicAudio.playChime();
    setHavamal(getRandomHavamal());
  };

  const isHome = !activeTab?.url || activeTab.url === 'mimir://newtab' || activeTab.url === 'about:blank';
  const isSplitHome = !splitTab?.url || splitTab.url === 'mimir://newtab' || splitTab.url === 'about:blank';

  const renderSanctum = (tab?: Tab, r = realm, th = theme, isPrimary = true) => (
    <div className="relative flex h-full w-full flex-col items-center justify-between p-6 overflow-y-auto z-10">
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

      {/* Top Section: Realm Ruler & Hávamál Stanza (Full Lore, No Truncation) */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row gap-4">
        {/* Ruler Lore Card */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 rounded-xl border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur-xl shadow-xl flex items-start space-x-4"
          style={{
            borderColor: `${th.accentColor}35`,
            boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${th.glowColor}`,
          }}
        >
          <div
            className="relative h-14 w-14 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 shadow-inner mt-0.5"
            style={{ borderColor: `${th.accentColor}60` }}
          >
            <img
              src={r.bgUrl}
              alt={r.ruler}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
            <span className="relative z-10 text-2xl font-black" style={{ color: th.accentColor }}>
              {r.rune}
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
                SOVEREIGN OF {r.norseName.toUpperCase()}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${th.accentColor}25`,
                  color: th.accentColor,
                  border: `1px solid ${th.accentColor}40`,
                }}
              >
                {r.ruler}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 leading-snug">
              {r.rulerTitle}
            </div>
            <p className="text-[11px] italic text-slate-300 font-serif leading-relaxed mt-1">
              "{r.quote}"
            </p>
            <div className="mt-1 text-[10px] text-slate-400 font-mono tracking-wide">
              {r.description}
            </div>
          </div>
        </motion.div>

        {/* Hávamál Stanza Card */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 rounded-xl border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          style={{
            borderColor: `${th.accentColor}30`,
            boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${th.glowColor}`,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Feather className="h-3.5 w-3.5" style={{ color: th.accentColor }} />
                <span className="font-mono font-bold tracking-wider uppercase text-slate-200">
                  HÁVAMÁL {havamal.stanzaNumber}
                </span>
                <span className="text-[9px] text-slate-500 font-serif italic">
                  (Words of the High One)
                </span>
              </div>

              <button
                onClick={cycleHavamal}
                className="group flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
                title="Drink anew from the Well (New Stanza)"
              >
                <span className="text-[9px] font-mono">DRINK ANEW</span>
                <RefreshCw className="h-2.5 w-2.5 transition-transform group-hover:rotate-180" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-200 font-serif italic leading-relaxed">
              "{havamal.english}"
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-mono text-slate-500">
            <span>SACRED WELL WISDOM</span>
            <span style={{ color: th.accentColor }}>{r.name.toUpperCase()} REPOSITORY</span>
          </div>
        </motion.div>
      </div>

      {/* Central Sanctum: The Eye of Mímir & Search Pool */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-2xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative mb-4 flex items-center justify-center"
        >
          <div
            className="absolute h-36 w-36 rounded-full border border-dashed opacity-30 animate-ripple pointer-events-none"
            style={{ borderColor: th.accentColor }}
          />
          <div
            className="absolute h-52 w-52 rounded-full border opacity-20 animate-ripple pointer-events-none"
            style={{ borderColor: th.accentColor, animationDelay: '2s' }}
          />
          <div
            className="absolute -inset-8 rounded-full blur-3xl opacity-35 pointer-events-none animate-pulse"
            style={{ backgroundColor: th.accentColor }}
          />

          <MimirSigil size={90} animated={true} showRings={true} />
        </motion.div>

        <h1 className="text-2xl font-black tracking-[0.25em] text-slate-100 uppercase">
          MÍMISBRUNNR
        </h1>
        <p className="mt-1 max-w-lg text-[11px] tracking-wider text-slate-400 text-center font-mono">
          THE SACRED WELL OF WISDOM • <span style={{ color: th.accentColor }}>{th.title.toUpperCase()}</span>
        </p>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-5 w-full relative flex items-center rounded-xl border border-white/10 bg-[#080e1a]/85 p-1 shadow-2xl backdrop-blur-xl transition-all focus-within:border-cyan-500/60"
          style={{
            boxShadow: `0 10px 40px -10px rgba(0,0,0,0.8), 0 0 20px -5px ${th.glowColor}`,
          }}
        >
          <div className="pl-3.5 pr-2" style={{ color: th.accentColor }}>
            <Search className="h-4 w-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Inquire of the Well or enter destination URL..."
            className="h-9 flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500/70 outline-none"
          />

          <button
            type="submit"
            className="flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95"
            style={{
              backgroundColor: `${th.accentColor}25`,
              color: th.accentColor,
              border: `1px solid ${th.accentColor}40`,
            }}
          >
            <span>CHANNEL</span>
            <span className="font-mono">ᚱ</span>
          </button>
        </form>

        {/* Sacred Runestones (Speed Dials) */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 w-full">
          {SPEED_DIALS.map((dial) => {
            const Icon = dial.icon;
            return (
              <button
                key={dial.name}
                onClick={() => {
                  runicAudio.playChime();
                  onNavigate(dial.url);
                }}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#070c18]/80 p-3 transition-all hover:bg-white/[0.05] hover:scale-102 active:scale-98 overflow-hidden backdrop-blur-md shadow-lg"
              >
                <div className="absolute top-1 right-2 text-[10px] font-mono text-slate-600 group-hover:text-cyan-400">
                  {dial.rune}
                </div>

                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-300 transition-all group-hover:scale-110"
                  style={{
                    color: th.accentColor,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="mt-2 text-xs font-bold text-slate-200 group-hover:text-white">
                  {dial.name}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {dial.norse}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Realm Gateways (Quick Cosmic Switcher) */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 pt-4">
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


