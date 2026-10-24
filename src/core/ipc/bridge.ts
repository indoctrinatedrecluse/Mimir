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

export interface NativeDownloadCompletedEvent {
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
  | { type: 'FIND_IN_PAGE'; payload: { query: string } }
  | { type: 'FIND_NEXT' }
  | { type: 'FIND_PREVIOUS' }
  | { type: 'FIND_CLOSE' }
  | { type: 'DUPLICATE_TAB'; payload: { tabId: string; newTabId: string } }
  | { type: 'OPEN_PATH'; payload: { path: string; isDir?: boolean } }
  | { type: 'DOWNLOAD_URL'; payload: { url: string; filename?: string } }
  | { type: 'DELETE_FILE'; payload: { path: string } }
  | { type: 'SHOW_DEVTOOLS' }
  | { type: 'EXECUTE_SCRIPT'; payload: { script: string } }
  | { type: 'WINDOW_MINIMIZE' }
  | { type: 'WINDOW_MAXIMIZE' }
  | { type: 'WINDOW_CLOSE' };

type DownloadStartedListener = (event: NativeDownloadStartedEvent) => void;
type DownloadCompletedListener = (event: NativeDownloadCompletedEvent) => void;
type ContextMenuListener = (event: NativeContextMenuEvent) => void;
type TrackerBlockedListener = (event: NativeTrackerBlockedEvent) => void;

class MimirIpcBridge {
  private downloadStartedListeners: Set<DownloadStartedListener> = new Set();
  private downloadCompletedListeners: Set<DownloadCompletedListener> = new Set();
  private contextMenuListeners: Set<ContextMenuListener> = new Set();
  private trackerBlockedListeners: Set<TrackerBlockedListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as any;

      win.__mimirOnDownloadStarted = (payload: NativeDownloadStartedEvent) => {
        this.downloadStartedListeners.forEach((l) => l(payload));
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
}

export const mimirIpc = new MimirIpcBridge();
