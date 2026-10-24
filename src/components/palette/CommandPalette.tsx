import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Columns,
  Sparkles,
  Bookmark,
  Network,
  Hammer,
  Volume2,
  VolumeX,
  Compass,
  Shield,
  Trash2,
  RefreshCw,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sliders,
  Feather,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  Pin,
  Copy,
  BookOpen,
  PanelRight,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'Tabs & Navigation' | 'Wisdom & Ravens' | 'Viewports & Tools' | 'The Nine Realms' | 'System & Wards';
  title: string;
  description: string;
  shortcut?: string;
  rune: string;
  icon: React.ElementType;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  onNewTab: () => void;
  onCloseTab: () => void;
  onToggleSplitGaze: () => void;
  onToggleHuginn: () => void;
  onToggleMuninn: () => void;
  onToggleBifrost: () => void;
  onToggleForge: () => void;
  onToggleAmbient: () => void;
  isAmbientPlaying: boolean;
  onSelectRealm: (realm: RealmId) => void;
  onNavigateHome: () => void;
  onRefresh: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onPrint?: () => void;
  onOpenFind?: () => void;
  onOpenDownloads?: () => void;
  onOpenClearData?: () => void;
  onPinActiveTab?: () => void;
  onDuplicateActiveTab?: () => void;
  onToggleReader?: () => void;
  onToggleSidecar?: () => void;
  onRestoreValhalla?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  activeRealm,
  onNewTab,
  onCloseTab,
  onToggleSplitGaze,
  onToggleHuginn,
  onToggleMuninn,
  onToggleBifrost,
  onToggleForge,
  onToggleAmbient,
  isAmbientPlaying,
  onSelectRealm,
  onNavigateHome,
  onRefresh,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrint,
  onOpenFind,
  onOpenDownloads,
  onOpenClearData,
  onPinActiveTab,
  onDuplicateActiveTab,
  onToggleReader,
  onToggleSidecar,
  onRestoreValhalla,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Auto-focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Tabs & Navigation
      {
        id: 'new-tab',
        category: 'Tabs & Navigation',
        title: 'New Tab (Sprout Branch of Yggdrasil)',
        description: 'Open a fresh web conduit across the digital branches',
        shortcut: 'Ctrl+T',
        rune: 'ᛏ',
        icon: Plus,
        action: onNewTab,
      },
      {
        id: 'close-tab',
        category: 'Tabs & Navigation',
        title: 'Close Active Conduit',
        description: 'Sever the current tab thread and return to prior sanctuary',
        shortcut: 'Ctrl+W',
        rune: 'ᚺ',
        icon: X,
        action: onCloseTab,
      },
      {
        id: 'refresh-tab',
        category: 'Tabs & Navigation',
        title: 'Re-commune with the Well (Refresh Page)',
        description: 'Reload active web content through the Blink runtime',
        shortcut: 'Ctrl+R',
        rune: 'ᚱ',
        icon: RotateCw,
        action: onRefresh,
      },
      {
        id: 'home-sanctum',
        category: 'Tabs & Navigation',
        title: 'Return to Sacred Well (Home Sanctum)',
        description: 'Navigate to mimir://newtab and commune with realm lore',
        rune: 'ᛗ',
        icon: Compass,
        action: onNavigateHome,
      },

      // Wisdom & Ravens
      {
        id: 'huginn-scout',
        category: 'Wisdom & Ravens',
        title: 'Summon Huginn AI Scout (Thought / Hugr)',
        description: 'Scour active page for 4-point lore synthesis and security audit',
        shortcut: 'Ctrl+H',
        rune: 'ᚲ',
        icon: Sparkles,
        action: onToggleHuginn,
      },
      {
        id: 'muninn-vault',
        category: 'Wisdom & Ravens',
        title: "Muninn's Memory Vault (Memory / Munr)",
        description: 'Explore carved Runestones (bookmarks) and Threads of Fate (history)',
        shortcut: 'Ctrl+M',
        rune: 'ᛚ',
        icon: Bookmark,
        action: onToggleMuninn,
      },
      {
        id: 'reader-sanctum',
        category: 'Wisdom & Ravens',
        title: 'Enter Reader Sanctum (Distraction-Free Reading)',
        description: 'Cleanse page of trackers, ads, and sidebars into pure parchment or obsidian view',
        shortcut: 'Alt+R',
        rune: 'ᛗ',
        icon: BookOpen,
        action: onToggleReader || (() => {}),
      },
      {
        id: 'runic-sidecar',
        category: 'Wisdom & Ravens',
        title: 'Toggle Runic Sidecar Dock',
        description: 'Open persistent right sidebar with Scratchpad Notes, Huginn AI, and Telemetry',
        shortcut: 'Ctrl+B',
        rune: 'ᚠ',
        icon: PanelRight,
        action: onToggleSidecar || (() => {}),
      },
      {
        id: 'valhalla-revival',
        category: 'Wisdom & Ravens',
        title: 'Revive Severed Session from Valhalla',
        description: 'Restore previous quest tabs and window hierarchy from Valhalla memory',
        rune: 'ᚲ',
        icon: RotateCw,
        action: onRestoreValhalla || (() => {}),
      },

      // Viewports & Tools
      {
        id: 'split-gaze',
        category: 'Viewports & Tools',
        title: "Odin's Split-Gaze (Toggle Hliðskjálf Dual-Viewport)",
        description: 'Divide HUD into concurrent side-by-side realm viewports',
        shortcut: 'Ctrl+\\',
        rune: 'ᚢ',
        icon: Columns,
        action: onToggleSplitGaze,
      },
      {
        id: 'brokkr-forge',
        category: 'Viewports & Tools',
        title: "Brokkr's Extension Forge",
        description: 'Inscribe domain user-scripts and custom runic CSS stylesheets',
        rune: 'ᛏ',
        icon: Hammer,
        action: onToggleForge,
      },
      {
        id: 'bifrost-matrix',
        category: 'Viewports & Tools',
        title: 'Bifröst Proxy Conduit Matrix',
        description: 'Configure per-realm network tunnels, Tor gateways & DoH resolvers',
        rune: 'ᛗ',
        icon: Network,
        action: onToggleBifrost,
      },
      {
        id: 'gjallarhorn-ambient',
        category: 'Viewports & Tools',
        title: isAmbientPlaying
          ? 'Gjallarhorn Soundscape: Silence Atmosphere'
          : 'Gjallarhorn Soundscape: Awaken Realm Synthesis',
        description: 'Continuous Web Audio procedural synthesizer tuned to active realm',
        rune: 'ᛞ',
        icon: isAmbientPlaying ? VolumeX : Volume2,
        action: onToggleAmbient,
      },

      // Security, Wards & Browser Operations
      {
        id: 'find-in-page',
        category: 'Viewports & Tools',
        title: 'Rune Seeker (Find in Page)',
        description: 'Search for text runes and glyphs within active web content',
        shortcut: 'Ctrl+F',
        rune: 'ᛋ',
        icon: Search,
        action: () => onOpenFind?.(),
      },
      {
        id: 'mimirs-hoard',
        category: 'Viewports & Tools',
        title: "Mímir's Hoard (Downloads Manager)",
        description: 'Inspect acquired artifacts and downloaded manuscripts',
        shortcut: 'Ctrl+J',
        rune: 'ᚠ',
        icon: Download,
        action: () => onOpenDownloads?.(),
      },
      {
        id: 'zoom-in',
        category: 'Viewports & Tools',
        title: 'Magnify Realm Gaze (Zoom In)',
        description: 'Increase active viewport magnification by 10%',
        shortcut: 'Ctrl++',
        rune: 'ᚨ',
        icon: ZoomIn,
        action: () => onZoomIn?.(),
      },
      {
        id: 'zoom-out',
        category: 'Viewports & Tools',
        title: 'Diminish Realm Gaze (Zoom Out)',
        description: 'Decrease active viewport magnification by 10%',
        shortcut: 'Ctrl+-',
        rune: 'ᚨ',
        icon: ZoomOut,
        action: () => onZoomOut?.(),
      },
      {
        id: 'zoom-reset',
        category: 'Viewports & Tools',
        title: 'Reset Realm Gaze (Zoom 100%)',
        description: 'Restore default 100% viewport magnification',
        shortcut: 'Ctrl+0',
        rune: 'ᚨ',
        icon: RotateCw,
        action: () => onZoomReset?.(),
      },
      {
        id: 'print-page',
        category: 'Viewports & Tools',
        title: 'Inscribe Parchment (Print Page)',
        description: 'Send current viewport content to system printing conduit',
        shortcut: 'Ctrl+P',
        rune: 'ᛈ',
        icon: Printer,
        action: () => onPrint?.(),
      },
      {
        id: 'pin-tab',
        category: 'Tabs & Navigation',
        title: 'Pin Branch of Fate (Lock Tab)',
        description: 'Anchor active tab to prevent accidental severance',
        rune: 'ᛏ',
        icon: Pin,
        action: () => onPinActiveTab?.(),
      },
      {
        id: 'duplicate-tab',
        category: 'Tabs & Navigation',
        title: 'Duplicate Fate Thread (Clone Active Tab)',
        description: 'Spawn an identical branch with current URL and realm',
        rune: 'ᛞ',
        icon: Copy,
        action: () => onDuplicateActiveTab?.(),
      },
      {
        id: 'purge-data',
        category: 'System & Wards',
        title: 'Purge Threads of Fate (Clear Browsing Data)',
        description: 'Wipe history, cookies, cache, and localStorage tokens',
        shortcut: 'Ctrl+Shift+Del',
        rune: 'ᚦ',
        icon: Trash2,
        action: () => onOpenClearData?.(),
      },
    ];

    // The Nine Realms Switchers
    (Object.keys(REALMS) as RealmId[]).forEach((rId) => {
      const r = REALMS[rId];
      list.push({
        id: `realm-${rId}`,
        category: 'The Nine Realms',
        title: `Commune with ${r.name} (${r.norseName})`,
        description: `Sovereign ${r.ruler} • ${r.rulerTitle}`,
        rune: r.rune,
        icon: Compass,
        action: () => onSelectRealm(rId),
      });
    });

    return list;
  }, [
    isAmbientPlaying,
    onNewTab,
    onCloseTab,
    onRefresh,
    onNavigateHome,
    onToggleHuginn,
    onToggleMuninn,
    onToggleSplitGaze,
    onToggleForge,
    onToggleBifrost,
    onToggleAmbient,
    onSelectRealm,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Reset selectedIndex when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      runicAudio.playClick(600);
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      runicAudio.playClick(600);
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        runicAudio.playChime();
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#070b14]/98 shadow-2xl backdrop-blur-3xl z-10 flex flex-col"
          style={{
            borderColor: `${theme.accentColor}40`,
            boxShadow: `0 20px 60px -15px rgba(0, 0, 0, 0.9), 0 0 25px -5px ${theme.glowColor}`,
          }}
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center border-b border-white/10 px-4 py-3.5">
            <Search className="h-4 w-4 mr-3" style={{ color: theme.accentColor }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Seek command, feature, realm or wisdom... (e.g. Split-Gaze, Huginn, Asgard)"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-500 hover:text-slate-300 transition-colors mr-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.03]"
          >
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <span className="text-2xl font-mono text-slate-600">ᛗ</span>
                <p className="mt-2 text-xs font-mono">No runic command found matching "{query}"</p>
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      runicAudio.playChime();
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? 'bg-white/10 border-l-2'
                        : 'hover:bg-white/[0.04] border-l-2 border-transparent'
                    }`}
                    style={{
                      borderLeftColor: isSelected ? theme.accentColor : undefined,
                    }}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Leading Runic Glyph Icon */}
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] transition-colors shrink-0"
                        style={{
                          color: isSelected ? theme.accentColor : '#94a3b8',
                          borderColor: isSelected ? `${theme.accentColor}50` : undefined,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`truncate text-xs font-bold transition-colors ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {cmd.title}
                          </span>
                          <span className="rounded bg-white/5 px-1.5 py-0.2 text-[8px] font-mono text-slate-400 border border-white/5 shrink-0">
                            {cmd.category}
                          </span>
                        </div>
                        <span className="truncate text-[10px] text-slate-400 mt-0.5">
                          {cmd.description}
                        </span>
                      </div>
                    </div>

                    {/* Trailing Shortcut / Rune indicator */}
                    <div className="flex items-center space-x-2 shrink-0 ml-3">
                      {cmd.shortcut && (
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono font-semibold text-slate-300">
                          {cmd.shortcut}
                        </span>
                      )}
                      <span
                        className="text-xs font-black font-serif opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ color: theme.accentColor }}
                      >
                        {cmd.rune}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[10px] font-mono text-slate-500 bg-[#05080f]/80">
            <div className="flex items-center space-x-3">
              <span>↑↓ Navigate</span>
              <span>↵ Execute</span>
              <span>ESC Dismiss</span>
            </div>
            <div className="flex items-center space-x-1.5" style={{ color: theme.accentColor }}>
              <span>HLIÐSKJÁLF COMMAND CENTER</span>
              <span className="font-serif font-black">{theme.primaryRune}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
