import { Tab } from '@/types';
import { mimirIpc } from '@/core/ipc/bridge';

export type SlumberTimeout = 15 | 30 | 60 | 0; // 0 = Never

const STORAGE_KEY = 'mimir_slumber_timeout';

class EinherjarSlumberEngine {
  private activityTimestamps: Map<string, number> = new Map();
  private timeoutMinutes: SlumberTimeout = 30;

  constructor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const val = parseInt(stored, 10) as SlumberTimeout;
        if ([0, 15, 30, 60].includes(val)) {
          this.timeoutMinutes = val;
        }
      }
    } catch {}
  }

  public getTimeoutMinutes(): SlumberTimeout {
    return this.timeoutMinutes;
  }

  public setTimeoutMinutes(timeout: SlumberTimeout): void {
    this.timeoutMinutes = timeout;
    try {
      localStorage.setItem(STORAGE_KEY, timeout.toString());
    } catch {}
  }

  public recordTabActivity(tabId: string): void {
    this.activityTimestamps.set(tabId, Date.now());
  }

  public removeTab(tabId: string): void {
    this.activityTimestamps.delete(tabId);
  }

  public estimateTabMemoryMb(tab: Tab): number {
    if (tab.url.includes('youtube.com') || tab.url.includes('twitch.tv')) return 320;
    if (tab.url.includes('github.com') || tab.url.includes('figma.com')) return 260;
    if (tab.url.startsWith('mimir://')) return 40;
    return 180;
  }

  public hibernateTab(tab: Tab): void {
    if (tab.isActive || tab.isPinned || tab.isSleeping) return;
    if (tab.url.startsWith('mimir://') || !tab.url) return;

    mimirIpc.suspendTab(tab.id);
  }

  public awakenTab(tab: Tab): void {
    if (!tab.isSleeping) return;
    mimirIpc.resumeTab(tab.id);
    this.recordTabActivity(tab.id);
  }

  public checkEligibleTabs(
    tabs: Tab[],
    activeTabId: string,
    onHibernate: (tabId: string, memorySaved: number) => void
  ): void {
    if (this.timeoutMinutes === 0) return; // Disabled

    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    const now = Date.now();

    tabs.forEach((tab) => {
      if (tab.id === activeTabId || tab.isPinned || tab.isSleeping) return;
      if (tab.url.startsWith('mimir://') || !tab.url) return;

      const lastActive = this.activityTimestamps.get(tab.id) || (tab.lastActiveTime ?? now);
      if (now - lastActive > timeoutMs) {
        const savedMb = this.estimateTabMemoryMb(tab);
        this.hibernateTab(tab);
        onHibernate(tab.id, savedMb);
      }
    });
  }
}

export const slumberEngine = new EinherjarSlumberEngine();
