import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TitleBar } from '@/components/chrome/TitleBar';
import { Omnibar } from '@/components/mimisbrunnr/Omnibar';
import { TabTree } from '@/components/yggdrasil/TabTree';
import { ContentViewport } from '@/components/viewport/ContentViewport';
import { StatusBar } from '@/components/hud/StatusBar';
import { RunicAtmosphere } from '@/components/hud/RunicAtmosphere';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { Tab, RealmId, DownloadItem, TorrentItem } from '@/types';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc, NativeContextMenuEvent } from '@/core/ipc/bridge';
import { AnimatePresence } from 'framer-motion';
import { NorseContextMenu } from '@/components/chrome/NorseContextMenu';
import { detectFileType } from '@/core/utils/fileType';

import { sessionManager, SavedSession } from '@/core/session/sessionManager';
import { ValhallaRevivalBanner } from '@/components/session/ValhallaRevivalBanner';
import { inscriptionEngine } from '@/core/inscriptions/inscriptionEngine';

// Engine & Bundle Optimization: Lazy-load heavy drawers and overlays
const RealmSelector = lazy(() => import('@/components/realms/RealmSelector').then((m) => ({ default: m.RealmSelector })));
const HuginnPanel = lazy(() => import('@/components/ai/HuginnPanel').then((m) => ({ default: m.HuginnPanel })));
const MuninnVault = lazy(() => import('@/components/muninn/MuninnVault').then((m) => ({ default: m.MuninnVault })));
const BifrostMatrix = lazy(() => import('@/components/network/BifrostMatrix').then((m) => ({ default: m.BifrostMatrix })));
const BrokkrForge = lazy(() => import('@/components/forge/BrokkrForge').then((m) => ({ default: m.BrokkrForge })));
const CommandPalette = lazy(() => import('@/components/palette/CommandPalette').then((m) => ({ default: m.CommandPalette })));
const RuneSeeker = lazy(() => import('@/components/hud/RuneSeeker').then((m) => ({ default: m.RuneSeeker })));
const MimirsHoard = lazy(() => import('@/components/hud/MimirsHoard').then((m) => ({ default: m.MimirsHoard })));
const FateThreadPurge = lazy(() => import('@/components/hud/FateThreadPurge').then((m) => ({ default: m.FateThreadPurge })));
const RunicSidecar = lazy(() => import('@/components/sidecar/RunicSidecar').then((m) => ({ default: m.RunicSidecar })));
const ReaderSanctum = lazy(() => import('@/components/reader/ReaderSanctum').then((m) => ({ default: m.ReaderSanctum })));

const getInitialRealm = (): RealmId => {
  try {
    const saved = localStorage.getItem('mimir_active_realm');
    if (
      saved &&
      ['midgard', 'asgard', 'helheim', 'jotunheim', 'alfheim', 'svartalfheim', 'vanaheim', 'muspelheim', 'niflheim'].includes(saved)
    ) {
      return saved as RealmId;
    }
  } catch {}
  return 'midgard';
};

const createInitialTabs = (realm: RealmId): Tab[] => [
  {
    id: 'tab-1',
    title: 'Mímisbrunnr (New Tab)',
    url: 'mimir://newtab',
    isActive: true,
    isLoading: false,
    isMuted: false,
    isPinned: false,
    realm,
    rune: 'ᛗ',
    zoomLevel: 100,
  },
  {
    id: 'tab-2',
    title: 'GitHub — Repositories',
    url: 'https://github.com',
    isActive: false,
    isLoading: false,
    isMuted: false,
    isPinned: false,
    realm: 'asgard',
    rune: 'ᚨ',
    zoomLevel: 100,
  },
];

const RUNES_POOL = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛚ', 'ᛞ', 'ᛟ'];

