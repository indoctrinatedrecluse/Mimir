import React, { useMemo, useState } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { generateQrMatrix } from '@/core/navigation/qrGenerator';
import { purifyUrl } from '@/core/navigation/autosuggest';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Check, Sparkles, X, ExternalLink } from 'lucide-react';

interface RunicQrPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  activeRealm: RealmId;
  onPurifyAndNavigate?: (purified: string) => void;
}

export const RunicQrPopover: React.FC<RunicQrPopoverProps> = ({
  isOpen,
  onClose,
  url,
  activeRealm,
  onPurifyAndNavigate,
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const [copied, setCopied] = useState(false);
  const [purifiedCopied, setPurifiedCopied] = useState(false);

  const purified = useMemo(() => purifyUrl(url), [url]);
  const hasTrackers = purified !== url;

  const matrix = useMemo(() => {
    try {
      const target = hasTrackers ? purified : url;
      return generateQrMatrix(target || 'https://mimir.internal');
    } catch {
      return generateQrMatrix('https://mimir.internal');
    }
  }, [url, purified, hasTrackers]);

  if (!isOpen) return null;

  const copyClean = () => {
    runicAudio.playChime();
    navigator.clipboard.writeText(purified);
    setPurifiedCopied(true);
    setTimeout(() => setPurifiedCopied(false), 2000);
  };

  const copyRaw = () => {
    runicAudio.playClick(600);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const moduleSize = 5;
  const padding = 16;
  const svgSize = matrix.length * moduleSize + padding * 2;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[360px] rounded-2xl border bg-[#080d1a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100"
          style={{
            borderColor: `${theme.accentColor}50`,
            boxShadow: `0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 25px -5px ${theme.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg border"
                style={{
                  borderColor: `${theme.accentColor}40`,
                  backgroundColor: `${theme.accentColor}15`,
                  color: theme.accentColor,
                }}
              >
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-1.5">
                  <span>Runic Lens • QR Matrix</span>
                  <span className="text-[10px] font-mono opacity-60" style={{ color: theme.accentColor }}>
                    {theme.primaryRune}
                  </span>
                </h3>
                <p className="text-[9px] text-slate-400 font-mono">Offline Mobile Teleportation</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* QR Matrix Canvas Container */}
          <div className="my-4 flex flex-col items-center justify-center">
            <div
              className="rounded-xl border p-2 bg-[#050811] shadow-inner"
              style={{ borderColor: `${theme.accentColor}30` }}
            >
              <svg
                width={svgSize}
                height={svgSize}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="shape-rendering-crispEdges"
              >
                {/* Background */}
                <rect width={svgSize} height={svgSize} fill="#050811" rx="8" />

                {/* QR Modules */}
                {matrix.map((row, r) =>
                  row.map((filled, c) => {
                    if (!filled) return null;
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={padding + c * moduleSize}
                        y={padding + r * moduleSize}
                        width={moduleSize - 0.4}
                        height={moduleSize - 0.4}
                        rx="1"
                        fill={theme.accentColor}
                      />
                    );
                  })
                )}
              </svg>
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-400">
              Scan with camera to bridge realm to mobile device
            </p>
          </div>

          {/* Purify URL & Action Links */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            {hasTrackers && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-[10px] flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Tracking runes purged from QR matrix</span>
                </div>
                {onPurifyAndNavigate && (
                  <button
                    onClick={() => {
                      onPurifyAndNavigate(purified);
                      onClose();
                    }}
                    className="text-[9px] font-bold text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Purify Active Realm</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={copyClean}
                className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
              >
                {purifiedCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{purifiedCopied ? 'Purified Link Copied!' : 'Copy Purified Link'}</span>
              </button>

              <button
                onClick={copyRaw}
                className="flex items-center justify-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition-all"
                title="Copy Exact Raw URL"
              >
                {copied ? <Check className="h-3 w-3 text-cyan-400" /> : <Copy className="h-3 w-3" />}
                <span>Raw</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
