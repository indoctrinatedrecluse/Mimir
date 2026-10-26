import { mimirIpc } from '@/core/ipc/bridge';

export type ProxyType = 'direct' | 'tor' | 'socks5' | 'http';

export interface SvalinnProxyConfig {
  enabled: boolean;
  proxyType: ProxyType;
  server: string;
  bypassList: string;
  customSocksHost: string;
  customSocksPort: number;
  customHttpHost: string;
  customHttpPort: number;
}

export interface EgressIpInfo {
  ip: string;
  country?: string;
  city?: string;
  org?: string;
  isCloaked: boolean;
  checkedAt: number;
}

const STORAGE_KEY = 'mimir_svalinn_proxy_config';

const DEFAULT_CONFIG: SvalinnProxyConfig = {
  enabled: false,
  proxyType: 'direct',
  server: '',
  bypassList: '<local>;localhost;127.0.0.1;*.local',
  customSocksHost: '127.0.0.1',
  customSocksPort: 1080,
  customHttpHost: '127.0.0.1',
  customHttpPort: 8080,
};

type ProxyListener = (config: SvalinnProxyConfig) => void;
type TestListener = (result: { host: string; port: number; reachable: boolean }) => void;

class SvalinnProxyManager {
  private config: SvalinnProxyConfig;
  private listeners: Set<ProxyListener> = new Set();
  private testListeners: Set<TestListener> = new Set();
  private lastEgressInfo: EgressIpInfo | null = null;

  constructor() {
    this.config = this.loadStoredConfig();
    this.initNativeBridge();
  }

  private loadStoredConfig(): SvalinnProxyConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_CONFIG;
  }

  private initNativeBridge() {
    if (typeof window !== 'undefined') {
      (window as any).__mimirOnProxyConfig = (nativeConfig: any) => {
        if (nativeConfig) {
          this.config.enabled = nativeConfig.enabled;
          this.config.proxyType = (nativeConfig.proxy_type as ProxyType) || this.config.proxyType;
          this.config.server = nativeConfig.server || '';
          if (nativeConfig.bypass_list) {
            this.config.bypassList = nativeConfig.bypass_list;
          }
          this.notify();
        }
      };

      (window as any).__mimirOnProxyTestResult = (result: any) => {
        this.testListeners.forEach((l) => l(result));
      };

      // Request initial config from Rust host
      setTimeout(() => {
        mimirIpc.send({ type: 'GET_PROXY_CONFIG' });
      }, 500);
    }
  }

  public subscribe(listener: ProxyListener): () => void {
    this.listeners.add(listener);
    listener(this.config);
    return () => this.listeners.delete(listener);
  }

  public subscribeTestResults(listener: TestListener): () => void {
    this.testListeners.add(listener);
    return () => this.testListeners.delete(listener);
  }

  private notify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {}
    this.listeners.forEach((l) => l(this.config));
  }

  public getConfig(): SvalinnProxyConfig {
    return { ...this.config };
  }

  public setDirectMode(): void {
    this.config.enabled = false;
    this.config.proxyType = 'direct';
    this.config.server = '';
    this.syncWithRust();
    this.notify();
  }

  public setTorCloakMode(port = 9050): void {
    this.config.enabled = true;
    this.config.proxyType = 'tor';
    this.config.server = `socks5://127.0.0.1:${port}`;
    this.syncWithRust();
    this.notify();
  }

  public setCustomSocks(host: string, port: number): void {
    this.config.enabled = true;
    this.config.proxyType = 'socks5';
    this.config.customSocksHost = host;
    this.config.customSocksPort = port;
    this.config.server = `socks5://${host.trim()}:${port}`;
    this.syncWithRust();
    this.notify();
  }

  public setCustomHttp(host: string, port: number): void {
    this.config.enabled = true;
    this.config.proxyType = 'http';
    this.config.customHttpHost = host;
    this.config.customHttpPort = port;
    this.config.server = `http://${host.trim()}:${port}`;
    this.syncWithRust();
    this.notify();
  }

  public updateBypassList(bypassList: string): void {
    this.config.bypassList = bypassList;
    this.syncWithRust();
    this.notify();
  }

  private syncWithRust(): void {
    mimirIpc.send({
      type: 'SET_PROXY_CONFIG',
      payload: {
        enabled: this.config.enabled,
        proxy_type: this.config.proxyType,
        server: this.config.server,
        bypass_list: this.config.bypassList,
      },
    });
  }

  public testConnectivity(host: string, port: number): void {
    mimirIpc.send({
      type: 'TEST_PROXY_CONNECTIVITY',
      payload: { host, port },
    });
  }

  public async probeEgressIp(): Promise<EgressIpInfo> {
    try {
      const resp = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
      const data = await resp.json();
      const ip = data.ip || 'Unknown';
      const info: EgressIpInfo = {
        ip,
        isCloaked: this.config.enabled,
        checkedAt: Date.now(),
      };
      this.lastEgressInfo = info;
      return info;
    } catch {
      return {
        ip: 'Probing through Bifröst...',
        isCloaked: this.config.enabled,
        checkedAt: Date.now(),
      };
    }
  }

  public getLastEgressInfo(): EgressIpInfo | null {
    return this.lastEgressInfo;
  }
}

export const svalinnProxy = new SvalinnProxyManager();
export const svalinnProxyManager = svalinnProxy;