export const App: React.FC = () => {
  const [activeRealm, setActiveRealm] = useState<RealmId>(getInitialRealm);
  const [tabs, setTabs] = useState<Tab[]>(() => createInitialTabs(getInitialRealm()));
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [isTabTreeCollapsed, setIsTabTreeCollapsed] = useState(false);
  const [isRealmSelectorOpen, setIsRealmSelectorOpen] = useState(false);
  const [isHuginnOpen, setIsHuginnOpen] = useState(false);
  const [isMuninnOpen, setIsMuninnOpen] = useState(false);
  const [isBifrostOpen, setIsBifrostOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);
  const [isSplitGaze, setIsSplitGaze] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | undefined>('tab-2');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(runicAudio.isAmbientEnabled());
  const [showSplash, setShowSplash] = useState(true);
  const [huginnPrompt, setHuginnPrompt] = useState<string>('');

  // Session Restoration & Valhalla Crash Sentinel
  const [pendingRevivalSession, setPendingRevivalSession] = useState<SavedSession | null>(() => {
    try {
      if (sessionManager.checkAbnormalTermination()) {
        return sessionManager.getAutoSavedSession();
      }
    } catch {}
    return null;
  });

  // Persistent Runic Sidecar & Reader Sanctum
  const [isSidecarOpen, setIsSidecarOpen] = useState(false);
  const [sidecarWidth, setSidecarWidth] = useState(340);
  const [isReaderSanctumOpen, setIsReaderSanctumOpen] = useState(false);

  // Download artifacts telemetry & localStorage persistence
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Naglfar Swarm torrent telemetry & localStorage persistence
  const [torrents, setTorrents] = useState<TorrentItem[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_torrents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Context Menu & Security Telemetry state
  const [contextMenuEvent, setContextMenuEvent] = useState<NativeContextMenuEvent | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [blockedTrackersCount, setBlockedTrackersCount] = useState<number>(0);

  // Synchronize downloads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mimir_downloads', JSON.stringify(downloads));
    } catch {}
  }, [downloads]);

  // Synchronize torrents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mimir_torrents', JSON.stringify(torrents));
    } catch {}
  }, [torrents]);

  // Persistent bookmarks storage
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mimir_bookmarked_urls');
      return saved ? JSON.parse(saved) : ['https://github.com'];
    } catch {
      return ['https://github.com'];
    }
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const splitTab = tabs.find((t) => t.id === splitTabId);

  // Synchronize initial tab with native Rust host
  useEffect(() => {
    mimirIpc.send({
      type: 'CREATE_TAB',
      payload: { tabId: 'tab-1', url: 'mimir://newtab', realm: activeRealm },
    });
  }, []);

