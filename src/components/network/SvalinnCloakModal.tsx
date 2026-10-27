import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { svalinnProxy, SvalinnProxyConfig, EgressIpInfo, ProxyType } from '@/core/privacy/proxyManager';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
  RefreshCw,
  Globe,
  Radio,
  Server,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface SvalinnCloakModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
}

export const SvalinnCloakModal: React.FC<SvalinnCloakModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
}) => {
  const [config, setConfig] = useState<SvalinnProxyConfig>(svalinnProxy.getConfig());
  const [egressInfo, setEgressInfo] = useState<EgressIpInfo | null>(svalinnProxy.getLastEgressInfo());
  const [isProbing, setIsProbing] = useState(false);
  const [testStatus, setTestStatus] = useState<{ [key: string]: 'testing' | 'success' | 'failed' }>({});

  const [customSocksHost, setCustomSocksHost] = useState(config.customSocksHost || '127.0.0.1');
  const [customSocksPort, setCustomSocksPort] = useState(config.customSocksPort || 1080);
  const [customHttpHost, setCustomHttpHost] = useState(config.customHttpHost || '127.0.0.1');
  const [customHttpPort, setCustomHttpPort] = useState(config.customHttpPort || 8080);
  const [bypassList, setBypassList] = useState(config.bypassList || '<local>;localhost;127.0.0.1');

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    const unsub = svalinnProxy.subscribe((cfg) => {
      setConfig(cfg);
      setCustomSocksHost(cfg.customSocksHost);
      setCustomSocksPort(cfg.customSocksPort);
      setCustomHttpHost(cfg.customHttpHost);
      setCustomHttpPort(cfg.customHttpPort);
      setBypassList(cfg.bypassList);
    });

    const unsubTest = svalinnProxy.subscribeTestResults((res) => {
      const key = `${res.host}:${res.port}`;
      setTestStatus((prev) => ({
        ...prev,
        [key]: res.reachable ? 'success' : 'failed',
      }));
      if (res.reachable) {
        runicAudio.playChime();
      } else {
        runicAudio.playClick(300);
      }
    });

    return () => {
      unsub();
      unsubTest();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      handleProbeIp();
    }
  }, [isOpen]);

  const handleProbeIp = async () => {
    setIsProbing(true);
    runicAudio.playClick(750);
    const info = await svalinnProxy.probeEgressIp();
    setEgressInfo(info);
    setIsProbing(false);
  };

  const handleSelectMode = (type: ProxyType) => {
    runicAudio.playClick(600);
    if (type === 'direct') {
      svalinnProxy.setDirectMode();
    } else if (type === 'tor') {
      svalinnProxy.setTorCloakMode(9050);
    } else if (type === 'socks5') {
      svalinnProxy.setCustomSocks(customSocksHost, customSocksPort);
    } else if (type === 'http') {
      svalinnProxy.setCustomHttp(customHttpHost, customHttpPort);
    }
    // Probe new IP after small delay
    setTimeout(() => handleProbeIp(), 1000);
  };

  const handleTestConnection = (host: string, port: number) => {
    const key = `${host}:${port}`;
    setTestStatus((prev) => ({ ...prev, [key]: 'testing' }));
    runicAudio.playClick(500);
    svalinnProxy.testConnectivity(host, port);
  };

  const handleSaveBypass = () => {
    runicAudio.playChime();
    svalinnProxy.updateBypassList(bypassList);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#070b14]/95 shadow-2xl backdrop-blur-2xl max-h-[90vh] flex flex-col"
        >
          {/* Top Cosmic Accent Stripe */}
          <div
            className="h-1 w-full shrink-0"
            style={{
              background: config.enabled
                ? 'linear-gradient(90deg, #10b981, #06b6d4, #10b981)'
                : `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
            }}
          />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner"
                style={{
                  color: config.enabled ? '#34d399' : theme.accentColor,
                  borderColor: config.enabled ? '#34d39940' : undefined,
                }}
              >
                {config.enabled ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold tracking-wider text-white uppercase font-sans">
                    Svalinn Network Cloak
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${
                      config.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {config.enabled ? `CLOAKED • ${config.proxyType.toUpperCase()}` : 'DIRECT BIFRÖST'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Multi-Hop SOCKS5, Tor Onion Routing & HTTP Proxy Shield
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(400);
                onClose();
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 pr-4">
            {/* Live Egress IP & Telemetry Card */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/40 shadow-inner">
              <div className="flex items-center space-x-3">
                <Globe className={`w-5 h-5 ${config.enabled ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Public Egress Address
                  </div>
                  <div className="text-sm font-mono font-bold text-white tracking-wide">
                    {egressInfo?.ip || 'Probing Bifröst...'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleProbeIp}
                disabled={isProbing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Verify IP</span>
              </button>
            </div>

            {/* Proxy Modes Grid */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                Routing Profiles
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Direct Mode */}
                <button
                  type="button"
                  onClick={() => handleSelectMode('direct')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    !config.enabled
                      ? 'border-cyan-500/50 bg-cyan-950/20 shadow-lg'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Direct Bifröst</span>
                    </div>
                    {!config.enabled && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Native unproxied routing. Fast everyday connection.
                  </p>
                </button>

                {/* 2. Tor Valhalla Cloak */}
                <button
                  type="button"
                  onClick={() => handleSelectMode('tor')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    config.enabled && config.proxyType === 'tor'
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Tor Valhalla Cloak</span>
                    </div>
                    {config.enabled && config.proxyType === 'tor' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Routes through local Tor daemon or Android Orbot (<code className="text-emerald-300 font-mono">127.0.0.1:9050</code>).
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestConnection('127.0.0.1', 9050);
                    }}
                    className="mt-2 text-[10px] font-mono text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Ping Tor (9050):</span>
                    <span className="font-bold uppercase">
                      {testStatus['127.0.0.1:9050'] || 'Test'}
                    </span>
                  </button>
                </button>

                {/* 3. Custom SOCKS5 */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    config.enabled && config.proxyType === 'socks5'
                      ? 'border-purple-500/50 bg-purple-950/20 shadow-lg'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Custom SOCKS5</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectMode('socks5')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        config.enabled && config.proxyType === 'socks5'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {config.enabled && config.proxyType === 'socks5' ? 'Active' : 'Apply'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="127.0.0.1"
                      value={customSocksHost}
                      onChange={(e) => setCustomSocksHost(e.target.value)}
                      className="w-2/3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="1080"
                      value={customSocksPort}
                      onChange={(e) => setCustomSocksPort(Number(e.target.value))}
                      className="w-1/3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection(customSocksHost, customSocksPort)}
                    className="mt-2 text-[10px] font-mono text-purple-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Test Ping:</span>
                    <span className="font-bold uppercase">
                      {testStatus[`${customSocksHost}:${customSocksPort}`] || 'Check'}
                    </span>
                  </button>
                </div>

                {/* 4. Custom HTTP / HTTPS */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    config.enabled && config.proxyType === 'http'
                      ? 'border-amber-500/50 bg-amber-950/20 shadow-lg'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Custom HTTP</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectMode('http')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        config.enabled && config.proxyType === 'http'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {config.enabled && config.proxyType === 'http' ? 'Active' : 'Apply'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="127.0.0.1"
                      value={customHttpHost}
                      onChange={(e) => setCustomHttpHost(e.target.value)}
                      className="w-2/3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="8080"
                      value={customHttpPort}
                      onChange={(e) => setCustomHttpPort(Number(e.target.value))}
                      className="w-1/3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection(customHttpHost, customHttpPort)}
                    className="mt-2 text-[10px] font-mono text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Test Ping:</span>
                    <span className="font-bold uppercase">
                      {testStatus[`${customHttpHost}:${customHttpPort}`] || 'Check'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Per-Domain Bypass List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                  Domain Bypass Conduits (Semicolon Delimited)
                </label>
                <button
                  type="button"
                  onClick={handleSaveBypass}
                  className="text-[10px] font-bold text-cyan-400 hover:underline uppercase"
                >
                  Save Bypass Rules
                </button>
              </div>
              <input
                type="text"
                value={bypassList}
                onChange={(e) => setBypassList(e.target.value)}
                placeholder="<local>;localhost;127.0.0.1;*.netflix.com;*.spotify.com"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Requests matching these patterns will route directly, bypassing the active proxy shield.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-3.5 bg-black/30 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">
              Changes take effect for active and newly established socket conduits.
            </span>
            <button
              onClick={() => {
                runicAudio.playClick(400);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl border border-white/10 bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all uppercase tracking-wide"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
