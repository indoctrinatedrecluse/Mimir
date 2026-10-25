/**
 * ᛗ Mímir Autosuggest & Frecency Ranking Engine
 * Provides intelligent, high-speed URL and wisdom query suggestions
 * ranked across Runestones (bookmarks), Threads of Fate (history), and Web Gateways.
 */

export type SuggestionType = 'bookmark' | 'history' | 'gateway' | 'search';

export interface SuggestionItem {
  id: string;
  type: SuggestionType;
  title: string;
  url: string;
  cleanUrl: string;
  rune: string;
  badge: string;
  score: number;
  visitCount?: number;
  timestamp?: string;
  isBookmarked?: boolean;
}

interface StoredRunestone {
  id: string;
  title: string;
  url: string;
  realm?: string;
  rune?: string;
  dateAdded?: string;
}

interface StoredFateThread {
  id: string;
  title: string;
  url: string;
  realm?: string;
  timestamp?: string;
}

export const POPULAR_GATEWAYS = [
  { title: 'GitHub — The Forge of Code', url: 'https://github.com', domain: 'github.com', rune: 'ᚨ' },
  { title: 'YouTube — Video Sanctuary', url: 'https://youtube.com', domain: 'youtube.com', rune: 'ᛃ' },
  { title: 'Google — World Search Engine', url: 'https://google.com', domain: 'google.com', rune: 'ᚷ' },
  { title: 'DuckDuckGo — Untracked Wisdom Search', url: 'https://duckduckgo.com', domain: 'duckduckgo.com', rune: 'ᛗ' },
  { title: 'Wikipedia — Free Knowledge Archive', url: 'https://wikipedia.org', domain: 'wikipedia.org', rune: 'ᚹ' },
  { title: 'Rust Documentation — The Borrow Forge', url: 'https://doc.rust-lang.org', domain: 'doc.rust-lang.org', rune: 'ᚱ' },
  { title: 'Reddit — Communities & Threads', url: 'https://reddit.com', domain: 'reddit.com', rune: 'ᚱ' },
  { title: 'Twitter / X — Global Stream', url: 'https://x.com', domain: 'x.com', rune: 'ᛋ' },
  { title: 'Discord — Realm Voice & Conclaves', url: 'https://discord.com', domain: 'discord.com', rune: 'ᛞ' },
  { title: 'Twitch — Live Realm Broadcasts', url: 'https://twitch.tv', domain: 'twitch.tv', rune: 'ᛏ' },
  { title: 'Stack Overflow — Elder Queries', url: 'https://stackoverflow.com', domain: 'stackoverflow.com', rune: 'ᛋ' },
  { title: 'MDN Web Docs — Client Lore', url: 'https://developer.mozilla.org', domain: 'developer.mozilla.org', rune: 'ᛗ' },
  { title: 'Claude AI — Anthropic Raven', url: 'https://claude.ai', domain: 'claude.ai', rune: 'ᚲ' },
  { title: 'ChatGPT — OpenAI Oracle', url: 'https://chatgpt.com', domain: 'chatgpt.com', rune: 'ᚺ' },
];

import { SEARCH_ENGINES, getPrivacySettings } from '@/core/privacy/privacySettings';

export interface BangDefinition {
  bang: string;
  name: string;
  rune: string;
  hint: string;
  buildUrl: (query: string) => string;
}

export const SEARCH_BANGS: BangDefinition[] = [
  { bang: '!ddg', name: 'DuckDuckGo Untracked', rune: 'ᛗ', hint: '!ddg <query>', buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  { bang: '!b', name: 'Brave Search', rune: 'ᛒ', hint: '!b <query>', buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
  { bang: '!sp', name: 'Startpage Proxy', rune: 'ᛋ', hint: '!sp <query>', buildUrl: (q) => `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}` },
  { bang: '!sx', name: 'SearXNG Swarm', rune: 'ᚹ', hint: '!sx <query>', buildUrl: (q) => `https://searx.be/search?q=${encodeURIComponent(q)}` },
  { bang: '!e', name: 'Ecosia Reforest', rune: 'ᛖ', hint: '!e <query>', buildUrl: (q) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}` },
  { bang: '!g', name: 'Google Search', rune: 'ᚷ', hint: '!g <query>', buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { bang: '!gh', name: 'GitHub Forge', rune: 'ᚨ', hint: '!gh <repo or user>', buildUrl: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` },
  { bang: '!yt', name: 'YouTube Streams', rune: 'ᛃ', hint: '!yt <video>', buildUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { bang: '!w', name: 'Wikipedia Lore', rune: 'ᚹ', hint: '!w <lore topic>', buildUrl: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}` },
  { bang: '!rust', name: 'Rust Lore (Std Docs)', rune: 'ᚱ', hint: '!rust <type or crate>', buildUrl: (q) => `https://doc.rust-lang.org/std/?search=${encodeURIComponent(q)}` },
  { bang: '!crate', name: 'Crates.io Registry', rune: 'ᚲ', hint: '!crate <crate name>', buildUrl: (q) => `https://crates.io/search?q=${encodeURIComponent(q)}` },
];

export function parseBangQuery(raw: string): { bang: BangDefinition; query: string; url: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(![a-zA-Z]+)(?:\s+(.*))?$/);
  if (!match) return null;
  const bangCode = match[1].toLowerCase();
  const query = (match[2] || '').trim();
  const def = SEARCH_BANGS.find((b) => b.bang.toLowerCase() === bangCode);
  if (!def) return null;
  return {
    bang: def,
    query,
    url: query ? def.buildUrl(query) : def.buildUrl(''),
  };
}

export function purifyUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'mc_cid', 'mc_eid',
      'igshid', 'si', '_ga', '_gl', 'yclid', 'zanpid'
    ];
    let changed = false;
    trackingParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });
    return changed ? url.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

