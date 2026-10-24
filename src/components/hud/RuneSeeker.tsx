import React, { useState, useEffect, useRef } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RuneSeekerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
}

export const RuneSeeker: React.FC<RuneSeekerProps> = ({
  isOpen,
  onClose,
  activeRealm,
}) => {
  const [query, setQuery] = useState('');
  const [matchInfo, setMatchInfo] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      mimirIpc.send({ type: 'FIND_CLOSE' });
      setQuery('');
      setMatchInfo('');
      setMatchCount(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = mimirIpc.onFindResult((res) => {
      setMatchCount(res.count);
      if (res.count === 0) {
        setMatchInfo('No matches');
      } else {
        setMatchInfo(`${res.count} ${res.count === 1 ? 'match' : 'matches'}`);
      }
    });
    return unsub;
  }, []);

  const executeFind = (searchQuery: string, isCase: boolean, isRegex: boolean) => {
    if (!searchQuery.trim()) {
      setMatchInfo('');
      setMatchCount(null);
      return;
    }
    mimirIpc.send({
      type: 'FIND_IN_PAGE',
      payload: {
        query: searchQuery,
        caseSensitive: isCase,
        useRegex: isRegex,
      },
    });
  };

  const handleSearch = (searchQuery: string) => {
    executeFind(searchQuery, caseSensitive, useRegex);
  };

  const toggleCase = () => {
    const next = !caseSensitive;
    setCaseSensitive(next);
    runicAudio.playClick(700);
    if (query.trim()) {
      executeFind(query, next, useRegex);
    }
  };

  const toggleRegex = () => {
    const next = !useRegex;
    setUseRegex(next);
    runicAudio.playClick(700);
    if (query.trim()) {
      executeFind(query, caseSensitive, next);
    }
  };

  const handleNext = () => {
    if (!query.trim()) return;
    mimirIpc.send({ type: 'FIND_NEXT' });
    runicAudio.playClick(600);
  };

  const handlePrevious = () => {
    if (!query.trim()) return;
    mimirIpc.send({ type: 'FIND_PREVIOUS' });
    runicAudio.playClick(600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-4 top-[90px] z-50 flex items-center space-x-2 rounded-xl border bg-[#080d17]/98 px-3 py-2 shadow-2xl backdrop-blur-2xl"
          style={{
            borderColor: `${theme.accentColor}50`,
            boxShadow: `0 8px 32px -8px rgba(0, 0, 0, 0.8), 0 0 16px -4px ${theme.glowColor}`,
          }}
        >
          {/* Rune Seeker Icon */}
          <div className="flex items-center pr-1">
            <Search className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
          </div>

          {/* Rune Label */}
          <span
            className="text-[9px] font-black tracking-widest uppercase select-none opacity-70"
            style={{ color: theme.accentColor }}
          >
            ᛋ SEEK
          </span>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              handleSearch(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Seek rune in page..."
            className="h-7 w-48 rounded border border-white/10 bg-white/[0.05] px-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-white/20"
            style={{
              borderColor: query ? `${theme.accentColor}50` : undefined,
            }}
          />

          {/* Case Sensitive Toggle (Aa) */}
          <button
            onClick={toggleCase}
            className={`flex h-6 px-1.5 items-center justify-center rounded text-[11px] font-mono font-bold transition-all ${
              caseSensitive
                ? 'border text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
            style={{
              borderColor: caseSensitive ? `${theme.accentColor}60` : undefined,
              backgroundColor: caseSensitive ? `${theme.accentColor}25` : undefined,
              color: caseSensitive ? theme.accentColor : undefined,
            }}
            title="Match Case (Aa)"
          >
            Aa
          </button>

          {/* Regex Toggle (.*) */}
          <button
            onClick={toggleRegex}
            className={`flex h-6 px-1.5 items-center justify-center rounded text-[11px] font-mono font-bold transition-all ${
              useRegex
                ? 'border text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
            style={{
              borderColor: useRegex ? `${theme.accentColor}60` : undefined,
              backgroundColor: useRegex ? `${theme.accentColor}25` : undefined,
              color: useRegex ? theme.accentColor : undefined,
            }}
            title="Use Regular Expression (.*)"
          >
            .*
          </button>

          {/* Match Info Badge */}
          {matchInfo && (
            <span
              className={`text-[10px] font-mono whitespace-nowrap px-1.5 py-0.5 rounded border ${
                matchCount && matchCount > 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              }`}
            >
              {matchInfo}
            </span>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={handlePrevious}
              disabled={!query.trim()}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNext}
              disabled={!query.trim()}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              title="Next match (Enter)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
            title="Close (Escape)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
