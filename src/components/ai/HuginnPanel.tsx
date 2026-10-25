import React, { useState, useRef, useEffect } from 'react';
import { RealmId, Tab } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Feather,
  Shield,
  Code2,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Compass,
  Key,
} from 'lucide-react';
import { scoutActivePage, getGeminiApiKey, setGeminiApiKey } from '@/core/ai/huginnScout';

interface HuginnMessage {
  id: string;
  sender: 'huginn' | 'user';
  text: string;
  timestamp: string;
  runeTag?: string;
}

interface HuginnPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  currentTab?: Tab;
  initialPrompt?: string;
}

export const HuginnPanel: React.FC<HuginnPanelProps> = ({
  isOpen,
  onClose,
  activeRealm,
  currentTab,
  initialPrompt,
}) => {
  const realm = REALMS[activeRealm];
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const [inputVal, setInputVal] = useState(initialPrompt || '');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey() || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputVal(initialPrompt);
    }
  }, [initialPrompt]);

  const initialWelcome: HuginnMessage = {
    id: 'welcome-1',
    sender: 'huginn',
    text: `Greetings, voyager of ${realm.name}. I am Huginn, raven of thought and scout of the Allfather. As you tread through the realm of ${realm.norseName} under the ward of ${realm.ruler}, I perceive all conduits, scripts, and ancient lore across the web. How may I enlighten your path?`,
    timestamp: 'Now',
    runeTag: realm.rune,
  };

  const [messages, setMessages] = useState<HuginnMessage[]>([initialWelcome]);

  // Reset or greet when active realm changes
  useEffect(() => {
    const realmGreeting: HuginnMessage = {
      id: `realm-switch-${Date.now()}`,
      sender: 'huginn',
      text: `Conduit aligned with ${realm.name} (${realm.norseName}). Ruler: ${realm.ruler} — "${realm.quote}". The atmospheric runes and memories are now calibrated to this realm.`,
      timestamp: 'Now',
      runeTag: realm.rune,
    };
    setMessages((prev) => [...prev, realmGreeting]);
  }, [activeRealm]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string, actionType?: 'summarize' | 'code' | 'ward' | 'chat') => {
    const content = (textToSend || inputVal).trim();
    if (!content) return;

    runicAudio.playClick(600);
    const userMsg: HuginnMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    try {
      const botReply = await scoutActivePage(actionType || 'chat', content, realm, currentTab);
      setIsTyping(false);
      runicAudio.playChime();
      const aiMsg: HuginnMessage = {
        id: `huginn-${Date.now()}`,
        sender: 'huginn',
        text: botReply,
        timestamp: 'Just now',
        runeTag: realm.rune,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setIsTyping(false);
      runicAudio.playClick(300);
      const errMsg: HuginnMessage = {
        id: `huginn-${Date.now()}`,
        sender: 'huginn',
        text: 'The winds of Yggdrasil are turbulent. The raven could not traverse the gateway.',
        timestamp: 'Just now',
        runeTag: '⚠️',
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    runicAudio.playClick(800);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const clearChat = () => {
    runicAudio.playClick(400);
    setMessages([initialWelcome]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Dim Backdrop for narrow viewports */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          />

          {/* Slide-out Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#060a14]/95 backdrop-blur-2xl shadow-[-15px_0_40px_rgba(0,0,0,0.8)]"
            style={{
              borderColor: `${theme.accentColor}30`,
              boxShadow: `-10px 0 35px -5px ${theme.glowColor}`,
            }}
          >
            {/* Ambient Background Silhouette */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
              style={{ backgroundImage: `url('${realm.bgUrl}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/70 via-[#060a14]/85 to-[#060a14]/95 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center space-x-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner"
                  style={{
                    borderColor: `${theme.accentColor}50`,
                    backgroundColor: `${theme.accentColor}15`,
                    color: theme.accentColor,
                  }}
                >
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black tracking-wider text-slate-100 uppercase">
                      HUGINN
                    </h3>
                    <span
                      className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase"
                      style={{
                        backgroundColor: `${theme.accentColor}25`,
                        color: theme.accentColor,
                      }}
                    >
                      {realm.name} • {realm.rune}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Raven of Thought • Scout of the Allfather
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setShowKeyConfig(!showKeyConfig);
                    runicAudio.playClick(650);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    geminiKey ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  title={geminiKey ? 'Gemini AI Key Connected' : 'Connect Gemini AI Key (Optional)'}
                >
                  <Key className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearChat}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Purge Raven Memory"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Return to Conduit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Gemini API Key Configuration Accordion */}
            <AnimatePresence>
              {showKeyConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative z-20 border-b border-amber-500/20 bg-amber-500/[0.04] p-3.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <Key className="h-3 w-3" />
                      GEMINI GENERATIVE CONDUIT (OPTIONAL)
                    </span>
                    {geminiKey && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        ⚡ Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Enter a Google Gemini API key to unlock full live multimodal generative intelligence. If left blank, Huginn operates via offline deterministic DOM semantic analysis.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 rounded-lg bg-black/50 border border-white/15 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        setGeminiApiKey(geminiKey);
                        runicAudio.playChime();
                        setShowKeyConfig(false);
                      }}
                      className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-all"
                    >
                      Save
                    </button>
                    {geminiKey && (
                      <button
                        onClick={() => {
                          setGeminiKey('');
                          setGeminiApiKey('');
                          runicAudio.playClick(400);
                        }}
                        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 transition-all"
                        title="Disconnect Key"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Runic Invocations */}
            <div className="relative z-10 border-b border-white/5 bg-white/[0.02] p-3">
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block mb-2">
                RUNIC INVOCATIONS:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSend('Synthesize this sacred conduit', 'summarize')}
                  className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  style={{ color: theme.accentColor }}
                >
                  <BookOpen className="h-3.5 w-3.5 mb-1" />
                  <span className="text-[10px] font-bold text-slate-300">Synthesize</span>
                  <span className="text-[8px] font-mono text-slate-500">ᚱ Page Lore</span>
                </button>

                <button
                  onClick={() => handleSend('Examine source code architecture', 'code')}
                  className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  style={{ color: theme.accentColor }}
                >
                  <Code2 className="h-3.5 w-3.5 mb-1" />
                  <span className="text-[10px] font-bold text-slate-300">Code Lore</span>
                  <span className="text-[8px] font-mono text-slate-500">ᚲ Architecture</span>
                </button>

                <button
                  onClick={() => handleSend('Audit privacy wards and tracking vectors', 'ward')}
                  className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  style={{ color: theme.accentColor }}
                >
                  <Shield className="h-3.5 w-3.5 mb-1" />
                  <span className="text-[10px] font-bold text-slate-300">Ward Audit</span>
                  <span className="text-[8px] font-mono text-slate-500">ᛈ Shield Status</span>
                </button>
              </div>
            </div>

            {/* Conversation Stream */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isHuginn = msg.sender === 'huginn';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isHuginn ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                      <span>{isHuginn ? 'ᚺ HUGINN' : 'ᛗ VOYAGER'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`relative max-w-[90%] rounded-xl p-3.5 text-xs leading-relaxed shadow-lg backdrop-blur-md ${
                        isHuginn
                          ? 'border border-white/10 bg-[#0a101f]/90 text-slate-200'
                          : 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-100'
                      }`}
                      style={{
                        borderColor: isHuginn ? `${theme.accentColor}25` : undefined,
                      }}
                    >
                      {/* Formatted Text */}
                      <div className="whitespace-pre-wrap font-sans space-y-2">
                        {msg.text}
                      </div>

                      {/* Action Bar for AI response */}
                      {isHuginn && (
                        <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                          <span className="font-mono text-slate-500" style={{ color: theme.accentColor }}>
                            {realm.ruler} • {realm.rune}
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
                            title="Carve into memory (Copy)"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400 font-mono text-[9px]">Carved</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span className="font-mono text-[9px]">Copy Lore</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono">
                  <Feather className="h-3.5 w-3.5 animate-bounce" style={{ color: theme.accentColor }} />
                  <span>Huginn is in flight across {realm.name}...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative z-10 border-t border-white/10 bg-[#070b14]/90 p-3"
            >
              <div
                className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1.5 focus-within:border-cyan-500/50 transition-colors shadow-inner"
                style={{ borderColor: `${theme.accentColor}30` }}
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={`Inquire of the raven in ${realm.name}...`}
                  className="flex-1 bg-transparent px-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputVal.trim() || isTyping}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: `${theme.accentColor}25`,
                    color: theme.accentColor,
                  }}
                  title="Release the Raven"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
