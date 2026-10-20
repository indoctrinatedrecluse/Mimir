import { RealmId } from '@/types';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type IpcCommand =
  | { type: 'NAVIGATE'; payload: { url: string } }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'REFRESH' }
  | { type: 'CREATE_TAB'; payload: { url?: string; realm: RealmId } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SWITCH_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_VIEWPORT_BOUNDS'; payload: ViewportBounds }
  | { type: 'WINDOW_MINIMIZE' }
  | { type: 'WINDOW_MAXIMIZE' }
  | { type: 'WINDOW_CLOSE' };

class MimirIpcBridge {
  private isNativeWry: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if running inside Wry WebView or Tauri runtime
      this.isNativeWry = 'ipc' in window || '__TAURI__' in window;
    }
  }

  public isNative(): boolean {
    return this.isNativeWry;
  }

  public send(cmd: IpcCommand) {
    if (typeof window === 'undefined') return;

    if (this.isNativeWry) {
      // Wry standard IPC channel
      const ipc = (window as unknown as { ipc?: { postMessage: (msg: string) => void } }).ipc;
      if (ipc && typeof ipc.postMessage === 'function') {
        ipc.postMessage(JSON.stringify(cmd));
        return;
      }
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
