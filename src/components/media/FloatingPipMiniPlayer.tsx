import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Maximize2,
  Disc3,
  GripHorizontal,
} from 'lucide-react';
import { ActiveMediaSession, RealmId } from '@/types';
import { mediaController } from '@/core/media/mediaController';
import { runicAudio } from '@/core/audio/runicAudio';
import { REALM_THEMES } from '@/components/themes/realmThemes';

interface FloatingPipMiniPlayerProps {
  activeRealm: RealmId;
  onNavigateToTab?: (tabId: string) => void;
}

export const FloatingPipMiniPlayer: React.FC<FloatingPipMiniPlayerProps> = ({
  activeRealm,
  onNavigateToTab,
}) => {
  const [session, setSession] = useState<ActiveMediaSession | null>(mediaController.getSession());

  useEffect(() => {
    return mediaController.subscribe((s) => setSession(s));
  }, []);

  if (!session || !session.isPipActive) {
    return null;
  }

  const theme = REALM_THEMES[session.tabRealm || activeRealm] || REALM_THEMES.midgard;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden cursor-default select-none"
      style={{
        boxShadow: `0 0 30px ${theme.accentColor}30, 0 10px 40px rgba(0,0,0,0.8)`,
        borderColor: `${theme.accentColor}50`,
      }}
    >
      {/* Drag Handle Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/10 cursor-grab active:cursor-grabbing">
        <div className="flex items-center space-x-1.5">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span
            className="text-[9px] font-mono font-bold tracking-wider uppercase"
            style={{ color: theme.accentColor }}
          >
            ᛊ FLOATING RUNE PIP
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {session.tabId !== 'ambient' && onNavigateToTab && (
            <button
              onClick={() => {
                runicAudio.playClick(700);
                onNavigateToTab(session.tabId);
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Return to Tab"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              mediaController.togglePip();
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
            title="Close Picture-in-Picture"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Mini Video / Audio Visualizer Screen */}
      <div className="relative h-36 bg-gradient-to-b from-slate-900 to-black flex items-center justify-center overflow-hidden">
        {/* Animated Runic Ambient Halo */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none blur-xl"
          style={{
            background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)`,
          }}
        />

        {/* Center Disc / Rune Sigil */}
        <div className="flex flex-col items-center space-y-2 z-10">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md ${
              session.isPlaying ? 'animate-spin' : ''
            }`}
            style={{
              animationDuration: '6s',
              boxShadow: `0 0 15px ${theme.accentColor}40`,
            }}
          >
            <Disc3 className="h-6 w-6" style={{ color: theme.accentColor }} />
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-300 max-w-[200px] truncate">
            {session.title}
          </span>
        </div>

        {/* Floating Sound Waves along bottom of video area */}
        <div className="absolute bottom-1 inset-x-0 flex items-end justify-center space-x-1 px-4 h-6 opacity-60 pointer-events-none">
          {[35, 65, 80, 45, 90, 70, 30, 85, 50, 40, 75, 60].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-t bg-cyan-400"
              style={{
                height: session.isPlaying ? `${h}%` : '15%',
                backgroundColor: theme.accentColor,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mini Controller Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              runicAudio.playClick(session.isPlaying ? 450 : 850);
              mediaController.togglePlay();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.accentColor,
              borderColor: `${theme.accentColor}90`,
            }}
            title={session.isPlaying ? 'Pause' : 'Play'}
          >
            {session.isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-0.2" />}
          </button>

          <button
            onClick={() => {
              runicAudio.playClick(500);
              mediaController.toggleMute();
            }}
            className="p-1 rounded text-slate-400 hover:text-white"
            title={session.isMuted ? 'Unmute' : 'Mute'}
          >
            {session.isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono text-slate-400">
            {session.artist || 'Web Stream'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
