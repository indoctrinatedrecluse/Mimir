import React, { useState, useEffect } from 'react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer,
  Code2,
  FileCode,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
} from 'lucide-react';

export interface RunicInscription {
  id: string;
  name: string;
  description: string;
  matchPattern: string;
  realmFilter: RealmId | 'all';
  cssRules: string;
  jsRules: string;
  enabled: boolean;
}

const PRESET_INSCRIPTIONS: RunicInscription[] = [
  {
    id: 'preset-obsidian',
    name: 'Obsidian Dark Veil',
    description: 'Forces deep OLED black aesthetics and softened text contrast across any website.',
    matchPattern: '*://*/*',
    realmFilter: 'all',
    cssRules: `html, body { background-color: #05070a !important; color: #cbd5e1 !important; }
a { color: #00f5ff !important; }
img, video { opacity: 0.95; filter: contrast(105%); }`,
    jsRules: `// Obsidian Dark Veil active`,
    enabled: true,
  },
  {
    id: 'preset-typography',
    name: 'Mímir High-Legibility Typography',
    description: 'Enforces clean, modern system sans-serif fonts and enhanced line-height for effortless reading.',
    matchPattern: '*://*/*',
    realmFilter: 'alfheim',
    cssRules: `* { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; letter-spacing: 0.015em; }`,
    jsRules: ``,
    enabled: true,
  },
  {
    id: 'preset-reader',
    name: 'Cleanse Distractions',
    description: 'Strips sticky floating overlays, newsletter popups, and intrusive marketing banners.',
    matchPattern: '*://*/*',
    realmFilter: 'all',
    cssRules: `header[class*="sticky"], div[class*="newsletter"], div[class*="popup"], div[class*="overlay"]:not([role="dialog"]) { display: none !important; }`,
    jsRules: ``,
    enabled: false,
  },
  {
    id: 'preset-code-boost',
    name: 'Asgard Engineering Monospace',
    description: 'Forces crisp ligatures and high-contrast styling on pre and code blocks.',
    matchPattern: '*://github.com/*',
    realmFilter: 'asgard',
    cssRules: `pre, code, .blob-code { font-family: "Cascadia Code", "Fira Code", monospace !important; font-size: 13px !important; }`,
    jsRules: ``,
    enabled: true,
  },
];

interface BrokkrForgeProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
}

