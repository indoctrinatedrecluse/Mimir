import React, { useState, useEffect, useRef } from 'react';
import { RealmId, Tab } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Activity,
  X,
  Copy,
  Check,
  Send,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
  Bot,
  User,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';

interface RunicSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  activeTab: Tab | undefined;
  width: number;
  onWidthChange: (w: number) => void;
}

type SidecarTab = 'notes' | 'huginn' | 'telemetry';

interface ChatMessage {
  id: string;
  sender: 'user' | 'huginn';
  text: string;
  timestamp: string;
}

export const RunicSidecar: React.FC<RunicSidecarProps> = ({
  isOpen,
  onClose,
  activeRealm,
  activeTab,
  width,
  onWidthChange,
}) => {
  const [currentTab, setCurrentTab] = useState<SidecarTab>('notes');
  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('mimir_sidecar_notes') || '';
    } catch {
      return '';
    }
  });
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Huginn Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'h-welcome',
      sender: 'huginn',
      text: 'I am Huginn, thought-scout of the Allfather. The conduit to Mímisbrunnr is open. Inscribe your inquiry or summon insight on this realm.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Telemetry Log State
  const [telemetryLogs, setTelemetryLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'ward' | 'net' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'Yggdrasil conduit initialized on Midgard', type: 'info' },
    { id: '2', time: new Date().toLocaleTimeString(), text: 'Security Ward active — 40 surveillance nets shielded', type: 'ward' },
  ]);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('mimir_sidecar_notes', notes);
    } catch {}
  }, [notes]);

  // Scroll chat to bottom
  useEffect(() => {
    if (currentTab === 'huginn') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTab]);

  // Resize handling
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 280 && newWidth <= 650) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notes);
    setCopiedNotes(true);
    runicAudio.playClick(800);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleSendPrompt = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const prompt = chatInput;
    setChatInput('');
    setIsAiLoading(true);
    runicAudio.playClick(600);

    // Contextual simulated response grounded in current realm and tab
    setTimeout(() => {
      let reply = `Observing through the eye of ${theme.title} (${theme.norseTitle}).`;
      if (activeTab?.title) {
        reply += ` Current scroll: "${activeTab.title}". The winds of Yggdrasil whisper that wisdom comes from deep scrutiny of this vessel.`;
      } else {
        reply += ` The conduit is clear. How may the thought-scout guide your traversal?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `h-${Date.now()}`,
          sender: 'huginn',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsAiLoading(false);
      runicAudio.playChime();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative flex h-full flex-col border-l border-white/10 bg-[#07090e]/95 backdrop-blur-2xl select-none z-20 shrink-0"
    >
      {/* Resizing grip handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-500/30 transition-colors z-30"
        title="Drag to resize Runic Sidecar"
      />

      {/* Sidecar Top Bar */}
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-3 bg-black/40">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setCurrentTab('notes');
              runicAudio.playClick(500);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              currentTab === 'notes'
                ? 'bg-white/10 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Scratchpad</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('huginn');
              runicAudio.playClick(600);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              currentTab === 'huginn'
                ? 'bg-white/10 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Huginn AI</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('telemetry');
              runicAudio.playClick(700);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              currentTab === 'telemetry'
                ? 'bg-white/10 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Telemetry</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Close Sidecar (Ctrl+B)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sidecar Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tab 1: Scratchpad / Notes */}
        {currentTab === 'notes' && (
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <span>ᚠ RUNIC RUNESTONE NOTES</span>
                <span className="text-slate-500">({notes.length} runes)</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopyNotes}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  title="Copy Notes to Clipboard"
                >
                  {copiedNotes ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedNotes ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setNotes('')}
                  className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                  title="Clear Scratchpad"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inscribe thoughts, runic URLs, or clippings here... Auto-saved to your realm sanctum."
              className="flex-1 w-full resize-none rounded-lg bg-black/40 border border-white/10 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 leading-relaxed"
            />
          </div>
        )}

        {/* Tab 2: Huginn AI Chat */}
        {currentTab === 'huginn' && (
          <div className="flex flex-col h-full">
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2 ${
                    m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] ${
                      m.sender === 'user'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    {m.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
                      m.sender === 'user'
                        ? 'bg-cyan-900/30 text-cyan-100 border border-cyan-500/30'
                        : 'bg-white/5 text-slate-200 border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap select-text">{m.text}</p>
                    <span className="mt-1 block text-[9px] font-mono text-slate-500 text-right">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 italic font-mono py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span>Huginn is divining the runes...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/40">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                  placeholder="Inquire with Huginn..."
                  className="flex-1 rounded-lg bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleSendPrompt}
                  disabled={!chatInput.trim() || isAiLoading}
                  className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 p-2 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry Log */}
        {currentTab === 'telemetry' && (
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>ᛋ LIVE CONDUIT TELEMETRY</span>
              </span>
              <button
                onClick={() => setTelemetryLogs([])}
                className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px]">
              {telemetryLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-md border border-white/5 bg-black/30 p-2 text-slate-300"
                >
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{log.time}</span>
                    </span>
                    <span
                      className={`uppercase text-[8px] px-1 py-0.2 rounded ${
                        log.type === 'ward'
                          ? 'bg-rose-500/20 text-rose-400'
                          : log.type === 'net'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {log.type}
                    </span>
                  </div>
                  <p className="select-text">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
