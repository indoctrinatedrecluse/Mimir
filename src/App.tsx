import React, { useState, useEffect } from 'react';
import { TitleBar } from '@/components/chrome/TitleBar';
import { Omnibar } from '@/components/mimisbrunnr/Omnibar';
import { TabTree } from '@/components/yggdrasil/TabTree';
import { ContentViewport } from '@/components/viewport/ContentViewport';
import { StatusBar } from '@/components/hud/StatusBar';
import { RealmSelector } from '@/components/realms/RealmSelector';
import { RunicAtmosphere } from '@/components/hud/RunicAtmosphere';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { HuginnPanel } from '@/components/ai/HuginnPanel';
import { MuninnVault } from '@/components/muninn/MuninnVault';
import { BifrostMatrix } from '@/components/network/BifrostMatrix';
import { BrokkrForge } from '@/components/forge/BrokkrForge';
import { CommandPalette } from '@/components/palette/CommandPalette';
import { RuneSeeker } from '@/components/hud/RuneSeeker';
import { MimirsHoard, DownloadItem } from '@/components/hud/MimirsHoard';
import { FateThreadPurge } from '@/components/hud/FateThreadPurge';
import { Tab, RealmId } from '@/types';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { AnimatePresence } from 'framer-motion';

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

  // Download artifacts telemetry
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: 'dl-1',
      filename: 'poetic_edda_voluspa.pdf',
      url: 'https://sacred-texts.com/cla/poe/voluspa.htm',
      size: '2.8 MB',
      progress: 100,
      status: 'complete',
      timestamp: 'Just now',
      type: 'document',
    },
    {
      id: 'dl-2',
      filename: 'yggdrasil_realm_cartography.png',
      url: 'https://mimir-archives.org/cartography/yggdrasil.png',
      size: '14.2 MB',
      progress: 100,
      status: 'complete',
      timestamp: '18 min ago',
      type: 'image',
    },
  ]);

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
      />

      {/* Layer 3: Main Workspace (Yggdrasil Tree + Content Viewport) */}
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
      </div>

      {/* Layer 4: Status Telemetry HUD */}
      <StatusBar activeRealm={activeRealm} />

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
      />

      {/* Overlay 6: Rune Seeker (Find in Page) */}
      <RuneSeeker
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
        activeRealm={activeRealm}
      />

      {/* Overlay 7: Mímir's Hoard (Downloads Manager) */}
      <MimirsHoard
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        activeRealm={activeRealm}
        downloads={downloads}
        onClearCompleted={() => setDownloads((prev) => prev.filter((d) => d.status !== 'complete'))}
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
      />
    </div>
  );
};

export default App;
