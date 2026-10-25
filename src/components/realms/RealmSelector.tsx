import React, { useState } from 'react';
import { RealmId, SanctumBackdropMode } from '@/types';
import { REALMS } from '@/core/realms';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Sparkles, HelpCircle, ChevronDown, ChevronUp, FolderArchive, Terminal, ShieldCheck } from 'lucide-react';

interface RealmSelectorProps {
  isOpen: boolean;
  activeRealm: RealmId;
  onSelectRealm: (realm: RealmId) => void;
  onClose: () => void;
  sanctumMode?: SanctumBackdropMode;
  onCycleSanctumMode?: () => void;
  initialShowGuide?: boolean;
}

export const RealmSelector: React.FC<RealmSelectorProps> = ({
  isOpen,
  activeRealm,
  onSelectRealm,
  onClose,
  sanctumMode = 'particles',
  onCycleSanctumMode,
  initialShowGuide = false,
}) => {
  const [showPackGuide, setShowPackGuide] = useState(initialShowGuide);

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
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#070b14]/95 p-6 shadow-[0_0_60px_rgba(0,245,255,0.18)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-base font-black tracking-widest text-cyan-400">
                    THE NINE REALMS OF YGGDRASIL
                  </span>
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                    NÍU HEIMAR
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Select your active cosmic realm to isolate tab workspaces, memory pools, theme aesthetics, and proxy conduits.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    runicAudio.playClick(600);
                    setShowPackGuide(!showPackGuide);
                  }}
                  className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-all shadow ${
                    showPackGuide
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-black/40 text-slate-400 hover:text-slate-200 hover:bg-black/60'
                  }`}
                  title="Toggle Visual Modes & Model A Video Pack Guide"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>PACK GUIDE</span>
                  {showPackGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {onCycleSanctumMode && (
                  <button
                    onClick={onCycleSanctumMode}
                    className="flex items-center space-x-1.5 rounded-lg border bg-black/40 px-3 py-1.5 text-xs font-mono transition-all hover:bg-black/60 shadow"
                    style={{
                      borderColor: sanctumMode !== 'static' ? '#00f5ff50' : 'rgba(255,255,255,0.12)',
                      color: sanctumMode !== 'static' ? '#00f5ff' : '#94a3b8',
                    }}
                    title="Cycle Backdrop Mode: Video ➔ Particles ➔ Static"
                  >
                    {sanctumMode === 'video' ? <Film className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>{sanctumMode === 'video' ? 'MODE: VIDEO (ᚠ)' : sanctumMode === 'particles' ? 'MODE: PARTICLES (ᛋ)' : 'MODE: STATIC (ᛏ)'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    runicAudio.playClick(400);
                    onClose();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* In-Browser Documentation: Visual Modes & Model A Pack Guide */}
            <AnimatePresence>
              {showPackGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-b border-white/10"
                >
                  <div className="py-4 space-y-3">
                    <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3.5 text-xs">
                      <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-2">
                        <FolderArchive className="h-4 w-4" />
                        <span className="font-mono tracking-wide uppercase">SANCTUM VISUAL MODES & MODEL A PACK GUIDE</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 my-2.5">
                        <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                          <div className="flex items-center space-x-1.5 font-bold text-amber-300 mb-1">
                            <Film className="h-3.5 w-3.5" />
                            <span>1. Video Mode (ᚠ)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Hardware-accelerated looping H.264 video backdrops with sovereign realm rulers animated in their mythological domains (heat waves, soul fire, auroral god-rays).
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                          <div className="flex items-center space-x-1.5 font-bold text-cyan-300 mb-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>2. Particles Mode (ᛋ)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            HTML5 Canvas procedural physics engine with 42s Ken Burns GPU breathing drift. Renders realm-specific embers, frost mists, spores, and stardust motes.
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-300 mb-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>3. Static Mode (ᛏ)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Pure, motionless high-resolution sovereign artwork. Ideal for reading sanctuary sessions and zero-GPU battery preservation.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-300 font-mono">
                        <div>
                          <span className="text-amber-400 font-bold">End-User Pack Installation:</span> Extract <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">mimir-cinematic-realm-pack.zip</code> into <code className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-300">dist/realms/videos/</code>
                        </div>
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>Zero-Downtime Fallback: Auto-falls back to Particles if videos are absent</span>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-400 font-mono">
                        <Terminal className="inline h-3 w-3 mr-1 text-cyan-400" />
                        <span className="text-slate-500">Dev / Local Forge:</span> <code className="text-slate-300">python scripts/forge_realm_videos.py --realm all</code> or <code className="text-slate-300">python scripts/package_realm_pack.py --install dist/realms/videos</code>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Realms Grid (3 columns x 3 rows) */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(Object.keys(REALMS) as RealmId[]).map((realmKey) => {
                const realm = REALMS[realmKey];
                const isCurrent = realmKey === activeRealm;

                return (
                  <button
                    key={realm.id}
                    onClick={() => {
                      runicAudio.playRunicHum();
                      onSelectRealm(realm.id);
                      onClose();
                    }}
                    className={`group relative flex flex-col rounded-xl border p-3.5 text-left transition-all overflow-hidden ${
                      isCurrent
                        ? 'scale-[1.01] shadow-lg'
                        : 'border-white/10 bg-[#090e1a]/90 hover:border-white/30 hover:bg-[#0c1424] hover:scale-[1.01]'
                    }`}
                    style={{
                      borderColor: isCurrent ? realm.accentColor : undefined,
                      backgroundColor: isCurrent ? `${realm.accentColor}18` : undefined,
                      boxShadow: isCurrent ? `0 0 25px ${realm.accentColor}40` : undefined,
                      borderWidth: isCurrent ? '1.5px' : '1px',
                    }}
                  >
                    {/* Realm Ruler Background Silhouette Thumbnail */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-45 transition-opacity group-hover:opacity-70 pointer-events-none"
                      style={{ backgroundImage: `url('${realm.bgUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/50 to-transparent pointer-events-none" />

                    {/* Card Content */}
                    <div className="relative z-10 flex items-start justify-between w-full">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg border text-lg font-black backdrop-blur-md"
                          style={{
                            borderColor: `${realm.accentColor}60`,
                            backgroundColor: `${realm.accentColor}15`,
                            color: realm.accentColor,
                          }}
                        >
                          {realm.rune}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                            {realm.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {realm.norseName}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span
                          className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm"
                          style={{
                            backgroundColor: realm.accentColor,
                            color: '#05070a',
                          }}
                        >
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                          {realm.ruler}
                        </span>
                      )}
                    </div>

                    {/* Ruler and Title */}
                    <div className="relative z-10 mt-2.5 flex items-center space-x-1.5 text-[11px]">
                      <span className="font-semibold text-slate-300">{realm.ruler}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 text-[10px] truncate">{realm.rulerTitle}</span>
                    </div>

                    {/* Description */}
                    <p className="relative z-10 mt-1.5 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                      {realm.description}
                    </p>

                    {/* Quote */}
                    <p className="relative z-10 mt-2 text-[10px] italic text-slate-500 font-serif line-clamp-1 border-t border-white/5 pt-1.5">
                      "{realm.quote}"
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
