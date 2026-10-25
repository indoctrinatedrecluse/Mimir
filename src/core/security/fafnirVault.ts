import { RealmId } from '@/types';

export interface VaultCredential {
  id: string;
  title: string;
  url: string;
  username: string;
  passwordCipherBase64: string; // AES-GCM encrypted
  passwordIvBase64: string;
  category: 'developer' | 'finance' | 'social' | 'personal' | 'server';
  notes?: string;
  realmAffinity?: RealmId;
  createdAt: number;
  updatedAt: number;
}

export interface VaultEnvelope {
  version: number;
  saltBase64: string;
  authCipherBase64: string;
  authIvBase64: string;
  credentials: VaultCredential[];
  autoLockMinutes: number;
}

export interface DecryptedCredential extends Omit<VaultCredential, 'passwordCipherBase64' | 'passwordIvBase64'> {
  password: string;
}

const STORAGE_KEY = 'mimir_fafnir_vault_v1';
const AUTH_SENTINEL = 'FAFNIR_TREASURY_VALIDATED';
const PBKDF2_ITERATIONS = 100000;

type VaultStateListener = (isUnlocked: boolean, isSetup: boolean, credentialsCount: number) => void;

class FafnirVaultEngine {
  private derivedKey: CryptoKey | null = null;
  private envelope: VaultEnvelope | null = null;
  private lockTimer: number | null = null;
  private listeners: Set<VaultStateListener> = new Set();
  private clipboardClearTimer: number | null = null;

  constructor() {
    this.loadEnvelope();
  }

