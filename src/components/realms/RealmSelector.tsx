import React from 'react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RealmSelectorProps {
  isOpen: boolean;
  activeRealm: RealmId;
  onSelectRealm: (realm: RealmId) => void;
  onClose: () => void;
}

export const RealmSelector: React.FC<RealmSelectorProps> = ({
  isOpen,
  activeRealm,
  onSelectRealm,
  onClose,
}) => {
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
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,245,255,0.25)] scale-[1.01]'
                        : 'border-white/10 bg-[#090e1a]/90 hover:border-white/30 hover:bg-[#0c1424] hover:scale-[1.01]'
                    }`}
                    style={{
                      borderColor: isCurrent ? realm.accentColor : undefined,
                      boxShadow: isCurrent ? `0 0 20px ${realm.accentColor}40` : undefined,
                    }}
                  >
                    {/* Realm Ruler Background Silhouette Thumbnail */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity group-hover:opacity-30 pointer-events-none"
                      style={{ backgroundImage: `url('${realm.bgUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-transparent pointer-events-none" />

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
