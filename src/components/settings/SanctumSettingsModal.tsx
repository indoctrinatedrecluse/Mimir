import React, { useState, useEffect } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Trash2,
  Lock,
  Sparkles,
  Check,
  Globe,
  Sliders,
  ExternalLink,
  Plus,
  RefreshCw,
  Cpu,
  EyeOff,
  Video,
  Key,
} from 'lucide-react';
import {
  getPrivacySettings,
  savePrivacySettings,
  PrivacySettings,
  SEARCH_ENGINES,
  SearchEngineId,
  ShieldLevel,
  CookiePolicy,
  ReferrerPolicy,
  getWhitelistedDomains,
  whitelistDomain,
  unwhitelistDomain,
} from '@/core/privacy/privacySettings';

interface SanctumSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  onOpenClearData?: () => void;
}

type SettingsTab = 'search' | 'shield' | 'fingerprint' | 'retention' | 'ai';

export const SanctumSettingsModal: React.FC<SanctumSettingsModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  onOpenClearData,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('search');
  const [settings, setSettings] = useState<PrivacySettings>(getPrivacySettings);
  const [whitelist, setWhitelist] = useState<string[]>(getWhitelistedDomains);
  const [newDomain, setNewDomain] = useState('');
  const [geminiKey, setGeminiKey] = useState(() => {
    try {
      return localStorage.getItem('mimir_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [keySaved, setKeySaved] = useState(false);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    if (isOpen) {
      setSettings(getPrivacySettings());
      setWhitelist(getWhitelistedDomains());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<PrivacySettings>) => {
    runicAudio.playClick(650);
    const updated = savePrivacySettings(partial);
    setSettings(updated);
  };

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    runicAudio.playChime();
    whitelistDomain(newDomain.trim());
    setWhitelist(getWhitelistedDomains());
    setNewDomain('');
  };

  const handleRemoveWhitelist = (domain: string) => {
    runicAudio.playClick(400);
    unwhitelistDomain(domain);
    setWhitelist(getWhitelistedDomains());
  };

  const handleSaveGeminiKey = () => {
    runicAudio.playChime();
    try {
      localStorage.setItem('mimir_gemini_api_key', geminiKey.trim());
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } catch {}
  };

  const navItems: { id: SettingsTab; label: string; norse: string; icon: React.ElementType }[] = [
    { id: 'search', label: 'Search Conduits', norse: 'Mímisbrunnr', icon: Search },
    { id: 'shield', label: 'Shield & Wards', norse: 'Svalinn Ward', icon: ShieldCheck },
    { id: 'fingerprint', label: 'Anti-Fingerprint', norse: 'Veil of Shadows', icon: Fingerprint },
    { id: 'retention', label: 'Fate Threads', norse: 'Urðr Memory', icon: Trash2 },
    { id: 'ai', label: 'AI Scout Key', norse: 'Huginn Intel', icon: Sparkles },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex h-[620px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090d16]/95 text-slate-100 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          style={{ borderColor: `${theme.accentColor}30` }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b border-white/10 px-6 py-4"
            style={{
              background: `linear-gradient(90deg, ${theme.accentColor}10, transparent)`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: `${theme.accentColor}15`,
                  borderColor: `${theme.accentColor}40`,
                  color: theme.accentColor,
                  boxShadow: `0 0 16px ${theme.glowColor}`,
                }}
              >
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-black tracking-wide text-white uppercase">Sanctum Privacy & Settings</h2>
                  <span
                    className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider border"
                    style={{
                      borderColor: `${theme.accentColor}40`,
                      backgroundColor: `${theme.accentColor}15`,
                      color: theme.accentColor,
                    }}
                  >
                    SOVEREIGNTY
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Control your search oracles, shield defenses, and data permanence
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(500);
                onClose();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body: Sidebar Tabs + Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-56 border-r border-white/10 bg-black/30 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      runicAudio.playClick(600);
                      setActiveTab(item.id);
                    }}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(0,245,255,0.25)]'
                        : 'border border-transparent text-slate-400 hover:border-white/5 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isSelected ? 'text-cyan-400' : 'text-slate-500'
                        }`}
                      />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        <span className="text-[9px] font-mono text-slate-500">{item.norse}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="pt-6 px-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Active Realm</span>
                  <div className="text-xs font-black capitalize mt-0.5" style={{ color: theme.accentColor }}>
                    {activeRealm}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                    Settings apply globally across all 9 realms.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: SEARCH CONDUITS */}
              {activeTab === 'search' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <Search className="h-4 w-4 text-cyan-400" />
                      <span>Default Search Oracle</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose which oracle parses unknown queries in the Omnibar and New Tab Sanctum. DuckDuckGo is the sacred default for untracked knowledge.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((id) => {
                      const engine = SEARCH_ENGINES[id];
                      const isSelected = settings.searchEngine === id;
                      return (
                        <div
                          key={id}
                          onClick={() => handleUpdate({ searchEngine: id })}
                          className={`relative cursor-pointer rounded-xl border p-3.5 transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,245,255,0.2)]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 font-mono text-xs font-black text-cyan-400 border border-white/10">
                                {engine.iconRune}
                              </span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-white">{engine.name}</span>
                                  {id === 'duckduckgo' && (
                                    <span className="rounded bg-cyan-400/20 px-1 py-0.2 text-[8px] font-mono font-bold text-cyan-300 border border-cyan-400/40">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">{engine.norseTitle}</span>
                              </div>
                            </div>

                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-black ${
                                engine.privacyGrade === 'A+'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : engine.privacyGrade === 'A' || engine.privacyGrade === 'A-'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              Grade {engine.privacyGrade}
                            </span>
                          </div>

                          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
                            {engine.description}
                          </p>

                          {isSelected && (
                            <div className="absolute bottom-2.5 right-3 flex items-center space-x-1 text-[10px] font-mono font-bold text-cyan-400">
                              <Check className="h-3 w-3" />
                              <span>ACTIVE ORACLE</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Search Suggestions Toggle */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Interactive Query Suggestions</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Provide local search history and domain suggestions as you type in Mímisbrunnr.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ searchSuggestions: !settings.searchSuggestions })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.searchSuggestions ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.searchSuggestions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SHIELD & WARDS (ADBLOCK) */}
              {activeTab === 'shield' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Svalinn Ward & Adblock Sentinel</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Mímir features high-velocity native network filtering and YouTube ad interception turned on out of the box.
                    </p>
                  </div>

                  {/* Shield Strength Level */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Shield Protection Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: 'standard',
                          label: 'Standard (Sacred)',
                          desc: 'Blocks ads, video pre-rolls, analytics, and known trackers while maintaining high website compatibility.',
                          badge: 'Recommended',
                        },
                        {
                          id: 'aggressive',
                          label: 'Aggressive (Valhalla)',
                          desc: 'Aggressively strikes 3rd-party scripts and all telemetry beacons. May affect deeply integrated web portals.',
                          badge: 'Maximum Defense',
                        },
                        {
                          id: 'permissive',
                          label: 'Permissive',
                          desc: 'Permits non-intrusive affiliate and sponsorship notices while shielding against malware.',
                          badge: 'Minimal',
                        },
                      ].map((lvl) => {
                        const isSelected = settings.shieldLevel === lvl.id;
                        return (
                          <div
                            key={lvl.id}
                            onClick={() => handleUpdate({ shieldLevel: lvl.id as ShieldLevel })}
                            className={`cursor-pointer rounded-xl border p-3 transition-all ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{lvl.label}</span>
                              <span className="rounded bg-white/10 px-1.5 py-0.2 text-[8px] font-mono text-slate-300">
                                {lvl.badge}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{lvl.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* YouTube Sentinel Toggle */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-emerald-200">YouTube Ad Sentinel</span>
                          <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                            ON BY DEFAULT
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Dissolves pre-roll and mid-roll commercials, skips sponsors, and sweeps tracking beacons on YouTube.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdate({ youtubeSentinel: !settings.youtubeSentinel })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.youtubeSentinel ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.youtubeSentinel ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cosmetic Banner Suppression Toggle */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Cosmetic Ad Container Hiding</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Collapses empty advertisement boxes, promo banners, and cookie consent nags via procedural CSS rules.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ cosmeticBannerHiding: !settings.cosmeticBannerHiding })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.cosmeticBannerHiding ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.cosmeticBannerHiding ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Domain Whitelist */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">Lowered Wards (Domain Whitelist)</div>
                        <p className="text-[11px] text-slate-400">
                          Domains where adblocking and filtering are explicitly paused.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{whitelist.length} whitelisted</span>
                    </div>

                    <form onSubmit={handleAddWhitelist} className="flex space-x-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. news.ycombinator.com"
                        className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        className="flex items-center space-x-1 rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Whitelist</span>
                      </button>
                    </form>

                    {whitelist.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                        {whitelist.map((domain) => (
                          <div
                            key={domain}
                            className="flex items-center space-x-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-mono text-slate-300"
                          >
                            <span>{domain}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveWhitelist(domain)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-slate-500 italic py-1">
                        No domains currently whitelisted. Svalinn Ward protects all conduits.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ANTI-FINGERPRINTING */}
              {activeTab === 'fingerprint' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <Fingerprint className="h-4 w-4 text-purple-400" />
                      <span>Veil of Shadows (Anti-Fingerprinting Armor)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Thwart cryptographic canvas tracking, audio hardware profiling, and cross-site telemetry beacons.
                    </p>
                  </div>

                  {/* GPC Signal */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">Global Privacy Control (GPC)</span>
                        <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[8px] font-mono font-bold text-purple-300 border border-purple-500/40">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Transmits <code className="font-mono text-slate-300">Sec-GPC: 1</code> and sets{' '}
                        <code className="font-mono text-slate-300">navigator.globalPrivacyControl = true</code> to legally forbid data brokering.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ globalPrivacyControl: !settings.globalPrivacyControl })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.globalPrivacyControl ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.globalPrivacyControl ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* DNT Signal */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Do Not Track Header (DNT)</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dispatches <code className="font-mono text-slate-300">DNT: 1</code> across all HTTP/HTTPS conduits.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ doNotTrack: !settings.doNotTrack })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.doNotTrack ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.doNotTrack ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Canvas Perturbation */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">Canvas & Audio Noise Perturbation</span>
                        <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                          HARDWARE DEFENSE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Injects imperceptible microscopic noise into HTML5 Canvas readbacks to disrupt deterministic GPU fingerprinting.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ canvasNoiseProtection: !settings.canvasNoiseProtection })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.canvasNoiseProtection ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.canvasNoiseProtection ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Referrer Policy */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <label className="text-xs font-bold text-slate-200">Outbound Referrer Sanctum Policy</label>
                    <p className="text-[11px] text-slate-400">
                      Determine how much path information is exposed when following links to other websites.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          id: 'strict-origin',
                          label: 'Strict Origin',
                          desc: 'Only reveals domain name (strips path & search parameters).',
                        },
                        {
                          id: 'no-referrer',
                          label: 'No Referrer',
                          desc: 'Maximum stealth. Never transmits outbound origin.',
                        },
                        {
                          id: 'standard',
                          label: 'Standard',
                          desc: 'Follows destination website referrer policies.',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdate({ referrerPolicy: item.id as ReferrerPolicy })}
                          className={`rounded-lg border p-2.5 text-left transition-all ${
                            settings.referrerPolicy === item.id
                              ? 'border-purple-400 bg-purple-500/20 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                              : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RETENTION & FATE THREADS */}
              {activeTab === 'retention' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <Trash2 className="h-4 w-4 text-rose-400" />
                      <span>Fate Threads & Sanctum Memory</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Govern how long history, cookies, and cached artifacts persist across application cycles.
                    </p>
                  </div>

                  {/* Auto-Purge on Exit Toggle */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Auto-Purge on Sanctum Exit</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Automatically incinerates browsing history, session tokens, and cached web data when Mímir is closed.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdate({ autoPurgeOnExit: !settings.autoPurgeOnExit })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings.autoPurgeOnExit ? 'bg-rose-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          settings.autoPurgeOnExit ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cookie Policy */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <label className="text-xs font-bold text-slate-200">Third-Party Cookie Isolation</label>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          id: 'isolate-third-party',
                          label: 'Partitioned Isolation',
                          desc: 'Cross-site cookies are sandboxed per domain (prevents cross-web tracking).',
                        },
                        {
                          id: 'block-all-third-party',
                          label: 'Block All Third-Party',
                          desc: 'Strictly blocks all cross-domain cookies (may break federated logins).',
                        },
                        {
                          id: 'allow-all',
                          label: 'Allow All',
                          desc: 'Permits traditional third-party cookies without partitioning.',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdate({ cookiePolicy: item.id as CookiePolicy })}
                          className={`rounded-lg border p-2.5 text-left transition-all ${
                            settings.cookiePolicy === item.id
                              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                              : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Purge Trigger */}
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-300">Incinerate Browsing Data Now</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Open the Fate Thread Purge dialog to selectively wipe caches, history, and tokens.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        runicAudio.playClick(600);
                        onClose();
                        onOpenClearData?.();
                      }}
                      className="flex items-center space-x-1.5 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Open Fate Purge</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: AI SCOUT KEY */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      <span>Huginn AI Intelligence Conduit</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure your private Gemini API Key for deep web summarization, page analysis, and translation without third-party proxy telemetry.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                      <Key className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Google Gemini API Key</span>
                    </label>

                    <div className="flex space-x-2">
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGeminiKey}
                        className="flex items-center space-x-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all"
                      >
                        {keySaved ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <span>Inscribe Key</span>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Stored exclusively inside your local browser vault. Calls are issued directly from your machine to Google Generative AI endpoints.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-6 py-3">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sovereignty Assured • Zero Cloud Telemetry</span>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(600);
                onClose();
              }}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Seal Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
