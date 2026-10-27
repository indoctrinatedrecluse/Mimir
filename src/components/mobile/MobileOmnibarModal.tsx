import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Globe, Sparkles, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileOmnibarModalProps {
  isOpen: boolean;
  currentUrl: string;
  onClose: () => void;
  onNavigate: (url: string) => void;
  onOpenQr?: () => void;
}

const SEARCH_ENGINES = [
  { id: 'duckduckgo', name: 'DuckDuckGo', query: 'https://duckduckgo.com/?q=', icon: '🦆' },
  { id: 'brave', name: 'Brave', query: 'https://search.brave.com/search?q=', icon: '🦁' },
  { id: 'startpage', name: 'Startpage', query: 'https://www.startpage.com/sp/search?query=', icon: '🔒' },
  { id: 'google', name: 'Google', query: 'https://www.google.com/search?q=', icon: '🔍' },
];

export const MobileOmnibarModal: React.FC<MobileOmnibarModalProps> = ({
  isOpen,
  currentUrl,
  onClose,
  onNavigate,
  onOpenQr,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const [selectedEngine, setSelectedEngine] = useState(SEARCH_ENGINES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal(currentUrl.startsWith('mimir://') ? '' : currentUrl);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    let target = trimmed;
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed);
    const hasProtocol = /^https?:\/\//i.test(trimmed) || /^mimir:\/\//i.test(trimmed);

    if (hasProtocol) {
      target = trimmed;
    } else if (isDomain) {
      target = `https://${trimmed}`;
    } else {
      target = `${selectedEngine.query}${encodeURIComponent(trimmed)}`;
    }

    onNavigate(target);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a]/95 backdrop-blur-2xl text-slate-100 select-none">
        {/* Top Header */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-800/80">
          <form onSubmit={handleSubmit} className="flex-1 relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search or inscribe web domain..."
              className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-900 border border-cyan-500/30 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-mono shadow-inner"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cancel
          </button>
        </div>

        {/* Engine Quick Selector */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/50 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider pl-1 pr-2">Conduit:</span>
          {SEARCH_ENGINES.map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => setSelectedEngine(eng)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedEngine.id === eng.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{eng.icon}</span>
              <span>{eng.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Suggestion List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {inputVal.trim() && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-left active:bg-cyan-900/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-400">Search with {selectedEngine.name}</div>
                  <div className="text-sm font-semibold text-cyan-200 truncate">{inputVal}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {/* Preset Portals */}
          <div className="mt-2 text-xs font-mono text-slate-500 uppercase tracking-wider px-1">
            ᛏ Sacred Portals
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { title: 'Bifröst Start', url: 'mimir://newtab', icon: '🌌' },
              { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
              { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📖' },
              { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
            ].map((p) => (
              <button
                key={p.url}
                type="button"
                onClick={() => {
                  onNavigate(p.url);
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left active:border-cyan-500/40 transition-all"
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-xs font-medium text-slate-300 truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
