import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Radio,
  Sparkles,
  Zap,
  Disc3,
  ExternalLink,
  X,
} from 'lucide-react';
import { ActiveMediaSession, RealmId } from '@/types';
import { mediaController } from '@/core/media/mediaController';
import { runicAudio } from '@/core/audio/runicAudio';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { REALMS } from '@/core/realms';

interface FloatingRuneMediaHudProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  onNavigateToTab?: (tabId: string) => void;
}

export const FloatingRuneMediaHud: React.FC<FloatingRuneMediaHudProps> = ({
  isOpen,
  onClose,
  activeRealm,
  onNavigateToTab,
}) => {
  const [session, setSession] = useState<ActiveMediaSession | null>(mediaController.getSession());
  const [equalizerBars, setEqualizerBars] = useState<number[]>([40, 75, 20, 90, 60, 30, 85, 45]);

  useEffect(() => {
    return mediaController.subscribe((s) => setSession(s));
  }, []);

  // Animate dynamic runic equalizer bars when media is playing
  useEffect(() => {
    if (!session?.isPlaying) return;
    const interval = setInterval(() => {
      setEqualizerBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 75) + 20)
      );
    }, 150);
    return () => clearInterval(interval);
  }, [session?.isPlaying]);

  const theme = REALM_THEMES[session?.tabRealm || activeRealm] || REALM_THEMES.midgard;
  const realmInfo = REALMS[session?.tabRealm || activeRealm];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-12 pointer-events-none">
        {/* Backdrop click to dismiss */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
          onClick={() => {
            runicAudio.playClick(500);
            onClose();
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative pointer-events-auto w-96 rounded-xl border border-white/15 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-2xl overflow-hidden"
          style={{
            boxShadow: `0 0 35px ${theme.accentColor}20, inset 0 0 15px rgba(255,255,255,0.05)`,
            borderTopColor: `${theme.accentColor}60`,
          }}
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: `${theme.accentColor}20`,
                  borderColor: `${theme.accentColor}40`,
                  color: theme.accentColor,
                }}
              >
                <Disc3 className={`h-4 w-4 ${session?.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wider text-slate-100 flex items-center space-x-1.5">
                  <span>FLOATING RUNE HUD</span>
                  <span className="font-mono text-cyan-400 text-[10px]">ᛊ</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Universal Media Conduit & Equalizer
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(600);
                onClose();
              }}
              className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!session ? (
            /* Empty State */
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div
                className="h-12 w-12 rounded-full border border-dashed flex items-center justify-center text-slate-500"
                style={{ borderColor: `${theme.accentColor}40` }}
              >
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">No Active Runic Broadcasts</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  Play media on any web page (YouTube, music stream, podcasts) or initiate Realm Ambient resonance to command it here.
                </p>
              </div>
              <button
                onClick={() => {
                  runicAudio.playChime();
                  runicAudio.toggleAmbient(activeRealm);
                  mediaController.registerMedia('ambient', 'Ambient Loom', activeRealm, 'mimir://ambient', true);
                }}
                className="mt-2 flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-125"
                style={{
                  backgroundColor: `${theme.accentColor}25`,
                  borderColor: `${theme.accentColor}50`,
                  color: theme.accentColor,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Channel {realmInfo?.name || 'Realm'} Ambient Resonance</span>
              </button>
            </div>
          ) : (
            /* Active Media Session Controls */
            <div className="mt-4 space-y-4">
              {/* Media Card Info */}
              <div className="flex items-start justify-between bg-white/[0.03] p-3 rounded-lg border border-white/5">
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span
                      className="rounded px-1.5 py-0.2 text-[8px] font-mono font-bold tracking-wider uppercase border"
                      style={{
                        backgroundColor: `${theme.accentColor}20`,
                        borderColor: `${theme.accentColor}40`,
                        color: theme.accentColor,
                      }}
                    >
                      {session.tabRealm}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {session.artist || 'Web Stream'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate" title={session.title}>
                    {session.title}
                  </h4>
                </div>

                {session.tabId !== 'ambient' && onNavigateToTab && (
                  <button
                    onClick={() => {
                      runicAudio.playClick(800);
                      onNavigateToTab(session.tabId);
                      onClose();
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors shrink-0"
                    title="Jump to Origin Tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dynamic Runic Equalizer Visualizer */}
              <div className="flex items-end justify-center space-x-1.5 h-10 px-4 bg-black/40 rounded-lg border border-white/5 py-1">
                {equalizerBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-t transition-all duration-150"
                    style={{
                      height: session.isPlaying ? `${height}%` : '15%',
                      backgroundColor: theme.accentColor,
                      opacity: session.isPlaying ? 0.85 : 0.25,
                      boxShadow: session.isPlaying ? `0 0 8px ${theme.accentColor}80` : undefined,
                    }}
                  />
                ))}
              </div>

              {/* Scrubber / Timeline Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatTime(session.currentTime)}</span>
                  <span>{formatTime(session.duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={session.duration}
                  value={session.currentTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    mediaController.seekTo(newTime);
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Primary Transport Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => {
                    runicAudio.playClick(600);
                    mediaController.seek(-10);
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    runicAudio.playClick(session.isPlaying ? 450 : 850);
                    mediaController.togglePlay();
                  }}
                  className="p-3 rounded-full border text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: theme.accentColor,
                    borderColor: `${theme.accentColor}80`,
                    boxShadow: `0 0 20px ${theme.accentColor}60`,
                  }}
                  title={session.isPlaying ? 'Pause' : 'Play'}
                >
                  {session.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
                </button>

                <button
                  onClick={() => {
                    runicAudio.playClick(600);
                    mediaController.seek(10);
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fast Forward 10s"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Volume & Mjolnir Thunder Boost */}
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        runicAudio.playClick(500);
                        mediaController.toggleMute();
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {session.isMuted || session.volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-rose-400" />
                      ) : session.volume < 0.5 ? (
                        <Volume1 className="h-4 w-4 text-cyan-300" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-cyan-300" />
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-slate-300">
                      Volume: {session.isMuted ? 'Muted' : `${Math.round(session.volume * 100)}%`}
                    </span>
                  </div>

                  {/* Volume Boost Indicator */}
                  {session.volumeBoost > 1.0 && (
                    <span className="flex items-center space-x-1 text-[9px] font-bold font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span>{Math.round(session.volumeBoost * 100)}% THUNDER BOOST</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={session.isMuted ? 0 : session.volume}
                    onChange={(e) => mediaController.setVolume(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Mjolnir Thunder Boost Multiplier Pills */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] font-mono text-slate-500">Mjolnir Amplification:</span>
                  <div className="flex items-center space-x-1">
                    {[1.0, 1.5, 2.0, 3.0].map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          runicAudio.playChime();
                          mediaController.setVolumeBoost(b);
                        }}
                        className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-all ${
                          session.volumeBoost === b
                            ? 'bg-amber-500/30 text-amber-300 border-amber-400/60 font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {b === 1.0 ? '100%' : `${Math.round(b * 100)}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Playback Speed & PiP Action Bar */}
              <div className="flex items-center justify-between pt-1">
                {/* Speed Pills */}
                <div className="flex items-center space-x-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        runicAudio.playClick(600);
                        mediaController.setPlaybackRate(rate);
                      }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-all ${
                        session.playbackRate === rate
                          ? 'bg-white/20 text-white border-white/40 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Floating Rune / Picture-in-Picture Trigger */}
                <button
                  onClick={() => {
                    runicAudio.playChime();
                    mediaController.togglePip();
                  }}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-all ${
                    session.isPipActive
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  title="Toggle Picture-in-Picture Floating Rune"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{session.isPipActive ? 'PiP ENGAGED' : 'POP OUT PIP'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
