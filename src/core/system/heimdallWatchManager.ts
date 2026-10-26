import { mimirIpc, SystemTelemetryPayload, ProcessItem } from '@/core/ipc/bridge';

export type TelemetryListener = (telemetry: SystemTelemetryPayload) => void;
export type ReclaimListener = (bytesReclaimed: number) => void;

class HeimdallWatchManager {
  private currentTelemetry: SystemTelemetryPayload | null = null;
  private listeners: Set<TelemetryListener> = new Set();
  private reclaimListeners: Set<ReclaimListener> = new Set();
  private pollIntervalId: any = null;
  private totalSessionReclaimedBytes: number = 0;
  private unsubs: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const unsubTelem = mimirIpc.onSystemTelemetry((payload) => {
      this.currentTelemetry = payload;
      this.listeners.forEach((l) => l(payload));
    });

    const unsubReclaim = mimirIpc.onMemoryReclaimed((payload) => {
      this.totalSessionReclaimedBytes += payload.bytesReclaimed;
      this.reclaimListeners.forEach((l) => l(payload.bytesReclaimed));
    });

    this.unsubs.push(unsubTelem, unsubReclaim);
  }

  public getTelemetry(): SystemTelemetryPayload | null {
    return this.currentTelemetry;
  }

  public getTotalSessionReclaimed(): number {
    return this.totalSessionReclaimedBytes;
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    if (this.currentTelemetry) {
      listener(this.currentTelemetry);
    }

    if (this.listeners.size === 1) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  public onReclaim(listener: ReclaimListener): () => void {
    this.reclaimListeners.add(listener);
    return () => {
      this.reclaimListeners.delete(listener);
    };
  }

  public refresh(): void {
    mimirIpc.getSystemTelemetry();
  }

  public startPolling(intervalMs = 1200): void {
    this.refresh();
    if (!this.pollIntervalId) {
      this.pollIntervalId = setInterval(() => {
        this.refresh();
      }, intervalMs);
    }
  }

  public stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public slayProcess(pid: number): void {
    mimirIpc.killProcess(pid);
  }

  public purgeWorkingSets(): void {
    mimirIpc.reclaimMemory();
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

export const heimdallWatch = new HeimdallWatchManager();
export const heimdallWatchManager = heimdallWatch;
