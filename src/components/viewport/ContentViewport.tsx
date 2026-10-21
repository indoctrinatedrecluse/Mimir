import React, { useEffect, useRef, useState } from 'react';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';
import { Tab, RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { YggdrasilRootsSvg, ValknutSvg, AegishjalmrSvg } from '@/components/themes/NorsePatterns';
import { MimirSigil } from '@/components/brand/MimirSigil';
import { getRandomHavamal, HavamalStanza } from '@/core/havamal';
import { Compass, Sparkles, Globe, Terminal, Shield, BookOpen, RefreshCw, Feather, Flame, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContentViewportProps {
  activeTab?: Tab;
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
  onSelectRealm: (realm: RealmId) => void;
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showIframeInDev, setShowIframeInDev] = useState(false);
  const [havamal, setHavamal] = useState<HavamalStanza>(getRandomHavamal());
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <main
      ref={containerRef}
      className="relative flex-1 overflow-hidden select-none"
      style={{
        background: theme.portalBg,
      }}
    >
      {/* If in dev mode and not home, optionally show an iframe preview */}
      {!isHome && showIframeInDev && !mimirIpc.isNative() ? (
        <div className="relative h-full w-full">
          <iframe
            src={activeTab?.url}
            title={activeTab?.title}
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      ) : isHome ? (
        /* The Sacred Well of Mímisbrunnr (New Blank Tab Sanctuary) */
        <div className="relative flex h-full w-full flex-col items-center justify-between p-6 overflow-y-auto z-10">
          {/* Realm Ruler Cinematic Background Image with Atmospheric Veil */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
            style={{
              backgroundImage: `url('${realm.bgUrl}')`,
            }}
          >
            {/* Obsidian Glass Gradient Overlays to preserve contrast & readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#040711]/85 via-[#060914]/80 to-[#03050a]/95 backdrop-blur-[3px]" />
            <div
              className="absolute inset-0 opacity-20 mix-blend-color-dodge transition-opacity duration-700 pointer-events-none"
              style={{ backgroundColor: theme.accentColor }}
            />
          </div>

          {/* Background Decorative Layer: Yggdrasil Roots & Ambient Knotwork */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Deep subterranean roots */}
            <div
              className="absolute bottom-0 inset-x-0 w-full h-80 opacity-20 transition-opacity duration-700"
              style={{ color: theme.accentColor }}
            >
              <YggdrasilRootsSvg className="w-full h-full object-cover" />
            </div>

            {/* Faint Sacred Stave in Center */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none scale-150"
              style={{ color: theme.accentColor }}
            >
              {theme.stave === 'valknut' ? (
                <ValknutSvg size={450} />
              ) : (
                <AegishjalmrSvg size={450} />
              )}
            </div>

            {/* Radial Concentric Ripple Rings */}
            <div
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full border border-dashed opacity-10 animate-[spin_60s_linear_infinite]"
              style={{ borderColor: theme.accentColor }}
            />
            <div
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] rounded-full border opacity-5"
              style={{ borderColor: theme.accentColor }}
            />
          </div>

          {/* Top Section: Realm Ruler & Hávamál Stanza */}
          <div className="relative z-10 w-full max-w-3xl flex flex-col sm:flex-row gap-3">
            {/* Ruler Lore Card */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 rounded-xl border border-white/10 bg-[#070b14]/85 p-3.5 backdrop-blur-xl shadow-xl flex items-center space-x-3.5"
              style={{
                borderColor: `${theme.accentColor}30`,
                boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${theme.glowColor}`,
              }}
            >
              {/* Ruler Avatar/Rune Badge */}
              <div
                className="relative h-12 w-12 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 shadow-inner"
                style={{ borderColor: `${theme.accentColor}60` }}
              >
                <img
                  src={realm.bgUrl}
                  alt={realm.ruler}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                <span className="relative z-10 text-xl font-black" style={{ color: theme.accentColor }}>
                  {realm.rune}
                </span>
              </div>

              {/* Ruler Info */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
                    SOVEREIGN OF {realm.norseName.toUpperCase()}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${theme.accentColor}20`,
                      color: theme.accentColor,
                    }}
                  >
                    {realm.ruler}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {realm.rulerTitle}
                </div>
                <p className="text-[10px] italic text-slate-400 font-serif line-clamp-1 mt-0.5">
                  "{realm.quote}"
                </p>
              </div>
            </motion.div>

            {/* Hávamál Stanza */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 rounded-xl border border-white/10 bg-[#070b14]/85 p-3.5 backdrop-blur-xl shadow-xl flex flex-col justify-between"
              style={{
                borderColor: `${theme.accentColor}25`,
                boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${theme.glowColor}`,
              }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Feather className="h-3 w-3" style={{ color: theme.accentColor }} />
                  <span className="font-mono font-bold tracking-wider uppercase text-slate-300">
                    HÁVAMÁL {havamal.stanzaNumber}
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

              {/* English Wisdom */}
              <p className="mt-1.5 text-[11px] text-slate-300 font-serif italic line-clamp-2 leading-relaxed">
                "{havamal.english}"
              </p>
            </motion.div>
          </div>

          {/* Central Sanctum: The Eye of Mímir & Search Pool */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-2xl">
            {/* Glowing Animated Mímir Sigil with Concentric Water Ripples */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative mb-4 flex items-center justify-center"
            >
              {/* Concentric Living Water Ripples from the Well */}
              <div
                className="absolute h-36 w-36 rounded-full border border-dashed opacity-30 animate-ripple pointer-events-none"
                style={{ borderColor: theme.accentColor }}
              />
              <div
                className="absolute h-52 w-52 rounded-full border opacity-20 animate-ripple pointer-events-none"
                style={{ borderColor: theme.accentColor, animationDelay: '2s' }}
              />
              <div
                className="absolute -inset-8 rounded-full blur-3xl opacity-35 pointer-events-none animate-pulse"
                style={{ backgroundColor: theme.accentColor }}
              />

              <MimirSigil size={105} animated={true} showRings={true} />
            </motion.div>

            {/* Heading & Lore */}
            <h1 className="text-3xl font-black tracking-[0.25em] text-slate-100 uppercase">
              MÍMISBRUNNR
            </h1>
            <p className="mt-1.5 max-w-lg text-xs tracking-wider text-slate-400 text-center font-mono">
              THE SACRED WELL OF WISDOM • CONDUIT OF <span style={{ color: theme.accentColor }}>{theme.title.toUpperCase()}</span>
            </p>

            {/* Search Input Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 w-full relative flex items-center rounded-xl border border-white/10 bg-[#080e1a]/85 p-1 shadow-2xl backdrop-blur-xl transition-all focus-within:border-cyan-500/60"
              style={{
                boxShadow: `0 10px 40px -10px rgba(0,0,0,0.8), 0 0 20px -5px ${theme.glowColor}`,
              }}
            >
              <div className="pl-3.5 pr-2" style={{ color: theme.accentColor }}>
                <Search className="h-4 w-4" />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Inquire of the Well or enter destination URL..."
                className="h-10 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500/70 outline-none"
              />

              <button
                type="submit"
                className="flex items-center space-x-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: `${theme.accentColor}25`,
                  color: theme.accentColor,
                  border: `1px solid ${theme.accentColor}40`,
                }}
              >
                <span>CHANNEL</span>
                <span className="font-mono">ᚱ</span>
              </button>
            </form>

            {/* Sacred Runestones (Speed Dials) */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 w-full">
              {SPEED_DIALS.map((dial) => {
                const Icon = dial.icon;
                return (
                  <button
                    key={dial.name}
                    onClick={() => {
                      runicAudio.playChime();
                      onNavigate(dial.url);
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#070c18]/80 p-4 transition-all hover:bg-white/[0.05] hover:scale-102 active:scale-98 overflow-hidden backdrop-blur-md shadow-lg"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Corner knotwork accent */}
                    <div className="absolute top-1 right-2 text-[10px] font-mono text-slate-600 group-hover:text-cyan-400">
                      {dial.rune}
                    </div>

                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-300 transition-all group-hover:scale-110"
                      style={{
                        color: theme.accentColor,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-slate-200 group-hover:text-white">
                      {dial.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dial.norse}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Realm Gateways (Quick Cosmic Switcher) */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mr-2">
              REALM PORTALS:
            </span>
            {(Object.keys(REALMS) as RealmId[]).map((rId) => {
              const r = REALMS[rId];
              const isSelected = rId === activeRealm;
              return (
                <button
                  key={rId}
                  onClick={() => {
                    runicAudio.playRunicHum();
                    onSelectRealm(rId);
                  }}
                  className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'border bg-white/10 text-white shadow-md'
                      : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: isSelected ? r.accentColor : undefined,
                  }}
                >
                  <span className="font-bold text-xs" style={{ color: r.accentColor }}>
                    {r.rune}
                  </span>
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Web Viewport Active Placeholder (native Wry overlays child window here) */
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl border bg-white/[0.03]"
            style={{ borderColor: theme.accentColor, color: theme.accentColor }}
          >
            <Globe className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="mt-4 text-base font-bold tracking-wide text-slate-100">
            {activeTab?.title || activeTab?.url}
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Conduit active in realm of {realm.name} ({realm.norseName})
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
      )}
    </main>
  );
};
