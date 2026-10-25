import { RealmId } from '@/types';

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  realm: RealmId;
  rune: string;
  folder?: string;
  favicon?: string;
  dateAdded: string;
}

const STORAGE_KEY = 'mimir_runestones';
const VISIBILITY_KEY = 'mimir_bookmarks_bar_visible';

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'rune-1',
    title: 'GitHub Forge',
    url: 'https://github.com',
    realm: 'asgard',
    rune: 'ᚨ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-2',
    title: 'Rust Lore',
    url: 'https://doc.rust-lang.org',
    realm: 'asgard',
    rune: 'ᚱ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-3',
    title: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    realm: 'midgard',
    rune: 'ᛗ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-4',
    title: 'Poetic Edda',
    url: 'https://en.wikipedia.org/wiki/Poetic_Edda',
    realm: 'alfheim',
    rune: 'ᛞ',
    dateAdded: 'Dawn of Creation',
  },
  {
    id: 'rune-5',
    title: 'MDN Web Scrolls',
    url: 'https://developer.mozilla.org',
    realm: 'asgard',
    rune: 'ᚲ',
    dateAdded: 'Dawn of Creation',
  },
];

type BookmarkListener = (items: BookmarkItem[], isVisible: boolean) => void;

class BookmarkManager {
  private items: BookmarkItem[] = [];
  private isVisible: boolean = true;
  private listeners: Set<BookmarkListener> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.items = saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      this.items = DEFAULT_BOOKMARKS;
    }

    try {
      const savedVis = localStorage.getItem(VISIBILITY_KEY);
      this.isVisible = savedVis !== null ? savedVis === 'true' : true;
    } catch {
      this.isVisible = true;
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      localStorage.setItem(VISIBILITY_KEY, String(this.isVisible));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn([...this.items], this.isVisible));
  }

  public subscribe(listener: BookmarkListener): () => void {
    this.listeners.add(listener);
    listener([...this.items], this.isVisible);
    return () => this.listeners.delete(listener);
  }

  public getBookmarks(): BookmarkItem[] {
    return [...this.items];
  }

  public isBarVisible(): boolean {
    return this.isVisible;
  }

  public toggleBarVisible(): boolean {
    this.isVisible = !this.isVisible;
    this.save();
    return this.isVisible;
  }

  public setBarVisible(visible: boolean) {
    this.isVisible = visible;
    this.save();
  }

  public isBookmarked(url: string): boolean {
    if (!url) return false;
    const clean = url.trim().toLowerCase().replace(/\/$/, '');
    return this.items.some((b) => b.url.toLowerCase().replace(/\/$/, '') === clean);
  }

  public toggleBookmark(url: string, title?: string, realm: RealmId = 'midgard') {
    if (!url || url === 'mimir://newtab' || url === 'about:blank') return;
    if (this.isBookmarked(url)) {
      this.removeBookmark(url);
    } else {
      let rune = 'ᛗ';
      const runes = ['ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛞ'];
      rune = runes[Math.floor(Math.random() * runes.length)];

      let displayTitle = title || url;
      try {
        const u = new URL(url);
        displayTitle = title || u.hostname.replace('www.', '');
      } catch {}

      this.addBookmark({
        title: displayTitle,
        url,
        realm,
        rune,
      });
    }
  }

  public addBookmark(data: Omit<BookmarkItem, 'id' | 'dateAdded'>) {
    const newItem: BookmarkItem = {
      ...data,
      id: `rune-${Date.now()}`,
      dateAdded: new Date().toLocaleDateString(),
    };
    this.items = [newItem, ...this.items.filter((i) => i.url !== data.url)];
    this.save();
  }

  public removeBookmark(urlOrId: string) {
    this.items = this.items.filter((i) => i.id !== urlOrId && i.url !== urlOrId);
    this.save();
  }

  public updateBookmark(id: string, updates: Partial<BookmarkItem>) {
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    this.save();
  }
}

export const bookmarkManager = new BookmarkManager();
