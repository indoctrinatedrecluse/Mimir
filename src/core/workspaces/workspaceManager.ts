import { YggdrasilWorkspace, RealmId, Tab } from '@/types';

const WORKSPACES_STORAGE_KEY = 'mimir_yggdrasil_workspaces';
const ACTIVE_WORKSPACE_KEY = 'mimir_active_workspace_id';

export const DEFAULT_WORKSPACES: YggdrasilWorkspace[] = [
  {
    id: 'ws-midgard',
    name: 'Midgard Sanctuary',
    rune: 'ᛗ',
    realm: 'midgard',
    color: '#38bdf8', // Bifröst Sky Cyan
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  },
  {
    id: 'ws-asgard',
    name: 'Asgardian Forge',
    rune: 'ᚨ',
    realm: 'asgard',
    color: '#fbbf24', // Valhalla Amber Gold
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  },
  {
    id: 'ws-vanaheim',
    name: 'Vanaheim Grove',
    rune: 'ᚱ',
    realm: 'vanaheim',
    color: '#34d399', // Freya Emerald
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  },
  {
    id: 'ws-alfheim',
    name: 'Alfheim Archives',
    rune: 'ᚲ',
    realm: 'alfheim',
    color: '#a78bfa', // Light Elf Lavender
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  },
];

export const workspaceManager = {
  getWorkspaces: (): YggdrasilWorkspace[] => {
    try {
      const stored = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load Yggdrasil workspaces:', e);
    }
    return DEFAULT_WORKSPACES;
  },

  getWorkspace: (id: string): YggdrasilWorkspace | undefined => {
    return workspaceManager.getWorkspaces().find((w) => w.id === id);
  },

  getActiveWorkspaceId: (): string => {
    try {
      const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      if (stored) return stored;
    } catch {}
    return DEFAULT_WORKSPACES[0].id;
  },

  getActiveWorkspace: (): YggdrasilWorkspace => {
    const id = workspaceManager.getActiveWorkspaceId();
    return workspaceManager.getWorkspace(id) || DEFAULT_WORKSPACES[0];
  },

  setActiveWorkspaceId: (id: string): void => {
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } catch {}
  },

  saveWorkspaces: (workspaces: YggdrasilWorkspace[]): void => {
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    } catch (e) {
      console.warn('Failed to save Yggdrasil workspaces:', e);
    }
  },

  createWorkspace: (
    name: string,
    realm: RealmId = 'midgard',
    rune: string = 'ᛗ',
    color?: string
  ): YggdrasilWorkspace => {
    const existing = workspaceManager.getWorkspaces();
    const newWs: YggdrasilWorkspace = {
      id: `ws-${Date.now()}`,
      name: name.trim() || `Branch ${existing.length + 1}`,
      realm,
      rune,
      color: color || '#38bdf8',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    const updated = [...existing, newWs];
    workspaceManager.saveWorkspaces(updated);
    return newWs;
  },

  updateWorkspace: (id: string, updates: Partial<YggdrasilWorkspace>): YggdrasilWorkspace[] => {
    const existing = workspaceManager.getWorkspaces();
    const updated = existing.map((ws) => (ws.id === id ? { ...ws, ...updates } : ws));
    workspaceManager.saveWorkspaces(updated);
    return updated;
  },

  deleteWorkspace: (id: string): YggdrasilWorkspace[] => {
    const existing = workspaceManager.getWorkspaces();
    if (existing.length <= 1) {
      return existing; // Cannot delete the sole remaining branch
    }
    const updated = existing.filter((ws) => ws.id !== id);
    workspaceManager.saveWorkspaces(updated);
    if (workspaceManager.getActiveWorkspaceId() === id) {
      workspaceManager.setActiveWorkspaceId(updated[0].id);
    }
    return updated;
  },

  exportSnapshot: (workspaces: YggdrasilWorkspace[], tabs: Tab[]): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      workspaces,
      tabs: tabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        realm: t.realm,
        rune: t.rune,
        isPinned: t.isPinned,
        workspaceId: t.workspaceId,
      })),
    };
    return JSON.stringify(data, null, 2);
  },

  importSnapshot: (
    jsonStr: string
  ): { workspaces: YggdrasilWorkspace[]; tabs: Partial<Tab>[] } | null => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.workspaces) && Array.isArray(data.tabs)) {
        return {
          workspaces: data.workspaces,
          tabs: data.tabs,
        };
      }
    } catch (e) {
      console.error('Invalid Yggdrasil snapshot payload:', e);
    }
    return null;
  },
};
