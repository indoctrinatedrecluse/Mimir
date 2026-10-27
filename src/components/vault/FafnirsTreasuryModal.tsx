import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Zap,
  RefreshCw,
  X,
  Sliders,
  Clock,
  Globe,
  Database,
  Terminal,
  Share2,
  DollarSign,
  User,
  Fingerprint,
} from 'lucide-react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { fafnirVault, DecryptedCredential } from '@/core/security/fafnirVault';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc } from '@/core/ipc/bridge';

interface FafnirsTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  currentUrl?: string;
  onNavigate?: (url: string) => void;
}

export const FafnirsTreasuryModal: React.FC<FafnirsTreasuryModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  currentUrl,
  onNavigate,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(fafnirVault.isUnlocked());
  const [isSetup, setIsSetup] = useState(fafnirVault.isSetup());
  const [credentials, setCredentials] = useState<DecryptedCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Master Passphrase Input
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isRevealingPassphrase, setIsRevealingPassphrase] = useState(false);

  // Add Credential Form
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState(currentUrl || '');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState<DecryptedCredential['category']>('developer');
  const [newNotes, setNewNotes] = useState('');

  // Revealed passwords state (id -> boolean)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Gungnir Generator Options
  const [genLength, setGenLength] = useState(20);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genRunes, setGenRunes] = useState(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{
    key: string;
    entropyBits: number;
    rating: string;
  } | null>(null);

  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  useEffect(() => {
    return fafnirVault.subscribe((unlocked, setup) => {
      setIsUnlocked(unlocked);
      setIsSetup(setup);
      if (unlocked) {
        fafnirVault.getCredentials().then(setCredentials);
      } else {
        setCredentials([]);
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (currentUrl && currentUrl !== 'mimir://newtab' && !newUrl) {
        setNewUrl(currentUrl);
      }
      handleRegenerateKey();
    }
  }, [isOpen, currentUrl]);

  const handleRegenerateKey = () => {
    const res = fafnirVault.generateGungnirKey({
      length: genLength,
      useUppercase: true,
      useLowercase: true,
      useNumbers: genNumbers,
      useSymbols: genSymbols,
      useRunes: genRunes,
    });
    setGeneratedKeyResult(res);
  };

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    if (passphrase.length < 6) {
      setUnlockError('Master rune must be at least 6 characters long');
      runicAudio.playClick(300);
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setUnlockError('Master runes do not match');
      runicAudio.playClick(300);
      return;
    }

    try {
      await fafnirVault.setupVault(passphrase);
      runicAudio.playChime();
      setPassphrase('');
      setConfirmPassphrase('');
      const list = await fafnirVault.getCredentials();
      setCredentials(list);
    } catch (err: any) {
      setUnlockError(err.message || 'Failed to establish vault');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    try {
      const ok = await fafnirVault.unlock(passphrase);
      if (ok) {
        runicAudio.playChime();
        setPassphrase('');
        const list = await fafnirVault.getCredentials();
        setCredentials(list);
      } else {
        runicAudio.playClick(300);
        setUnlockError('Incorrect master rune. Treasury remains sealed.');
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Unlock failed');
    }
  };

  useEffect(() => {
    const prevHandler = (window as any).__mimirOnBiometricResult;
    (window as any).__mimirOnBiometricResult = async (success: boolean, error?: string | null) => {
      if (success) {
        const ok = await fafnirVault.unlockWithBiometric();
        if (ok) {
          runicAudio.playChime();
          const list = await fafnirVault.getCredentials();
          setCredentials(list);
          setUnlockError('');
        } else {
          setUnlockError('Biometric confirmed, but master rune not stored on device. Enter passphrase manually.');
        }
      } else if (error) {
        setUnlockError(error);
      }
    };
    return () => {
      (window as any).__mimirOnBiometricResult = prevHandler;
    };
  }, []);

  const handleBiometricAuth = () => {
    setUnlockError('');
    runicAudio.playClick(600);
    if (mimirIpc.isAndroid()) {
      mimirIpc.send({ type: 'REQUEST_BIOMETRIC_AUTH' });
    } else {
      fafnirVault.unlockWithBiometric().then((ok) => {
        if (ok) {
          runicAudio.playChime();
          fafnirVault.getCredentials().then(setCredentials);
        } else {
          setUnlockError('Biometric credential not available.');
        }
      });
    }
  };

  const handleLock = () => {
    runicAudio.playClick(400);
    fafnirVault.lock();
    setRevealedIds(new Set());
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const item = await fafnirVault.addCredential(
        newTitle || newUrl || 'Encrypted Secret',
        newUrl,
        newUsername,
        newPassword,
        newCategory,
        newNotes,
        activeRealm
      );
      runicAudio.playChime();
      setCredentials((prev) => [item, ...prev]);
      setIsAdding(false);
      setNewTitle('');
      setNewUsername('');
      setNewPassword('');
      setNewNotes('');
    } catch (err: any) {
      setUnlockError(err.message);
    }
  };

  const handleDelete = (id: string) => {
    runicAudio.playClick(450);
    fafnirVault.deleteCredential(id);
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCopy = async (text: string, fieldId: string, isPassword = false) => {
    if (isPassword) {
      await fafnirVault.copyPasswordToClipboard(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
    runicAudio.playClick(900);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const toggleReveal = (id: string) => {
    runicAudio.playClick(700);
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Auto-hide after 15s
        setTimeout(() => {
          setRevealedIds((p) => {
            const n = new Set(p);
            n.delete(id);
            return n;
          });
        }, 15000);
      }
      return next;
    });
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [credentials, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-amber-500/30 bg-slate-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 50px rgba(245,158,11,0.15), inset 0 0 20px rgba(255,255,255,0.03)`,
        }}
      >
        {/* Top Header Banner */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/20 via-black to-slate-950">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {isUnlocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-slate-100 flex items-center space-x-2">
                <span>FAFNIR'S TREASURY</span>
                <span className="font-mono text-xs text-amber-400">ᛞ</span>
                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-mono text-amber-300">
                  AES-256-GCM
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Zero-Knowledge Encrypted Credential Vault & Key Forge
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLock}
                className="flex items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
                title="Lock Treasury and purge key from memory"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>SEAL VAULT</span>
              </button>
            )}

            <button
              onClick={() => {
                runicAudio.playClick(500);
                onClose();
              }}
              className="rounded p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isUnlocked ? (
            /* Locked / Setup Gate Screen */
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-md mx-auto space-y-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <ShieldCheck className="h-8 w-8 text-amber-400" />
                <span className="absolute -bottom-2 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-300">
                  PBKDF2 100k
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {!isSetup ? 'Forge Your Dragon Seal' : 'Unlock the Golden Treasury'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {!isSetup
                    ? 'Establish a master passphrase. All credentials are cryptographically protected using AES-256-GCM and never stored in plaintext.'
                    : 'Enter your master passphrase to decrypt your passwords and keys.'}
                </p>
              </div>

              {unlockError && (
                <div className="flex items-center space-x-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={!isSetup ? handleSetupVault : handleUnlock} className="w-full space-y-3">
                <div className="relative">
                  <input
                    type={isRevealingPassphrase ? 'text' : 'password'}
                    placeholder="Master Passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3.5 pr-10 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400 transition-colors font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsRevealingPassphrase(!isRevealingPassphrase)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {isRevealingPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {!isSetup && (
                  <input
                    type="password"
                    placeholder="Confirm Master Passphrase..."
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                )}

                <button
                  type="submit"
                  className="w-full h-10 rounded-lg font-bold text-xs tracking-wider uppercase border border-amber-400/80 bg-amber-500 text-slate-950 shadow-lg hover:brightness-110 active:scale-98 transition-all"
                >
                  {!isSetup ? 'Inscribe & Establish Treasury' : 'Unlock Dragon Hoard'}
                </button>

                {isSetup && (mimirIpc.isAndroid() || fafnirVault.hasBiometricSecret()) && (
                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    className="w-full h-10 rounded-lg font-bold text-xs tracking-wider uppercase border border-cyan-400/50 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:border-cyan-400 hover:text-white active:scale-98 transition-all flex items-center justify-center space-x-2"
                  >
                    <Fingerprint className="h-4 w-4 text-cyan-400" />
                    <span>Unlock with Biometrics (ᛒ)</span>
                  </button>
                )}

                {!isSetup && mimirIpc.isAndroid() && (
                  <div className="flex items-center space-x-2 text-[11px] text-cyan-300/80 bg-cyan-950/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-left">
                    <Fingerprint className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Runic Biometrics (Fingerprint/Face) will bond to this device automatically upon establishment.</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* Unlocked Treasury Manager */
            <div className="space-y-6">
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search credentials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {['all', 'developer', 'finance', 'social', 'server', 'personal'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        runicAudio.playClick(700);
                        setSelectedCategory(cat);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold border transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      runicAudio.playClick(800);
                      setIsAdding(!isAdding);
                    }}
                    className="flex items-center space-x-1 rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-300 hover:bg-amber-500/30 transition-all shrink-0 ml-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>CARVE</span>
                  </button>
                </div>
              </div>

              {/* Add Credential Collapsible Form */}
              <AnimatePresence>
                {isAdding && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveCredential}
                    className="rounded-xl border border-amber-500/40 bg-amber-950/10 p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                        <Key className="h-3.5 w-3.5" />
                        <span>Carve New Encrypted Secret</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Title / Service</label>
                        <input
                          type="text"
                          placeholder="e.g. GitHub, AWS, DigitalOcean..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full h-8 rounded border border-white/10 bg-white/5 px-2.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Target URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="w-full h-8 rounded border border-white/10 bg-white/5 px-2.5 text-xs text-slate-100 outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Username / Email</label>
                        <input
                          type="text"
                          placeholder="user@domain.com"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-full h-8 rounded border border-white/10 bg-white/5 px-2.5 text-xs text-slate-100 outline-none focus:border-amber-400 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-mono text-slate-400">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              handleRegenerateKey();
                              if (generatedKeyResult) {
                                setNewPassword(generatedKeyResult.key);
                              }
                            }}
                            className="text-[9px] font-mono text-amber-300 hover:underline flex items-center space-x-1"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Gungnir Generate</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Secret key..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-8 rounded border border-white/10 bg-white/5 px-2.5 text-xs text-slate-100 outline-none focus:border-amber-400 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="h-8 rounded border border-white/10 bg-slate-900 px-2 text-xs text-slate-300 font-mono outline-none"
                      >
                        <option value="developer">Developer</option>
                        <option value="finance">Finance</option>
                        <option value="social">Social</option>
                        <option value="server">Server</option>
                        <option value="personal">Personal</option>
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md"
                      >
                        Seal into Hoard
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Credential List */}
              <div className="space-y-2.5">
                {filteredCredentials.map((c) => {
                  const isRevealed = revealedIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                    >
                      {/* Left: Info */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
                          {c.category === 'developer' ? (
                            <Terminal className="h-4 w-4" />
                          ) : c.category === 'finance' ? (
                            <DollarSign className="h-4 w-4" />
                          ) : c.category === 'social' ? (
                            <Share2 className="h-4 w-4" />
                          ) : c.category === 'server' ? (
                            <Database className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {c.title}
                            </span>
                            <span className="rounded px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30">
                              {c.category}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-0.5">
                            <span className="truncate">{c.username}</span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-300">
                              {isRevealed ? c.password : '••••••••••••'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-1.5 mt-2 sm:mt-0 shrink-0">
                        {/* Reveal Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleReveal(c.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title={isRevealed ? 'Hide Password' : 'Reveal Password (15s)'}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>

                        {/* Copy Username */}
                        <button
                          type="button"
                          onClick={() => handleCopy(c.username, `user-${c.id}`)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Username"
                        >
                          {copiedField === `user-${c.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Copy Password */}
                        <button
                          type="button"
                          onClick={() => handleCopy(c.password, `pass-${c.id}`, true)}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 text-[10px] font-mono transition-all"
                          title="Copy Password (Auto-clears in 30s)"
                        >
                          {copiedField === `pass-${c.id}` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>KEY</span>
                            </>
                          )}
                        </button>

                        {/* Launch URL */}
                        {c.url && onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              runicAudio.playClick(800);
                              onNavigate(c.url);
                              onClose();
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                            title="Launch URL in Active Viewport"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Secret"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredCredentials.length === 0 && (
                  <div className="py-8 text-center text-slate-500 font-mono text-xs">
                    No secrets match your runes in Fafnir's Treasury.
                  </div>
                )}
              </div>

              {/* Gungnir Key Generator Box */}
              <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/10 via-black to-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Gungnir Key Generator
                    </span>
                    {generatedKeyResult && (
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                        {generatedKeyResult.rating} ({generatedKeyResult.entropyBits} bits)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Generate New Gungnir Key"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {generatedKeyResult && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-black/60 font-mono text-xs text-amber-200 break-all select-all">
                    <span>{generatedKeyResult.key}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedKeyResult.key, 'gen-key', true)}
                      className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold shrink-0"
                    >
                      {copiedField === 'gen-key' ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                )}

                {/* Generator Tuning Sliders */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center space-x-2">
                    <span>Length: {genLength}</span>
                    <input
                      type="range"
                      min={12}
                      max={48}
                      value={genLength}
                      onChange={(e) => {
                        setGenLength(Number(e.target.value));
                        setTimeout(handleRegenerateKey, 50);
                      }}
                      className="w-24 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genSymbols}
                        onChange={(e) => {
                          setGenSymbols(e.target.checked);
                          setTimeout(handleRegenerateKey, 50);
                        }}
                        className="rounded accent-amber-400"
                      />
                      <span>Symbols</span>
                    </label>

                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genRunes}
                        onChange={(e) => {
                          setGenRunes(e.target.checked);
                          setTimeout(handleRegenerateKey, 50);
                        }}
                        className="rounded accent-amber-400"
                      />
                      <span>Norse Runes</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
