import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Disc3,
  GripHorizontal,
  Layers,
  RotateCcw,
  RotateCw,
  Maximize2,
  Check,
  Minimize2,
} from 'lucide-react';
import { ActiveMediaSession, RealmId } from '@/types';
import { mediaController } from '@/core/media/mediaController';
import { runicAudio } from '@/core/audio/runicAudio';
import { REALM_THEMES } from '@/components/themes/realmThemes';

interface FloatingPipMiniPlayerProps {
  activeRealm: RealmId;
  onNavigateToTab?: (tabId: string) => void;
}

type AspectRatioMode = '16:9' | '4:3' | '1:1' | 'free';

const ASPECT_RATIOS: Record<AspectRatioMode, number | null> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1 / 1,
  'free': null,
};

export const FloatingPipMiniPlayer: React.FC<FloatingPipMiniPlayerProps> = ({
  activeRealm,
  onNavigateToTab,
}) => {
  const [session, setSession] = useState<ActiveMediaSession | null>(mediaController.getSession());
  
  // Dimensions and Aspect Ratio with localStorage persistence
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem('mimir_pip_dimensions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.width && parsed.height) return parsed;
      }
    } catch {}
    return { width: 360, height: 202.5 };
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>(() => {
    try {
      return (localStorage.getItem('mimir_pip_aspect_ratio') as AspectRatioMode) || '16:9';
    } catch {
      return '16:9';
    }
  });

  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 360,
    startH: 202.5,
  });

  useEffect(() => {
    return mediaController.subscribe((s) => setSession(s));
  }, []);

  const saveDimensions = (width: number, height: number) => {
    try {
      localStorage.setItem('mimir_pip_dimensions', JSON.stringify({ width, height }));
    } catch {}
  };

  const handleAspectRatioChange = (mode: AspectRatioMode) => {
    runicAudio.playClick(600);
    setAspectRatio(mode);
    try {
      localStorage.setItem('mimir_pip_aspect_ratio', mode);
    } catch {}

    const ratio = ASPECT_RATIOS[mode];
    if (ratio !== null) {
      const newHeight = Math.round(dimensions.width / ratio);
      const newDims = { width: dimensions.width, height: newHeight };
      setDimensions(newDims);
      saveDimensions(newDims.width, newDims.height);
    }
    setShowAspectMenu(false);
  };

  // Interactive Resizing handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: dimensions.width,
      startH: dimensions.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;

      let newWidth = Math.max(280, Math.min(800, resizeStartRef.current.startW + deltaX));
      let newHeight: number;

      const ratio = ASPECT_RATIOS[aspectRatio];
      if (ratio !== null) {
        newHeight = Math.round(newWidth / ratio);
      } else {
        newHeight = Math.max(158, Math.min(500, resizeStartRef.current.startH + deltaY));
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setDimensions((current) => {
          saveDimensions(current.width, current.height);
          return current;
        });
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [dimensions, aspectRatio]);

  if (!session || !session.isPipActive) {
    return null;
  }

  const theme = REALM_THEMES[session.tabRealm || activeRealm] || REALM_THEMES.midgard;
  const isNativeAot = Boolean(session.isNativePipActive);

  return (
    <motion.div
      drag={!isNativeAot}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="fixed bottom-6 right-6 z-50 rounded-2xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden cursor-default select-none group"
      style={{
        width: isNativeAot ? 360 : dimensions.width,
        boxShadow: `0 0 35px ${theme.accentColor}35, 0 15px 45px rgba(0,0,0,0.85)`,
        borderColor: `${theme.accentColor}50`,
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10 cursor-grab active:cursor-grabbing">
        <div className="flex items-center space-x-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span
            className="text-[9px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5"
            style={{ color: theme.accentColor }}
          >
            <span>ᛊ FLOATING RUNE</span>
            {isNativeAot && (
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8px] border border-cyan-400/40">
                AOT OS WINDOW
              </span>
            )}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          {/* Resolution & Aspect Ratio Badge */}
          {!isNativeAot && (
            <div className="relative">
              <button
                onClick={() => setShowAspectMenu(!showAspectMenu)}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Aspect Ratio & Resolution"
              >
                {Math.round(dimensions.width)}×{Math.round(dimensions.height)} ({aspectRatio})
              </button>

              {showAspectMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-32 p-1 bg-[#090e17] border border-cyan-500/30 rounded-xl shadow-2xl text-[10px] font-mono space-y-0.5">
                  {(['16:9', '4:3', '1:1', 'free'] as AspectRatioMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleAspectRatioChange(mode)}
                      className={`flex items-center justify-between w-full px-2 py-1 rounded text-left transition-colors ${
                        aspectRatio === mode 
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{mode === 'free' ? 'Freeform' : `${mode} Ratio`}</span>
                      {aspectRatio === mode && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Always-On-Top Native Popout Button */}
          <button
            onClick={() => {
              runicAudio.playClick(isNativeAot ? 550 : 800);
              if (isNativeAot) {
                mediaController.closeNativePipWindow();
              } else {
                mediaController.spawnNativePipWindow(Math.round(dimensions.width), Math.round(dimensions.height));
              }
            }}
            className={`p-1 rounded transition-colors ${
              isNativeAot 
                ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-400/40' 
                : 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
            }`}
            title={isNativeAot ? 'Dock back to browser' : 'Pin to Foreground (Always-On-Top over all desktop apps)'}
          >
            <Layers className="h-3 w-3" />
          </button>

          {/* Return to Tab */}
          {session.tabId !== 'ambient' && onNavigateToTab && (
            <button
              onClick={() => {
                runicAudio.playClick(700);
                onNavigateToTab(session.tabId);
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Return to Tab"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          )}

          {/* Close PiP */}
          <button
            onClick={() => {
              runicAudio.playClick(450);
              if (isNativeAot) {
                mediaController.closeNativePipWindow();
              }
              mediaController.togglePip();
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
            title="Close Picture-in-Picture"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Screen Area / OS Window Bridge Card */}
      {isNativeAot ? (
        <div className="p-6 bg-gradient-to-b from-cyan-950/30 via-slate-950 to-black flex flex-col items-center justify-center text-center space-y-3">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,245,255,0.2)] animate-pulse"
          >
            <Layers className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block">
              Floating Over Windows Desktop
            </span>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[260px] line-clamp-1">
              {session.title}
            </p>
          </div>
          <span className="text-[9px] font-mono text-cyan-300/80 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-500/20">
            Permanently visible across all applications
          </span>
        </div>
      ) : (
        <div 
          className="relative bg-gradient-to-b from-slate-900 to-black flex items-center justify-center overflow-hidden transition-all"
          style={{ height: Math.max(120, dimensions.height - 76) }}
        >
          {/* Animated Runic Ambient Halo */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none blur-xl"
            style={{
              background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)`,
            }}
          />

          {/* Center Disc / Rune Sigil */}
          <div className="flex flex-col items-center space-y-2 z-10 px-4 text-center">
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
            <span className="text-[11px] font-mono font-semibold text-slate-200 max-w-[85%] truncate drop-shadow">
              {session.title}
            </span>
          </div>

          {/* Equalizer Frequency Pillars */}
          <div className="absolute bottom-1 inset-x-0 flex items-end justify-center space-x-1 px-4 h-6 opacity-60 pointer-events-none">
            {[35, 65, 80, 45, 90, 70, 30, 85, 50, 40, 75, 60, 40, 70].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-t"
                style={{
                  height: session.isPlaying ? `${h}%` : '15%',
                  backgroundColor: theme.accentColor,
                  transition: 'height 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controller Transport Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-t border-white/5">
        <div className="flex items-center space-x-2">
          {/* Seek -10s */}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              mediaController.seek(-10);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Play/Pause */}
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

          {/* Seek +10s */}
          <button
            onClick={() => {
              runicAudio.playClick(600);
              mediaController.seek(10);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
            title="Forward 10 seconds"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => {
              runicAudio.playClick(500);
              mediaController.toggleMute();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={session.isMuted ? 'Unmute' : 'Mute'}
          >
            {session.isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Audio/Video Origin & Stream Status */}
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]">
            {session.artist || 'Web Stream'}
          </span>
          <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: session.isPlaying ? '#10b981' : '#f59e0b' }}
          />
        </div>
      </div>

      {/* Interactive Bottom-Right Corner Resize Handle */}
      {!isNativeAot && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
          title="Drag to resize mini player"
        >
          <div 
            className="w-2 h-2 border-r-2 border-b-2"
            style={{ borderColor: theme.accentColor }}
          />
        </div>
      )}
    </motion.div>
  );
};
