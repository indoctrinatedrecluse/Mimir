import React from 'react';
import {
  Compass,
  BookOpen,
  KeyRound,
  Shield,
  Bot,
  Settings,
  Trash2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  activeRealm: RealmId;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  onSelectRealm: (realm: RealmId) => void;
  onOpenVault: () => void;
  onOpenTreasury: () => void;
  onOpenCloak: () => void;
  onOpenHuginn: () => void;
  onOpenSettings: () => void;
  onOpenPurge: () => void;
  onClose: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  activeRealm,
  isAmbientPlaying,
  onToggleAmbient,
  onSelectRealm,
  onOpenVault,
  onOpenTreasury,
  onOpenCloak,
  onOpenHuginn,
  onOpenSettings,
  onOpenPurge,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md">
      {/* Backdrop tap to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-up Container */}
      <div
        className="w-full bg-[#070b12] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto select-none"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold text-sm tracking-wider">ᛗ MÍMIR SANCTUM MENU</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nine Realms Carousel / Row */}
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Cosmic Realm</span>
            <span className="text-cyan-400 font-bold">{REALMS[activeRealm]?.name}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {(Object.keys(REALMS) as RealmId[]).map((rId) => {
              const r = REALMS[rId];
              const isSelected = rId === activeRealm;
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() => onSelectRealm(rId)}
                  className={`flex flex-col items-center justify-center min-w-16 h-16 p-2 rounded-2xl border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg">{r.rune}</span>
                  <span className="text-[10px] font-mono mt-1 capitalize truncate max-w-full">
                    {rId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          {/* Mímir's Eye Vault */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVault();
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left active:border-cyan-500/40"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Mímir's Eye</div>
              <div className="text-[10px] text-slate-400">Markdown Vault</div>
            </div>
          </button>

          {/* Fafnir's Treasury */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTreasury();
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left active:border-amber-500/40"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Fafnir's Treasury</div>
              <div className="text-[10px] text-slate-400">AES-256 Vault</div>
            </div>
          </button>

          {/* Svalinn Cloak */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCloak();
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left active:border-emerald-500/40"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Svalinn Cloak</div>
              <div className="text-[10px] text-slate-400">Proxy &amp; Tor</div>
            </div>
          </button>

          {/* Huginn AI */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHuginn();
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left active:border-purple-500/40"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Huginn AI</div>
              <div className="text-[10px] text-slate-400">Runic Companion</div>
            </div>
          </button>
        </div>

        {/* Footer Utilities */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
          {/* Ambient Loom Toggle */}
          <button
            type="button"
            onClick={onToggleAmbient}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
          >
            {isAmbientPlaying ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Ambient: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span>Ambient: Off</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
              title="Sanctum Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPurge();
              }}
              className="p-2 rounded-xl bg-red-950/40 text-red-400 border border-red-900/50 hover:text-red-300"
              title="Fate Thread Purge"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
