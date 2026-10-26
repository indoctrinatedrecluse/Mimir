import { RealmId } from '@/types';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeDownloadStartedEvent {
  id: string;
  filename: string;
  url: string;
  path: string;
}

export interface NativeDownloadProgressEvent {
  id: string;
  receivedBytes: number;
  totalBytes: number;
  speedBytesSec: number;
  strands: number;
  strandProgress: number[];
}

export interface NativeDownloadCompletedEvent {
  id?: string;
  url: string;
  path: string;
  success: boolean;
  size: string;
}

export interface NativeContextMenuEvent {
  x: number;
  y: number;
  linkUrl?: string | null;
  imageUrl?: string | null;
  selectedText?: string | null;
  pageUrl: string;
  pageTitle: string;
}

export interface NativeTrackerBlockedEvent {
  domain: string;
  category: string;
  url: string;
}

export interface NativeFindResultEvent {
  count: number;
  query: string;
}

export interface NativeHashResultEvent {
  path: string;
  hash: string;
}

export interface NativeTorrentAddedEvent {
  id: string;
  infoHash: string;
  name: string;
}

export interface NativeTorrentProgressEvent {
  id: string;
  infoHash: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  totalBytes: number;
  downloadedBytes: number;
  uploadedBytes: number;
  peers: number;
  state: string;
  etaSeconds: number;
}

export interface NativeTorrentCompletedEvent {
  id: string;
  infoHash: string;
  name: string;
  totalBytes: number;
  path: string;
}

export interface ClearBrowsingDataPayload {
  history: boolean;
  cookies: boolean;
  cache: boolean;
  localStorage: boolean;
  timeRange: string;
}

export interface PageContentPayload {
  title: string;
  url: string;
  metaDescription: string;
  headings: string[];
  textExcerpt: string;
  codeSnippetsCount: number;
  scriptsCount: number;
  frameworks: string[];
  wordCount: number;
}

export interface PageClippedPayload {
  title: string;
  url: string;
  selected_text?: string | null;
  html_content: string;
  text_content: string;
  meta_description?: string;
  author?: string | null;
}

export interface ProcessItem {
  pid: number;
  name: string;
  role: string;
  working_set_bytes: number;
  commit_bytes: number;
  is_main: boolean;
}

export interface SystemTelemetryPayload {
  main_pid: number;
  total_mimir_memory_bytes: number;
  main_process_memory_bytes: number;
  child_process_count: number;
  processes: ProcessItem[];
  total_system_ram_bytes: number;
  available_system_ram_bytes: number;
  memory_load_percent: number;
}

