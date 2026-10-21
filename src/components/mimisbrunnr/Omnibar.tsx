import React, { useState, useEffect, useRef } from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { ArrowLeft, ArrowRight, RotateCw, Shield, Sparkles, Bookmark, Search, Compass, BookOpen, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OmnibarProps {
  currentUrl: string;
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
  isLoading?: boolean;
  onToggleHuginn?: () => void;
  isHuginnOpen?: boolean;
}

interface Suggestion {
  icon: React.ElementType;
  title: string;
  lore: string;
  action: () => void;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  currentUrl,
  activeRealm,
  onNavigate,
  isLoading = false,
  onToggleHuginn,
  isHuginnOpen = false,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    setInputVal(currentUrl);
  }, [currentUrl]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateTarget = (target: string) => {
    let url = target.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      }
    }
    runicAudio.playChime();
    setIsFocused(false);
    onNavigate(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleNavigateTarget(inputVal);
  };

  const handleBack = () => {
    runicAudio.playClick(650);
    mimirIpc.send({ type: 'GO_BACK' });
  };

  const handleForward = () => {
    runicAudio.playClick(750);
    mimirIpc.send({ type: 'GO_FORWARD' });
  };

  const handleRefresh = () => {
    runicAudio.playClick(900);
    mimirIpc.send({ type: 'REFRESH' });
  };

  const suggestions: Suggestion[] = [
    {
      icon: Search,
      title: inputVal.trim() ? `Search the Nine Realms for "${inputVal}"` : "Explore Mímisbrunnr",
      lore: "Direct wisdom query via DuckDuckGo",
      action: () => handleNavigateTarget(inputVal || "https://duckduckgo.com"),
    },
    {
      icon: Terminal,
      title: "GitHub — Forge of Code",
      lore: "Repositories, pull requests & code sanctums",
      action: () => handleNavigateTarget("https://github.com"),
    },
    {
      icon: BookOpen,
      title: "Rust Documentation — Iron Lore",
      lore: "Standard library, crates & borrow checker lore",
      action: () => handleNavigateTarget("https://doc.rust-lang.org"),
    },
    {
      icon: Sparkles,
      title: "Huginn AI Scout",
      lore: "Summon the raven of thought to analyze current page",
      action: () => {
        runicAudio.playChime();
        setIsFocused(false);
      },
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative z-20 flex h-12 w-full items-center justify-between border-b border-white/10 px-3 py-1.5 backdrop-blur-xl transition-colors duration-500"
      style={{
        background: 'linear-gradient(180deg, rgba(8, 12, 20, 0.95) 0%, rgba(5, 8, 14, 0.98) 100%)',
      }}
    >
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1 pr-2">
        <button
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="Return across the Bifröst (Back)"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleForward}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="Advance to Next Realm (Forward)"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleRefresh}
          className={`flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95 ${
            isLoading ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Re-commune with the Well (Refresh)"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Mímisbrunnr (The Well Omnibar Input) */}
      <div className="relative flex-1 max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-center rounded-lg border transition-all duration-300 ${
            isFocused
              ? 'bg-[#0b101c] shadow-lg'
              : 'border-white/10 bg-[#070b13]/80 hover:border-white/20 hover:bg-[#090e18]'
          }`}
          style={{
            borderColor: isFocused ? theme.accentColor : undefined,
            boxShadow: isFocused ? `0 0 16px ${theme.glowColor}` : undefined,
          }}
        >
          {/* Security Shield / Runic Ward Icon */}
          <div className="flex items-center pl-3 pr-2 text-slate-500">
            <Shield className="h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          {/* Norse Inscription Marker */}
          <span
            className="text-xs font-black pr-2 select-none opacity-60"
            style={{ color: theme.accentColor }}
          >
            ᚱ
          </span>

          {/* Input field */}
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              runicAudio.playRunicHum();
            }}
            placeholder="Drink from Mímisbrunnr... (Search or enter realm URL)"
            className="h-8 flex-1 bg-transparent text-xs tracking-wide text-slate-100 outline-none placeholder:text-slate-500/70"
          />

          {/* Right side icons */}
          <div className="flex items-center space-x-1.5 pr-2">
            {/* Bookmark / Runestone */}
            <button
              type="button"
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                runicAudio.playClick(isBookmarked ? 400 : 900);
              }}
              className={`p-1 transition-colors hover:text-amber-400 ${
                isBookmarked
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                  : 'text-slate-500'
              }`}
              title="Carve Runestone (Bookmark destination)"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>

            {/* Shortcut hint */}
            <span className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 sm:inline-block">
              Ctrl+L
            </span>

            {/* Search Trigger */}
            <button
              type="submit"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition-all hover:text-white"
              style={{
                backgroundColor: `${theme.accentColor}25`,
                color: theme.accentColor,
              }}
              title="Channel through the Well"
            >
              <Search className="h-3 w-3" />
            </button>
          </div>
        </form>

        {/* Echoes from the Well (Suggestion Dropdown) */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-lg border border-white/10 bg-[#090e18]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
              style={{
                borderColor: `${theme.accentColor}40`,
                boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px -5px ${theme.glowColor}`,
              }}
            >
              <div className="px-2 py-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase flex items-center justify-between border-b border-white/5 mb-1">
                <span>ECHOES FROM MÍMISBRUNNR</span>
                <span className="text-[8px] font-mono" style={{ color: theme.accentColor }}>
                  {theme.primaryRune} SACRED CONDUIT
                </span>
              </div>

              {suggestions.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      item.action();
                    }}
                    className="group flex w-full items-center space-x-3 rounded-md px-2.5 py-2 text-left transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/[0.03] transition-colors group-hover:border-white/20"
                      style={{ color: theme.accentColor }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                        {item.title}
                      </span>
                      <span className="truncate text-[10px] text-slate-500">
                        {item.lore}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Huginn AI Scout (Right Cluster) */}
      <div className="flex items-center pl-2 space-x-2">
        <button
          onClick={() => {
            runicAudio.playChime();
            onToggleHuginn?.();
          }}
          className={`group flex h-8 items-center space-x-1.5 rounded border px-3 text-[11px] font-bold tracking-wider transition-all backdrop-blur-md active:scale-95 ${
            isHuginnOpen ? 'ring-1 ring-cyan-400 brightness-125' : ''
          }`}
          style={{
            borderColor: `${theme.accentColor}50`,
            backgroundColor: isHuginnOpen ? `${theme.accentColor}30` : `${theme.accentColor}15`,
            color: theme.accentColor,
            boxShadow: `0 0 12px ${theme.glowColor}`,
          }}
          title="Huginn AI — Raven of Thought (Toggle Intelligence Panel)"
        >
          <Sparkles className={`h-3.5 w-3.5 transition-transform group-hover:rotate-12 ${isHuginnOpen ? 'animate-pulse' : ''}`} />
          <span className="hidden md:inline font-mono">HUGINN</span>
        </button>
      </div>
    </div>
  );
};
