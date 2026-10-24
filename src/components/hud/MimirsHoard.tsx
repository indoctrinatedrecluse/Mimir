import React, { useState } from 'react';
import { RealmId, DownloadItem, TorrentItem } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  FolderOpen,
  Trash2,
  CheckCircle,
  Loader,
  FileText,
  Image,
  Archive,
  Film,
  Music,
  ExternalLink,
  Plus,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Hash,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Radio,
  Users,
  Upload,
  Compass,
  Share2,
} from 'lucide-react';

export type { DownloadItem };

interface MimirsHoardProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  downloads: DownloadItem[];
  torrents?: TorrentItem[];
  onClearCompleted: () => void;
  onAcquireUrl: (url: string) => void;
  onDeleteItem: (id: string, path: string) => void;
  onCancelItem?: (id: string) => void;
  onTogglePauseItem?: (id: string) => void;
  onAddTorrent?: (urlOrMagnet: string, downloadDir?: string) => void;
  onPauseTorrent?: (id: string) => void;
  onResumeTorrent?: (id: string) => void;
  onDeleteTorrent?: (id: string, deleteFiles?: boolean) => void;
}

import { detectFileType } from '@/core/utils/fileType';
export { detectFileType };

const getFileIcon = (type: DownloadItem['type']) => {
  switch (type) {
    case 'image':
      return Image;
    case 'archive':
      return Archive;
    case 'video':
      return Film;
    case 'audio':
      return Music;
    case 'document':
      return FileText;
    default:
      return FileText;
  }
};

const getStatusColor = (status: DownloadItem['status']) => {
  switch (status) {
    case 'downloading':
      return '#06b6d4';
    case 'complete':
      return '#10b981';
    case 'failed':
      return '#ef4444';
    case 'paused':
      return '#f59e0b';
  }
};

const getStatusLabel = (status: DownloadItem['status']) => {
  switch (status) {
    case 'downloading':
      return 'Acquiring...';
    case 'complete':
      return 'Acquired';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Suspended';
  }
};