const formatDownloadSpeed = (bytesSec: number): string => {
  if (!bytesSec || bytesSec <= 0) return '0 B/s';
  if (bytesSec >= 1024 * 1024 * 1024) return `${(bytesSec / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
  if (bytesSec >= 1024 * 1024) return `${(bytesSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesSec >= 1024) return `${(bytesSec / 1024).toFixed(0)} KB/s`;
  return `${bytesSec} B/s`;
};

const formatDownloadBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const formatEtaSeconds = (secs: number): string => {
  if (secs <= 0) return '';
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remainingSecs}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
};

  // Subscribe to native host events (downloads, context menu, tracker interception)
  useEffect(() => {
    const unDownloadStarted = mimirIpc.onDownloadStarted((ev) => {
      runicAudio.playRunicHum();
      setDownloads((prev) => {
        const existingIdx = prev.findIndex((d) => d.id === ev.id || d.url === ev.url);
        const newItem: DownloadItem = {
          id: ev.id,
          filename: ev.filename,
          url: ev.url,
          path: ev.path,
          size: 'Probing Bifröst conduits...',
          progress: 0,
          status: 'downloading',
          timestamp: 'Just now',
          type: detectFileType(ev.filename),
          speed: 'Accelerating...',
          strands: 1,
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newItem };
          return updated;
        }
        return [newItem, ...prev];
      });
    });

    const unDownloadProgress = mimirIpc.onDownloadProgress((ev) => {
      setDownloads((prev) =>
        prev.map((d) => {
          if (d.id === ev.id || d.url === ev.id) {
            const pct = ev.totalBytes > 0
              ? Math.min(100, Math.round((ev.receivedBytes / ev.totalBytes) * 100))
              : d.progress;
            const remainingBytes = ev.totalBytes > ev.receivedBytes ? ev.totalBytes - ev.receivedBytes : 0;
            const etaSecs = ev.speedBytesSec > 0 ? Math.ceil(remainingBytes / ev.speedBytesSec) : 0;
            const sizeStr = ev.totalBytes > 0
              ? `${formatDownloadBytes(ev.receivedBytes)} / ${formatDownloadBytes(ev.totalBytes)}`
              : formatDownloadBytes(ev.receivedBytes);

            return {
              ...d,
              progress: pct,
              speed: formatDownloadSpeed(ev.speedBytesSec),
              speedBytesSec: ev.speedBytesSec,
              receivedBytes: ev.receivedBytes,
              totalBytes: ev.totalBytes,
              strands: ev.strands,
              strandProgress: ev.strandProgress,
              eta: formatEtaSeconds(etaSecs),
              size: sizeStr,
              status: 'downloading',
            };
          }
          return d;
        })
      );
    });

    const unDownloadCompleted = mimirIpc.onDownloadCompleted((ev) => {
      if (ev.success) {
        runicAudio.playChime();
      } else {
        runicAudio.playClick(300);
      }
      setDownloads((prev) =>
        prev.map((d) => {
          if ((ev.id && d.id === ev.id) || d.url === ev.url || (ev.path && d.path === ev.path)) {
            return {
              ...d,
              path: ev.path || d.path,
              size: ev.size && ev.size !== '0 B' ? ev.size : d.size,
              status: ev.success ? 'complete' : 'failed',
              progress: ev.success ? 100 : 0,
              speed: undefined,
              eta: undefined,
            };
          }
          return d;
        })
      );
    });

    const unContextMenu = mimirIpc.onContextMenu((ev) => {
      setContextMenuEvent(ev);
      setIsContextMenuOpen(true);
    });

    const unTracker = mimirIpc.onTrackerBlocked(() => {
      setBlockedTrackersCount((prev) => prev + 1);
    });

    const unTorrentAdded = mimirIpc.onTorrentAdded((ev) => {
      runicAudio.playRunicHum();
      setTorrents((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === ev.id || t.infoHash === ev.infoHash);
        const newItem: TorrentItem = {
          id: ev.id,
          infoHash: ev.infoHash,
          name: ev.name || `Torrent ${ev.infoHash.slice(0, 8)}`,
          progress: 0,
          downloadSpeed: '0 B/s',
          uploadSpeed: '0 B/s',
          downloadSpeedBytesSec: 0,
          uploadSpeedBytesSec: 0,
          totalBytes: 0,
          downloadedBytes: 0,
          uploadedBytes: 0,
          peers: 0,
          state: 'initializing',
          eta: 'Probing Swarm...',
          timestamp: 'Just now',
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newItem };
          return updated;
        }
        return [newItem, ...prev];
      });
    });

    const unTorrentProgress = mimirIpc.onTorrentProgress((ev) => {
      setTorrents((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === ev.id || t.infoHash === ev.infoHash);
        const updatedItem: TorrentItem = {
          id: ev.id,
          infoHash: ev.infoHash,
          name: ev.name,
          progress: Math.min(100, Math.round(ev.progress * 100)),
          downloadSpeed: formatDownloadSpeed(ev.downloadSpeed),
          uploadSpeed: formatDownloadSpeed(ev.uploadSpeed),
          downloadSpeedBytesSec: ev.downloadSpeed,
          uploadSpeedBytesSec: ev.uploadSpeed,
          totalBytes: ev.totalBytes,
          downloadedBytes: ev.downloadedBytes,
          uploadedBytes: ev.uploadedBytes,
          peers: ev.peers,
          state: ev.state as TorrentItem['state'],
          eta: ev.state === 'seeding' ? 'Seeding' : (ev.etaSeconds > 0 ? formatEtaSeconds(ev.etaSeconds) : 'Calculating...'),
          timestamp: 'Active',
        };
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...updatedItem };
          return next;
        }
        return [updatedItem, ...prev];
      });
    });

    const unTorrentCompleted = mimirIpc.onTorrentCompleted((ev) => {
      runicAudio.playChime();
      setTorrents((prev) =>
        prev.map((t) => {
          if (t.id === ev.id || t.infoHash === ev.infoHash) {
            return {
              ...t,
              name: ev.name || t.name,
              totalBytes: ev.totalBytes || t.totalBytes,
              path: ev.path,
              progress: 100,
              state: 'seeding',
              downloadSpeed: '0 B/s',
              eta: 'Seeding to Swarm',
            };
          }
          return t;
        })
      );
    });

    return () => {
      unDownloadStarted();
      unDownloadProgress();
      unDownloadCompleted();
      unContextMenu();
      unTracker();
      unTorrentAdded();
      unTorrentProgress();
      unTorrentCompleted();
    };
  }, []);

  // Update ambient audio if active realm changes
  useEffect(() => {
    runicAudio.updateAmbientRealm(activeRealm);
  }, [activeRealm]);

  // Synchronize active realm to localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('mimir_active_realm', activeRealm);
    } catch {}
  }, [activeRealm]);

  // Session Lifecycle: mark running and clean shutdown
  useEffect(() => {
    sessionManager.markSessionRunning();
    const handleBeforeUnload = () => {
      sessionManager.markCleanShutdown();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Continuous Auto-Save to Valhalla Session Memory
  useEffect(() => {
    if (tabs.length > 0) {
      sessionManager.saveCurrentSessionAuto(tabs, activeTabId, activeRealm, splitTabId || null, isSplitGaze);
    }
  }, [tabs, activeTabId, activeRealm, splitTabId, isSplitGaze]);

  // Automatic Realm Inscriptions Injection for Web Views
  useEffect(() => {
    if (activeTab?.url) {
      inscriptionEngine.applyInscriptionsForTab(activeTab.url, activeRealm);
    }
  }, [activeTab?.url, activeRealm]);

  const handleRestoreSession = (saved: SavedSession) => {
    if (!saved.tabs || saved.tabs.length === 0) return;
    runicAudio.playChime();
    const revivedTabs: Tab[] = saved.tabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      realm: t.realm,
      rune: t.rune,
      isActive: t.id === saved.activeTabId,
      isLoading: false,
      isMuted: false,
      isPinned: Boolean(t.isPinned),
      parentId: t.parentId,
      zoomLevel: t.zoomLevel || 100,
    }));
    setTabs(revivedTabs);
    setActiveTabId(saved.activeTabId || revivedTabs[0].id);
    setActiveRealm(saved.realm || 'midgard');
    if (saved.splitTabId) setSplitTabId(saved.splitTabId);
    setIsSplitGaze(saved.isSplitGaze);
    setPendingRevivalSession(null);
    const activeUrl = revivedTabs.find((t) => t.id === saved.activeTabId)?.url || revivedTabs[0].url;
    if (activeUrl && !activeUrl.startsWith('mimir://')) {
      mimirIpc.send({
        type: 'NAVIGATE',
        payload: { url: activeUrl },
      });
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New Tab
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+W: Close Tab
      if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTab && !activeTab.isPinned) {
          handleCloseTab(activeTab.id);
        }
      }
      // Ctrl+H or Ctrl+I: Toggle Huginn AI Panel
      if (e.ctrlKey && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        runicAudio.playChime();
        setIsHuginnOpen((prev) => !prev);
      }
      // Ctrl+M: Toggle Muninn's Vault (Memory & Runestones)
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        runicAudio.playChime();
        setIsMuninnOpen((prev) => !prev);
      }
      // Ctrl+\: Toggle Odin's Split-Gaze
      if (e.ctrlKey && (e.key === '\\' || e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        runicAudio.playClick(650);
        setIsSplitGaze((prev) => !prev);
      }
      // Ctrl+K or Ctrl+Shift+P: Toggle Command Palette
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        runicAudio.playClick(600);
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+F: Rune Seeker (Find in Page)
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        runicAudio.playClick(700);
        setIsFindOpen((prev) => !prev);
      }
      // Ctrl+J: Mímir's Hoard (Downloads)
      if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        runicAudio.playClick(600);
        setIsDownloadsOpen((prev) => !prev);
      }
      // Ctrl+P: Print Page
      if (e.ctrlKey && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        handlePrint();
      }
      // Ctrl+= / Ctrl++: Zoom In
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl+-: Zoom Out
      if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      }
      // Ctrl+0: Zoom Reset
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      // Ctrl+Shift+Delete: Fate Thread Purge (Clear Browsing Data)
      if (e.ctrlKey && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        runicAudio.playClick(750);
        setIsClearDataOpen((prev) => !prev);
      }
      // Ctrl+B: Toggle Runic Sidecar (Persistent Dock)
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        runicAudio.playClick(600);
        setIsSidecarOpen((prev) => !prev);
      }
      // Alt+R: Toggle Reader Sanctum (Distraction-Free)
      if (e.altKey && !e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        runicAudio.playChime();
        setIsReaderSanctumOpen((prev) => !prev);
      }
      // Alt+1 to Alt+9: Realm Jump Hotkeys
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          const realms: RealmId[] = [
            'midgard',
            'asgard',
            'vanaheim',
            'alfheim',
            'jotunheim',
            'muspelheim',
            'niflheim',
            'nidavellir',
            'helheim',
          ];
          const target = realms[num - 1];
          if (target) {
            e.preventDefault();
            handleSelectRealm(target);
          }
        }
      }
      // Esc: Close modals & drawers
      if (e.key === 'Escape') {
        setIsRealmSelectorOpen(false);
        setIsHuginnOpen(false);
        setIsMuninnOpen(false);
        setIsBifrostOpen(false);
        setIsForgeOpen(false);
        setIsCommandPaletteOpen(false);
        setIsFindOpen(false);
        setIsDownloadsOpen(false);
        setIsClearDataOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, activeRealm, activeTab]);

  const handleSelectRealm = (realm: RealmId) => {
    setActiveRealm(realm);
    try {
      localStorage.setItem('mimir_active_realm', realm);
    } catch {}
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, realm } : t))
    );
    runicAudio.playRunicHum();
  };

  const handleSelectTab = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        isActive: t.id === id,
      }))
    );
    setActiveTabId(id);
    const target = tabs.find((t) => t.id === id);
    if (target?.realm) {
      setActiveRealm(target.realm);
    }
    mimirIpc.send({ type: 'SWITCH_TAB', payload: { tabId: id } });
  };

  const handleCloseTab = (id: string) => {
    mimirIpc.send({ type: 'CLOSE_TAB', payload: { tabId: id } });

    if (tabs.length === 1) {
      // Don't close last tab, just reset to new tab
      setTabs([
        {
          id: 'tab-1',
          title: 'Mímisbrunnr (New Tab)',
          url: 'mimir://newtab',
          isActive: true,
          isLoading: false,
          isMuted: false,
          isPinned: false,
          realm: activeRealm,
          rune: 'ᛗ',
          zoomLevel: 100,
        },
      ]);
      setActiveTabId('tab-1');
      mimirIpc.send({
        type: 'CREATE_TAB',
        payload: { tabId: 'tab-1', url: 'mimir://newtab', realm: activeRealm },
      });
      return;
    }

    const nextTabs = tabs.filter((t) => t.id !== id);
    if (activeTabId === id) {
      const idx = tabs.findIndex((t) => t.id === id);
      const newActive = nextTabs[Math.max(0, idx - 1)];
      nextTabs.forEach((t) => (t.isActive = t.id === newActive.id));
      setActiveTabId(newActive.id);
      mimirIpc.send({ type: 'SWITCH_TAB', payload: { tabId: newActive.id } });
    }
    setTabs(nextTabs);
  };

  const handleNewTab = (url = 'mimir://newtab') => {
    const newId = `tab-${Date.now()}`;
    const randomRune = RUNES_POOL[Math.floor(Math.random() * RUNES_POOL.length)];
    const newTab: Tab = {
      id: newId,
      title: url === 'mimir://newtab' ? 'Mímisbrunnr (New Tab)' : url,
      url,
      isActive: true,
      isLoading: false,
      isMuted: false,
      isPinned: false,
      realm: activeRealm,
      rune: randomRune,
      zoomLevel: 100,
    };

    setTabs((prev) => prev.map((t) => ({ ...t, isActive: false })).concat(newTab));
    setActiveTabId(newId);
    mimirIpc.send({ type: 'CREATE_TAB', payload: { tabId: newId, url, realm: activeRealm } });
  };

  const handleNavigate = (url: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTabId) {
          return {
            ...t,
            url,
            title: url.replace(/^https?:\/\//, '').replace(/\/$/, '') || url,
            isLoading: true,
          };
        }
        return t;
      })
    );

    // Send IPC navigation command with active tabId
    mimirIpc.send({ type: 'NAVIGATE', payload: { url, tabId: activeTabId } });

    // Clear loading state after delay
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
      );
    }, 600);
  };

  const handleZoomIn = () => {
    mimirIpc.send({ type: 'ZOOM_IN' });
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, zoomLevel: Math.min(300, (t.zoomLevel || 100) + 10) } : t
      )
    );
  };

  const handleZoomOut = () => {
    mimirIpc.send({ type: 'ZOOM_OUT' });
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, zoomLevel: Math.max(30, (t.zoomLevel || 100) - 10) } : t
      )
    );
  };

  const handleZoomReset = () => {
    mimirIpc.send({ type: 'ZOOM_RESET' });
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, zoomLevel: 100 } : t))
    );
  };

  const handlePrint = () => {
    mimirIpc.send({ type: 'PRINT' });
  };

  const handleTogglePinTab = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleToggleMuteTab = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  const handleDuplicateTab = (id: string) => {
    const source = tabs.find((t) => t.id === id);
    if (!source) return;
    const newId = `tab-${Date.now()}`;
    const randomRune = RUNES_POOL[Math.floor(Math.random() * RUNES_POOL.length)];
    const newTab: Tab = {
      id: newId,
      title: source.title,
      url: source.url,
      isActive: true,
      isLoading: false,
      isMuted: false,
      isPinned: false,
      realm: source.realm,
      rune: randomRune,
      zoomLevel: source.zoomLevel || 100,
      parentId: id,
    };
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: false })).concat(newTab));
    setActiveTabId(newId);
    mimirIpc.send({
      type: 'DUPLICATE_TAB',
      payload: { tabId: id, newTabId: newId },
    });
  };

  const handleToggleBookmark = (url: string) => {
    if (!url || url === 'mimir://newtab') return;
    setBookmarks((prev) => {
      const next = prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url];
      try {
        localStorage.setItem('mimir_bookmarked_urls', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAcquireUrl = (url: string) => {
    if (!url.trim()) return;
    mimirIpc.send({ type: 'DOWNLOAD_URL', payload: { url: url.trim() } });
    const parts = url.split('/');
    const rawFilename = parts[parts.length - 1] || 'artifact.bin';
    const filename = rawFilename.split('?')[0] || 'artifact.bin';
    const tempItem: DownloadItem = {
      id: `dl-${Date.now()}`,
      filename,
      url: url.trim(),
      path: '',
      size: 'Acquiring...',
      progress: 25,
      status: 'downloading',
      timestamp: 'Just now',
      type: detectFileType(filename),
    };
    setDownloads((prev) => [tempItem, ...prev]);
  };

  const handleCancelDownloadItem = (id: string) => {
    mimirIpc.cancelDownload(id);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'failed', progress: 0 } : d))
    );
  };

  const handleTogglePauseDownloadItem = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'downloading' ? 'paused' : 'downloading';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const handleDeleteDownloadItem = (id: string, path: string) => {
    if (path) {
      mimirIpc.send({ type: 'DELETE_FILE', payload: { path } });
    }
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddTorrent = (urlOrMagnet: string, downloadDir?: string) => {
    if (!urlOrMagnet.trim()) return;
    runicAudio.playRunicHum();
    mimirIpc.addTorrent(urlOrMagnet.trim(), downloadDir);
  };

  const handlePauseTorrent = (id: string) => {
    runicAudio.playClick(500);
    mimirIpc.pauseTorrent(id);
    setTorrents((prev) =>
      prev.map((t) => (t.id === id || t.infoHash === id ? { ...t, state: 'paused' } : t))
    );
  };

  const handleResumeTorrent = (id: string) => {
    runicAudio.playClick(600);
    mimirIpc.resumeTorrent(id);
    setTorrents((prev) =>
      prev.map((t) => (t.id === id || t.infoHash === id ? { ...t, state: 'downloading' } : t))
    );
  };

  const handleDeleteTorrent = (id: string, deleteFiles = false) => {
    runicAudio.playClick(400);
    mimirIpc.deleteTorrent(id, deleteFiles);
    setTorrents((prev) => prev.filter((t) => t.id !== id && t.infoHash !== id));
  };

  const handleUpgradeToHttps = () => {
    if (activeTab && activeTab.url.startsWith('http://')) {
      const upgraded = activeTab.url.replace(/^http:\/\//, 'https://');
      handleNavigate(upgraded);
    }
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#05070a] text-slate-100 font-sans">
      {/* Cinematic Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Ambient Runic Particles */}
      <RunicAtmosphere activeRealm={activeRealm} />

      {/* Layer 1: TitleBar */}
      <TitleBar
        activeRealm={activeRealm}
        onOpenRealmSelector={() => setIsRealmSelectorOpen(true)}
      />

      {/* Layer 2: Mímisbrunnr Omnibar */}
      <Omnibar
        currentUrl={activeTab?.url === 'mimir://newtab' ? '' : activeTab?.url || ''}
        activeRealm={activeRealm}
        onNavigate={handleNavigate}
        isLoading={activeTab?.isLoading}
        onToggleHuginn={() => setIsHuginnOpen((prev) => !prev)}
        isHuginnOpen={isHuginnOpen}
        onToggleMuninn={() => setIsMuninnOpen((prev) => !prev)}
        isMuninnOpen={isMuninnOpen}
        onToggleSplitGaze={() => setIsSplitGaze((prev) => !prev)}
        isSplitGazeActive={isSplitGaze}
        onToggleBifrost={() => setIsBifrostOpen(true)}
        onToggleForge={() => setIsForgeOpen(true)}
        isAmbientPlaying={isAmbientPlaying}
        onToggleAmbient={() => {
          const nextState = runicAudio.toggleAmbient(activeRealm);
          setIsAmbientPlaying(nextState);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        zoomLevel={activeTab?.zoomLevel || 100}
        onToggleDownloads={() => setIsDownloadsOpen((prev) => !prev)}
        downloadCount={downloads.filter((d) => d.status === 'downloading').length || downloads.length}
        onToggleFind={() => setIsFindOpen(true)}
        onPrint={handlePrint}
        onOpenClearData={() => setIsClearDataOpen(true)}
        isDownloadsOpen={isDownloadsOpen}
        onBookmarkCurrent={() => handleToggleBookmark(activeTab?.url || '')}
        isCurrentBookmarked={bookmarks.includes(activeTab?.url || '')}
        liveBlockedCount={blockedTrackersCount}
        onUpgradeToHttps={handleUpgradeToHttps}
        onToggleReader={() => setIsReaderSanctumOpen((prev) => !prev)}
        isReaderOpen={isReaderSanctumOpen}
        onToggleSidecar={() => setIsSidecarOpen((prev) => !prev)}
        isSidecarOpen={isSidecarOpen}
      />

      {/* Valhalla Revival Crash Sentinel Banner */}
      <ValhallaRevivalBanner
        session={pendingRevivalSession}
        activeRealm={activeRealm}
        onRestore={handleRestoreSession}
        onDismiss={() => {
          sessionManager.clearAutoSavedSession();
          setPendingRevivalSession(null);
        }}
      />

      {/* Layer 3: Main Workspace (Yggdrasil Tree + Content Viewport + Runic Sidecar) */}
      <div className="relative flex flex-1 overflow-hidden">
        <TabTree
          tabs={tabs}
          activeTabId={activeTabId}
          activeRealm={activeRealm}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={() => handleNewTab()}
          isCollapsed={isTabTreeCollapsed}
          onToggleCollapse={() => setIsTabTreeCollapsed(!isTabTreeCollapsed)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onTogglePinTab={handleTogglePinTab}
          onDuplicateTab={handleDuplicateTab}
          onReorderTabs={(newTabs) => setTabs(newTabs)}
          onToggleMuteTab={handleToggleMuteTab}
        />

        <ContentViewport
          activeTab={activeTab}
          activeRealm={activeRealm}
          onNavigate={handleNavigate}
          onSelectRealm={handleSelectRealm}
          isSplitGaze={isSplitGaze}
          splitTab={splitTab}
          tabs={tabs}
          onSelectSplitTab={(tabId) => setSplitTabId(tabId)}
          onCloseSplitGaze={() => setIsSplitGaze(false)}
          onSwapSplitTabs={() => {
            const currentActive = activeTabId;
            const nextActive = splitTabId || tabs[0].id;
            setActiveTabId(nextActive);
            setSplitTabId(currentActive);
            runicAudio.playClick(650);
          }}
        />

        {/* Persistent Runic Sidecar (Scratchpad, Huginn AI, Telemetry) */}
        <Suspense fallback={null}>
          <RunicSidecar
            isOpen={isSidecarOpen}
            onClose={() => setIsSidecarOpen(false)}
            activeRealm={activeRealm}
            activeTab={activeTab}
            width={sidecarWidth}
            onWidthChange={setSidecarWidth}
          />
        </Suspense>
      </div>

      {/* Layer 4: Status Telemetry HUD */}
      <StatusBar activeRealm={activeRealm} />

      {/* Lazy Overlays & Drawers Boundary */}
      <Suspense fallback={null}>
        {/* Overlay 1: Nine Realms Modal */}
        <RealmSelector
          isOpen={isRealmSelectorOpen}
          activeRealm={activeRealm}
          onSelectRealm={handleSelectRealm}
          onClose={() => setIsRealmSelectorOpen(false)}
        />

        {/* Overlay 2: Muninn's Memory Vault (Runestones & History) */}
        <MuninnVault
          isOpen={isMuninnOpen}
          onClose={() => setIsMuninnOpen(false)}
          activeRealm={activeRealm}
          currentTab={activeTab}
          onNavigate={handleNavigate}
        />

        {/* Overlay 3: Bifröst Proxy Conduit Matrix */}
        <BifrostMatrix
          isOpen={isBifrostOpen}
          onClose={() => setIsBifrostOpen(false)}
          activeRealm={activeRealm}
        />

        {/* Overlay 4: Brokkr's Extension Forge */}
        <BrokkrForge
          isOpen={isForgeOpen}
          onClose={() => setIsForgeOpen(false)}
          activeRealm={activeRealm}
        />

        {/* Overlay 5: Hliðskjálf Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          activeRealm={activeRealm}
          onNewTab={() => handleNewTab()}
          onCloseTab={() => {
            if (activeTab && !activeTab.isPinned) handleCloseTab(activeTab.id);
          }}
          onToggleSplitGaze={() => setIsSplitGaze((prev) => !prev)}
          onToggleHuginn={() => setIsHuginnOpen((prev) => !prev)}
          onToggleMuninn={() => setIsMuninnOpen((prev) => !prev)}
          onToggleBifrost={() => setIsBifrostOpen(true)}
          onToggleForge={() => setIsForgeOpen(true)}
          onToggleAmbient={() => {
            const nextState = runicAudio.toggleAmbient(activeRealm);
            setIsAmbientPlaying(nextState);
          }}
          isAmbientPlaying={isAmbientPlaying}
          onSelectRealm={handleSelectRealm}
          onNavigateHome={() => handleNavigate('mimir://newtab')}
          onRefresh={() => {
            if (activeTab?.url) {
              handleNavigate(activeTab.url);
            }
          }}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onPrint={handlePrint}
          onOpenFind={() => setIsFindOpen(true)}
          onOpenDownloads={() => setIsDownloadsOpen(true)}
          onOpenClearData={() => setIsClearDataOpen(true)}
          onPinActiveTab={() => handleTogglePinTab(activeTabId)}
          onDuplicateActiveTab={() => handleDuplicateTab(activeTabId)}
          onToggleReader={() => setIsReaderSanctumOpen((prev) => !prev)}
          onToggleSidecar={() => setIsSidecarOpen((prev) => !prev)}
          onRestoreValhalla={() => {
            const auto = sessionManager.getAutoSavedSession();
            if (auto) handleRestoreSession(auto);
          }}
        />

        {/* Overlay 6: Rune Seeker (Find in Page) */}
        <RuneSeeker
          isOpen={isFindOpen}
          onClose={() => setIsFindOpen(false)}
          activeRealm={activeRealm}
        />

        {/* Overlay 7: Mímir's Hoard (Downloads Manager & Naglfar Swarm) */}
        <MimirsHoard
          isOpen={isDownloadsOpen}
          onClose={() => setIsDownloadsOpen(false)}
          activeRealm={activeRealm}
          downloads={downloads}
          torrents={torrents}
          onClearCompleted={() => setDownloads((prev) => prev.filter((d) => d.status !== 'complete'))}
          onAcquireUrl={handleAcquireUrl}
          onDeleteItem={handleDeleteDownloadItem}
          onCancelItem={handleCancelDownloadItem}
          onTogglePauseItem={handleTogglePauseDownloadItem}
          onAddTorrent={handleAddTorrent}
          onPauseTorrent={handlePauseTorrent}
          onResumeTorrent={handleResumeTorrent}
          onDeleteTorrent={handleDeleteTorrent}
        />

        {/* Overlay 8: Fate Thread Purge (Clear Browsing Data) */}
        <FateThreadPurge
          isOpen={isClearDataOpen}
          onClose={() => setIsClearDataOpen(false)}
          activeRealm={activeRealm}
        />

        {/* Slide-out: Huginn AI Intelligence Drawer */}
        <HuginnPanel
          isOpen={isHuginnOpen}
          onClose={() => setIsHuginnOpen(false)}
          activeRealm={activeRealm}
          currentTab={activeTab}
          initialPrompt={huginnPrompt}
        />

        {/* Overlay 9: Reader Sanctum (Distraction-Free Reader Mode) */}
        <ReaderSanctum
          isOpen={isReaderSanctumOpen}
          onClose={() => setIsReaderSanctumOpen(false)}
          activeRealm={activeRealm}
          activeTab={activeTab}
        />
      </Suspense>

      {/* Custom Themed Norse Context Menu */}
      <NorseContextMenu
        isOpen={isContextMenuOpen}
        onClose={() => setIsContextMenuOpen(false)}
        activeRealm={activeRealm}
        eventData={contextMenuEvent}
        onOpenInNewTab={(url) => handleNewTab(url)}
        onOpenReader={() => setIsReaderSanctumOpen(true)}
        onOpenInSplitGaze={(url) => {
          const newId = `tab-${Date.now()}`;
          const newTab: Tab = {
            id: newId,
            title: url.replace(/^https?:\/\//, ''),
            url,
            isActive: false,
            isLoading: false,
            isMuted: false,
            isPinned: false,
            realm: activeRealm,
            rune: 'ᚱ',
            zoomLevel: 100,
          };
          setTabs((prev) => [...prev, newTab]);
          setSplitTabId(newId);
          setIsSplitGaze(true);
          mimirIpc.send({ type: 'CREATE_TAB', payload: { tabId: newId, url, realm: activeRealm } });
        }}
        onDownloadUrl={(url) => {
          handleAcquireUrl(url);
          setIsDownloadsOpen(true);
        }}
        onBookmarkUrl={(url) => handleToggleBookmark(url)}
        onSearchQuery={(query) => {
          const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
          handleNewTab(searchUrl);
        }}
        onAskHuginn={(prompt) => {
          setHuginnPrompt(prompt);
          setIsHuginnOpen(true);
        }}
      />
    </div>
  );
};

export default App;
