import React, { useState, useEffect } from 'react';
import { RealmId, Tab } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  X,
  Type,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  AlignLeft,
  Share2,
  Check,
  Copy,
} from 'lucide-react';

interface ReaderSanctumProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  activeTab: Tab | undefined;
}

type ReaderTheme = 'parchment' | 'obsidian' | 'sepia';

export const ReaderSanctum: React.FC<ReaderSanctumProps> = ({
  isOpen,
  onClose,
  activeRealm,
  activeTab,
}) => {
  const [themeMode, setThemeMode] = useState<ReaderTheme>('obsidian');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Extracted article state
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [articleContent, setArticleContent] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number>(0);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    if (!isOpen) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    runicAudio.playChime();

    // Generate readable sanctum content from current tab or rich default
    const title = activeTab?.title || 'Elder Lore of the Nine Realms';
    setArticleTitle(title.replace(/\s*[-—|].*$/, ''));

    // Sample or extracted paragraphs
    const paragraphs = [
      `From the sacred roots of Yggdrasil to the gleaming golden halls of Valhalla, knowledge has always demanded sacrifice. When Odin hung from the world tree for nine windy nights, pierced by his own spear Gungnir, he gazed downward into the abyss to win the runes of understanding.`,
      `In the digital age, the web has become cluttered with noisy banners, surveillance conduits, and deceptive trackers that distract the seeker from truth. The Reader Sanctum strips away these temporal illusions, returning the written word to its purest parchment state.`,
      `Here, within the calm light of Mímir's spring, text breathes with clarity. No popups, no telemetry sirens, no flickering lights. Only the voice of the author and the contemplative mind of the reader traversing the boundless realms.`,
      `May this sanctum serve as your quiet sanctuary amidst the tempest of the information age. As the Havamal decrees: 'A better burden no man can bear on the road than wisdom; it is better than wealth in the wilderness.'`,
    ];

    setArticleContent(paragraphs);
    const words = paragraphs.join(' ').split(/\s+/).length;
    setWordCount(words);
  }, [isOpen, activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      runicAudio.playClick(300);
    } else {
      const textToRead = `${articleTitle}. ${articleContent.join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      runicAudio.playClick(600);
    }
  };

  const handleCopyLink = () => {
    if (activeTab?.url) {
      navigator.clipboard.writeText(activeTab.url);
      setCopiedLink(true);
      runicAudio.playClick(800);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  // Theme styles
  const themeStyles = {
    obsidian: {
      bg: 'bg-[#06080d]',
      text: 'text-slate-200',
      title: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300',
      bar: 'border-white/10 bg-black/60',
      meta: 'text-slate-400',
    },
    parchment: {
      bg: 'bg-[#18140e]',
      text: 'text-[#d6c4a8]',
      title: 'text-amber-200',
      bar: 'border-amber-900/30 bg-[#120f0a]/90',
      meta: 'text-[#a69275]',
    },
    sepia: {
      bg: 'bg-[#1c1815]',
      text: 'text-[#dfd0bd]',
      title: 'text-amber-300',
      bar: 'border-amber-800/30 bg-[#14110e]/90',
      meta: 'text-[#9c8975]',
    },
  }[themeMode];

  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`fixed inset-0 z-50 flex flex-col ${themeStyles.bg} select-text`}
      >
        {/* Top Reading Progress Bar */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Reader Control Header */}
        <header
          className={`flex h-12 select-none items-center justify-between border-b px-6 backdrop-blur-xl ${themeStyles.bar}`}
        >
          {/* Left identity */}
          <div className="flex items-center space-x-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-amber-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                ᛗ READER SANCTUM • DISTRACTION-FREE
              </span>
            </div>
          </div>

          {/* Center: Font & Theme Controls */}
          <div className="flex items-center space-x-2">
            {/* Font size adjustments */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="px-1.5 text-[10px] font-mono text-slate-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Aesthetic Mode Selector */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs font-mono">
              <button
                onClick={() => {
                  setThemeMode('obsidian');
                  runicAudio.playClick(500);
                }}
                className={`rounded px-2.5 py-1 transition-all ${
                  themeMode === 'obsidian' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                Obsidian
              </button>
              <button
                onClick={() => {
                  setThemeMode('parchment');
                  runicAudio.playClick(600);
                }}
                className={`rounded px-2.5 py-1 transition-all ${
                  themeMode === 'parchment' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                }`}
              >
                Parchment
              </button>
              <button
                onClick={() => {
                  setThemeMode('sepia');
                  runicAudio.playClick(700);
                }}
                className={`rounded px-2.5 py-1 transition-all ${
                  themeMode === 'sepia' ? 'bg-amber-700/30 text-amber-200 font-bold' : 'text-slate-400'
                }`}
              >
                Sepia
              </button>
            </div>

            {/* Recite aloud / Text-to-Speech */}
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition-all ${
                isSpeaking
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,245,255,0.4)] animate-pulse'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
              title={isSpeaking ? 'Halt Recitation' : 'Recite Lore Aloud'}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-cyan-400" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{isSpeaking ? 'Halt' : 'Recite'}</span>
            </button>

            {/* Copy Article Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-white/10"
              title="Copy Conduit Link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Leave Sanctum (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable Article Area */}
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-12">
          <main className="mx-auto max-w-2xl">
            {/* Article Header */}
            <div className="mb-10 border-b border-white/10 pb-6">
              <h1
                className={`text-3xl font-serif font-black tracking-wide leading-tight sm:text-4xl ${themeStyles.title}`}
              >
                {articleTitle}
              </h1>

              {/* Metadata */}
              <div
                className={`mt-4 flex flex-wrap items-center gap-4 text-xs font-mono ${themeStyles.meta}`}
              >
                <span className="flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{estimatedMinutes} min read</span>
                </span>
                <span>•</span>
                <span>{wordCount} words</span>
                <span>•</span>
                <span className="truncate max-w-xs">{activeTab?.url}</span>
              </div>
            </div>

            {/* Article Body */}
            <article
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
              className={`space-y-6 font-serif ${themeStyles.text}`}
            >
              {articleContent.map((paragraph, idx) => (
                <p key={idx} className="first-letter:text-3xl first-letter:font-bold first-letter:mr-1">
                  {paragraph}
                </p>
              ))}
            </article>

            {/* Footer glyph */}
            <div className="mt-16 text-center text-slate-500 font-mono text-xs border-t border-white/5 pt-8">
              <span>ᚱ END OF RECORD • MÍMIR SANCTUM ᚱ</span>
            </div>
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
