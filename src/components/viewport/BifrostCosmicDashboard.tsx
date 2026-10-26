import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Feather,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Terminal,
  Compass,
  BookOpen,
  Flame,
  Shield,
  Code,
  Sparkles,
  Cpu,
  Database,
  Music,
  Film,
  Zap,
  Activity,
  Layers,
  Lock,
  KeyRound,
  Eye,
  Wind,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { RealmId, Tab } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { MimirSigil } from '@/components/brand/MimirSigil';
import { getRandomHavamal, HavamalStanza } from '@/core/havamal';
import { runicAudio } from '@/core/audio/runicAudio';
import { buildSearchUrl } from '@/core/privacy/privacySettings';
import {
  bifrostManager,
  BifrostPortal,
  NorseTimeState,
  NorseDateState,
  RealmAtmosphereTelemetry,
} from '@/core/bifrost/bifrostManager';
import { AddPortalModal } from '@/components/viewport/AddPortalModal';
import { heimdallWatchManager } from '@/core/system/heimdallWatchManager';
import { svalinnProxyManager, SvalinnProxyConfig } from '@/core/privacy/proxyManager';
import { workspaceManager } from '@/core/workspaces/workspaceManager';
import { SystemTelemetryPayload } from '@/core/ipc/bridge';

interface BifrostCosmicDashboardProps {
  activeRealm: RealmId;
  onNavigate: (url: string) => void;
  onOpenWorkspaces?: () => void;
  onOpenProxyCloak?: () => void;
  onOpenHeimdallWatch?: () => void;
  onOpenMimirsEye?: () => void;
  onOpenTreasury?: () => void;
  onOpenRealmSelector?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Globe,
  Terminal,
  Compass,
  BookOpen,
  Flame,
  Shield,
  Code,
  Sparkles,
  Cpu,
  Database,
  Feather,
  Music,
  Film,
};

