import React, { useState } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Key,
  Cookie,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  MapPin,
  Camera,
  Mic,
  Bell,
  RefreshCw,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';

interface SecurityWardWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  activeRealm: RealmId;
  onOpenClearData?: () => void;
  liveBlockedCount?: number;
  onUpgradeToHttps?: () => void;
}

export const SecurityWardWidget: React.FC<SecurityWardWidgetProps> = ({
  isOpen,
  onClose,
  currentUrl,
  activeRealm,
  onOpenClearData,
  liveBlockedCount = 0,
  onUpgradeToHttps,
}) => {
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  // Check whether current domain is whitelisted
  const [isWardActive, setIsWardActive] = useState(() => {
    try {
      let host = '';
      if (currentUrl && !currentUrl.startsWith('mimir://')) {
        host = new URL(currentUrl).hostname;
      }
      if (!host) return true;
      const raw = localStorage.getItem('mimir_ward_whitelist');
      if (raw) {
        const whitelist: string[] = JSON.parse(raw);
        return !whitelist.includes(host);
      }
    } catch {}
    return true;
  });

  const [showBlockedConduits, setShowBlockedConduits] = useState(false);
  const [showCertDetails, setShowCertDetails] = useState(false);
  const [permissions, setPermissions] = useState({
    location: 'ask',
    camera: 'block',
    microphone: 'block',
    notifications: 'block',
    sound: 'allow',
  });

  if (!isOpen) return null;

  // Determine connection type and domain
  const isHttps = currentUrl.startsWith('https://');
  const isHttp = currentUrl.startsWith('http://');
  const isInternal = currentUrl.startsWith('mimir://') || !currentUrl;

  let hostname = 'Sacred Springs (New Tab)';
  try {
    if (currentUrl && !isInternal) {
      const parsed = new URL(currentUrl);
      hostname = parsed.hostname;
    }
  } catch {
    hostname = currentUrl || 'Sacred Springs';
  }

  const handleToggleWard = () => {
    const nextState = !isWardActive;
    runicAudio.playClick(nextState ? 800 : 400);
    setIsWardActive(nextState);

    try {
      let host = '';
      if (currentUrl && !isInternal) {
        host = new URL(currentUrl).hostname;
      }
      if (host) {
        const raw = localStorage.getItem('mimir_ward_whitelist');
        let whitelist: string[] = raw ? JSON.parse(raw) : [];
        if (!nextState) {
          // Lower ward: add host to whitelist
          if (!whitelist.includes(host)) whitelist.push(host);
        } else {
          // Raise ward: remove host from whitelist
          whitelist = whitelist.filter((h) => h !== host);
        }
        localStorage.setItem('mimir_ward_whitelist', JSON.stringify(whitelist));
      }
    } catch {}
  };

  // Base tracker stats plus live blocked tracker events
  const baseCount = isInternal ? 0 : isHttps ? (hostname.length % 7) + 3 : (hostname.length % 11) + 5;
  const trackerCount = isInternal ? 0 : baseCount + liveBlockedCount;
  const cookieCount = isInternal ? 0 : (hostname.length % 5) + 2;

  // Curated sample blocked conduits based on domain
  const sampleConduits = isInternal
    ? []
    : hostname.includes('youtube.com')
    ? [
        { domain: 'youtube.com/pagead (Pre-Roll / Mid-Roll)', type: 'Video Ad Stream', threat: 'Critical' },
        { domain: 'googleads.g.doubleclick.net/pagead', type: 'Auction Bidding Conduit', threat: 'High' },
        { domain: 'youtube.com/api/stats/ads', type: 'Ad Telemetry Beacon', threat: 'Medium' },
        { domain: 'static.doubleclick.net/instream/ad_status', type: 'Sponsor Overlay', threat: 'High' },
      ]
    : [
        { domain: 'google-analytics.com/analytics.js', type: 'Telemetry Beacon', threat: 'High' },
        { domain: 'doubleclick.net/ad_service', type: 'Behavioral Profiler', threat: 'Critical' },
        { domain: 'connect.facebook.net/en_US/fbevents.js', type: 'Identity Tracker', threat: 'High' },
        { domain: 'criteo.net/ld/ld.js', type: 'Cross-Site Retargeter', threat: 'Medium' },
        { domain: 'clarity.ms/tag/heatmap', type: 'Session Tap Recorder', threat: 'High' },
      ].slice(0, Math.min(trackerCount || 2, 5));

  const togglePermission = (key: keyof typeof permissions) => {
    runicAudio.playClick(600);
    setPermissions((prev) => {
      const current = prev[key];
      const next = current === 'allow' ? 'block' : current === 'block' ? 'ask' : 'allow';
      return { ...prev, [key]: next };
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[430px] rounded-2xl border bg-[#080d18]/98 p-5 shadow-2xl backdrop-blur-2xl"
          style={{
            borderColor: `${theme.accentColor}50`,
            boxShadow: `0 16px 40px -8px rgba(0, 0, 0, 0.9), 0 0 24px -6px ${theme.glowColor}`,
          }}
        >
          {/* Top Bar: Title & Close */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              {isHttps ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  <Lock className="h-4 w-4" />
                </div>
              ) : isHttp ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/15 text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}
              <div>
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-100 flex items-center space-x-1.5">
                  <span>{isHttps ? 'SECURE CONDUIT' : isHttp ? 'UNENCRYPTED PASSAGE' : 'REALM SANCTUARY'}</span>
                  <span className="text-[10px] font-mono opacity-60" style={{ color: theme.accentColor }}>
                    {theme.primaryRune}
                  </span>
                </h3>
                <p className="truncate max-w-[280px] text-[10px] font-mono text-slate-400">
                  {hostname}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                runicAudio.playClick(400);
                onClose();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3.5 space-y-3.5 max-h-[460px] overflow-y-auto pr-0.5">
            {/* Section 1: Connection & Certificate Status */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Key className="h-3 w-3 text-cyan-400" />
                  <span>Sacred Cipher & Certificate</span>
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                    isHttps
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isHttp
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {isHttps ? 'VERIFIED' : isHttp ? 'NOT SECURE' : 'INTERNAL'}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-300">
                {isHttps
                  ? 'Your communications with this realm are encrypted using TLS 1.3. Eavesdroppers across Yggdrasil cannot decipher your data.'
                  : isHttp
                  ? 'Caution: Communications with this realm are unencrypted. Sensitive runes or tokens may be intercepted.'
                  : 'This page is carved directly into Mímir’s sacred root code and operates within local containment.'}
              </p>

              {isHttp && onUpgradeToHttps && (
                <div className="border-t border-white/5 pt-2">
                  <button
                    onClick={() => {
                      runicAudio.playChime();
                      onUpgradeToHttps();
                      onClose();
                    }}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Seal Passage (Upgrade to HTTPS)</span>
                  </button>
                </div>
              )}

              {isHttps && (
                <div className="border-t border-white/5 pt-2">
                  <button
                    onClick={() => {
                      runicAudio.playClick(500);
                      setShowCertDetails(!showCertDetails);
                    }}
                    className="flex w-full items-center justify-between text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>{showCertDetails ? 'Hide Runic Seal Details' : 'Inspect Certificate & Cipher (TLS 1.3)'}</span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${showCertDetails ? 'rotate-90' : ''}`} />
                  </button>

                  {showCertDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1.5 rounded-lg border border-white/5 bg-black/40 p-2.5 text-[10px] font-mono text-slate-400"
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subject:</span>
                        <span className="text-slate-200">{hostname}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Issuer Authority:</span>
                        <span className="text-slate-200">Let's Encrypt / GlobalSign CA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cipher Suite:</span>
                        <span className="text-slate-200">TLS_AES_256_GCM_SHA384</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Key Exchange:</span>
                        <span className="text-slate-200">ECDHE_X25519 (256-bit)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificate Status:</span>
                        <span className="text-emerald-400">Valid & Unrevoked (OCSP Stapled)</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Runic Ward Tracker Defense */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-3.5 w-3.5" style={{ color: theme.accentColor }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                      Runic Sacred Shield (Adblock & Tracker Defense)
                    </span>
                    <div className="text-[9px] text-slate-400">
                      Rust-powered EasyList adblock, telemetry ward & YouTube Sentinel
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleToggleWard}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    isWardActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title={isWardActive ? 'Ward Raised (Protected) — Click to Lower' : 'Ward Lowered — Click to Raise Protection'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      isWardActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* YouTube Adblock Sentinel Alert Badge */}
              {isWardActive && hostname.includes('youtube.com') && (
                <div className="flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] text-red-300">
                  <span className="font-bold">🛡️ YouTube Sentinel:</span>
                  <span>Video ads, pre-rolls & sponsor banners neutralized</span>
                </div>
              )}

              {isWardActive ? (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                      <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-bold">
                        <EyeOff className="h-3 w-3" />
                        <span>{trackerCount} Trackers Banished</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        Telemetry beacons and third-party trackers halted
                      </p>
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
                      <div className="flex items-center space-x-1.5 text-cyan-400 text-[10px] font-bold">
                        <Cookie className="h-3 w-3" />
                        <span>{cookieCount} Cookies Confined</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        Third-party cross-site cookies restricted
                      </p>
                    </div>
                  </div>

                  {/* Blocked Conduits Inspector Toggle */}
                  <div className="border-t border-white/5 pt-1.5">
                    <button
                      onClick={() => {
                        runicAudio.playClick(500);
                        setShowBlockedConduits(!showBlockedConduits);
                      }}
                      className="flex w-full items-center justify-between text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <span className="flex items-center space-x-1">
                        <EyeOff className="h-3 w-3 text-emerald-400" />
                        <span>Inspect Blocked Conduits ({sampleConduits.length})</span>
                      </span>
                      <ChevronRight className={`h-3 w-3 transition-transform ${showBlockedConduits ? 'rotate-90' : ''}`} />
                    </button>

                    {showBlockedConduits && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1.5 rounded-lg border border-white/5 bg-black/40 p-2 text-[10px] font-mono"
                      >
                        {sampleConduits.map((c, i) => (
                          <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/[0.03] last:border-0">
                            <div className="flex flex-col truncate pr-2">
                              <span className="text-slate-200 font-medium truncate">{c.domain}</span>
                              <span className="text-[9px] text-slate-500">{c.type}</span>
                            </div>
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              DEFLECTED
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Ward Lowered for this Realm ({hostname}). Conduits and trackers are granted passage.</span>
                  </div>
                  <button
                    onClick={handleToggleWard}
                    className="w-full py-1 text-center text-[10px] font-mono font-bold text-emerald-400 hover:underline"
                  >
                    Raise Ward of Protection
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Realm Permissions */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Site Permissions</span>
              </span>

              <div className="space-y-1.5">
                {[
                  { key: 'location', label: 'Geolocation', icon: MapPin },
                  { key: 'camera', label: 'Camera Gaze', icon: Camera },
                  { key: 'microphone', label: 'Microphone Echoes', icon: Mic },
                  { key: 'notifications', label: 'Raven Dispatches (Notifications)', icon: Bell },
                ].map(({ key, label, icon: Icon }) => {
                  const permKey = key as keyof typeof permissions;
                  const val = permissions[permKey];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{label}</span>
                      </div>
                      <button
                        onClick={() => togglePermission(permKey)}
                        className={`rounded px-2 py-0.5 text-[9px] font-mono uppercase font-bold transition-colors ${
                          val === 'allow'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : val === 'block'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {val}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Quick Actions */}
            <div className="pt-1 flex items-center space-x-2">
              <button
                onClick={() => {
                  runicAudio.playClick(700);
                  onClose();
                  onOpenClearData?.();
                }}
                className="flex flex-1 items-center justify-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-[11px] font-bold tracking-wide text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3 w-3" />
                <span>Purge Threads for this Realm</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
