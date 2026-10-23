import React, { useState, useEffect, useRef, useMemo } from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Search,
  Compass,
  BookOpen,
  Terminal,
  Columns,
  Feather,
  Hammer,
  Network,
  Volume2,
  VolumeX,
  Clock,
  Globe,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankedSuggestions, SuggestionItem, cleanDisplayUrl } from '@/core/navigation/autosuggest';
import { SecurityWardWidget } from './SecurityWardWidget';

interface OmnibarProps {
  currentUrl: string;
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
  isLoading?: boolean;
  onToggleHuginn?: () => void;
  isHuginnOpen?: boolean;
  onToggleMuninn?: () => void;
  isMuninnOpen?: boolean;
  onToggleSplitGaze?: () => void;
  isSplitGazeActive?: boolean;
  onToggleBifrost?: () => void;
  onToggleForge?: () => void;
  isAmbientPlaying?: boolean;
  onToggleAmbient?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  zoomLevel?: number;
  onToggleDownloads?: () => void;
  downloadCount?: number;
  onToggleFind?: () => void;
  onBookmarkCurrent?: () => void;
  isCurrentBookmarked?: boolean;
  onPrint?: () => void;
  onOpenClearData?: () => void;
  isDownloadsOpen?: boolean;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  currentUrl,
  activeRealm,
  onNavigate,
  isLoading = false,
  onToggleHuginn,
  isHuginnOpen = false,
  onToggleMuninn,
  isMuninnOpen = false,
  onToggleSplitGaze,
  isSplitGazeActive = false,
  onToggleBifrost,
  onToggleForge,
  isAmbientPlaying = false,
  onToggleAmbient,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomLevel = 100,
  onToggleDownloads,
  downloadCount = 0,
  onToggleFind,
  onBookmarkCurrent,
  isCurrentBookmarked = false,
  onPrint,
  onOpenClearData,
  isDownloadsOpen = false,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSecurityWidgetOpen, setIsSecurityWidgetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    setInputVal(currentUrl);
    setSelectedIndex(-1);
  }, [currentUrl]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute ranked autosuggest items whenever input changes or bar focuses
  const rankedSuggestions = useMemo(() => {
    return getRankedSuggestions(inputVal, 7);
  }, [inputVal, isFocused]);

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
    setSelectedIndex(-1);
    onNavigate(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < rankedSuggestions.length) {
      handleNavigateTarget(rankedSuggestions[selectedIndex].url);
      return;
    }
    if (!inputVal.trim()) return;
    handleNavigateTarget(inputVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || rankedSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      runicAudio.playClick(600);
      const nextIndex = selectedIndex < rankedSuggestions.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(nextIndex);
      // Auto-populate input bar with selected clean URL or query
      const selected = rankedSuggestions[nextIndex];
      if (selected.type === 'search') {
        // keep query
      } else {
        setInputVal(selected.cleanUrl);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      runicAudio.playClick(600);
      const prevIndex = selectedIndex <= 0 ? rankedSuggestions.length - 1 : selectedIndex - 1;
      setSelectedIndex(prevIndex);
      const selected = rankedSuggestions[prevIndex];
      if (selected.type === 'search') {
        // keep query
      } else {
        setInputVal(selected.cleanUrl);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
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

  const getItemIcon = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'bookmark':
        return Bookmark;
      case 'history':
        return Clock;
      case 'gateway':
        return Globe;
      case 'search':
      default:
        return Search;
    }
  };

  const getItemColor = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'bookmark':
        return '#f59e0b'; // amber
      case 'history':
        return '#06b6d4'; // cyan
      case 'gateway':
        return '#a855f7'; // purple
      case 'search':
      default:
        return theme.accentColor;
    }
  };

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
          {/* Dynamic Security / HTTPS Indicator & Lock Widget Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              runicAudio.playClick(800);
              setIsSecurityWidgetOpen(!isSecurityWidgetOpen);
            }}
            className="flex items-center pl-3 pr-2 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            title={
              currentUrl.startsWith('https://')
                ? 'Sacred Conduit (Encrypted HTTPS) — Click to view Security Ward'
                : currentUrl.startsWith('http://')
                ? 'Unshielded Passage (HTTP) — Click to view Security Ward'
                : 'Mímir Sanctuary (Internal) — Click to view Security Ward'
            }
          >
            {currentUrl.startsWith('https://') ? (
              <Lock className="h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            ) : currentUrl.startsWith('http://') ? (
              <ShieldAlert className="h-3.5 w-3.5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
            )}
          </button>

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
            onChange={(e) => {
              setInputVal(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              runicAudio.playRunicHum();
            }}
            placeholder="Drink from Mímisbrunnr... (Search or enter destination URL)"
            className="h-8 flex-1 bg-transparent text-xs tracking-wide text-slate-100 outline-none placeholder:text-slate-500/70"
          />

          {/* Right side icons */}
          <div className="flex items-center space-x-1.5 pr-2">
            {/* Bookmark / Runestone */}
            <button
              type="button"
              onClick={() => {
                runicAudio.playClick(isCurrentBookmarked ? 400 : 900);
                onBookmarkCurrent?.();
              }}
              className={`p-1 transition-colors hover:text-amber-400 ${
                isCurrentBookmarked
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                  : 'text-slate-500'
              }`}
              title={isCurrentBookmarked ? 'Remove Runestone (Unbookmark)' : 'Carve Runestone (Bookmark destination)'}
            >
              {isCurrentBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
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

        {/* Echoes from the Well (Ranked Autosuggest Dropdown) */}
        <AnimatePresence>
          {isFocused && rankedSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-lg border border-white/10 bg-[#080d17]/98 p-1.5 shadow-2xl backdrop-blur-2xl z-50"
              style={{
                borderColor: `${theme.accentColor}40`,
                boxShadow: `0 12px 35px -5px rgba(0, 0, 0, 0.85), 0 0 20px -5px ${theme.glowColor}`,
              }}
            >
              <div className="px-2 py-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase flex items-center justify-between border-b border-white/5 mb-1">
                <span>ECHOES FROM MÍMISBRUNNR • AUTOSUGGEST</span>
                <span className="text-[8px] font-mono" style={{ color: theme.accentColor }}>
                  {theme.primaryRune} FRECENCY RANKED
                </span>
              </div>

              {rankedSuggestions.map((item, idx) => {
                const Icon = getItemIcon(item.type);
                const itemColor = getItemColor(item.type);
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleNavigateTarget(item.url);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group flex w-full items-center space-x-3 rounded-md px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'bg-white/10 border-l-2'
                        : 'hover:bg-white/[0.05] border-l-2 border-transparent'
                    }`}
                    style={{
                      borderLeftColor: isSelected ? itemColor : undefined,
                    }}
                  >
                    {/* Leading Runic Category Icon */}
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/[0.03] transition-colors shrink-0"
                      style={{ color: itemColor }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Information Cluster */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                          {item.title}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.2 text-[8px] font-bold font-mono tracking-wider shrink-0"
                          style={{
                            backgroundColor: `${itemColor}20`,
                            color: itemColor,
                            border: `1px solid ${itemColor}40`,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span className="truncate" style={{ color: isSelected ? theme.accentColor : undefined }}>
                          {item.cleanUrl}
                        </span>
                        {item.visitCount && item.visitCount > 1 && (
                          <span className="shrink-0 text-[9px] text-slate-400">
                            ({item.visitCount} visits)
                          </span>
                        )}
                        {item.timestamp && (
                          <span className="shrink-0 text-[9px] text-slate-500">
                            • {item.timestamp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trailing Selection Indicator */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Norse Command Hub (Right Cluster) */}
      <div className="flex items-center pl-2 space-x-1.5">
        {/* Find in Page (Rune Seeker) */}
        <button
          onClick={() => {
            runicAudio.playClick(600);
            onToggleFind?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          title="Rune Seeker (Find in Page — Ctrl+F)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center rounded border border-white/10 bg-white/[0.03] text-slate-400">
          <button
            onClick={() => {
              runicAudio.playClick(500);
              onZoomOut?.();
            }}
            className="flex h-8 w-6 items-center justify-center hover:text-white hover:bg-white/[0.08] transition-all rounded-l"
            title="Diminish Gaze (Zoom Out — Ctrl+-)"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onZoomReset?.();
            }}
            className="px-1.5 py-1 text-[10px] font-mono hover:text-white transition-colors"
            title="Reset Gaze (Zoom 100% — Ctrl+0)"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => {
              runicAudio.playClick(500);
              onZoomIn?.();
            }}
            className="flex h-8 w-6 items-center justify-center hover:text-white hover:bg-white/[0.08] transition-all rounded-r"
            title="Magnify Gaze (Zoom In — Ctrl++)"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>

        {/* Mímir's Hoard (Downloads) */}
        <button
          onClick={() => {
            runicAudio.playClick(600);
            onToggleDownloads?.();
          }}
          className={`relative flex h-8 w-8 items-center justify-center rounded border transition-all ${
            isDownloadsOpen
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Mímir's Hoard (Downloads — Ctrl+J)"
        >
          <Download className="h-3.5 w-3.5" />
          {downloadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-black"
              style={{ backgroundColor: theme.accentColor }}
            >
              {downloadCount}
            </span>
          )}
        </button>

        {/* Print Page */}
        <button
          onClick={() => {
            runicAudio.playClick(500);
            onPrint?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          title="Inscribe Parchment (Print Page — Ctrl+P)"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>

        {/* Odin's Split-Gaze (Hliðskjálf) */}
        <button
          onClick={() => {
            runicAudio.playClick(650);
            onToggleSplitGaze?.();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-all ${
            isSplitGazeActive
              ? 'border-cyan-400 bg-cyan-500/25 text-cyan-300 shadow-[0_0_10px_rgba(0,245,255,0.4)]'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Odin's Split-Gaze (Toggle Hliðskjálf Dual-Viewport)"
        >
          <Columns className="h-3.5 w-3.5" />
        </button>

        {/* Gjallarhorn Ambient Soundscape */}
        <button
          onClick={() => {
            runicAudio.playClick(500);
            onToggleAmbient?.();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-all ${
            isAmbientPlaying
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title={isAmbientPlaying ? 'Gjallarhorn Soundscape: Playing (Click to mute)' : 'Gjallarhorn Soundscape: Muted (Click to play realm atmosphere)'}
        >
          {isAmbientPlaying ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>

        {/* Bifröst Matrix */}
        <button
          onClick={() => {
            runicAudio.playRunicHum();
            onToggleBifrost?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          title="Bifröst Matrix (Per-Realm Proxy & DoH Conduits)"
        >
          <Network className="h-3.5 w-3.5" />
        </button>

        {/* Brokkr's Forge */}
        <button
          onClick={() => {
            runicAudio.playClick(550);
            onToggleForge?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          title="Brokkr's Forge (User-Scripts & Custom Runic Styles)"
        >
          <Hammer className="h-3.5 w-3.5" />
        </button>

        {/* Muninn's Vault (Memory & Runestones) */}
        <button
          onClick={() => {
            runicAudio.playChime();
            onToggleMuninn?.();
          }}
          className={`flex h-8 items-center space-x-1 rounded border px-2 text-[11px] font-bold tracking-wider transition-all ${
            isMuninnOpen
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,245,255,0.4)]'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Muninn's Vault (Memory, Runestones & Fate Threads)"
        >
          <Feather className="h-3.5 w-3.5" />
          <span className="hidden xl:inline font-mono">MUNINN</span>
        </button>

        {/* Huginn AI Scout */}
        <button
          onClick={() => {
            runicAudio.playChime();
            onToggleHuginn?.();
          }}
          className={`group flex h-8 items-center space-x-1.5 rounded border px-2.5 text-[11px] font-bold tracking-wider transition-all backdrop-blur-md active:scale-95 ${
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

      {/* Security Ward & Privacy Lock Widget */}
      <SecurityWardWidget
        isOpen={isSecurityWidgetOpen}
        onClose={() => setIsSecurityWidgetOpen(false)}
        currentUrl={currentUrl}
        activeRealm={activeRealm}
        onOpenClearData={onOpenClearData}
      />
    </div>
  );
};
