export type RealmId = 
  | 'midgard'     // General / Everyday
  | 'asgard'      // Development / Tech / Divine
  | 'vanaheim'    // Media / Entertainment / Nature
  | 'alfheim'     // Design / Reading / Light
  | 'jotunheim'   // Storage / Heavy Data / Frost
  | 'muspelheim'  // High Performance / Gaming / Fire
  | 'niflheim'    // Security / DevTools / Mist
  | 'nidavellir'  // Extensions / WebAssembly / Forges
  | 'helheim';    // Stealth / Ephemeral / Underworld

export type SanctumBackdropMode = 'video' | 'particles' | 'static';

export interface Realm {
  id: RealmId;
  name: string;
  norseName: string;
  rune: string;
  ruler: string;
  rulerTitle: string;
  description: string;
  accentColor: string;
  bgUrl: string;
  videoUrl?: string;
  quote: string;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isPinned: boolean;
  realm: RealmId;
  rune: string;
  zoomLevel: number;
  parentId?: string;
  isBranchCollapsed?: boolean;
  isSleeping?: boolean;
  lastActiveTime?: number;
  memorySavedBytes?: number;
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
  speed?: string;
  speedBytesSec?: number;
  receivedBytes?: number;
  totalBytes?: number;
  strands?: number;
  strandProgress?: number[];
  eta?: string;
}

export interface TorrentItem {
  id: string;
  infoHash: string;
  name: string;
  progress: number; // 0-100
  downloadSpeed: string;
  uploadSpeed: string;
  downloadSpeedBytesSec: number;
  uploadSpeedBytesSec: number;
  totalBytes: number;
  downloadedBytes: number;
  uploadedBytes: number;
  peers: number;
  state: 'initializing' | 'downloading' | 'seeding' | 'paused' | 'finished' | 'error';
  eta: string;
  path?: string;
  timestamp: string;
}

export interface ActiveMediaSession {
  tabId: string;
  tabTitle: string;
  tabRealm: RealmId;
  url: string;
  title: string;
  artist?: string;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  volumeBoost: number; // 1.0 to 3.0 (Mjolnir Thunder Boost)
  playbackRate: number; // 0.5 to 2.0
  isMuted: boolean;
  isPipActive: boolean;
  mediaType: 'video' | 'audio' | 'ambient';
}

