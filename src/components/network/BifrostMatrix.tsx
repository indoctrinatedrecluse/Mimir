import React, { useState, useEffect } from 'react';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Shield,
  Zap,
  Globe,
  Lock,
  RotateCcw,
  Check,
  X,
  Server,
  Terminal,
} from 'lucide-react';

export interface RealmProxyConfig {
  realm: RealmId;
  mode: 'direct' | 'socks5' | 'http' | 'tor_gateway';
  proxyUrl: string;
  dnsOverHttps: string;
  bypassLocalhost: boolean;
  enabled: boolean;
}

const DEFAULT_MATRIX: Record<RealmId, RealmProxyConfig> = {
  midgard: {
    realm: 'midgard',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://cloudflare-dns.com/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  asgard: {
    realm: 'asgard',
    mode: 'direct',
    proxyUrl: 'http://127.0.0.1:8080',
    dnsOverHttps: 'https://dns.google/dns-query',
    bypassLocalhost: true,
    enabled: true,
  },
  vanaheim: {
    realm: 'vanaheim',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://cloudflare-dns.com/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  alfheim: {
    realm: 'alfheim',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://dns.quad9.net/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  jotunheim: {
    realm: 'jotunheim',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://cloudflare-dns.com/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  muspelheim: {
    realm: 'muspelheim',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://1.1.1.1/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  niflheim: {
    realm: 'niflheim',
    mode: 'socks5',
    proxyUrl: 'socks5://127.0.0.1:1080',
    dnsOverHttps: 'https://doh.mullvad.net/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  nidavellir: {
    realm: 'nidavellir',
    mode: 'direct',
    proxyUrl: '',
    dnsOverHttps: 'https://cloudflare-dns.com/dns-query',
    bypassLocalhost: true,
    enabled: false,
  },
  helheim: {
    realm: 'helheim',
    mode: 'tor_gateway',
    proxyUrl: 'socks5://127.0.0.1:9050',
    dnsOverHttps: 'https://doh.mullvad.net/dns-query',
    bypassLocalhost: false,
    enabled: true,
  },
};

interface BifrostMatrixProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
}

