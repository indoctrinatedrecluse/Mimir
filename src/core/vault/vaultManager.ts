import { RealmId } from '@/types';

export interface ClippedNote {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string; // Markdown document with frontmatter
  realm: RealmId;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

const STORAGE_KEY = 'mimir_knowledge_vault';

export type VaultChangeListener = (notes: ClippedNote[]) => void;

class VaultManager {
  private notes: ClippedNote[] = [];
  private listeners: Set<VaultChangeListener> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.notes = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load Mímir Knowledge Vault:', e);
    }

    // Default welcoming stave note
    this.notes = [
      {
        id: 'note-mimir-origins',
        title: 'The Well of Mímir (Mímisbrunnr)',
        url: 'mimir://sanctum',
        excerpt:
          'Beneath the root of Yggdrasil that reaches to Jötunheim lies Mímisbrunnr, containing supreme wisdom and cosmic knowledge.',
        content: `---
title: "The Well of Mímir (Mímisbrunnr)"
url: "mimir://sanctum"
date: "${new Date().toISOString()}"
realm: "midgard"
tags: ["#norse", "#wisdom", "#origins"]
excerpt: "Beneath the root of Yggdrasil that reaches to Jötunheim lies Mímisbrunnr."
---

# The Well of Mímir (Mímisbrunnr)

> Source: [mimir://sanctum](mimir://sanctum)

Beneath the root of Yggdrasil that reaches into the realm of the frost giants lies **Mímisbrunnr**, the sacred spring that holds cosmic wisdom and intellect.

### Sacred Traits of the Sovereign Vault
- **Zero Cloud Leaks**: All runic inscriptions remain encrypted and isolated on your local iron.
- **Runic Frontmatter**: Clean YAML metadata compatible with Obsidian, Logseq, and standard Markdown viewers.
- **Elder Tagging**: Organize thoughts across the Nine Realms and custom tag taxonomy.
`,
        realm: 'midgard',
        tags: ['#norse', '#wisdom', '#origins'],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        isPinned: true,
      },
    ];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
    } catch (e) {
      console.warn('Failed to persist Mímir Knowledge Vault:', e);
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((l) => l([...this.notes]));
  }

  public subscribe(listener: VaultChangeListener): () => void {
    this.listeners.add(listener);
    listener([...this.notes]);
    return () => this.listeners.delete(listener);
  }

  public getNotes = (): ClippedNote[] => {
    return [...this.notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  };

  public getNote = (id: string): ClippedNote | undefined => {
    return this.notes.find((n) => n.id === id);
  };

  public saveNote(data: {
    id?: string;
    title: string;
    url: string;
    excerpt: string;
    content: string;
    realm: RealmId;
    tags: string[];
    isPinned?: boolean;
  }): ClippedNote {
    const now = Date.now();
    let note: ClippedNote;

    if (data.id) {
      const idx = this.notes.findIndex((n) => n.id === data.id);
      if (idx !== -1) {
        note = {
          ...this.notes[idx],
          title: data.title.trim() || 'Untitled Inscription',
          url: data.url,
          excerpt: data.excerpt,
          content: data.content,
          realm: data.realm,
          tags: data.tags,
          isPinned: data.isPinned ?? this.notes[idx].isPinned,
          updatedAt: now,
        };
        this.notes[idx] = note;
      } else {
        note = {
          id: data.id,
          title: data.title.trim() || 'Untitled Inscription',
          url: data.url,
          excerpt: data.excerpt,
          content: data.content,
          realm: data.realm,
          tags: data.tags,
          isPinned: data.isPinned || false,
          createdAt: now,
          updatedAt: now,
        };
        this.notes.unshift(note);
      }
    } else {
      note = {
        id: `note-${now}-${Math.random().toString(36).substring(2, 6)}`,
        title: data.title.trim() || 'Untitled Inscription',
        url: data.url,
        excerpt: data.excerpt,
        content: data.content,
        realm: data.realm,
        tags: data.tags,
        isPinned: data.isPinned || false,
        createdAt: now,
        updatedAt: now,
      };
      this.notes.unshift(note);
    }

    this.persist();
    return note;
  }

  public deleteNote(id: string): void {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.persist();
  }

  public togglePin(id: string): void {
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      note.updatedAt = Date.now();
      this.persist();
    }
  }

  public getAllTags(): string[] {
    const set = new Set<string>();
    this.notes.forEach((n) => {
      n.tags.forEach((t) => {
        const clean = t.startsWith('#') ? t : `#${t}`;
        set.add(clean);
      });
    });
    return Array.from(set);
  }

  public exportMarkdownFile(note: ClippedNote): void {
    const safeTitle = (note.title || 'mimir-note')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '_')
      .slice(0, 60);
    const filename = `${safeTitle}.md`;

    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public exportVaultJson(): void {
    const jsonStr = JSON.stringify(this.notes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mimir_knowledge_vault_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const vaultManager = new VaultManager();