  public subscribe(listener: VaultStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isUnlocked(), this.isSetup(), this.getCredentialCount());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) =>
      fn(this.isUnlocked(), this.isSetup(), this.getCredentialCount())
    );
  }

  public isSetup(): boolean {
    return this.envelope !== null;
  }

  public isUnlocked(): boolean {
    return this.derivedKey !== null;
  }

  public getCredentialCount(): number {
    return this.envelope?.credentials.length || 0;
  }

  private loadEnvelope() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.envelope = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse Fafnir Vault envelope', e);
    }
  }

  private saveEnvelope() {
    if (typeof window === 'undefined' || !this.envelope) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.envelope));
    } catch (e) {
      console.error('Failed to save Fafnir Vault envelope', e);
    }
    this.notify();
  }

  // Cryptographic Helper Functions
  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encryptString(key: CryptoKey, text: string): Promise<{ cipher: string; iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(text)
    );

    return {
      cipher: this.bufferToBase64(ciphertext),
      iv: this.bufferToBase64(iv),
    };
  }

  private async decryptString(key: CryptoKey, cipherBase64: string, ivBase64: string): Promise<string> {
    const iv = this.base64ToBuffer(ivBase64);
    const ciphertext = this.base64ToBuffer(cipherBase64);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  }

  /**
   * Initialize a new vault with a master passphrase
   */
  public async setupVault(masterPassphrase: string, autoLockMinutes = 15): Promise<boolean> {
    if (!masterPassphrase || masterPassphrase.length < 6) {
      throw new Error('Master passphrase must contain at least 6 runes');
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(masterPassphrase, salt);
    const auth = await this.encryptString(key, AUTH_SENTINEL);

    this.envelope = {
      version: 1,
      saltBase64: this.bufferToBase64(salt),
      authCipherBase64: auth.cipher,
      authIvBase64: auth.iv,
      credentials: [],
      autoLockMinutes,
    };

    this.derivedKey = key;
    this.saveEnvelope();
    this.resetLockTimer();
    return true;
  }

  /**
   * Unlock vault with master passphrase
   */
  public async unlock(masterPassphrase: string): Promise<boolean> {
    if (!this.envelope) {
      throw new Error('Vault has not been established yet');
    }

    const salt = this.base64ToBuffer(this.envelope.saltBase64);
    const candidateKey = await this.deriveKey(masterPassphrase, salt);

    try {
      const decryptedAuth = await this.decryptString(
        candidateKey,
        this.envelope.authCipherBase64,
        this.envelope.authIvBase64
      );

      if (decryptedAuth === AUTH_SENTINEL) {
        this.derivedKey = candidateKey;
        this.resetLockTimer();
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Lock vault and purge cryptographic key from memory
   */
  public lock() {
    this.derivedKey = null;
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
    this.notify();
  }

  public resetLockTimer() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
    }
    if (!this.envelope || !this.derivedKey) return;

    const timeoutMs = (this.envelope.autoLockMinutes || 15) * 60 * 1000;
    this.lockTimer = window.setTimeout(() => {
      this.lock();
    }, timeoutMs);
  }

  /**
   * Retrieve and decrypt all credentials in the vault
   */
  public async getCredentials(): Promise<DecryptedCredential[]> {
    if (!this.derivedKey || !this.envelope) {
      throw new Error('Treasury is sealed by dragon locks');
    }

    this.resetLockTimer();
    const result: DecryptedCredential[] = [];

    for (const item of this.envelope.credentials) {
      try {
        const password = await this.decryptString(
          this.derivedKey,
          item.passwordCipherBase64,
          item.passwordIvBase64
        );
        result.push({
          id: item.id,
          title: item.title,
          url: item.url,
          username: item.username,
          password,
          category: item.category,
          notes: item.notes,
          realmAffinity: item.realmAffinity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } catch (err) {
        console.warn(`Failed to decrypt credential ${item.id}`, err);
      }
    }

    return result;
  }

  /**
   * Add a new encrypted credential
   */
  public async addCredential(
    title: string,
    url: string,
    username: string,
    plainPassword: string,
    category: VaultCredential['category'] = 'developer',
    notes = '',
    realmAffinity: RealmId = 'midgard'
  ): Promise<DecryptedCredential> {
    if (!this.derivedKey || !this.envelope) {
      throw new Error('Treasury is locked');
    }

    this.resetLockTimer();
    const encrypted = await this.encryptString(this.derivedKey, plainPassword);
    const now = Date.now();
    const newEntry: VaultCredential = {
      id: `fafnir-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title || url,
      url,
      username,
      passwordCipherBase64: encrypted.cipher,
      passwordIvBase64: encrypted.iv,
      category,
      notes,
      realmAffinity,
      createdAt: now,
      updatedAt: now,
    };

    this.envelope.credentials.push(newEntry);
    this.saveEnvelope();

    return {
      id: newEntry.id,
      title: newEntry.title,
      url: newEntry.url,
      username: newEntry.username,
      password: plainPassword,
      category: newEntry.category,
      notes: newEntry.notes,
      realmAffinity: newEntry.realmAffinity,
      createdAt: newEntry.createdAt,
      updatedAt: newEntry.updatedAt,
    };
  }

  /**
   * Update an existing credential
   */
  public async updateCredential(
    id: string,
    updates: Partial<{
      title: string;
      url: string;
      username: string;
      password?: string;
      category: VaultCredential['category'];
      notes: string;
      realmAffinity: RealmId;
    }>
  ) {
    if (!this.derivedKey || !this.envelope) {
      throw new Error('Treasury is locked');
    }

    this.resetLockTimer();
    const index = this.envelope.credentials.findIndex((c) => c.id === id);
    if (index === -1) return;

    const existing = this.envelope.credentials[index];
    if (updates.password) {
      const encrypted = await this.encryptString(this.derivedKey, updates.password);
      existing.passwordCipherBase64 = encrypted.cipher;
      existing.passwordIvBase64 = encrypted.iv;
    }

    if (updates.title !== undefined) existing.title = updates.title;
    if (updates.url !== undefined) existing.url = updates.url;
    if (updates.username !== undefined) existing.username = updates.username;
    if (updates.category !== undefined) existing.category = updates.category;
    if (updates.notes !== undefined) existing.notes = updates.notes;
    if (updates.realmAffinity !== undefined) existing.realmAffinity = updates.realmAffinity;
    existing.updatedAt = Date.now();

    this.saveEnvelope();
  }

  /**
   * Delete a credential
   */
  public deleteCredential(id: string) {
    if (!this.envelope) return;
    this.envelope.credentials = this.envelope.credentials.filter((c) => c.id !== id);
    this.saveEnvelope();
  }

  /**
   * Copy password to clipboard with 30s auto-clearing security defense
   */
  public async copyPasswordToClipboard(password: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(password);

      if (this.clipboardClearTimer) {
        clearTimeout(this.clipboardClearTimer);
      }

      this.clipboardClearTimer = window.setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === password) {
            await navigator.clipboard.writeText('');
          }
        } catch {
          // ignore
        }
      }, 30000);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gungnir Key Generator: Generates high-entropy passphrases & passwords
   */
  public generateGungnirKey(options: {
    length?: number;
    useUppercase?: boolean;
    useLowercase?: boolean;
    useNumbers?: boolean;
    useSymbols?: boolean;
    useRunes?: boolean;
  } = {}): { key: string; entropyBits: number; rating: string } {
    const {
      length = 20,
      useUppercase = true,
      useLowercase = true,
      useNumbers = true,
      useSymbols = true,
      useRunes = false,
    } = options;

    let chars = '';
    if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (useRunes) chars += 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟ';

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars[array[i] % chars.length];
    }

    const poolSize = chars.length;
    const entropyBits = Math.round(length * Math.log2(poolSize));

    let rating = 'Brittle Branch';
    if (entropyBits >= 120) rating = 'Mjolnir Core (Unbreakable)';
    else if (entropyBits >= 90) rating = 'Dragon Scale (Extreme)';
    else if (entropyBits >= 65) rating = 'Iron Shield (Strong)';
    else if (entropyBits >= 45) rating = 'Bronze Ward (Moderate)';

    return { key, entropyBits, rating };
  }
}

export const fafnirVault = new FafnirVaultEngine();