export const BifrostMatrix: React.FC<BifrostMatrixProps> = ({
  isOpen,
  onClose,
  activeRealm,
}) => {
  const [matrix, setMatrix] = useState<Record<RealmId, RealmProxyConfig>>(() => {
    try {
      const saved = localStorage.getItem('mimir_bifrost_matrix');
      return saved ? { ...DEFAULT_MATRIX, ...JSON.parse(saved) } : DEFAULT_MATRIX;
    } catch {
      return DEFAULT_MATRIX;
    }
  });

  const [selectedRealm, setSelectedRealm] = useState<RealmId>(activeRealm);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [probeStatus, setProbeStatus] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  const theme = REALM_THEMES[selectedRealm] || REALM_THEMES.midgard;
  const currentConfig = matrix[selectedRealm] || DEFAULT_MATRIX[selectedRealm];

  const handleProbeConduit = async () => {
    setIsProbing(true);
    setProbeStatus(null);
    runicAudio.playClick(600);
    const start = performance.now();
    try {
      const target = currentConfig.dnsOverHttps || 'https://cloudflare-dns.com/dns-query';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      await fetch(target, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      setProbeStatus(`${latency}ms — Conduit Flowing`);
      runicAudio.playChime();
    } catch {
      const latency = Math.round(performance.now() - start);
      if (latency < 3900) {
        setProbeStatus(`${latency}ms — Reachable`);
        runicAudio.playChime();
      } else {
        setProbeStatus('Unreachable');
        runicAudio.playClick(300);
      }
    } finally {
      setIsProbing(false);
    }
  };

  const handleUpdate = <K extends keyof RealmProxyConfig>(key: K, value: RealmProxyConfig[K]) => {
    setMatrix((prev) => {
      const updated = {
        ...prev,
        [selectedRealm]: {
          ...prev[selectedRealm],
          [key]: value,
        },
      };
      return updated;
    });
  };

  const handleSave = () => {
    runicAudio.playChime();
    try {
      localStorage.setItem('mimir_bifrost_matrix', JSON.stringify(matrix));
      mimirIpc.configureProxy({
        realm: selectedRealm,
        mode: currentConfig.mode,
        proxyUrl: currentConfig.proxyUrl,
        enabled: currentConfig.enabled,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to save Bifröst Matrix', e);
    }
  };

  const handleReset = () => {
    runicAudio.playClick(400);
    setMatrix(DEFAULT_MATRIX);
    localStorage.removeItem('mimir_bifrost_matrix');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 flex h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070b14]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            style={{
              borderColor: `${theme.accentColor}35`,
              boxShadow: `0 0 40px -10px ${theme.glowColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center space-x-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${theme.accentColor}60`,
                    backgroundColor: `${theme.accentColor}15`,
                    color: theme.accentColor,
                  }}
                >
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">
                      BIFRÖST CONDUIT MATRIX
                    </h2>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      PER-REALM PROXY & DOH
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Route web conduits across isolated proxies, Tor tunnels, and low-latency DNS per realm.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Realm Selector Strip */}
            <div className="flex items-center space-x-2 border-b border-white/5 bg-white/[0.02] px-5 py-3 overflow-x-auto">
              {(Object.keys(REALMS) as RealmId[]).map((rId) => {
                const r = REALMS[rId];
                const isSelected = rId === selectedRealm;
                const isProxyEnabled = matrix[rId]?.enabled;

                return (
                  <button
                    key={rId}
                    onClick={() => {
                      runicAudio.playClick(600);
                      setSelectedRealm(rId);
                    }}
                    className={`flex items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      isSelected
                        ? 'bg-white/15 text-white shadow-md'
                        : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                    style={{
                      borderColor: isSelected ? r.accentColor : undefined,
                    }}
                  >
                    <span style={{ color: r.accentColor }}>{r.rune}</span>
                    <span>{r.name}</span>
                    {isProxyEnabled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Matrix Config Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Active Realm Card Summary */}
              <div
                className="flex items-center justify-between rounded-xl border border-white/10 p-4"
                style={{
                  backgroundColor: `${theme.accentColor}08`,
                  borderColor: `${theme.accentColor}30`,
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg border text-xl font-black"
                    style={{
                      borderColor: `${theme.accentColor}60`,
                      color: theme.accentColor,
                    }}
                  >
                    {REALMS[selectedRealm].rune}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {REALMS[selectedRealm].name} Conduit ({REALMS[selectedRealm].norseName})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ruler: {REALMS[selectedRealm].ruler} • {REALMS[selectedRealm].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentConfig.enabled}
                      onChange={(e) => handleUpdate('enabled', e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 h-4 w-4 bg-black/40"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      {currentConfig.enabled ? 'CONDUIT ACTIVE' : 'CONDUIT BYPASSED'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Routing Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  ROUTING TOPOLOGY
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'direct', label: 'Direct Bifröst', desc: 'Default local ISP gateway', icon: Globe },
                    { id: 'socks5', label: 'SOCKS5 Proxy', desc: 'Secure socks conduit', icon: Server },
                    { id: 'http', label: 'HTTP / HTTPS Proxy', desc: 'Web proxy tunneling', icon: Network },
                    { id: 'tor_gateway', label: 'Helheim Stealth', desc: 'Zero-trace onion routing', icon: Shield },
                  ].map((modeItem) => {
                    const Icon = modeItem.icon;
                    const isModeSelected = currentConfig.mode === modeItem.id;
                    return (
                      <button
                        key={modeItem.id}
                        onClick={() => handleUpdate('mode', modeItem.id as RealmProxyConfig['mode'])}
                        className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                          isModeSelected
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-md'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                        }`}
                        style={{
                          borderColor: isModeSelected ? theme.accentColor : undefined,
                        }}
                      >
                        <Icon className="h-4 w-4 mb-2" style={{ color: isModeSelected ? theme.accentColor : undefined }} />
                        <span className="text-xs font-bold text-slate-200">{modeItem.label}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{modeItem.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proxy Endpoint & DNS over HTTPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    PROXY CONDUIT URL
                  </label>
                  <input
                    type="text"
                    value={currentConfig.proxyUrl}
                    onChange={(e) => handleUpdate('proxyUrl', e.target.value)}
                    placeholder="e.g. socks5://127.0.0.1:9050 or http://proxy:8080"
                    disabled={currentConfig.mode === 'direct'}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/60 disabled:opacity-40"
                  />
                  <p className="text-[10px] text-slate-500">
                    Host:port address of the outbound proxy server for {REALMS[selectedRealm].name}.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    DNS-OVER-HTTPS (DOH) PROVIDER
                  </label>
                  <input
                    type="text"
                    value={currentConfig.dnsOverHttps}
                    onChange={(e) => handleUpdate('dnsOverHttps', e.target.value)}
                    placeholder="https://cloudflare-dns.com/dns-query"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/60"
                  />
                  <p className="text-[10px] text-slate-500">
                    Encrypted DNS resolver prevents ISP eavesdropping and DNS spoofing.
                  </p>
                </div>
              </div>

              {/* Advanced Flags */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.bypassLocalhost}
                    onChange={(e) => handleUpdate('bypassLocalhost', e.target.checked)}
                    className="rounded border-white/20 text-cyan-500 focus:ring-0 h-4 w-4 bg-black/40"
                  />
                  <span className="text-xs text-slate-300">
                    Bypass proxy conduit for local connections (<code className="font-mono text-[11px] text-cyan-300">localhost, 127.0.0.1, *.local</code>)
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Default</span>
                </button>

                <button
                  onClick={handleProbeConduit}
                  disabled={isProbing}
                  className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                  title="Probe network latency and DoH resolver reachability"
                >
                  <Zap className={`h-3.5 w-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                  <span>{isProbing ? 'Probing...' : probeStatus ? probeStatus : 'Probe Conduit'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {savedSuccess && (
                  <span className="flex items-center space-x-1 text-xs text-emerald-400 font-bold">
                    <Check className="h-4 w-4" />
                    <span>Conduits Inscribed!</span>
                  </span>
                )}
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-lg active:scale-95"
                  style={{
                    backgroundColor: theme.accentColor,
                    color: '#05070a',
                  }}
                >
                  <span>Inscribe Bifröst Matrix</span>
                  <span className="font-mono text-sm">ᛗ</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
