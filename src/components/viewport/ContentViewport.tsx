import React, { useEffect, useRef, useState } from 'react';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';
import { Tab, RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { Compass, Sparkles, Globe, Terminal, Shield, BookOpen } from 'lucide-react';

interface ContentViewportProps {
  activeTab?: Tab;
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
}

const SPEED_DIALS = [
  { name: 'GitHub', norse: 'Forge of Code', url: 'https://github.com', icon: Terminal, rune: 'ᚲ' },
  { name: 'DuckDuckGo', norse: 'Well of Search', url: 'https://duckduckgo.com', icon: Compass, rune: 'ᛗ' },
  { name: 'Rust Docs', norse: 'Iron Lore', url: 'https://doc.rust-lang.org', icon: BookOpen, rune: 'ᚱ' },
  { name: 'Vite', norse: 'Lightning Speed', url: 'https://vite.dev', icon: Sparkles, rune: 'ᛋ' },
];

export const ContentViewport: React.FC<ContentViewportProps> = ({
  activeTab,
  activeRealm,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showIframeInDev, setShowIframeInDev] = useState(false);
  const realm = REALMS[activeRealm];

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

  return (
    <main
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-[#05080e]"
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
        /* The Well of Mímir New Tab Portal */
        <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
          {/* Glowing Central Sigil */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/30 bg-[#0c121e]/80 shadow-[0_0_30px_rgba(0,245,255,0.25)]">
              <span className="text-4xl font-black text-cyan-400">ᛗ</span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl font-black tracking-widest text-slate-100 uppercase">
            MÍMISBRUNNR
          </h1>
          <p className="mt-1.5 max-w-md text-xs tracking-wide text-slate-400">
            Conduit active in the realm of <span className="font-semibold text-cyan-400">{realm.name}</span> ({realm.norseName}). All web requests are shielded by the Runic Ward.
          </p>

          {/* Speed Dial Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-xl w-full">
            {SPEED_DIALS.map((dial) => {
              const Icon = dial.icon;
              return (
                <button
                  key={dial.name}
                  onClick={() => {
                    runicAudio.playChime();
                    onNavigate(dial.url);
                  }}
                  className="group flex flex-col items-center justify-center rounded-lg border border-white/5 bg-[#090e18]/80 p-4 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_10px_rgba(0,245,255,0.4)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                    {dial.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {dial.norse}
                  </span>
                </button>
              );
            })}
          </div>

          {/* HUD Status Card */}
          <div className="mt-8 flex items-center space-x-6 rounded-lg border border-white/5 bg-[#070b14]/70 px-4 py-2.5 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Runic Shielding: <strong className="text-emerald-400">Active</strong></span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>Engine: <strong className="text-cyan-400">WebView2 Blink</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* Web Viewport Active Placeholder (native Wry overlays child window here) */
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <Globe className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="mt-3 text-sm font-bold tracking-wide text-slate-200">
            Viewing: {activeTab?.title || activeTab?.url}
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {activeTab?.url}
          </p>

          {!mimirIpc.isNative() && (
            <button
              onClick={() => setShowIframeInDev(!showIframeInDev)}
              className="mt-4 rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20"
            >
              {showIframeInDev ? 'Switch to HUD View' : 'Toggle Web Preview (IFrame)'}
            </button>
          )}
        </div>
      )}
    </main>
  );
};
