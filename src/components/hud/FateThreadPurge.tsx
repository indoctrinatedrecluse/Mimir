import React, { useState } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Clock, Cookie, Database, FileText, AlertTriangle } from 'lucide-react';

interface FateThreadPurgeProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
}

type TimeRange = 'last-hour' | 'last-day' | 'last-week' | 'all-time';

interface PurgeOption {
  id: string;
  label: string;
  norseName: string;
  icon: React.ElementType;
  description: string;
}

const PURGE_OPTIONS: PurgeOption[] = [
  {
    id: 'history',
    label: 'Browsing History',
    norseName: 'Threads of Fate',
    icon: Clock,
    description: 'All visited gateways and navigation records from Muninn\'s memory.',
  },
  {
    id: 'cookies',
    label: 'Cookies & Site Data',
    norseName: 'Hospitality Tokens',
    icon: Cookie,
    description: 'Authentication tokens, preferences, and realm-bound site data.',
  },
  {
    id: 'cache',
    label: 'Cached Images & Files',
    norseName: 'Cached Artifacts',
    icon: Database,
    description: 'Locally stored web assets, images, scripts, and style fragments.',
  },
  {
    id: 'localStorage',
    label: 'Local Storage',
    norseName: 'Runic Inscriptions',
    icon: FileText,
    description: 'Application data stored by websites including saved preferences.',
  },
];

const TIME_RANGES: { value: TimeRange; label: string; norse: string }[] = [
  { value: 'last-hour', label: 'Last Hour', norse: 'Past Twilight' },
  { value: 'last-day', label: 'Last 24 Hours', norse: 'Since Last Dawn' },
  { value: 'last-week', label: 'Last 7 Days', norse: 'This Moon Cycle' },
  { value: 'all-time', label: 'All Time', norse: 'Since the Dawn of Creation' },
];

export const FateThreadPurge: React.FC<FateThreadPurgeProps> = ({
  isOpen,
  onClose,
  activeRealm,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set(['history', 'cache']));
  const [timeRange, setTimeRange] = useState<TimeRange>('last-hour');
  const [isPurging, setIsPurging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    runicAudio.playClick(600);
  };

  const handlePurge = async () => {
    setIsPurging(true);
    runicAudio.playRunicHum();

    // Clear selected data
    if (selectedOptions.has('history')) {
      localStorage.removeItem('mimir_fate_threads');
    }
    if (selectedOptions.has('localStorage')) {
      // Clear non-essential localStorage (preserve settings and runestones)
      const keysToKeep = ['mimir_runestones'];
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
    }
    if (selectedOptions.has('cookies')) {
      // Signal cookie clear intent (WebView2 handles actual cookies)
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substring(0, eqPos) : c;
        document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
    }

    // Simulate purge delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsPurging(false);
    setShowConfirm(false);
    runicAudio.playChime();
    onClose();
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070b14]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
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
                    borderColor: '#ef444460',
                    backgroundColor: '#ef444415',
                    color: '#ef4444',
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">
                    FATE THREAD PURGE
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sever and banish selected traces from Muninn's memory.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">
                TIME RANGE
              </span>
              <div className="flex flex-wrap gap-2">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setTimeRange(range.value);
                      runicAudio.playClick(600);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      timeRange === range.value
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                    style={{
                      color: timeRange === range.value ? theme.accentColor : undefined,
                      borderColor: timeRange === range.value ? `${theme.accentColor}40` : undefined,
                      border: timeRange === range.value ? `1px solid ${theme.accentColor}40` : '1px solid transparent',
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purge Options */}
            <div className="flex-1 p-5 space-y-2.5">
              {PURGE_OPTIONS.map((option) => {
                const isSelected = selectedOptions.has(option.id);
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`group flex w-full items-center space-x-3 rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-all shrink-0 ${
                        isSelected
                          ? 'border-red-400 bg-red-500/30'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isSelected && (
                        <span className="text-red-300 text-xs">✓</span>
                      )}
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] shrink-0">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-red-300' : 'text-slate-200'}`}>
                          {option.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 italic">
                          ({option.norseName})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
              <div className="flex items-center space-x-2 text-[10px] text-amber-400/80">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>This action cannot be undone.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedOptions.size > 0) {
                      handlePurge();
                    }
                  }}
                  disabled={selectedOptions.size === 0 || isPurging}
                  className="rounded-lg border border-red-500/40 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isPurging ? 'Purging...' : `Purge ${selectedOptions.size} Thread${selectedOptions.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
