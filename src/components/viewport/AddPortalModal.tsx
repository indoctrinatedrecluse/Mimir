import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Globe, Terminal, Compass, BookOpen, Flame, Shield, Code, Cpu, Database, Feather, Music, Film, Check } from 'lucide-react';
import { BifrostPortal, HOUR_RUNES, bifrostManager } from '@/core/bifrost/bifrostManager';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';

interface AddPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  editingPortal?: BifrostPortal | null;
}

const AVAILABLE_ICONS = [
  { name: 'Globe', icon: Globe },
  { name: 'Terminal', icon: Terminal },
  { name: 'Compass', icon: Compass },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Flame', icon: Flame },
  { name: 'Shield', icon: Shield },
  { name: 'Code', icon: Code },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Cpu', icon: Cpu },
  { name: 'Database', icon: Database },
  { name: 'Feather', icon: Feather },
  { name: 'Music', icon: Music },
  { name: 'Film', icon: Film },
];

export const AddPortalModal: React.FC<AddPortalModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  editingPortal,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [norseTitle, setNorseTitle] = useState('');
  const [rune, setRune] = useState('ᚲ');
  const [icon, setIcon] = useState('Globe');
  const [category, setCategory] = useState('');

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    if (editingPortal) {
      setTitle(editingPortal.title);
      setUrl(editingPortal.url);
      setNorseTitle(editingPortal.norseTitle);
      setRune(editingPortal.rune);
      setIcon(editingPortal.icon);
      setCategory(editingPortal.category || '');
    } else {
      setTitle('');
      setUrl('');
      setNorseTitle('');
      setRune('ᚲ');
      setIcon('Globe');
      setCategory('');
    }
  }, [editingPortal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (editingPortal) {
      bifrostManager.updatePortal({
        ...editingPortal,
        title: title.trim(),
        url: finalUrl,
        norseTitle: norseTitle.trim() || 'Waystone',
        rune,
        icon,
        category: category.trim() || undefined,
      });
      runicAudio.playChime();
    } else {
      bifrostManager.addPortal({
        title: title.trim(),
        url: finalUrl,
        norseTitle: norseTitle.trim() || 'Waystone',
        rune,
        icon,
        category: category.trim() || undefined,
      });
      runicAudio.playRunicHum();
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#070c18]/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100"
          style={{
            borderColor: `${theme.accentColor}40`,
            boxShadow: `0 20px 60px -15px rgba(0,0,0,0.9), 0 0 30px -5px ${theme.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-black" style={{ color: theme.accentColor }}>
                {rune}
              </span>
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">
                  {editingPortal ? 'REFURBISH SACRED WAYSTONE' : 'INSCRIBE NEW BIFRÖST WAYSTONE'}
                </h3>
                <p className="text-[10px] font-mono text-slate-400">
                  Forge a custom speed-dial portal into the sacred tapestry
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Title & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Portal Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ArchWiki"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Norse Mythic Epithet
                </label>
                <input
                  type="text"
                  value={norseTitle}
                  onChange={(e) => setNorseTitle(e.target.value)}
                  placeholder="e.g. Iron Citadel Lore"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Conduit URL
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
              />
            </div>

            {/* Elder Futhark Rune Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">
                  Select Guardian Rune
                </label>
                <span className="text-[10px] font-mono font-bold" style={{ color: theme.accentColor }}>
                  Current: {rune}
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1 p-2 rounded-lg border border-white/5 bg-black/30">
                {HOUR_RUNES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRune(r);
                      runicAudio.playClick(600);
                    }}
                    className={`h-7 rounded flex items-center justify-center font-bold text-sm transition-all ${
                      rune === r
                        ? 'border shadow text-white scale-110'
                        : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`}
                    style={{
                      borderColor: rune === r ? theme.accentColor : undefined,
                      backgroundColor: rune === r ? `${theme.accentColor}30` : undefined,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                Visual Sigil Icon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/5 bg-black/30">
                {AVAILABLE_ICONS.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setIcon(item.name);
                        runicAudio.playClick(500);
                      }}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border text-white shadow scale-105'
                          : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.accentColor : undefined,
                        backgroundColor: isSelected ? `${theme.accentColor}30` : undefined,
                      }}
                      title={item.name}
                    >
                      <ItemIcon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                DISMISS
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 rounded-lg px-5 py-2 text-xs font-bold transition-all active:scale-95 shadow-lg"
                style={{
                  backgroundColor: `${theme.accentColor}25`,
                  color: theme.accentColor,
                  border: `1px solid ${theme.accentColor}50`,
                  boxShadow: `0 0 15px ${theme.glowColor}`,
                }}
              >
                <Check className="h-3.5 w-3.5" />
                <span>{editingPortal ? 'UPDATE WAYSTONE' : 'BIND WAYSTONE'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
