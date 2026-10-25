export type SearchEngineId =
  | 'duckduckgo'
  | 'brave'
  | 'startpage'
  | 'searxng'
  | 'ecosia'
  | 'google'
  | 'bing';

export interface SearchEngineOption {
  id: SearchEngineId;
  name: string;
  norseTitle: string;
  description: string;
  buildUrl: (query: string) => string;
  privacyGrade: 'A+' | 'A' | 'A-' | 'B' | 'C';
  iconRune: string;
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngineOption> = {
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    norseTitle: 'Mímisbrunnr Untracked Well',
    description: 'Privacy-by-default untracked search. Never stores IP or personal search history.',
    buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    privacyGrade: 'A+',
    iconRune: 'ᛗ',
  },
  brave: {
    id: 'brave',
    name: 'Brave Search',
    norseTitle: 'Sovereign Shield Index',
    description: 'Independent privacy search index completely independent of big tech crawlers.',
    buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    privacyGrade: 'A+',
    iconRune: 'ᛒ',
  },
  startpage: {
    id: 'startpage',
    name: 'Startpage',
    norseTitle: 'Anonymous Oracle Proxy',
    description: 'Delivers Google results through a high-privacy Dutch proxy conduit with zero logging.',
    buildUrl: (q) => `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`,
    privacyGrade: 'A',
    iconRune: 'ᛋ',
  },
  searxng: {
    id: 'searxng',
    name: 'SearXNG',
    norseTitle: 'Decentralized Swarm Search',
    description: 'Open-source, decentralized metasearch aggregating multiple engines anonymously.',
    buildUrl: (q) => `https://searx.be/search?q=${encodeURIComponent(q)}`,
    privacyGrade: 'A+',
    iconRune: 'ᚹ',
  },
  ecosia: {
    id: 'ecosia',
    name: 'Ecosia',
    norseTitle: 'Yggdrasil Evergreen Canopy',
    description: 'Environmentally regenerative search dedicating 100% of profits to planetary reforestation.',
    buildUrl: (q) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`,
    privacyGrade: 'A-',
    iconRune: 'ᛖ',
  },
  google: {
    id: 'google',
    name: 'Google',
    norseTitle: 'Global Omnisearch Index',
    description: 'Traditional search index with comprehensive coverage but active telemetry tracking.',
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    privacyGrade: 'C',
    iconRune: 'ᚷ',
  },
  bing: {
    id: 'bing',
    name: 'Microsoft Bing',
    norseTitle: 'Azure Realm Index',
    description: 'Microsoft standard search engine with commercial profiling integration.',
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    privacyGrade: 'C',
    iconRune: 'ᛏ',
  },
};

export type ShieldLevel = 'standard' | 'aggressive' | 'permissive';
export type CookiePolicy = 'isolate-third-party' | 'block-all-third-party' | 'allow-all';
export type ReferrerPolicy = 'strict-origin' | 'no-referrer' | 'standard';

export interface PrivacySettings {
  searchEngine: SearchEngineId;
  shieldLevel: ShieldLevel;
  youtubeSentinel: boolean;
  cosmeticBannerHiding: boolean;
  globalPrivacyControl: boolean;
  doNotTrack: boolean;
  canvasNoiseProtection: boolean;
  autoPurgeOnExit: boolean;
  cookiePolicy: CookiePolicy;
  referrerPolicy: ReferrerPolicy;
  searchSuggestions: boolean;
  httpsEverywhere: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  searchEngine: 'duckduckgo',
  shieldLevel: 'standard',
  youtubeSentinel: true,
  cosmeticBannerHiding: true,
  globalPrivacyControl: true,
  doNotTrack: true,
  canvasNoiseProtection: true,
  autoPurgeOnExit: false,
  cookiePolicy: 'isolate-third-party',
  referrerPolicy: 'strict-origin',
  searchSuggestions: true,
  httpsEverywhere: true,
};

const STORAGE_KEY = 'mimir_privacy_settings';
const WHITELIST_KEY = 'mimir_ward_whitelist';

type PrivacyListener = (settings: PrivacySettings) => void;
const listeners = new Set<PrivacyListener>();

export const getPrivacySettings = (): PrivacySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_PRIVACY_SETTINGS;
};

export const savePrivacySettings = (partial: Partial<PrivacySettings>): PrivacySettings => {
  const current = getPrivacySettings();
  const updated: PrivacySettings = { ...current, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Also synchronize search engine preference to legacy key if needed
    localStorage.setItem('mimir_search_engine', updated.searchEngine);
  } catch {}
  listeners.forEach((l) => l(updated));
  return updated;
};

export const onPrivacySettingsChanged = (listener: PrivacyListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const buildSearchUrl = (query: string): string => {
  const settings = getPrivacySettings();
  const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo;
  return engine.buildUrl(query);
};

export const getWhitelistedDomains = (): string[] => {
  try {
    const raw = localStorage.getItem(WHITELIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isDomainWhitelisted = (domain: string): boolean => {
  const list = getWhitelistedDomains();
  return list.includes(domain.toLowerCase());
};

export const whitelistDomain = (domain: string): void => {
  const clean = domain.trim().toLowerCase();
  if (!clean) return;
  const list = getWhitelistedDomains();
  if (!list.includes(clean)) {
    list.push(clean);
    localStorage.setItem(WHITELIST_KEY, JSON.stringify(list));
  }
};

export const unwhitelistDomain = (domain: string): void => {
  const clean = domain.trim().toLowerCase();
  const list = getWhitelistedDomains().filter((d) => d !== clean);
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(list));
};