export const BrokkrForge: React.FC<BrokkrForgeProps> = ({
  isOpen,
  onClose,
  activeRealm,
}) => {
  const [inscriptions, setInscriptions] = useState<RunicInscription[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_brokkr_forge');
      return saved ? JSON.parse(saved) : PRESET_INSCRIPTIONS;
    } catch {
      return PRESET_INSCRIPTIONS;
    }
  });

  const [activeInscriptionId, setActiveInscriptionId] = useState<string>(
    PRESET_INSCRIPTIONS[0].id
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const currentInscription =
    inscriptions.find((i) => i.id === activeInscriptionId) || inscriptions[0];

  useEffect(() => {
    try {
      localStorage.setItem('mimir_brokkr_forge', JSON.stringify(inscriptions));
    } catch (e) {
      console.error('Failed to save Brokkr Forge', e);
    }
  }, [inscriptions]);

  const handleUpdate = <K extends keyof RunicInscription>(
    key: K,
    val: RunicInscription[K]
  ) => {
    setInscriptions((prev) =>
      prev.map((item) =>
        item.id === activeInscriptionId ? { ...item, [key]: val } : item
      )
    );
  };

  const handleToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runicAudio.playClick(700);
    setInscriptions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleAddNew = () => {
    runicAudio.playChime();
    const newId = `custom-rune-${Date.now()}`;
    const newInscription: RunicInscription = {
      id: newId,
      name: 'New Runic Style Inscription',
      description: 'Custom DOM rule forged in the fires of Nidavellir.',
      matchPattern: '*://*/*',
      realmFilter: 'all',
      cssRules: `/* Custom CSS for your domain */\nbody {\n  /* Inscribe styles */\n}`,
      jsRules: `// Custom user-script execution`,
      enabled: true,
    };
    setInscriptions((prev) => [newInscription, ...prev]);
    setActiveInscriptionId(newId);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runicAudio.playClick(400);
    if (inscriptions.length <= 1) return;
    const nextList = inscriptions.filter((i) => i.id !== id);
    setInscriptions(nextList);
    setActiveInscriptionId(nextList[0].id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070b14]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            style={{
              borderColor: `${theme.accentColor}35`,
              boxShadow: `0 0 40px -10px ${theme.glowColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center space-x-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${theme.accentColor}60`,
                    backgroundColor: `${theme.accentColor}15`,
                    color: theme.accentColor,
                  }}
                >
                  <Hammer className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">
                      BROKKR’S EXTENSION FORGE
                    </h2>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      USER-SCRIPTS & RUNIC STYLES
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Craft domain-specific CSS overrides, tamper scripts, and runic enhancements.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddNew}
                  className="flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    borderColor: `${theme.accentColor}50`,
                    backgroundColor: `${theme.accentColor}20`,
                    color: theme.accentColor,
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Forge Inscription</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Split Workspace: Left List / Right Editor */}
            <div className="flex flex-1 overflow-hidden">
              {/* Inscriptions Sidebar List */}
              <div className="w-80 border-r border-white/10 bg-white/[0.01] p-3 space-y-2 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  ACTIVE INSCRIPTIONS ({inscriptions.length})
                </div>

                {inscriptions.map((item) => {
                  const isSelected = item.id === activeInscriptionId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        runicAudio.playClick(600);
                        setActiveInscriptionId(item.id);
                      }}
                      className={`group relative flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-white/10 shadow-sm'
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.accentColor : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-bold text-slate-200 group-hover:text-white">
                          {item.name}
                        </span>
                        <button
                          onClick={(e) => handleToggle(item.id, e)}
                          className="text-slate-400 hover:text-white"
                          title={item.enabled ? 'Disable Inscription' : 'Enable Inscription'}
                        >
                          {item.enabled ? (
                            <ToggleRight className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-600" />
                          )}
                        </button>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                        {item.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5 text-[9px] font-mono text-slate-500">
                        <span className="truncate">{item.matchPattern}</span>
                        {inscriptions.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-2"
                            title="Delete Inscription"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inscription Code Editor */}
              {currentInscription ? (
                <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4">
                  {/* Name and Match Pattern */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        INSCRIPTION TITLE
                      </label>
                      <input
                        type="text"
                        value={currentInscription.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/60"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        URL MATCH PATTERN
                      </label>
                      <input
                        type="text"
                        value={currentInscription.matchPattern}
                        onChange={(e) => handleUpdate('matchPattern', e.target.value)}
                        placeholder="*://*.example.com/*"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-cyan-500/60"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      DESCRIPTION / PURPOSE
                    </label>
                    <input
                      type="text"
                      value={currentInscription.description}
                      onChange={(e) => handleUpdate('description', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  {/* CSS Code Editor */}
                  <div className="flex-1 flex flex-col space-y-1 min-h-[160px]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center space-x-1.5">
                        <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                        <span>RUNIC CSS STYLES (INJECTED ON DOM READY)</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">CSS3 Standard</span>
                    </div>
                    <textarea
                      value={currentInscription.cssRules}
                      onChange={(e) => handleUpdate('cssRules', e.target.value)}
                      rows={7}
                      className="w-full flex-1 rounded-xl border border-white/10 bg-[#050811] p-3 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                    />
                  </div>

                  {/* JS Script Code Editor */}
                  <div className="flex flex-col space-y-1 min-h-[120px]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center space-x-1.5">
                        <Code2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>RUNIC JAVASCRIPT LOGIC (OPTIONAL RUNTIME)</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">ESNext Sandboxed</span>
                    </div>
                    <textarea
                      value={currentInscription.jsRules}
                      onChange={(e) => handleUpdate('jsRules', e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-[#050811] p-3 font-mono text-xs text-amber-200 outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
