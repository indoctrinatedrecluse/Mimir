import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Copy,
  Download,
  Trash2,
  Pin,
  Tag,
  Search,
  Check,
  X,
  Compass,
  ExternalLink,
  Edit3,
  Eye,
  Plus,
  Sparkles,
  Archive,
  Layers,
} from 'lucide-react';
import { RealmId, Tab } from '@/types';
import { REALMS } from '@/core/realms';
import { runicAudio } from '@/core/audio/runicAudio';
import { mimirIpc, PageClippedPayload } from '@/core/ipc/bridge';
import { htmlToMarkdown, buildFrontmatterMarkdown } from '@/core/vault/clipperEngine';
import { vaultManager, ClippedNote } from '@/core/vault/vaultManager';

interface MimirsEyeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmId;
  activeTab?: Tab;
}

type ModalView = 'clipper' | 'vault';
type EditorTab = 'source' | 'preview';

const SUGGESTED_TAGS = ['#research', '#dev', '#norse', '#wisdom', '#design', '#ai', '#guide'];

export const MimirsEyeModal: React.FC<MimirsEyeModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  activeTab,
}) => {
  const [view, setView] = useState<ModalView>('clipper');
  const [editorTab, setEditorTab] = useState<EditorTab>('preview');
  const [notes, setNotes] = useState<ClippedNote[]>(vaultManager.getNotes);

  // Active Clipper Form State
  const [noteId, setNoteId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [noteRealm, setNoteRealm] = useState<RealmId>(activeRealm);
  const [tags, setTags] = useState<string[]>(['#research']);
  const [newTagInput, setNewTagInput] = useState('');
  const [markdownBody, setMarkdownBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Vault Archive Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRealmFilter, setSelectedRealmFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Subscribe to vault changes
  useEffect(() => {
    return vaultManager.subscribe((updated) => setNotes(updated));
  }, []);

  // Listen for native page clipping events
  useEffect(() => {
    if (!isOpen) return;

    const unsubClipped = mimirIpc.onPageClipped((payload: PageClippedPayload) => {
      setTitle(payload.title || activeTab?.title || 'Clipped Sanctum');
      setUrl(payload.url || activeTab?.url || '');
      setAuthor(payload.author || '');

      let bodyContent = '';
      if (payload.selected_text && payload.selected_text.trim()) {
        bodyContent = `> ${payload.selected_text.trim().replace(/\n/g, '\n> ')}\n\n`;
      } else if (payload.html_content) {
        bodyContent = htmlToMarkdown(payload.html_content);
      } else if (payload.text_content) {
        bodyContent = payload.text_content;
      }

      setMarkdownBody(bodyContent);
      setNoteId(undefined);
      setView('clipper');
      setEditorTab('preview');
      runicAudio.playChime();
    });

    return () => {
      unsubClipped();
    };
  }, [isOpen, activeTab]);

  // Request native clip when opened
  useEffect(() => {
    if (isOpen) {
      setNoteRealm(activeRealm);
      mimirIpc.clipPage();
      // Pre-fill immediate fallback from activeTab
      if (activeTab) {
        setTitle(activeTab.title || 'Clipped Sanctum');
        setUrl(activeTab.url || '');
        if (!markdownBody) {
          setMarkdownBody(`Extracted from ${activeTab.url}\n\n`);
        }
      }
    }
  }, [isOpen, activeTab, activeRealm]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tag Management
  const handleAddTag = (tagToAdd: string) => {
    let clean = tagToAdd.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Compile full document with Frontmatter
  const compiledMarkdown = useMemo(() => {
    return buildFrontmatterMarkdown({
      title: title || 'Untitled Inscription',
      url: url || 'mimir://sanctum',
      realm: noteRealm,
      tags,
      author,
      body: markdownBody,
    });
  }, [title, url, noteRealm, tags, author, markdownBody]);

  // Word count & reading time
  const stats = useMemo(() => {
    const words = markdownBody.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));
    return { words, readingTimeMin };
  }, [markdownBody]);

  // Save Note to Vault
  const handleSave = () => {
    const excerpt = markdownBody.replace(/[#*`>_\[\]]/g, '').slice(0, 180).trim();
    vaultManager.saveNote({
      id: noteId,
      title: title || 'Untitled Inscription',
      url,
      excerpt,
      content: compiledMarkdown,
      realm: noteRealm,
      tags,
    });

    runicAudio.playClick(900);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export current note as .md file
  const handleExportFile = () => {
    runicAudio.playClick(750);
    vaultManager.exportMarkdownFile({
      id: noteId || 'temp',
      title,
      url,
      excerpt: '',
      content: compiledMarkdown,
      realm: noteRealm,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  // Copy Markdown to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(compiledMarkdown);
    runicAudio.playClick(800);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Open note from Vault into Editor
  const handleEditNote = (note: ClippedNote) => {
    setNoteId(note.id);
    setTitle(note.title);
    setUrl(note.url);
    setNoteRealm(note.realm);
    setTags(note.tags);

    // Strip frontmatter from body for editing
    const cleanBody = note.content.replace(/^---[\s\S]*?---\n*/, '').replace(/^#\s+[^\n]*\n*/, '').trim();
    setMarkdownBody(cleanBody);
    setView('clipper');
    setEditorTab('preview');
    runicAudio.playClick(600);
  };

  // Filter vault archives
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return notes.filter((n) => {
      const matchQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)) ||
        n.url.toLowerCase().includes(q);

      const matchRealm = selectedRealmFilter === 'all' || n.realm === selectedRealmFilter;
      const matchTag = selectedTagFilter === 'all' || n.tags.includes(selectedTagFilter);

      return matchQuery && matchRealm && matchTag;
    });
  }, [notes, searchQuery, selectedRealmFilter, selectedTagFilter]);

  const allVaultTags = useMemo(() => vaultManager.getAllTags(), [notes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl bg-[#070b12]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 overflow-hidden font-sans"
        role="dialog"
        aria-label="Mímir's Eye Web Clipper & Markdown Knowledge Vault"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-black/40 to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-700/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="font-serif font-black text-xl leading-none">ᛗ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-cyan-200 uppercase flex items-center gap-2">
                  Mímir’s Eye
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono lowercase">
                    runic-web-clipper
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Inscribe web wisdom into sovereign Markdown archives with YAML frontmatter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1 text-xs">
              <button
                onClick={() => setView('clipper')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  view === 'clipper'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Clipper & Forge</span>
              </button>
              <button
                onClick={() => setView('vault')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  view === 'vault'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Knowledge Vault ({notes.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {view === 'clipper' ? (
          /* Clipper & Inscription Forge */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Metadata Bar */}
            <div className="p-4 px-6 border-b border-white/10 bg-black/20 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inscription Title..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-base font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />

                <select
                  value={noteRealm}
                  onChange={(e) => setNoteRealm(e.target.value as RealmId)}
                  className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50 capitalize"
                >
                  {(Object.keys(REALMS) as RealmId[]).map((rId) => (
                    <option key={rId} value={rId} className="bg-slate-900 text-white">
                      {REALMS[rId].rune} {REALMS[rId].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source URL & Tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400 min-w-0 flex-1">
                  <span className="font-mono text-cyan-400">URI:</span>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px] truncate focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Tags cluster */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      <span>{t}</span>
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="+ tag"
                      className="w-16 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:w-24 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Suggested Tag Pills */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Suggested:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SUGGESTED_TAGS.map((st) => (
                    <button
                      key={st}
                      onClick={() => handleAddTag(st)}
                      className="px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor Sub-Header (Source vs Preview Switcher) */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-black/40 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                    editorTab === 'preview'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sanctum Preview</span>
                </button>
                <button
                  onClick={() => setEditorTab('source')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                    editorTab === 'source'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown Source</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span>{stats.words} words</span>
                <span>•</span>
                <span>~{stats.readingTimeMin} min read</span>
              </div>
            </div>

            {/* Editor Main Canvas */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {editorTab === 'source' ? (
                <textarea
                  value={markdownBody}
                  onChange={(e) => setMarkdownBody(e.target.value)}
                  placeholder="Markdown content extracted from active webpage..."
                  className="w-full h-full min-h-[300px] p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
                />
              ) : (
                /* Rich Markdown Preview */
                <div className="max-w-3xl mx-auto space-y-4 text-slate-200 text-sm leading-relaxed">
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs font-mono text-cyan-400">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                      YAML Frontmatter
                    </div>
                    <div>title: "{title}"</div>
                    <div>url: "{url}"</div>
                    <div>realm: "{noteRealm}"</div>
                    <div>tags: [{tags.join(', ')}]</div>
                  </div>

                  <h1 className="text-2xl font-bold text-white border-b border-white/10 pb-2">
                    {title || 'Untitled Inscription'}
                  </h1>

                  <blockquote className="border-l-4 border-cyan-500/50 pl-4 py-1 text-slate-400 italic bg-white/[0.01] rounded-r">
                    Source: <a href={url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{url}</a>
                  </blockquote>

                  <div className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-sm">
                    {markdownBody || (
                      <span className="text-slate-500 italic">No content extracted yet. Clip a webpage or type notes here.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clipper Footer Action Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/50 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                  title="Copy formatted Markdown with Frontmatter"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>

                <button
                  onClick={handleExportFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                  title="Download .md file to local disk"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export .md</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-emerald-400 text-xs font-semibold animate-in fade-in flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Inscribed to Vault!
                  </span>
                )}

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Inscribe to Vault</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Knowledge Vault Archives View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filters */}
            <div className="p-4 px-6 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault inscriptions, tags, or content..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Realm Filter */}
                <select
                  value={selectedRealmFilter}
                  onChange={(e) => setSelectedRealmFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-amber-300 font-mono capitalize focus:outline-none"
                >
                  <option value="all">All Realms</option>
                  {(Object.keys(REALMS) as RealmId[]).map((rId) => (
                    <option key={rId} value={rId}>
                      {REALMS[rId].rune} {REALMS[rId].name}
                    </option>
                  ))}
                </select>

                {/* Tag Filter */}
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none"
                >
                  <option value="all">All Tags</option>
                  {allVaultTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => vaultManager.exportVaultJson()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                  title="Export entire vault as JSON backup"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Note Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <Archive className="w-8 h-8 opacity-40 text-cyan-400" />
                  <span>No inscriptions found matching your query.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => {
                    const realmInfo = REALMS[note.realm] || REALMS.midgard;
                    const dateFormatted = new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={note.id}
                        className={`group flex flex-col justify-between p-4 rounded-xl border transition-all ${
                          note.isPinned
                            ? 'bg-amber-500/[0.05] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                            : 'bg-white/[0.02] border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div>
                          {/* Card Header: Realm & Pin */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                              <span className="text-amber-400 font-serif font-bold">{realmInfo.rune}</span>
                              <span className="capitalize">{note.realm}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => vaultManager.togglePin(note.id)}
                                className={`p-1 rounded hover:bg-white/10 transition-colors ${
                                  note.isPinned ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                }`}
                                title={note.isPinned ? 'Unpin inscription' : 'Pin inscription'}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Sever and delete inscription "${note.title}"?`)) {
                                    vaultManager.deleteNote(note.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                title="Delete inscription"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Title & URL */}
                          <h3
                            onClick={() => handleEditNote(note)}
                            className="font-semibold text-slate-100 hover:text-cyan-300 cursor-pointer text-sm mb-1 line-clamp-2"
                          >
                            {note.title}
                          </h3>

                          <div className="text-[11px] text-slate-500 font-mono truncate mb-2">
                            {note.url}
                          </div>

                          {/* Excerpt */}
                          <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                            {note.excerpt || 'No excerpt available.'}
                          </p>
                        </div>

                        <div>
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-1 mb-3">
                            {note.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {/* Footer Info & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                            <span>{dateFormatted}</span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/10"
                                title="Open & Edit Inscription"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(note.content);
                                  runicAudio.playClick(800);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                                title="Copy Markdown"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => vaultManager.exportMarkdownFile(note)}
                                className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10"
                                title="Export .md file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