export const BifrostCosmicDashboard: React.FC<BifrostCosmicDashboardProps> = ({
  activeRealm,
  onNavigate,
  onOpenWorkspaces,
  onOpenProxyCloak,
  onOpenHeimdallWatch,
  onOpenMimirsEye,
  onOpenTreasury,
  onOpenRealmSelector,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [havamal, setHavamal] = useState<HavamalStanza>(getRandomHavamal());
  const [portals, setPortals] = useState<BifrostPortal[]>(bifrostManager.getPortals());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<BifrostPortal | null>(null);

  // Celestial time & calendar state
  const [norseTime, setNorseTime] = useState<NorseTimeState>(bifrostManager.getNorseTime());
  const [norseDate, setNorseDate] = useState<NorseDateState>(bifrostManager.getNorseDate());

  // Sovereign telemetry state
  const [telemetry, setTelemetry] = useState<SystemTelemetryPayload | null>(
    heimdallWatchManager.getTelemetry()
  );
  const [proxyConfig, setProxyConfig] = useState<SvalinnProxyConfig>(svalinnProxyManager.getConfig());
  const [activeWorkspace, setActiveWorkspace] = useState(workspaceManager.getActiveWorkspace());

  const realm = REALMS[activeRealm] || REALMS.midgard;
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const atmosphere: RealmAtmosphereTelemetry = bifrostManager.getRealmAtmosphere(activeRealm);

  // Subscribe to portals, time clock, and telemetry
  useEffect(() => {
    const unsubPortals = bifrostManager.subscribe((updated) => setPortals(updated));
    const unsubTelem = heimdallWatchManager.subscribe((telem: SystemTelemetryPayload) => setTelemetry(telem));
    const unsubProxy = svalinnProxyManager.subscribe((cfg: SvalinnProxyConfig) => setProxyConfig(cfg));

    const clockTimer = setInterval(() => {
      const now = new Date();
      setNorseTime(bifrostManager.getNorseTime(now));
      setNorseDate(bifrostManager.getNorseDate(now));
      setActiveWorkspace(workspaceManager.getActiveWorkspace());
    }, 1000);

    return () => {
      unsubPortals();
      unsubTelem();
      unsubProxy();
      clearInterval(clockTimer);
    };
  }, [activeRealm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let url = searchQuery.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = buildSearchUrl(url);
      }
    }
    runicAudio.playChime();
    onNavigate(url);
  };

  const cycleHavamal = () => {
    runicAudio.playChime();
    setHavamal(getRandomHavamal());
  };

  const handleDeletePortal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runicAudio.playClick(400);
    bifrostManager.removePortal(id);
  };

  const handleEditPortal = (portal: BifrostPortal, e: React.MouseEvent) => {
    e.stopPropagation();
    runicAudio.playClick(550);
    setEditingPortal(portal);
    setIsAddModalOpen(true);
  };

  const handleReclaimMemoryQuick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    runicAudio.playRunicHum();
    heimdallWatchManager.purgeWorkingSets();
  };

  // Format memory
  const formatMb = (bytes: number) => Math.round(bytes / (1024 * 1024));
  const totalMimirRamMb = telemetry ? formatMb(telemetry.total_mimir_memory_bytes) : 0;

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-between p-4 sm:p-6 pb-20 overflow-y-auto z-10 space-y-6">
      {/* Top Cosmic Navigation & Telemetry Pill */}
      <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Runic Celestial Clock & Norse Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 rounded-xl border border-white/10 bg-[#060a14]/90 px-4 py-2.5 backdrop-blur-xl shadow-lg"
          style={{ borderColor: `${theme.accentColor}35` }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white/[0.03] shadow-inner shrink-0"
            style={{
              borderColor: `${theme.accentColor}50`,
              color: theme.accentColor,
            }}
          >
            <span className="text-xl font-black">{norseTime.hourRune}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-slate-100 tracking-wider">
                {norseTime.timeString}
              </span>
              <span
                className="font-mono text-[10px] animate-pulse font-bold"
                style={{ color: theme.accentColor }}
              >
                {norseTime.secondsRune}
              </span>
              <span className="text-[10px] font-mono text-slate-500">•</span>
              <span className="text-[11px] font-bold text-slate-300 font-serif">
                {norseDate.dayNorse}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
              <span style={{ color: theme.accentColor }}>{norseDate.monthNorse}</span>
              <span>({norseDate.seasonNorse})</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span>{norseDate.moonPhaseRune}</span>
                <span>{norseDate.moonPhaseName}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Live Realm Atmospheric Conditions HUD */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex-1 min-w-[280px] max-w-md flex items-center justify-between rounded-xl border border-white/10 bg-[#060a14]/90 px-4 py-2.5 backdrop-blur-xl shadow-lg"
          style={{ borderColor: `${theme.accentColor}35` }}
        >
          <div className="flex items-center space-x-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white/[0.02]"
              style={{ borderColor: `${theme.accentColor}40`, color: theme.accentColor }}
            >
              <Wind className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {realm.name} ATMOSPHERE
                </span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
              </div>
              <div className="text-xs font-bold text-slate-200">
                {atmosphere.condition}
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-[9px] uppercase text-slate-400">{atmosphere.fluxLabel}</div>
            <div className="text-xs font-bold" style={{ color: theme.accentColor }}>
              {atmosphere.fluxValue}
            </div>
          </div>
        </motion.div>

        {/* Sovereign Citadel Telemetry Badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-2"
        >
          {/* Active Workspace Pill */}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onOpenWorkspaces?.();
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#060a14]/90 px-3 py-2.5 backdrop-blur-xl shadow-md hover:border-white/25 transition-all group"
            title="Active Yggdrasil Workspace (Click to Switch)"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="text-left font-mono">
              <div className="text-[8px] uppercase text-slate-500">WORKSPACE</div>
              <div className="text-[11px] font-bold text-slate-200 flex items-center space-x-1">
                <span style={{ color: activeWorkspace.color }}>{activeWorkspace.rune}</span>
                <span className="truncate max-w-[90px]">{activeWorkspace.name}</span>
              </div>
            </div>
          </button>

          {/* Svalinn Cloak Proxy Pill */}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onOpenProxyCloak?.();
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#060a14]/90 px-3 py-2.5 backdrop-blur-xl shadow-md hover:border-white/25 transition-all group"
            title="Svalinn Network Cloak (Click to Configure)"
          >
            <ShieldCheck
              className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
                proxyConfig.enabled ? 'text-emerald-400' : 'text-slate-400'
              }`}
            />
            <div className="text-left font-mono">
              <div className="text-[8px] uppercase text-slate-500">CLOAK</div>
              <div className="text-[11px] font-bold text-slate-200">
                {proxyConfig.enabled ? proxyConfig.proxyType.toUpperCase() : 'DIRECT'}
              </div>
            </div>
          </button>

          {/* Heimdall's Watch RAM Pill */}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              onOpenHeimdallWatch?.();
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#060a14]/90 px-3 py-2.5 backdrop-blur-xl shadow-md hover:border-white/25 transition-all group"
            title="Heimdall's Watch Sovereign Task Manager (Shift+Esc)"
          >
            <Activity className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="text-left font-mono">
              <div className="text-[8px] uppercase text-slate-500">MÍMIR RAM</div>
              <div className="text-[11px] font-bold text-slate-200">
                {totalMimirRamMb > 0 ? `${totalMimirRamMb} MB` : 'ACTIVE'}
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Top Deck: Realm Lore & Hávamál Wisdom */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ruler Lore Card */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur-xl shadow-xl flex items-start space-x-4"
          style={{
            borderColor: `${theme.accentColor}35`,
            boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${theme.glowColor}`,
          }}
        >
          <div
            className="relative h-14 w-14 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 shadow-inner mt-0.5"
            style={{ borderColor: `${theme.accentColor}60` }}
          >
            <img
              src={realm.bgUrl}
              alt={realm.ruler}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
            <span className="relative z-10 text-2xl font-black" style={{ color: theme.accentColor }}>
              {realm.rune}
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
                SOVEREIGN OF {realm.norseName.toUpperCase()}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${theme.accentColor}25`,
                  color: theme.accentColor,
                  border: `1px solid ${theme.accentColor}40`,
                }}
              >
                {realm.ruler}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 leading-snug">
              {realm.rulerTitle}
            </div>
            <p className="text-[11px] italic text-slate-300 font-serif leading-relaxed mt-1">
              "{realm.quote}"
            </p>
            <div className="mt-1 text-[10px] text-slate-400 font-mono tracking-wide">
              {atmosphere.weatherQuote}
            </div>
          </div>
        </motion.div>

        {/* Hávamál Stanza Card */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          style={{
            borderColor: `${theme.accentColor}30`,
            boxShadow: `0 8px 30px -10px rgba(0,0,0,0.7), 0 0 15px -4px ${theme.glowColor}`,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Feather className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
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
            <span style={{ color: theme.accentColor }}>{atmosphere.runicHarmonic}</span>
          </div>
        </motion.div>
      </div>

      {/* Central Search Pool & Mímisbrunnr Sigil */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl my-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative mb-3 flex items-center justify-center"
        >
          <div
            className="absolute h-32 w-32 rounded-full border border-dashed opacity-30 animate-ripple pointer-events-none"
            style={{ borderColor: theme.accentColor }}
          />
          <div
            className="absolute h-48 w-48 rounded-full border opacity-20 animate-ripple pointer-events-none"
            style={{ borderColor: theme.accentColor, animationDelay: '2s' }}
          />
          <div
            className="absolute -inset-8 rounded-full blur-3xl opacity-35 pointer-events-none animate-pulse"
            style={{ backgroundColor: theme.accentColor }}
          />

          <MimirSigil size={80} animated={true} showRings={true} />
        </motion.div>

        <h1 className="text-2xl font-black tracking-[0.25em] text-slate-100 uppercase">
          MÍMISBRUNNR
        </h1>
        <p className="mt-0.5 max-w-lg text-[11px] tracking-wider text-slate-400 text-center font-mono">
          BIFRÖST COSMIC PORTAL • <span style={{ color: theme.accentColor }}>{theme.title.toUpperCase()}</span>
        </p>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 w-full relative flex items-center rounded-xl border border-white/10 bg-[#080e1a]/85 p-1 shadow-2xl backdrop-blur-xl transition-all focus-within:border-cyan-500/60"
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
            placeholder="Inquire of the Sacred Well or channel URL destination..."
            className="h-9 flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500/70 outline-none"
          />

          <button
            type="submit"
            className="flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95"
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
      </div>

      {/* Sovereign Citadel Quick Launchers (Fast Dock) */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => {
            runicAudio.playClick(600);
            onOpenWorkspaces?.();
          }}
          className="flex items-center space-x-2 rounded-xl border border-white/10 bg-[#070c18]/85 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-cyan-500/50 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg group"
        >
          <Layers className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Workspaces</span>
          <span className="text-[10px] font-mono text-slate-500">Alt+1..9</span>
        </button>

        <button
          onClick={() => {
            runicAudio.playClick(600);
            onOpenProxyCloak?.();
          }}
          className="flex items-center space-x-2 rounded-xl border border-white/10 bg-[#070c18]/85 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg group"
        >
          <Shield className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Svalinn Cloak</span>
          <span className="text-[10px] font-mono text-slate-500">Ctrl+Shift+P</span>
        </button>

        <button
          onClick={() => {
            runicAudio.playClick(600);
            onOpenHeimdallWatch?.();
          }}
          className="flex items-center space-x-2 rounded-xl border border-white/10 bg-[#070c18]/85 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-amber-500/50 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg group"
        >
          <Activity className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Heimdall Watch</span>
          <span className="text-[10px] font-mono text-slate-500">Shift+Esc</span>
        </button>

        <button
          onClick={() => {
            runicAudio.playClick(600);
            onOpenMimirsEye?.();
          }}
          className="flex items-center space-x-2 rounded-xl border border-white/10 bg-[#070c18]/85 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-purple-500/50 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg group"
        >
          <Eye className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Mímir's Eye Vault</span>
          <span className="text-[10px] font-mono text-slate-500">Ctrl+Shift+C</span>
        </button>

        <button
          onClick={() => {
            runicAudio.playClick(600);
            onOpenTreasury?.();
          }}
          className="flex items-center space-x-2 rounded-xl border border-white/10 bg-[#070c18]/85 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-yellow-500/50 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg group"
        >
          <KeyRound className="h-4 w-4 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span>Fafnir's Treasury</span>
        </button>
      </div>

      {/* Sacred Runestones (Speed Dials Grid) */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SACRED BIFRÖST WAYSTONES
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-mono font-bold"
              style={{
                backgroundColor: `${theme.accentColor}20`,
                color: theme.accentColor,
                border: `1px solid ${theme.accentColor}30`,
              }}
            >
              {portals.length} WAYSTONES
            </span>
          </div>

          <button
            onClick={() => {
              runicAudio.playClick(500);
              setEditingPortal(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-white/5 transition-all shadow"
          >
            <Plus className="h-3 w-3 text-cyan-400" />
            <span>INSCRIBE WAYSTONE</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
          {portals.map((portal) => {
            const IconComponent = ICON_MAP[portal.icon] || Globe;
            return (
              <motion.div
                key={portal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  runicAudio.playChime();
                  onNavigate(portal.url);
                }}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#070c18]/80 p-3.5 transition-all hover:bg-white/[0.05] active:scale-98 cursor-pointer overflow-hidden backdrop-blur-md shadow-lg"
                style={{
                  boxShadow: '0 4px 20px -5px rgba(0,0,0,0.6)',
                }}
              >
                {/* Guardian Rune in Top Right */}
                <div
                  className="absolute top-2 right-2.5 text-xs font-mono font-black transition-colors"
                  style={{ color: `${theme.accentColor}90` }}
                >
                  {portal.rune}
                </div>

                {/* Edit & Delete Action Hover Overlay */}
                <div className="absolute top-1.5 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => handleEditPortal(portal, e)}
                    className="rounded p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                    title="Edit Waystone"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeletePortal(portal.id, e)}
                    className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                    title="Dissolve Waystone"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Sigil Icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] transition-all group-hover:scale-110 shadow-inner"
                  style={{
                    color: theme.accentColor,
                    borderColor: `${theme.accentColor}30`,
                  }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Portal Title & Norse Subtitle */}
                <span className="mt-2 text-xs font-bold text-slate-100 group-hover:text-white truncate max-w-full">
                  {portal.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                  {portal.norseTitle}
                </span>
              </motion.div>
            );
          })}

          {/* Quick Add Button Card */}
          <button
            onClick={() => {
              runicAudio.playClick(500);
              setEditingPortal(null);
              setIsAddModalOpen(true);
            }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.01] p-3.5 text-slate-500 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-white/[0.03] transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/10 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-mono font-bold text-slate-400 group-hover:text-cyan-300">
              + Inscribe Waystone
            </span>
            <span className="text-[9px] font-mono text-slate-600">
              Custom Speed Dial
            </span>
          </button>
        </div>
      </div>

      {/* Add / Edit Portal Modal */}
      <AddPortalModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPortal(null);
        }}
        activeRealm={activeRealm}
        editingPortal={editingPortal}
      />
    </div>
  );
};