export type IpcCommand =
  | { type: 'NAVIGATE'; payload: { url: string; tabId?: string } }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'REFRESH' }
  | { type: 'CREATE_TAB'; payload: { tabId?: string; url?: string; realm: RealmId } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SWITCH_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_VIEWPORT_BOUNDS'; payload: ViewportBounds }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'ZOOM_RESET' }
  | { type: 'PRINT' }
  | { type: 'FIND_IN_PAGE'; payload: { query: string; caseSensitive?: boolean; useRegex?: boolean } }
  | { type: 'FIND_NEXT' }
  | { type: 'FIND_PREVIOUS' }
  | { type: 'FIND_CLOSE' }
  | { type: 'DUPLICATE_TAB'; payload: { tabId: string; newTabId: string } }
  | { type: 'OPEN_PATH'; payload: { path: string; isDir?: boolean } }
  | { type: 'DOWNLOAD_URL'; payload: { url: string; filename?: string } }
  | { type: 'CANCEL_DOWNLOAD'; payload: { id: string } }
  | { type: 'DELETE_FILE'; payload: { path: string } }
  | { type: 'CALCULATE_HASH'; payload: { path: string } }
  | { type: 'CONFIGURE_PROXY'; payload: { realm: string; mode: string; proxyUrl: string; enabled: boolean } }
  | { type: 'SHOW_DEVTOOLS' }
  | { type: 'EXECUTE_SCRIPT'; payload: { script: string } }
  | { type: 'WINDOW_MINIMIZE' }
  | { type: 'WINDOW_MAXIMIZE' }
  | { type: 'WINDOW_CLOSE' }
  | { type: 'ADD_TORRENT'; payload: { urlOrMagnet: string; downloadDir?: string } }
  | { type: 'PAUSE_TORRENT'; payload: { id: string } }
  | { type: 'RESUME_TORRENT'; payload: { id: string } }
  | { type: 'DELETE_TORRENT'; payload: { id: string; deleteFiles?: boolean } }
  | { type: 'CLEAR_BROWSING_DATA'; payload: ClearBrowsingDataPayload }
  | { type: 'EXTRACT_PAGE_CONTENT' }
  | { type: 'SUSPEND_TAB'; payload: { tabId: string } }
  | { type: 'RESUME_TAB'; payload: { tabId: string } }
  | { type: 'SPAWN_PIP_WINDOW'; payload: { title: string; is_playing?: boolean; width?: number; height?: number; x?: number; y?: number } }
  | { type: 'CLOSE_PIP_WINDOW' }
  | { type: 'DRAG_PIP_WINDOW' }
  | { type: 'SYNC_PIP_STATE'; payload: { is_playing: boolean; volume?: number; title?: string } }
  | { type: 'SET_PROXY_CONFIG'; payload: { enabled: boolean; proxy_type: string; server: string; bypass_list?: string } }
  | { type: 'GET_PROXY_CONFIG' }
  | { type: 'TEST_PROXY_CONNECTIVITY'; payload: { host: string; port: number } }
  | { type: 'GET_SYSTEM_TELEMETRY' }
  | { type: 'KILL_PROCESS'; payload: { pid: number } }
  | { type: 'RECLAIM_MEMORY' }
  | { type: 'CLIP_PAGE' };

type DownloadStartedListener = (event: NativeDownloadStartedEvent) => void;
type DownloadProgressListener = (event: NativeDownloadProgressEvent) => void;
type DownloadCompletedListener = (event: NativeDownloadCompletedEvent) => void;
type ContextMenuListener = (event: NativeContextMenuEvent) => void;
type TrackerBlockedListener = (event: NativeTrackerBlockedEvent) => void;
type FindResultListener = (event: NativeFindResultEvent) => void;
type HashResultListener = (event: NativeHashResultEvent) => void;
type TorrentAddedListener = (event: NativeTorrentAddedEvent) => void;
type TorrentProgressListener = (event: NativeTorrentProgressEvent) => void;
type TorrentCompletedListener = (event: NativeTorrentCompletedEvent) => void;
type BrowsingDataClearedListener = () => void;
type PageContentListener = (event: PageContentPayload) => void;
type ProxyConfiguredListener = (event: any) => void;
type SystemTelemetryListener = (event: SystemTelemetryPayload) => void;
type MemoryReclaimedListener = (event: { bytesReclaimed: number }) => void;
type PageClippedListener = (event: PageClippedPayload) => void;

class MimirIpcBridge {
  private downloadStartedListeners: Set<DownloadStartedListener> = new Set();
  private downloadProgressListeners: Set<DownloadProgressListener> = new Set();
  private downloadCompletedListeners: Set<DownloadCompletedListener> = new Set();
  private contextMenuListeners: Set<ContextMenuListener> = new Set();
  private trackerBlockedListeners: Set<TrackerBlockedListener> = new Set();
  private findResultListeners: Set<FindResultListener> = new Set();
  private hashResultListeners: Set<HashResultListener> = new Set();
  private torrentAddedListeners: Set<TorrentAddedListener> = new Set();
  private torrentProgressListeners: Set<TorrentProgressListener> = new Set();
  private torrentCompletedListeners: Set<TorrentCompletedListener> = new Set();
  private browsingDataClearedListeners: Set<BrowsingDataClearedListener> = new Set();
  private pageContentListeners: Set<PageContentListener> = new Set();
  private proxyConfiguredListeners: Set<ProxyConfiguredListener> = new Set();
  private systemTelemetryListeners: Set<SystemTelemetryListener> = new Set();
  private memoryReclaimedListeners: Set<MemoryReclaimedListener> = new Set();
  private pageClippedListeners: Set<PageClippedListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as any;

      win.__mimirOnDownloadStarted = (payload: NativeDownloadStartedEvent) => {
        this.downloadStartedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnDownloadProgress = (payload: NativeDownloadProgressEvent) => {
        this.downloadProgressListeners.forEach((l) => l(payload));
      };

      win.__mimirOnDownloadCompleted = (payload: NativeDownloadCompletedEvent) => {
        this.downloadCompletedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnContextMenu = (payload: NativeContextMenuEvent) => {
        this.contextMenuListeners.forEach((l) => l(payload));
      };

      win.__mimirOnTrackerBlocked = (payload: NativeTrackerBlockedEvent) => {
        this.trackerBlockedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnFindResult = (payload: NativeFindResultEvent) => {
        this.findResultListeners.forEach((l) => l(payload));
      };

      win.__mimirOnHashResult = (payload: NativeHashResultEvent) => {
        this.hashResultListeners.forEach((l) => l(payload));
      };

      win.__mimirOnTorrentAdded = (payload: NativeTorrentAddedEvent) => {
        this.torrentAddedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnTorrentProgress = (payload: NativeTorrentProgressEvent) => {
        this.torrentProgressListeners.forEach((l) => l(payload));
      };

      win.__mimirOnTorrentCompleted = (payload: NativeTorrentCompletedEvent) => {
        this.torrentCompletedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnBrowsingDataCleared = () => {
        this.browsingDataClearedListeners.forEach((l) => l());
      };

      win.__mimirOnPageContent = (payload: PageContentPayload) => {
        this.pageContentListeners.forEach((l) => l(payload));
      };

      win.__mimirOnProxyConfigured = (payload: any) => {
        this.proxyConfiguredListeners.forEach((l) => l(payload));
      };

      win.__mimirOnSystemTelemetry = (payload: SystemTelemetryPayload) => {
        this.systemTelemetryListeners.forEach((l) => l(payload));
      };

      win.__mimirOnMemoryReclaimed = (payload: { bytesReclaimed: number }) => {
        this.memoryReclaimedListeners.forEach((l) => l(payload));
      };

      win.__mimirOnPageClipped = (payload: PageClippedPayload) => {
        this.pageClippedListeners.forEach((l) => l(payload));
      };
    }
  }

  public isNative(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return 'ipc' in win || '__TAURI__' in win || Boolean(win.chrome?.webview?.postMessage);
  }

  public send(cmd: IpcCommand) {
    if (typeof window === 'undefined') return;

    const win = window as any;

    // 1. Wry standard IPC channel
    if (win.ipc && typeof win.ipc.postMessage === 'function') {
      win.ipc.postMessage(JSON.stringify(cmd));
      return;
    }

    // 2. Direct Windows WebView2 COM channel
    if (win.chrome?.webview?.postMessage && typeof win.chrome.webview.postMessage === 'function') {
      win.chrome.webview.postMessage(JSON.stringify(cmd));
      return;
    }

    // In web dev preview mode, log neatly
    console.debug(`[MÍMIR IPC MOCK] ᛗ ->`, cmd);
  }

  public updateViewportBounds(bounds: ViewportBounds) {
    this.send({
      type: 'UPDATE_VIEWPORT_BOUNDS',
      payload: bounds,
    });
  }

  public executeScript(script: string) {
    this.send({
      type: 'EXECUTE_SCRIPT',
      payload: { script },
    });
  }

  public onDownloadStarted(listener: DownloadStartedListener): () => void {
    this.downloadStartedListeners.add(listener);
    return () => this.downloadStartedListeners.delete(listener);
  }

  public onDownloadProgress(listener: DownloadProgressListener): () => void {
    this.downloadProgressListeners.add(listener);
    return () => this.downloadProgressListeners.delete(listener);
  }

  public onDownloadCompleted(listener: DownloadCompletedListener): () => void {
    this.downloadCompletedListeners.add(listener);
    return () => this.downloadCompletedListeners.delete(listener);
  }

  public onContextMenu(listener: ContextMenuListener): () => void {
    this.contextMenuListeners.add(listener);
    return () => this.contextMenuListeners.delete(listener);
  }

  public onTrackerBlocked(listener: TrackerBlockedListener): () => void {
    this.trackerBlockedListeners.add(listener);
    return () => this.trackerBlockedListeners.delete(listener);
  }

  public onFindResult(listener: FindResultListener): () => void {
    this.findResultListeners.add(listener);
    return () => this.findResultListeners.delete(listener);
  }

  public onHashResult(listener: HashResultListener): () => void {
    this.hashResultListeners.add(listener);
    return () => this.hashResultListeners.delete(listener);
  }

  public calculateHash(path: string) {
    this.send({
      type: 'CALCULATE_HASH',
      payload: { path },
    });
  }

  public cancelDownload(id: string) {
    this.send({
      type: 'CANCEL_DOWNLOAD',
      payload: { id },
    });
  }

  public configureProxy(payload: { realm: string; mode: string; proxyUrl: string; enabled: boolean }) {
    this.send({
      type: 'CONFIGURE_PROXY',
      payload,
    });
  }

  public onTorrentAdded(listener: TorrentAddedListener): () => void {
    this.torrentAddedListeners.add(listener);
    return () => this.torrentAddedListeners.delete(listener);
  }

  public onTorrentProgress(listener: TorrentProgressListener): () => void {
    this.torrentProgressListeners.add(listener);
    return () => this.torrentProgressListeners.delete(listener);
  }

  public onTorrentCompleted(listener: TorrentCompletedListener): () => void {
    this.torrentCompletedListeners.add(listener);
    return () => this.torrentCompletedListeners.delete(listener);
  }

  public addTorrent(urlOrMagnet: string, downloadDir?: string) {
    this.send({
      type: 'ADD_TORRENT',
      payload: { urlOrMagnet, downloadDir },
    });
  }

  public pauseTorrent(id: string) {
    this.send({
      type: 'PAUSE_TORRENT',
      payload: { id },
    });
  }

  public resumeTorrent(id: string) {
    this.send({
      type: 'RESUME_TORRENT',
      payload: { id },
    });
  }

  public deleteTorrent(id: string, deleteFiles = false) {
    this.send({
      type: 'DELETE_TORRENT',
      payload: { id, deleteFiles },
    });
  }

  public clearBrowsingData(payload: ClearBrowsingDataPayload) {
    this.send({
      type: 'CLEAR_BROWSING_DATA',
      payload,
    });
  }

  public onBrowsingDataCleared(listener: BrowsingDataClearedListener): () => void {
    this.browsingDataClearedListeners.add(listener);
    return () => this.browsingDataClearedListeners.delete(listener);
  }

  public extractPageContent() {
    this.send({
      type: 'EXTRACT_PAGE_CONTENT',
    });
  }

  public onPageContent(listener: PageContentListener): () => void {
    this.pageContentListeners.add(listener);
    return () => this.pageContentListeners.delete(listener);
  }

  public onProxyConfigured(listener: ProxyConfiguredListener): () => void {
    this.proxyConfiguredListeners.add(listener);
    return () => this.proxyConfiguredListeners.delete(listener);
  }

  public suspendTab(tabId: string) {
    this.send({
      type: 'SUSPEND_TAB',
      payload: { tabId },
    });
  }

  public resumeTab(tabId: string) {
    this.send({
      type: 'RESUME_TAB',
      payload: { tabId },
    });
  }

  public getSystemTelemetry() {
    this.send({
      type: 'GET_SYSTEM_TELEMETRY',
    });
  }

  public killProcess(pid: number) {
    this.send({
      type: 'KILL_PROCESS',
      payload: { pid },
    });
  }

  public reclaimMemory() {
    this.send({
      type: 'RECLAIM_MEMORY',
    });
  }

  public onSystemTelemetry(listener: SystemTelemetryListener): () => void {
    this.systemTelemetryListeners.add(listener);
    return () => this.systemTelemetryListeners.delete(listener);
  }

  public onMemoryReclaimed(listener: MemoryReclaimedListener): () => void {
    this.memoryReclaimedListeners.add(listener);
    return () => this.memoryReclaimedListeners.delete(listener);
  }

  public clipPage() {
    this.send({
      type: 'CLIP_PAGE',
    });
  }

  public onPageClipped(listener: PageClippedListener): () => void {
    this.pageClippedListeners.add(listener);
    return () => this.pageClippedListeners.delete(listener);
  }
}

export const mimirIpc = new MimirIpcBridge();
