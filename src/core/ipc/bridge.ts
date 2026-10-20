import { RealmId } from '@/types';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
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
  | { type: 'WINDOW_MINIMIZE' }
  | { type: 'WINDOW_MAXIMIZE' }
  | { type: 'WINDOW_CLOSE' };

class MimirIpcBridge {
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
}

export const mimirIpc = new MimirIpcBridge();
