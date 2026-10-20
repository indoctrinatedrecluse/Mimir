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
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-cyan-500/30 bg-[#090d16]/95 p-6 shadow-[0_0_50px_rgba(0,245,255,0.15)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold tracking-widest text-cyan-400">
                    THE NINE REALMS
                  </span>
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                    NÍU HEIMAR
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Select your active cosmic realm to isolate tab workspaces, memory pools, and proxy conduits.
                </p>
              </div>

              <button
                onClick={() => {
                  runicAudio.playClick(400);
                  onClose();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Realms Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
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
                    className={`group relative flex flex-col rounded-lg border p-3.5 text-left transition-all ${
                      isCurrent
                        ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,245,255,0.25)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-lg font-black"
                          style={{ color: realm.accentColor }}
                        >
                          {realm.rune}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                            {realm.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {realm.norseName}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                      {realm.description}
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
