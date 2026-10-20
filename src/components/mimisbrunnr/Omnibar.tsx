import React, { useState, useEffect } from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { ArrowLeft, ArrowRight, RotateCw, Shield, Sparkles, Bookmark, Search } from 'lucide-react';

interface OmnibarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  isLoading?: boolean;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  currentUrl,
  onNavigate,
  isLoading = false,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setInputVal(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    let target = inputVal.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }

    runicAudio.playChime();
    onNavigate(target);
    mimirIpc.send({ type: 'NAVIGATE', payload: { url: target } });
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

  return (
    <div className="relative z-20 flex h-12 w-full items-center justify-between border-b border-white/5 bg-[#090d15]/95 px-3 py-1.5 backdrop-blur-lg">
      {/* Navigation Cluster */}
      <div className="flex items-center space-x-1 pr-2">
        <button
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-white/5 hover:text-cyan-400 active:scale-95"
          title="Return across the Bifröst (Back)"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleForward}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-white/5 hover:text-cyan-400 active:scale-95"
          title="Advance to Next Realm (Forward)"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleRefresh}
          className={`flex h-8 w-8 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-white/5 hover:text-cyan-400 active:scale-95 ${
            isLoading ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Re-commune with the Well (Refresh)"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Mímisbrunnr (The Omnibar Input) */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-1 items-center rounded-md border transition-all duration-300 ${
          isFocused
            ? 'border-cyan-500/60 bg-[#0e1420] shadow-[0_0_15px_rgba(0,245,255,0.25)]'
            : 'border-white/10 bg-[#070b12]/80 hover:border-white/20 hover:bg-[#0c121d]'
        }`}
      >
        {/* Security / Runic Ward Icon */}
        <div className="flex items-center pl-3 pr-2 text-slate-500">
          <Shield className="h-3.5 w-3.5 text-emerald-400/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            runicAudio.playRunicHum();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="Drink from Mímisbrunnr... (Search or enter realm URL)"
          className="h-8 flex-1 bg-transparent text-xs tracking-wide text-slate-200 outline-none placeholder:text-slate-500/70"
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
              isBookmarked ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'text-slate-500'
            }`}
            title="Carve Runestone (Bookmark)"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>

          {/* Shortcut hint */}
          <span className="hidden rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 sm:inline-block">
            Ctrl+L
          </span>

          {/* Search Trigger */}
          <button
            type="submit"
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-cyan-500/10 text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_8px_rgba(0,245,255,0.4)]"
            title="Search the Nine Realms"
          >
            <Search className="h-3 w-3" />
          </button>
        </div>
      </form>

      {/* Huginn AI Scout (Right Cluster) */}
      <div className="flex items-center pl-2 space-x-1.5">
        <button
          onClick={() => {
            runicAudio.playChime();
          }}
          className="flex h-8 items-center space-x-1.5 rounded-sm border border-cyan-500/20 bg-cyan-500/10 px-2.5 text-[11px] font-semibold text-cyan-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(0,245,255,0.3)] active:scale-95"
          title="Huginn AI — Instant Scout & Summary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden md:inline">HUGINN</span>
        </button>
      </div>
    </div>
  );
};
