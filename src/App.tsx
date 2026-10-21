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
import { Tab, RealmId } from '@/types';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { AnimatePresence } from 'framer-motion';

const INITIAL_TABS: Tab[] = [
  {
    id: 'tab-1',
    title: 'Mímisbrunnr (New Tab)',
    url: 'mimir://newtab',
    isActive: true,
    isLoading: false,
    isMuted: false,
    realm: 'midgard',
    rune: 'ᛗ',
  },
  {
    id: 'tab-2',
    title: 'GitHub — Repositories',
    url: 'https://github.com',
    isActive: false,
    isLoading: false,
    isMuted: false,
    realm: 'asgard',
    rune: 'ᚨ',
  },
];

const RUNES_POOL = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛚ', 'ᛞ', 'ᛟ'];

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [activeRealm, setActiveRealm] = useState<RealmId>('midgard');
  const [isTabTreeCollapsed, setIsTabTreeCollapsed] = useState(false);
  const [isRealmSelectorOpen, setIsRealmSelectorOpen] = useState(false);
  const [isHuginnOpen, setIsHuginnOpen] = useState(false);
  const [isMuninnOpen, setIsMuninnOpen] = useState(false);
  const [isBifrostOpen, setIsBifrostOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSplitGaze, setIsSplitGaze] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | undefined>('tab-2');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(runicAudio.isAmbientEnabled());
  const [showSplash, setShowSplash] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const splitTab = tabs.find((t) => t.id === splitTabId);

  // Synchronize initial tab with native Rust host
  useEffect(() => {
    mimirIpc.send({
      type: 'CREATE_TAB',
      payload: { tabId: 'tab-1', url: 'mimir://newtab', realm: 'midgard' },
    });
  }, []);

  // Update ambient audio if active realm changes
  useEffect(() => {
    runicAudio.updateAmbientRealm(activeRealm);
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
        if (activeTab) {
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
      // Esc: Close modals & drawers
      if (e.key === 'Escape') {
        setIsRealmSelectorOpen(false);
        setIsHuginnOpen(false);
        setIsMuninnOpen(false);
        setIsBifrostOpen(false);
        setIsForgeOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, activeRealm]);

  const handleSelectTab = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        isActive: t.id === id,
      }))
    );
    setActiveTabId(id);
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
          realm: activeRealm,
          rune: 'ᛗ',
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
      realm: activeRealm,
      rune: randomRune,
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
        />

        <ContentViewport
          activeTab={activeTab}
          activeRealm={activeRealm}
          onNavigate={handleNavigate}
          onSelectRealm={(r) => {
            setActiveRealm(r);
            runicAudio.playRunicHum();
          }}
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
        onSelectRealm={(r) => {
          setActiveRealm(r);
          runicAudio.playRunicHum();
        }}
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
          if (activeTab) handleCloseTab(activeTab.id);
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
        onSelectRealm={(r) => {
          setActiveRealm(r);
          runicAudio.playRunicHum();
        }}
        onNavigateHome={() => handleNavigate('mimir://newtab')}
        onRefresh={() => {
          if (activeTab?.url) {
            handleNavigate(activeTab.url);
          }
        }}
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
