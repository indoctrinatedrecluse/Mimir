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
  const [showSplash, setShowSplash] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Synchronize initial tab with native Rust host
  useEffect(() => {
    mimirIpc.send({
      type: 'CREATE_TAB',
      payload: { tabId: 'tab-1', url: 'mimir://newtab', realm: 'midgard' },
    });
  }, []);

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
      // Esc: Close modals & drawers
      if (e.key === 'Escape') {
        setIsRealmSelectorOpen(false);
        setIsHuginnOpen(false);
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
        />

        <ContentViewport
          activeTab={activeTab}
          activeRealm={activeRealm}
          onNavigate={handleNavigate}
          onSelectRealm={(r) => {
            setActiveRealm(r);
            runicAudio.playRunicHum();
          }}
        />
      </div>

      {/* Layer 4: Status Telemetry HUD */}
      <StatusBar activeRealm={activeRealm} />

      {/* Overlay: Nine Realms Modal */}
      <RealmSelector
        isOpen={isRealmSelectorOpen}
        activeRealm={activeRealm}
        onSelectRealm={(r) => {
          setActiveRealm(r);
          runicAudio.playRunicHum();
        }}
        onClose={() => setIsRealmSelectorOpen(false)}
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
