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
  | { type: 'DELETE_TORRENT'; payload: { id: string; deleteFiles?: boolean } };

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
}

export const mimirIpc = new MimirIpcBridge();