export function cleanDisplayUrl(rawUrl: string): string {
  try {
    return rawUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Computes ranked autosuggest list for omnibar input.
 */
export function getRankedSuggestions(query: string, maxResults = 7): SuggestionItem[] {
  const q = query.trim().toLowerCase();
  const qClean = cleanDisplayUrl(q);

  // 0. Search Bangs Handling
  if (q.startsWith('!')) {
    const parsed = parseBangQuery(query);
    const bangList: SuggestionItem[] = [];

    if (parsed && parsed.query) {
      bangList.push({
        id: `bang-exec-${parsed.bang.bang}`,
        type: 'search',
        title: `${parsed.bang.name} for "${parsed.query}"`,
        url: parsed.url,
        cleanUrl: parsed.url,
        rune: parsed.bang.rune,
        badge: `⚡ ${parsed.bang.bang.toUpperCase()} BANG`,
        score: 1000,
      });
    }

    // List available bangs matching prefix
    const matchingBangs = SEARCH_BANGS.filter((b) => b.bang.startsWith(q.split(' ')[0]));
    matchingBangs.forEach((b) => {
      if (parsed && parsed.bang.bang === b.bang && parsed.query) return;
      bangList.push({
        id: `bang-hint-${b.bang}`,
        type: 'gateway',
        title: `${b.name} (${b.hint})`,
        url: b.buildUrl(''),
        cleanUrl: b.bang,
        rune: b.rune,
        badge: '⚡ RUNIC BANG',
        score: 800,
      });
    });

    if (bangList.length > 0) {
      return bangList.slice(0, maxResults);
    }
  }

  // 1. Fetch Runestones from localStorage
  let runestones: StoredRunestone[] = [];
  try {
    const raw = localStorage.getItem('mimir_runestones');
    if (raw) runestones = JSON.parse(raw);
  } catch {
    runestones = [];
  }

  // 2. Fetch Threads of Fate (History) from localStorage
  let history: StoredFateThread[] = [];
  try {
    const raw = localStorage.getItem('mimir_fate_threads');
    if (raw) history = JSON.parse(raw);
  } catch {
    history = [];
  }

  // Aggregate history for frequency (visit count) & latest recency
  const historyMap = new Map<string, { count: number; title: string; latestTime: string; recencyIndex: number }>();
  history.forEach((thread, idx) => {
    const norm = cleanDisplayUrl(thread.url).toLowerCase();
    if (!historyMap.has(norm)) {
      historyMap.set(norm, {
        count: 1,
        title: thread.title,
        latestTime: thread.timestamp || 'Recent',
        recencyIndex: idx,
      });
    } else {
      const entry = historyMap.get(norm)!;
      entry.count += 1;
    }
  });

  // Map of bookmarks for rapid lookup
  const bookmarkMap = new Map<string, StoredRunestone>();
  runestones.forEach((r) => {
    bookmarkMap.set(cleanDisplayUrl(r.url).toLowerCase(), r);
  });

  const candidates = new Map<string, SuggestionItem>();

  // Helper to add or update candidate
  const registerCandidate = (item: SuggestionItem) => {
    const key = item.cleanUrl.toLowerCase();
    if (!candidates.has(key)) {
      candidates.set(key, item);
    } else {
      const existing = candidates.get(key)!;
      // Merge: retain highest score and combined badges
      existing.score = Math.max(existing.score, item.score) + 30; // bonus for appearing in multiple sources
      if (item.type === 'bookmark' || existing.type === 'bookmark') {
        existing.type = 'bookmark';
        existing.badge = 'ᛚ RUNESTONE • VISITED';
        existing.isBookmarked = true;
      }
    }
  };

  // If query is empty, return top recent history + bookmarks
  if (!q) {
    // Top bookmarks
    runestones.slice(0, 3).forEach((b) => {
      const clean = cleanDisplayUrl(b.url);
      registerCandidate({
        id: `bm-${b.id}`,
        type: 'bookmark',
        title: b.title,
        url: b.url,
        cleanUrl: clean,
        rune: b.rune || 'ᛚ',
        badge: 'ᛚ RUNESTONE',
        score: 100,
        isBookmarked: true,
      });
    });

    // Top recent history
    history.slice(0, 4).forEach((h, idx) => {
      const clean = cleanDisplayUrl(h.url);
      registerCandidate({
        id: `hist-${h.id}`,
        type: 'history',
        title: h.title,
        url: h.url,
        cleanUrl: clean,
        rune: 'ᚺ',
        badge: 'ᚺ HISTORY',
        score: 90 - idx * 5,
        timestamp: h.timestamp,
        visitCount: historyMap.get(clean.toLowerCase())?.count || 1,
      });
    });

    return Array.from(candidates.values()).slice(0, maxResults);
  }

  // --- QUERY ACTIVE MATCHING ---

  // A. Search Runestones (Bookmarks)
  runestones.forEach((b) => {
    const clean = cleanDisplayUrl(b.url);
    const cleanLower = clean.toLowerCase();
    const titleLower = b.title.toLowerCase();

    let matchScore = 0;
    if (cleanLower === qClean) {
      matchScore = 150; // exact domain match
    } else if (cleanLower.startsWith(qClean)) {
      matchScore = 110; // domain starts with query
    } else if (cleanLower.includes(qClean)) {
      matchScore = 75; // URL contains query
    } else if (titleLower.includes(q)) {
      matchScore = 55; // Title contains query
    }

    if (matchScore > 0) {
      registerCandidate({
        id: `bm-${b.id}`,
        type: 'bookmark',
        title: b.title,
        url: b.url,
        cleanUrl: clean,
        rune: b.rune || 'ᛚ',
        badge: 'ᛚ RUNESTONE',
        score: matchScore + 40, // Bookmark intent bonus
        isBookmarked: true,
      });
    }
  });

  // B. Search Threads of Fate (History)
  historyMap.forEach((entry, normUrl) => {
    let matchScore = 0;
    const titleLower = entry.title.toLowerCase();

    if (normUrl === qClean) {
      matchScore = 140;
    } else if (normUrl.startsWith(qClean)) {
      matchScore = 100;
    } else if (normUrl.includes(qClean)) {
      matchScore = 70;
    } else if (titleLower.includes(q)) {
      matchScore = 50;
    }

    if (matchScore > 0) {
      // Frequency and recency bonuses
      const freqBonus = Math.min(entry.count * 8, 40);
      const recencyBonus = Math.max(25 - entry.recencyIndex, 0);

      const isRune = bookmarkMap.has(normUrl);
      registerCandidate({
        id: `hist-${normUrl}`,
        type: isRune ? 'bookmark' : 'history',
        title: entry.title,
        url: normUrl.startsWith('http') ? normUrl : `https://${normUrl}`,
        cleanUrl: normUrl,
        rune: isRune ? (bookmarkMap.get(normUrl)?.rune || 'ᛚ') : 'ᚺ',
        badge: isRune ? 'ᛚ RUNESTONE • VISITED' : 'ᚺ HISTORY',
        score: matchScore + 25 + freqBonus + recencyBonus,
        visitCount: entry.count,
        timestamp: entry.latestTime,
        isBookmarked: isRune,
      });
    }
  });

  // C. Search Popular Web Gateways
  POPULAR_GATEWAYS.forEach((gw) => {
    const domainLower = gw.domain.toLowerCase();
    const titleLower = gw.title.toLowerCase();

    let matchScore = 0;
    if (domainLower === qClean) {
      matchScore = 130;
    } else if (domainLower.startsWith(qClean)) {
      matchScore = 95;
    } else if (domainLower.includes(qClean) || titleLower.includes(q)) {
      matchScore = 60;
    }

    if (matchScore > 0) {
      const isRune = bookmarkMap.has(domainLower);
      registerCandidate({
        id: `gw-${gw.domain}`,
        type: isRune ? 'bookmark' : 'gateway',
        title: gw.title,
        url: gw.url,
        cleanUrl: gw.domain,
        rune: isRune ? (bookmarkMap.get(domainLower)?.rune || 'ᛚ') : gw.rune,
        badge: isRune ? 'ᛚ RUNESTONE' : 'ᛟ GATEWAY',
        score: matchScore + (isRune ? 35 : 20),
        isBookmarked: isRune,
      });
    }
  });

  // D. Always include Search Wisdom Query option
  const isDirectWebUrl = (q.includes('.') && !q.includes(' ')) || q.startsWith('http://') || q.startsWith('https://');
  const searchScore = isDirectWebUrl ? 40 : 105; // prioritize search if user typed search query words

  const settings = getPrivacySettings();
  const activeEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo;
  const searchUrl = activeEngine.buildUrl(query);
  const searchCleanUrl = `${activeEngine.name.toLowerCase().replace(/\s+/g, '')}.com/?q=${encodeURIComponent(query)}`;

  const searchItem: SuggestionItem = {
    id: 'search-query',
    type: 'search',
    title: `Search via ${activeEngine.name} for "${query}"`,
    url: searchUrl,
    cleanUrl: searchCleanUrl,
    rune: activeEngine.iconRune || 'ᛋ',
    badge: `ᛋ ${activeEngine.name.toUpperCase()}`,
    score: searchScore,
  };

  const results = Array.from(candidates.values());
  results.push(searchItem);

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}
