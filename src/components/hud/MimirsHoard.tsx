import React, { useState } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FolderOpen, Trash2, CheckCircle, Loader, FileText, Image, Archive, Film, Music } from 'lucide-react';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
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
}

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
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const activeDownloads = downloads.filter((d) => d.status === 'downloading');
  const completedDownloads = downloads.filter((d) => d.status !== 'downloading');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-3 top-[52px] z-50 flex w-[380px] max-h-[480px] flex-col overflow-hidden rounded-xl border bg-[#080d17]/98 shadow-2xl backdrop-blur-2xl"
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
              {completedDownloads.length > 0 && (
                <button
                  onClick={() => {
                    runicAudio.playClick(400);
                    onClearCompleted();
                  }}
                  className="flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Clear completed downloads"
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

          {/* Downloads List */}
          <div className="flex-1 overflow-y-auto p-2">
            {downloads.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center text-slate-500">
                <Download className="h-6 w-6 mb-2 opacity-40" />
                <p className="text-xs">No artifacts acquired yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Downloaded files will appear here as treasures in Mímir's Hoard.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {downloads.map((item) => {
                  const FileIcon = getFileIcon(item.type);
                  const statusColor = getStatusColor(item.status);
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center space-x-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 hover:border-white/15 hover:bg-white/[0.04] transition-all"
                    >
                      {/* File Type Icon */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] shrink-0">
                        {item.status === 'downloading' ? (
                          <Loader className="h-4 w-4 text-cyan-400 animate-spin" />
                        ) : item.status === 'complete' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate text-xs font-medium text-slate-200">
                          {item.filename}
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-mono" style={{ color: statusColor }}>
                            {getStatusLabel(item.status)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.size}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {item.timestamp}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {item.status === 'downloading' && (
                          <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.progress}%`,
                                background: `linear-gradient(90deg, ${theme.accentColor}, ${statusColor})`,
                                boxShadow: `0 0 8px ${statusColor}`,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {item.status === 'complete' && (
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Open containing folder"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                        </button>
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
