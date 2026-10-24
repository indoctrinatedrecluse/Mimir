import React from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RotateCcw, X, ShieldAlert } from 'lucide-react';
import { SavedSession } from '@/core/session/sessionManager';

interface ValhallaRevivalBannerProps {
  session: SavedSession | null;
  activeRealm: RealmId;
  onRestore: (session: SavedSession) => void;
  onDismiss: () => void;
}

export const ValhallaRevivalBanner: React.FC<ValhallaRevivalBannerProps> = ({
  session,
  activeRealm,
  onRestore,
  onDismiss,
}) => {
  if (!session || !session.tabs || session.tabs.length === 0) return null;

  const currentTheme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const sessionTheme = REALM_THEMES[session.realm] || currentTheme;

  const handleRestore = () => {
    runicAudio.playChime();
    onRestore(session);
  };

  const handleDismiss = () => {
    runicAudio.playClick(400);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-30 mx-4 mt-2 overflow-hidden rounded-xl border border-amber-500/40 bg-[#090b10]/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(245,158,11,0.25)] backdrop-blur-xl"
      >
        {/* Subtle fiery glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          {/* Left info badge */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <Flame className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                  ᚲ VALHALLA REVIVAL • CRASH SENTINEL
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-slate-300">
                  {session.tabs.length} {session.tabs.length === 1 ? 'Tab' : 'Tabs'}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${sessionTheme.accentColor}20`,
                    color: sessionTheme.accentColor,
                  }}
                >
                  {sessionTheme.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                The threads of your previous journey were severed. Restore your open conduits from Valhalla?
              </p>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRestore}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all hover:brightness-110 active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 text-black" />
              <span>Revive Session</span>
            </button>
            <button
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Dismiss & Begin Anew"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
