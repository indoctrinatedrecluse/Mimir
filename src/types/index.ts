export type RealmId = 
  | 'midgard'     // General / Everyday
  | 'asgard'      // Development / Tech
  | 'vanaheim'    // Media / Entertainment
  | 'alfheim'     // Design / Reading
  | 'helheim'     // Stealth / Private
  | 'muspelheim'; // Gaming / High Performance

export interface Realm {
  id: RealmId;
  name: string;
  norseName: string;
  rune: string;
  description: string;
  accentColor: string;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  isMuted: boolean;
  realm: RealmId;
  rune: string;
}

export interface RunicWardStats {
  blockedTrackers: number;
  blockedAds: number;
  httpsUpgraded: boolean;
  shieldActive: boolean;
}

export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isAudioEnabled: boolean;
  activeRealm: RealmId;
}