const getTorrentStatusColor = (state: TorrentItem['state']) => {
  switch (state) {
    case 'downloading':
      return '#06b6d4';
    case 'seeding':
      return '#a855f7';
    case 'finished':
      return '#10b981';
    case 'paused':
      return '#f59e0b';
    case 'error':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
};

const getTorrentStatusLabel = (state: TorrentItem['state']) => {
  switch (state) {
    case 'downloading':
      return 'Sailing Swarm';
    case 'seeding':
      return 'Seeding Allfather';
    case 'finished':
      return 'Anchored in Hoard';
    case 'paused':
      return 'Swarm Suspended';
    case 'error':
      return 'Vessel Damaged';
    default:
      return 'Probing Trackers...';
  }
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const SAMPLE_UBUNTU_MAGNET =
  'magnet:?xt=urn:btih:2b281f6c13488f58356f91cb7ffaa90cfdc79391&dn=ubuntu-mini-iso';

export const MimirsHoard: React.FC<MimirsHoardProps> = ({
  isOpen,
  onClose,
  activeRealm,
  downloads,
  torrents = [],
  onClearCompleted,
  onAcquireUrl,
  onDeleteItem,
  onCancelItem,
  onTogglePauseItem,
  onAddTorrent,
  onPauseTorrent,
  onResumeTorrent,
  onDeleteTorrent,
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const [activeHoardTab, setActiveHoardTab] = useState<'artifacts' | 'swarm'>('artifacts');
  const [manualUrl, setManualUrl] = useState('');
  const [showAcquireInput, setShowAcquireInput] = useState(false);
  const [swarmInput, setSwarmInput] = useState('');
  const [showSwarmInput, setShowSwarmInput] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'downloading' | 'complete' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeHashPath, setActiveHashPath] = useState<string | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [isHashing, setIsHashing] = useState(false);

  React.useEffect(() => {
    const unsub = mimirIpc.onHashResult((res) => {
      if (res.path === activeHashPath) {
        setCalculatedHash(res.hash);
        setIsHashing(false);
        runicAudio.playChime();
      }
    });
    return unsub;
  }, [activeHashPath]);

  const handleCalculateHash = (path: string) => {
    setActiveHashPath(path);
    setCalculatedHash(null);
    setVerifyInput('');
    setIsHashing(true);
    runicAudio.playClick(600);
    mimirIpc.calculateHash(path);
  };

  const copyHash = () => {
    if (!calculatedHash) return;
    navigator.clipboard.writeText(calculatedHash);
    setCopiedHash(true);
    runicAudio.playClick(800);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const completedDownloads = downloads.filter((d) => d.status !== 'downloading');

  const filteredDownloads = downloads.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    return true;
  });

  const handleAcquireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    runicAudio.playRunicHum();
    onAcquireUrl(manualUrl.trim());
    setManualUrl('');
    setShowAcquireInput(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSwarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swarmInput.trim()) return;
    runicAudio.playRunicHum();
    onAddTorrent?.(swarmInput.trim());
    setSwarmInput('');
    setShowSwarmInput(false);
  };

  const handleTorrentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        runicAudio.playRunicHum();
        onAddTorrent?.(result);
        setShowSwarmInput(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const totalSwarmPeers = torrents.reduce((acc, t) => acc + (t.peers || 0), 0);

  const handleOpenFile = (path: string) => {
    if (!path) return;
    runicAudio.playClick(700);
    mimirIpc.send({ type: 'OPEN_PATH', payload: { path, isDir: false } });
  };

  const handleOpenFolder = (path: string) => {
    if (!path) return;
    runicAudio.playClick(600);
    mimirIpc.send({ type: 'OPEN_PATH', payload: { path, isDir: true } });
  };

  const handleDelete = (id: string, path: string) => {
    runicAudio.playClick(400);
    onDeleteItem(id, path);
    if (activeHashPath === path) {
      setActiveHashPath(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-3 top-[52px] z-50 flex w-[450px] max-h-[560px] flex-col overflow-hidden rounded-xl border bg-[#080d17]/98 shadow-2xl backdrop-blur-2xl"
          style={{
            borderColor: `${theme.accentColor}40`,
            boxShadow: `0 12px 40px -10px rgba(0, 0, 0, 0.85), 0 0 20px -5px ${theme.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4" style={{ color: theme.accentColor }} />
              <span className="text-xs font-black tracking-wider text-slate-100 uppercase">
                MÍMIR'S HOARD
              </span>
              <span className="flex items-center space-x-1 rounded bg-cyan-500/15 border border-cyan-400/30 px-1.5 py-0.5 text-[8.5px] font-mono font-bold text-cyan-300">
                <Zap className="h-2.5 w-2.5 text-cyan-400 animate-pulse" />
                <span>Bifröst Turbo</span>
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {activeHoardTab === 'artifacts' ? (
                <>
                  <button
                    onClick={() => {
                      runicAudio.playClick(500);
                      setShowAcquireInput(!showAcquireInput);
                    }}
                    className={`flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                      showAcquireInput
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Acquire artifact from custom URL"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Fetch</span>
                  </button>

                  {completedDownloads.length > 0 && (
                    <button
                      onClick={() => {
                        runicAudio.playClick(400);
                        onClearCompleted();
                      }}
                      className="flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Clear finished downloads from Hoard list"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      runicAudio.playClick(500);
                      setShowSwarmInput(!showSwarmInput);
                    }}
                    className={`flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                      showSwarmInput
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : 'text-purple-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Ingest Magnet or .torrent"
                  >
                    <Radio className="h-3 w-3 text-purple-400" />
                    <span>Ingest Swarm</span>
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-realm Mode Selector: Sacred Artifacts vs Naglfar Swarm */}
          <div className="flex items-center border-b border-white/10 bg-black/40 px-3 py-1.5 space-x-2">
            <button
              onClick={() => {
                runicAudio.playClick(600);
                setActiveHoardTab('artifacts');
              }}
              className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeHoardTab === 'artifacts'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Zap className="h-3 w-3 text-cyan-400" />
              <span>Sacred Artifacts</span>
              <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                {downloads.length}
              </span>
            </button>

            <button
              onClick={() => {
                runicAudio.playClick(600);
                setActiveHoardTab('swarm');
              }}
              className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeHoardTab === 'swarm'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Radio className="h-3 w-3 text-purple-400" />
              <span>Naglfar Swarm</span>
              <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono text-purple-300">
                {torrents.length}
              </span>
              {totalSwarmPeers > 0 && (
                <span className="flex items-center space-x-0.5 rounded bg-purple-500/30 px-1.5 py-0.2 text-[8px] font-mono text-purple-200">
                  <Users className="h-2 w-2" />
                  <span>{totalSwarmPeers}</span>
                </span>
              )}
            </button>
          </div>

          {/* Artifacts Filter Bar & Input Drawer */}
          {activeHoardTab === 'artifacts' && (
            <>
              <div className="flex flex-col border-b border-white/10 bg-white/[0.01] px-3 py-2 space-y-1.5">
                {/* Status Tabs */}
                <div className="flex items-center space-x-1">
                  {(['all', 'downloading', 'complete', 'failed'] as const).map((st) => {
                    const count = st === 'all' ? downloads.length : downloads.filter((d) => d.status === st).length;
                    const isSel = statusFilter === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          runicAudio.playClick(600);
                          setStatusFilter(st);
                        }}
                        className={`flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold capitalize transition-all ${
                          isSel
                            ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <span>{st === 'downloading' ? 'Active' : st}</span>
                        <span className="text-[9px] opacity-60">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Type Filter Pills */}
                <div className="flex items-center space-x-1 overflow-x-auto text-[9px] font-mono text-slate-400">
                  <span className="text-slate-500 select-none">Type:</span>
                  {(['all', 'document', 'image', 'archive', 'video'] as const).map((tp) => (
                    <button
                      key={tp}
                      onClick={() => {
                        runicAudio.playClick(600);
                        setTypeFilter(tp);
                      }}
                      className={`rounded px-1.5 py-0.5 transition-colors ${
                        typeFilter === tp ? 'bg-white/15 text-white font-bold' : 'hover:text-slate-300'
                      }`}
                    >
                      {tp === 'all' ? 'All Types' : tp.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Acquire Input Drawer */}
              {showAcquireInput && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAcquireSubmit}
                  className="border-b border-white/10 bg-white/[0.02] p-2.5 flex items-center space-x-2"
                >
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://... (Direct artifact URL)"
                    autoFocus
                    className="flex-1 bg-black/40 border border-white/15 rounded px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="flex items-center space-x-1 rounded px-3 py-1 text-xs font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-all"
                  >
                    <span>Acquire</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </motion.form>
              )}
            </>
          )}

          {/* Swarm Ingest Drawer */}
          {activeHoardTab === 'swarm' && showSwarmInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-purple-500/20 bg-purple-950/25 p-2.5 space-y-2"
            >
              <form onSubmit={handleSwarmSubmit} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={swarmInput}
                  onChange={(e) => setSwarmInput(e.target.value)}
                  placeholder="magnet:?xt=... or https://.../file.torrent or local path"
                  autoFocus
                  className="flex-1 bg-black/50 border border-purple-500/30 rounded px-2.5 py-1 text-xs text-purple-100 placeholder:text-slate-500 outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 rounded px-2.5 py-1 text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all"
                  title="Select local .torrent file"
                >
                  <FolderOpen className="h-3 w-3" />
                  <span>.torrent</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".torrent"
                  onChange={handleTorrentFileChange}
                  className="hidden"
                />
                <button
                  type="submit"
                  className="flex items-center space-x-1 rounded px-3 py-1 text-xs font-bold bg-purple-600/30 border border-purple-400/40 text-purple-200 hover:bg-purple-600/50 transition-all"
                >
                  <span>Sail</span>
                  <Radio className="h-3 w-3" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Quick Test Vessel:</span>
                <button
                  type="button"
                  onClick={() => {
                    runicAudio.playClick(600);
                    onAddTorrent?.(SAMPLE_UBUNTU_MAGNET);
                    setShowSwarmInput(false);
                  }}
                  className="text-purple-300 hover:text-purple-100 underline decoration-purple-500/50 hover:decoration-purple-300 transition-colors"
                >
                  Load Ubuntu Mini ISO Swarm ⛵
                </button>
              </div>
            </motion.div>
          )}

          {/* Main Content Area */}
          {activeHoardTab === 'artifacts' ? (
            <div className="flex-1 overflow-y-auto p-2">
            {filteredDownloads.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-slate-500">
                <Download className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-400">No artifacts match filter.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[260px]">
                  Files downloaded across the Nine Realms will be preserved as sacred artifacts in Mímir's Hoard.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredDownloads.map((item) => {
                  const FileIcon = getFileIcon(item.type);
                  const statusColor = getStatusColor(item.status);

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-2.5 hover:border-white/15 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        {/* File Type Icon */}
                        <div
                          onClick={() => item.path && handleOpenFile(item.path)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] shrink-0 transition-transform ${
                            item.path ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                          }`}
                          title={item.path ? 'Channel Artifact (Open)' : undefined}
                        >
                          {item.status === 'downloading' ? (
                            <Loader className="h-4 w-4 text-cyan-400 animate-spin" />
                          ) : item.status === 'complete' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : item.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-rose-400" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            onClick={() => item.path && handleOpenFile(item.path)}
                            className={`truncate text-xs font-medium text-slate-200 transition-colors ${
                              item.path ? 'cursor-pointer hover:text-cyan-300' : ''
                            }`}
                            title={item.path || item.filename}
                          >
                            {item.filename}
                          </span>
                          <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-bold" style={{ color: statusColor }}>
                              {getStatusLabel(item.status)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.size}
                            </span>
                            {item.status === 'downloading' && (
                              <>
                                <span className="text-[10px] text-cyan-300 font-mono font-bold">
                                  • {item.speed || 'Accelerating...'}
                                </span>
                                {item.eta && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    • ETA {item.eta}
                                  </span>
                                )}
                                {item.strands && item.strands > 1 ? (
                                  <span className="flex items-center space-x-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 px-1 py-0.2 text-[8px] font-mono font-bold text-cyan-300">
                                    <Zap className="h-2 w-2 text-cyan-400" />
                                    <span>{item.strands} Strands</span>
                                  </span>
                                ) : (
                                  <span className="rounded bg-white/5 border border-white/10 px-1 py-0.2 text-[8px] font-mono text-slate-400">
                                    Stream
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-[10px] text-slate-500">
                              • {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Micro-buttons */}
                        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.status === 'downloading' && (
                            <>
                              <button
                                onClick={() => onTogglePauseItem?.(item.id)}
                                className="flex h-7 w-7 items-center justify-center rounded text-amber-400 hover:bg-amber-500/10 transition-colors"
                                title="Suspend Artifact Acquisition"
                              >
                                <Pause className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onCancelItem?.(item.id)}
                                className="flex h-7 w-7 items-center justify-center rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Abort Acquisition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {item.status === 'paused' && (
                            <button
                              onClick={() => onTogglePauseItem?.(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Resume Acquisition"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {item.path && item.status === 'complete' && (
                            <>
                              <button
                                onClick={() => handleCalculateHash(item.path)}
                                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                                  activeHashPath === item.path
                                    ? 'text-cyan-300 bg-cyan-500/20'
                                    : 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
                                }`}
                                title="Compute & Verify SHA-256 Checksum"
                              >
                                <Hash className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenFile(item.path)}
                                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Channel Artifact (Open File)"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenFolder(item.path)}
                                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Reveal in Realm (Show in Explorer)"
                              >
                                <FolderOpen className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(item.id, item.path)}
                            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Exile Artifact (Delete)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bifröst Multi-Strand Progress Visualizer */}
                      {item.status === 'downloading' && (
                        <div className="mt-2 space-y-1.5">
                          {/* Main Progress Conduit */}
                          <div className="flex items-center space-x-2">
                            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(4, item.progress)}%`,
                                  background: `linear-gradient(90deg, ${theme.accentColor}, #06b6d4, #8b5cf6)`,
                                  boxShadow: `0 0 10px #06b6d4`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-cyan-300 min-w-[32px] text-right">
                              {Math.round(item.progress)}%
                            </span>
                          </div>

                          {/* Individual Strand Conduits (when accelerated across 2+ strands) */}
                          {item.strandProgress && item.strandProgress.length > 1 && (
                            <div className="rounded bg-black/40 border border-white/5 p-1.5 space-y-1">
                              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                                <span className="flex items-center space-x-1 text-cyan-400">
                                  <Zap className="h-2.5 w-2.5" />
                                  <span>Bifröst Multi-Strand Slices ({item.strandProgress.length})</span>
                                </span>
                                <span>Multiplexed</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {item.strandProgress.map((prog, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-1 h-1.5 rounded-sm bg-white/10 overflow-hidden relative group/strand"
                                    title={`Strand ${idx + 1}: ${Math.round(prog * 100)}%`}
                                  >
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-200"
                                      style={{ width: `${Math.round(prog * 100)}%` }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SHA-256 Checksum & Verification Card */}
                      {activeHashPath === item.path && item.status === 'complete' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 rounded-lg border border-cyan-500/30 bg-black/60 p-2.5 space-y-2 overflow-hidden"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                              <Hash className="h-3 w-3" />
                              <span>SHA-256 Runic Checksum</span>
                            </span>
                            <button
                              onClick={() => setActiveHashPath(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          {isHashing ? (
                            <div className="flex items-center space-x-2 text-xs text-slate-400 py-1 font-mono">
                              <Loader className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                              <span>Computing cryptographic checksum...</span>
                            </div>
                          ) : calculatedHash ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 rounded bg-black/40 border border-white/10 px-2 py-1 text-[10px] font-mono text-cyan-200 break-all select-all">
                                <span className="flex-1 font-mono">{calculatedHash}</span>
                                <button
                                  onClick={copyHash}
                                  className="p-1 text-slate-400 hover:text-white shrink-0"
                                  title="Copy SHA-256 Hash"
                                >
                                  {copiedHash ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-mono uppercase text-slate-400">
                                  Verify Against Expected Author Hash
                                </label>
                                <input
                                  type="text"
                                  value={verifyInput}
                                  onChange={(e) => setVerifyInput(e.target.value.trim())}
                                  placeholder="Paste expected SHA-256 checksum..."
                                  className={`w-full rounded border px-2 py-1 text-[10px] font-mono outline-none transition-colors ${
                                    verifyInput
                                      ? verifyInput.toLowerCase() === calculatedHash.toLowerCase()
                                        ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200'
                                        : 'border-rose-500/70 bg-rose-500/10 text-rose-200'
                                      : 'border-white/10 bg-white/[0.03] text-slate-200'
                                  }`}
                                />
                                {verifyInput && (
                                  <div className="text-[10px] font-mono font-bold pt-0.5">
                                    {verifyInput.toLowerCase() === calculatedHash.toLowerCase() ? (
                                      <span className="text-emerald-400 flex items-center space-x-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        <span>Sacred Integrity Verified! Hash Match.</span>
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 flex items-center space-x-1">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Checksum Mismatch — Artifact Altered</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            {torrents.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center text-center text-slate-500">
                <Radio className="h-8 w-8 mb-2 text-purple-400/40 animate-pulse" />
                <p className="text-xs font-semibold text-slate-300">Naglfar Swarm is Dormant</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
                  Harness the peer-to-peer conduits of the cosmos. Ingest magnet links, .torrent URLs, or local files to sail the swarm.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-mono font-bold text-purple-200 hover:bg-purple-500/20 transition-all"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-purple-300" />
                    <span>Ingest .torrent File</span>
                  </button>
                  <button
                    onClick={() => {
                      runicAudio.playClick(500);
                      onAddTorrent?.(SAMPLE_UBUNTU_MAGNET);
                    }}
                    className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                  >
                    <Radio className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Ubuntu ISO Swarm</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {torrents.map((t) => {
                  const statusColor = getTorrentStatusColor(t.state);
                  const statusLabel = getTorrentStatusLabel(t.state);
                  return (
                    <div
                      key={t.id}
                      className="group flex flex-col rounded-lg border border-purple-500/15 bg-purple-950/10 p-2.5 hover:border-purple-500/35 hover:bg-purple-950/20 transition-all"
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 shrink-0">
                            {t.state === 'downloading' ? (
                              <Loader className="h-4 w-4 text-cyan-400 animate-spin" />
                            ) : t.state === 'seeding' ? (
                              <Upload className="h-4 w-4 text-purple-400 animate-pulse" />
                            ) : t.state === 'finished' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : t.state === 'paused' ? (
                              <Pause className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Radio className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-xs font-semibold text-slate-200" title={t.name}>
                              {t.name}
                            </span>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono font-bold" style={{ color: statusColor }}>
                                {statusLabel}
                              </span>
                              <span className="text-[9.5px] font-mono text-purple-300/80 flex items-center space-x-0.5">
                                <Users className="h-2.5 w-2.5" />
                                <span>{t.peers} peers</span>
                              </span>
                              {t.downloadSpeedBytesSec > 0 && (
                                <span className="text-[9.5px] font-mono text-cyan-300 font-bold">
                                  ⬇ {t.downloadSpeed}
                                </span>
                              )}
                              {t.uploadSpeedBytesSec > 0 && (
                                <span className="text-[9.5px] font-mono text-purple-300 font-bold">
                                  ⬆ {t.uploadSpeed}
                                </span>
                              )}
                              {t.eta && t.state === 'downloading' && (
                                <span className="text-[9.5px] font-mono text-slate-400">
                                  ETA {t.eta}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Torrent Action Micro-buttons */}
                        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(t.state === 'downloading' || t.state === 'seeding') && (
                            <button
                              onClick={() => onPauseTorrent?.(t.id)}
                              className="flex h-7 w-7 items-center justify-center rounded text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Pause Swarm"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {t.state === 'paused' && (
                            <button
                              onClick={() => onResumeTorrent?.(t.id)}
                              className="flex h-7 w-7 items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Resume Swarm"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {t.path && (
                            <button
                              onClick={() => handleOpenFolder(t.path!)}
                              className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Reveal in Explorer"
                            >
                              <FolderOpen className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteTorrent?.(t.id, false)}
                            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Exile from Swarm (Remove)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar & Byte Details */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(2, t.progress)}%`,
                                background: t.state === 'seeding'
                                  ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                                  : 'linear-gradient(90deg, #06b6d4, #a855f7)',
                                boxShadow: `0 0 10px ${t.state === 'seeding' ? '#a855f7' : '#06b6d4'}`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-300 min-w-[32px] text-right">
                            {Math.round(t.progress)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span>
                            {t.totalBytes > 0 ? `${formatBytes(t.downloadedBytes)} / ${formatBytes(t.totalBytes)}` : 'Resolving swarm metadata...'}
                          </span>
                          <span className="truncate max-w-[150px] opacity-60">
                            Hash: {t.infoHash.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
