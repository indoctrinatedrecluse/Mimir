import React, { useState } from 'react';
import { RealmId } from '@/types';
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
} from 'lucide-react';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  path: string;
  size: string;
  progress: number; // 0-100
  status: 'downloading' | 'complete' | 'failed' | 'paused';
  timestamp: string;
  type: 'document' | 'image' | 'archive' | 'video' | 'audio' | 'other';
}

interface MimirsHoardProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  downloads: DownloadItem[];
  onClearCompleted: () => void;
  onAcquireUrl: (url: string) => void;
  onDeleteItem: (id: string, path: string) => void;
}

export const detectFileType = (filename: string): DownloadItem['type'] => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz'].includes(ext)) return 'archive';
  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'flac', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['pdf', 'docx', 'doc', 'txt', 'md', 'html', 'json', 'csv'].includes(ext)) return 'document';
  return 'other';
};

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

export const MimirsHoard: React.FC<MimirsHoardProps> = ({
  isOpen,
  onClose,
  activeRealm,
  downloads,
  onClearCompleted,
  onAcquireUrl,
  onDeleteItem,
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const [manualUrl, setManualUrl] = useState('');
  const [showAcquireInput, setShowAcquireInput] = useState(false);

  const completedDownloads = downloads.filter((d) => d.status !== 'downloading');

  const handleAcquireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    runicAudio.playRunicHum();
    onAcquireUrl(manualUrl.trim());
    setManualUrl('');
    setShowAcquireInput(false);
  };

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
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-3 top-[52px] z-50 flex w-[420px] max-h-[540px] flex-col overflow-hidden rounded-xl border bg-[#080d17]/98 shadow-2xl backdrop-blur-2xl"
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
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                {downloads.length} artifact{downloads.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-1">
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
              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
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

          {/* Downloads List */}
          <div className="flex-1 overflow-y-auto p-2">
            {downloads.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-slate-500">
                <Download className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-400">No artifacts acquired yet.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[260px]">
                  Files downloaded across the Nine Realms will be preserved as sacred artifacts in Mímir's Hoard.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {downloads.map((item) => {
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
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold" style={{ color: statusColor }}>
                              {getStatusLabel(item.status)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.size}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              • {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Micro-buttons */}
                        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.path && item.status === 'complete' && (
                            <>
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

                      {/* Progress Bar */}
                      {item.status === 'downloading' && (
                        <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(5, item.progress)}%`,
                              background: `linear-gradient(90deg, ${theme.accentColor}, ${statusColor})`,
                              boxShadow: `0 0 8px ${statusColor}`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
