import { Tab, RealmId } from '@/types';

export interface SavedTab {
  id: string;
  title: string;
  url: string;
  realm: RealmId;
  rune: string;
  isPinned?: boolean;
  parentId?: string;
  zoomLevel?: number;
}

export interface SavedSession {
  id: string;
  name: string;
  savedAt: string;
  realm: RealmId;
  activeTabId: string;
  splitTabId: string | null;
  isSplitGaze: boolean;
  tabs: SavedTab[];
}

const AUTO_SESSION_KEY = 'mimir_valhalla_auto_session';
const CLEAN_SHUTDOWN_KEY = 'mimir_valhalla_clean_shutdown';
const NAMED_SESSIONS_KEY = 'mimir_valhalla_named_sessions';

export const sessionManager = {
  markSessionRunning: (): void => {
    try {
      localStorage.setItem(CLEAN_SHUTDOWN_KEY, 'false');
    } catch {}
  },

  markCleanShutdown: (): void => {
    try {
      localStorage.setItem(CLEAN_SHUTDOWN_KEY, 'true');
    } catch {}
  },

  checkAbnormalTermination: (): boolean => {
    try {
      const clean = localStorage.getItem(CLEAN_SHUTDOWN_KEY);
      const autoSession = localStorage.getItem(AUTO_SESSION_KEY);
      if (clean === 'false' && autoSession) {
        const parsed: SavedSession = JSON.parse(autoSession);
        return parsed.tabs && parsed.tabs.length > 0;
      }
    } catch {}
    return false;
  },

  saveCurrentSessionAuto: (
    tabs: Tab[],
    activeTabId: string,
    realm: RealmId,
    splitTabId: string | null,
    isSplitGaze: boolean
  ): void => {
    try {
      const serializableTabs: SavedTab[] = tabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        realm: t.realm,
        rune: t.rune,
        isPinned: t.isPinned,
        parentId: t.parentId,
        zoomLevel: t.zoomLevel,
      }));

      const session: SavedSession = {
        id: 'valhalla-auto',
        name: 'Valhalla Auto-Saved Session',
        savedAt: new Date().toISOString(),
        realm,
        activeTabId,
        splitTabId,
        isSplitGaze,
        tabs: serializableTabs,
      };

      localStorage.setItem(AUTO_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to auto-save Valhalla session to localStorage:', e);
    }
  },

  getAutoSavedSession: (): SavedSession | null => {
    try {
      const raw = localStorage.getItem(AUTO_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  },

  clearAutoSavedSession: (): void => {
    try {
      localStorage.removeItem(AUTO_SESSION_KEY);
    } catch {}
  },

  saveNamedSession: (
    name: string,
    tabs: Tab[],
    activeTabId: string,
    realm: RealmId,
    splitTabId: string | null,
    isSplitGaze: boolean
  ): SavedSession => {
    const existing = sessionManager.getNamedSessions();
    const newSession: SavedSession = {
      id: `session-${Date.now()}`,
      name: name.trim() || `Quest ${new Date().toLocaleDateString()}`,
      savedAt: new Date().toISOString(),
      realm,
      activeTabId,
      splitTabId,
      isSplitGaze,
      tabs: tabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        realm: t.realm,
        rune: t.rune,
        isPinned: t.isPinned,
        parentId: t.parentId,
        zoomLevel: t.zoomLevel,
      })),
    };

    try {
      localStorage.setItem(NAMED_SESSIONS_KEY, JSON.stringify([newSession, ...existing]));
    } catch {}
    return newSession;
  },

  getNamedSessions: (): SavedSession[] => {
    try {
      const raw = localStorage.getItem(NAMED_SESSIONS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return [];
  },

  deleteNamedSession: (id: string): void => {
    try {
      const existing = sessionManager.getNamedSessions();
      const filtered = existing.filter((s) => s.id !== id);
      localStorage.setItem(NAMED_SESSIONS_KEY, JSON.stringify(filtered));
    } catch {}
  },
};
