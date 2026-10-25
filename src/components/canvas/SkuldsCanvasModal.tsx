import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Download,
  Copy,
  Undo2,
  Trash2,
  Crop,
  PenTool,
  Square,
  ArrowRight,
  Type,
  Sparkles,
  Check,
  Maximize2,
  Palette,
} from 'lucide-react';

interface SkuldsCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  initialImageBase64?: string;
  pageTitle?: string;
}

type CanvasTool = 'pen' | 'rect' | 'arrow' | 'rune' | 'text' | 'crop';

const RUNE_STAMPS = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ'];

const PALETTE_COLORS = [
  { name: 'Bifröst Cyan', hex: '#00f5ff' },
  { name: 'Gungnir Gold', hex: '#fbbf24' },
  { name: 'Surtr Ember', hex: '#f43f5e' },
  { name: 'Yggdrasil Emerald', hex: '#10b981' },
  { name: 'Valkyrie Purple', hex: '#c084fc' },
  { name: 'Frost White', hex: '#ffffff' },
];

export const SkuldsCanvasModal: React.FC<SkuldsCanvasModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  initialImageBase64,
  pageTitle = 'Sacred Viewport',
}) => {
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState<string>('#00f5ff');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [selectedRune, setSelectedRune] = useState<string>('ᛗ');
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  // Initialize canvas with captured image or procedural backdrop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 960;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    if (initialImageBase64) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const initialSnapshot = ctx.getImageData(0, 0, width, height);
        setHistory([initialSnapshot]);
        setHistoryIndex(0);
      };
      img.src = initialImageBase64;
    } else {
      // Create high-res cinematic mock capture of current sanctuary
      ctx.fillStyle = '#060912';
      ctx.fillRect(0, 0, width, height);

      // Subtle Norse radial nebula
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 1.5);
      grad.addColorStop(0, `${theme.accentColor}25`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Inscribe grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Title watermark banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`ᛗ MÍMIR CAPTURE: ${pageTitle.toUpperCase()}`, 40, 60);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`Timestamp: ${new Date().toISOString()} • Sovereign Realm: ${activeRealm.toUpperCase()}`, 40, 85);

      const initialSnapshot = ctx.getImageData(0, 0, width, height);
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
    }
  }, [isOpen, initialImageBase64, activeRealm, pageTitle]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, data];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    runicAudio.playClick(500);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const prevIndex = historyIndex - 1;
    ctx.putImageData(history[prevIndex], 0, 0);
    setHistoryIndex(prevIndex);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    isDrawingRef.current = true;
    startPosRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    } else if (tool === 'rune') {
      runicAudio.playChime();
      ctx.font = `bold ${lineWidth * 12}px monospace`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillText(selectedRune, coords.x, coords.y);
      saveState();
      isDrawingRef.current = false;
    } else if (tool === 'text') {
      const text = window.prompt('Inscribe text onto parchment:', 'Noted');
      if (text) {
        runicAudio.playChime();
        ctx.font = `bold ${lineWidth * 6}px monospace`;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillText(text, coords.x, coords.y);
        saveState();
      }
      isDrawingRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (tool === 'pen') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      const w = coords.x - startPosRef.current.x;
      const h = coords.y - startPosRef.current.y;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
    } else if (tool === 'arrow') {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const fromX = startPosRef.current.x;
      const fromY = startPosRef.current.y;
      const toX = coords.x;
      const toY = coords.y;

      const headlen = 16;
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveState();
  };

  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    runicAudio.playChime();
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback: copy as data URL
        const dataUrl = canvas.toDataURL('image/png');
        await navigator.clipboard.writeText(dataUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  const handleSaveArtifact = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    runicAudio.playChime();
    const link = document.createElement('a');
    link.download = `mimir_skuld_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex h-[720px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070b13]/95 text-slate-100 shadow-[0_0_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          style={{ borderColor: `${theme.accentColor}40` }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b border-white/10 px-6 py-3.5"
            style={{
              background: `linear-gradient(90deg, ${theme.accentColor}15, transparent)`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: `${theme.accentColor}20`,
                  borderColor: `${theme.accentColor}50`,
                  color: theme.accentColor,
                  boxShadow: `0 0 16px ${theme.glowColor}`,
                }}
              >
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-black tracking-wide text-white uppercase">Skuld's Canvas</h2>
                  <span
                    className="rounded px-1.5 py-0.2 text-[8px] font-mono font-bold tracking-wider border"
                    style={{
                      borderColor: `${theme.accentColor}40`,
                      backgroundColor: `${theme.accentColor}15`,
                      color: theme.accentColor,
                    }}
                  >
                    CAPTURE & ANNOTATE
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Visible viewport captured • Inscribe runes, pointers, and annotations
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(500);
                onClose();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Canvas Viewport Area */}
          <div className="relative flex-1 overflow-hidden bg-black/60 flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-h-full max-w-full rounded-lg border border-white/10 shadow-2xl cursor-crosshair object-contain"
            />
          </div>

          {/* Runic Toolbar Bar */}
          <div className="flex items-center justify-between border-t border-white/10 bg-[#090e18]/90 px-6 py-3">
            {/* Tool selectors */}
            <div className="flex items-center space-x-1.5">
              {[
                { id: 'pen', label: 'Runic Pen', icon: PenTool },
                { id: 'rect', label: 'Box / Frame', icon: Square },
                { id: 'arrow', label: 'Runic Arrow', icon: ArrowRight },
                { id: 'rune', label: 'Rune Stamp', icon: Sparkles },
                { id: 'text', label: 'Inscription', icon: Type },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    runicAudio.playClick(600);
                    setTool(id as CanvasTool);
                  }}
                  className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                    tool === id
                      ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.3)]'
                      : 'border border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}

              {tool === 'rune' && (
                <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
                  {RUNE_STAMPS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        runicAudio.playClick(700);
                        setSelectedRune(r);
                      }}
                      className={`h-7 w-7 rounded border font-mono font-black text-xs transition-all ${
                        selectedRune === r
                          ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color Palette & Brush Size */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      runicAudio.playClick(550);
                      setColor(c.hex);
                    }}
                    className={`h-5 w-5 rounded-full border transition-transform ${
                      color === c.hex ? 'scale-125 border-white ring-2 ring-white/50' : 'border-black/50 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="h-4 w-[1px] bg-white/10" />

              {/* Stroke width */}
              <div className="flex items-center space-x-1">
                {[2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      runicAudio.playClick(500);
                      setLineWidth(w);
                    }}
                    className={`h-6 w-6 rounded border text-[10px] font-mono font-bold transition-all ${
                      lineWidth === w
                        ? 'border-cyan-400 bg-cyan-500/25 text-cyan-300'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Undo Inscription"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Actions: Copy & Save */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyClipboard}
                className="flex items-center space-x-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-500/30 active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSaveArtifact}
                className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/30 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Artifact</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
