import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealmId, YggdrasilWorkspace } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { X, Sparkles, Plus, Check } from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkspace: (name: string, realm: RealmId, rune: string, color?: string) => void;
  editingWorkspace?: YggdrasilWorkspace | null;
}

const RUNE_CHOICES = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛚ', 'ᛞ', 'ᛟ'];
const REALM_OPTIONS: { id: RealmId; label: string; desc: string }[] = [
  { id: 'midgard', label: 'Midgard', desc: 'Mortal World / Everyday Browsing' },
  { id: 'asgard', label: 'Asgard', desc: 'Realm of Gods / Engineering & Code' },
  { id: 'vanaheim', label: 'Vanaheim', desc: 'Nature & Magic / Media & Streams' },
  { id: 'alfheim', label: 'Alfheim', desc: 'Light Elves / Reading & Research' },
  { id: 'jotunheim', label: 'Jotunheim', desc: 'Frost Giants / Big Data & Archives' },
  { id: 'muspelheim', label: 'Muspelheim', desc: 'Fire Realm / High Performance' },
  { id: 'niflheim', label: 'Niflheim', desc: 'Primordial Mist / Stealth & Privacy' },
  { id: 'nidavellir', label: 'Nidavellir', desc: 'Dwarven Forge / Extensions & Tools' },
  { id: 'helheim', label: 'Helheim', desc: 'Underworld / Ephemeral & Incognito' },
];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSaveWorkspace,
  editingWorkspace,
}) => {
  const [name, setName] = useState(editingWorkspace?.name || '');
  const [selectedRealm, setSelectedRealm] = useState<RealmId>(editingWorkspace?.realm || 'midgard');
  const [selectedRune, setSelectedRune] = useState(editingWorkspace?.rune || 'ᛗ');

  React.useEffect(() => {
    if (editingWorkspace) {
      setName(editingWorkspace.name);
      setSelectedRealm(editingWorkspace.realm);
      setSelectedRune(editingWorkspace.rune);
    } else {
      setName('');
      setSelectedRealm('midgard');
      setSelectedRune('ᛗ');
    }
  }, [editingWorkspace, isOpen]);

  if (!isOpen) return null;

  const currentTheme = REALM_THEMES[selectedRealm] || REALM_THEMES.midgard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    runicAudio.playChime();
    onSaveWorkspace(name.trim(), selectedRealm, selectedRune, currentTheme.accentColor);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Top Cosmic Glow */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${currentTheme.accentColor}, transparent)`,
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl" style={{ color: currentTheme.accentColor }}>
                {selectedRune}
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-widest text-white uppercase">
                  {editingWorkspace ? 'Edit Realm Branch' : 'Inscribe New Realm Branch'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Isolate tabs, memory contexts, and cosmic themes
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                runicAudio.playClick(400);
                onClose();
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Branch Name Input */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-300 uppercase mb-1.5">
                Branch Designation
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Asgardian Engineering, Deep Research, Valhalla Media..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Realm Cosmic Affiliation */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-300 uppercase mb-1.5">
                Cosmic Realm Theme
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {REALM_OPTIONS.map((realm) => {
                  const rTheme = REALM_THEMES[realm.id];
                  const isSelected = selectedRealm === realm.id;
                  return (
                    <button
                      key={realm.id}
                      type="button"
                      onClick={() => {
                        setSelectedRealm(realm.id);
                        runicAudio.playClick(600);
                      }}
                      className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-white/40 bg-white/10 shadow-lg'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                      }`}
                      style={{
                        borderColor: isSelected ? rTheme.accentColor : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">{realm.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <span className="text-[9px] text-slate-400 line-clamp-1">{realm.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Elder Futhark Rune Glyphs */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-300 uppercase mb-1.5">
                Elder Futhark Runic Sigil
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-white/10 bg-black/30">
                {RUNE_CHOICES.map((rune) => (
                  <button
                    key={rune}
                    type="button"
                    onClick={() => {
                      setSelectedRune(rune);
                      runicAudio.playClick(700);
                    }}
                    className={`h-7 w-7 rounded-lg text-sm font-serif transition-transform flex items-center justify-center ${
                      selectedRune === rune
                        ? 'bg-white/20 scale-110 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    style={{
                      color: selectedRune === rune ? currentTheme.accentColor : undefined,
                    }}
                  >
                    {rune}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  runicAudio.playClick(400);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  backgroundColor: currentTheme.accentColor,
                }}
              >
                {editingWorkspace ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingWorkspace ? 'Update Branch' : 'Inscribe Branch'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
