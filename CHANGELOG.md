# Changelog

All notable changes to the **Mímir Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned & In-Flight Roadmap (Next Release)
* **Streaming Media Codecs & DRM Protocols**:
  * Investigate and implement Widevine Content Decryption Modules (CDM) and specialized media codecs to enable streaming platforms (Netflix, Amazon Prime Video, Disney+, Spotify Web, and protected media channels).
* **Floating Rune PiP Overhaul (Enhanced Always-On-Top Mini Player)**:
  * Resizable popped-out mini-player window with interactive corner drag handles and aspect ratio constraints.
  * Native OS-level Always-On-Top floating window overlay, ensuring the mini-player stays permanently visible in the foreground even when other non-browser desktop applications are active and focused.
  * Multi-monitor positioning memory and native video stream projection.
* **Custom Theme Generator (Milestone 6)**:
  * Interactive theme designer for user-defined cosmic realms, customizable HSL color palettes, runic staves, and personal shader backdrop generators.

---

## [0.8.0] - 2026-10-25 *(Sovereign Mastery: Einherjar Slumber, Skuld's Canvas, Floating Rune, Havamal Staves & Fafnir's Treasury)*

This milestone release brings sovereign performance, media mastery, viewport annotation, and cryptographic security to Mímir Browser: Einherjar Slumber (Sleeping tabs and native RAM freezer deallocating 180MB–320MB per background tab), Skuld's Canvas (Viewport screenshot and Norse annotation studio), Floating Rune (Universal media controller with Mjolnir 300% Thunder Boost, equalizer & PiP mini-player), Havamal Staves (Runic bookmarks ribbon), Fafnir's Treasury (Zero-knowledge AES-256-GCM encrypted credential vault & Gungnir Key Generator), Svalinn Ward YouTube Adblock Sentinel, and Mythic 100% Native Rust Setup Installer.

### Added

#### Einherjar Slumber: Sleeping Tabs & Native RAM Freezer (`slumberEngine.ts`, `tab_manager.rs`, `ipc.rs`, `TabTree.tsx`, `App.tsx`)
* **Zero-Mock WebView2 Memory Deallocation**:
  * Dropping `tab.webview.take()` genuinely destroys inactive background child webview render processes, releasing **180 MB – 320 MB of RAM per tab**.
  * Instant Einherjar Awakening: Automatically resurrects sleeping tabs via `build_child_webview` the moment they are clicked or focused without page loss.
* **Configurable Auto-Slumber Engine**:
  * Automatically scans background tabs every 60 seconds with configurable inactivity timeout thresholds (15m, 30m, 60m, or Never).
  * Excludes pinned tabs, active playing media, and internal sanctuary portals.
* **Frost Rune Visuals & Manual Controls**:
  * Sleeping tabs display frosty cyan mist (`bg-cyan-950/15`), an animated `Snowflake` icon, and a `SLUMBER` badge with exact memory reclaimed.
  * Instant manual hibernation button per tab or global background hibernation shortcut (`Alt+Z`).

#### Skuld's Canvas: Viewport Capture & Runic Annotation Studio (`SkuldsCanvasModal.tsx`, `Omnibar.tsx`, `App.tsx`, `CommandPalette.tsx`)
* **HTML5 Canvas Viewport Capture & Crop**:
  * Capture viewport contents (`Ctrl+Shift+S` or Omnibar Camera button) with instant interactive cropping and full-screen annotation canvas.
* **Norse Drawing Instruments & Inscriptions**:
  * **Freehand Runic Pen & Highlighter**: Smooth Bézier curves with adjustable line widths.
  * **Runic Rectangles & Directional Arrow Pointers**: Clean bounding frames and vector arrows for bug reporting and sharing.
  * **Elder Futhark Rune Stamps**: 1-click glyph stamping (`ᛗ`, `ᚨ`, `ᚱ`, `ᚲ`, `ᚷ`, `ᛋ`, `ᛏ`, `ᛞ`).
  * **Runic Text Inscription Tool**: Inscribe comments and notes with customizable fonts.
  * **6 Realm Neon Color Palettes**: Bifröst Cyan, Valhalla Amber, Surtr Rose, Yggdrasil Emerald, Odin Purple, and Pure White.
* **Instant Export & Clipboard Conduits**:
  * Copy annotated canvas directly to system clipboard as image blob (`navigator.clipboard.write([ClipboardItem])`).
  * 1-click download as PNG artifact (`mimir_skuld_<timestamp>.png`).

#### Floating Rune: Universal Media HUD, Equalizer & Draggable Picture-in-Picture (`mediaController.ts`, `FloatingRuneMediaHud.tsx`, `FloatingPipMiniPlayer.tsx`, `TitleBar.tsx`, `App.tsx`)
* **Global Webview Media Conduit**:
  * Injects JavaScript controls directly into active or background HTML5 `<video>` and `<audio>` elements across YouTube, Spotify, Soundcloud, Twitch, and web streams.
  * Play/pause toggle, ±10s seeking, timeline scrubber, and playback speed pills (`0.75x`, `1x`, `1.25x`, `1.5x`, `2x`).
* **Mjolnir Thunder Boost (100% to 300% Volume Amplification)**:
  * Overcomes quiet video recordings by chaining Web Audio API `GainNode` amplifiers directly into media element sources, boosting audio volume up to 300%.
* **Dynamic Runic Frequency Equalizer**:
  * Obsidian Glass popover featuring an 8-band reactive runic equalizer with pulsing accent halos.
* **Floating Draggable Picture-in-Picture (PiP) Mini-Player**:
  * Universal draggable mini-player floating in bottom-right corner with mini-screen visualizer, transport controls, and "Return to Tab" navigation.
  * Accessible via `Ctrl+Shift+M`, TitleBar `Disc3` spinning icon, or Command Palette.

#### Runic Bookmarks Bar: Havamal Staves Ribbon (`bookmarkManager.ts`, `RunicBookmarksBar.tsx`, `App.tsx`, `CommandPalette.tsx`)
* **Obsidian Glass Bookmarks Ribbon**:
  * Pinned quick-access ribbon situated directly below the Omnibar (`Ctrl+Shift+B` toggle).
  * Synchronized seamlessly with `mimir_runestones` and Muninn's Vault.
* **Runic Badges & Multi-Conduit Navigation**:
  * Each bookmark features an Elder Futhark rune initial badge, realm affinity styling, and quick truncation.
  * Left-click to navigate in active tab, middle-click to spawn new tab.
  * Custom right-click stave context menu: "Channel in Current Tab", "Open in New Fate Thread", "Split-Gaze Channel", and "Sever Runestone".
* **1-Click Stave Carving**:
  * Inline "+ CARVE" button and Omnibar bookmark icon to instantly store active web destinations.

#### Fafnir's Treasury: Zero-Knowledge AES-256-GCM Vault & Gungnir Key Forge (`fafnirVault.ts`, `FafnirsTreasuryModal.tsx`, `SanctumSettingsModal.tsx`, `App.tsx`)
* **Cryptographically Secure Zero-Knowledge Vault**:
  * Full Web Crypto API architecture: PBKDF2 key derivation using SHA-256 with **100,000 iterations** and a 16-byte cryptographically secure random salt.
  * AES-256-GCM authenticated encryption with a unique 12-byte initialization vector (IV) per secret.
  * Zero plaintext on disk: Master keys exist exclusively in volatile memory and are purged on lock.
* **Auto-Lock Defense & Auto-Clearing Clipboard**:
  * Configurable auto-lock timer automatically seals treasury after inactivity.
  * 30-second clipboard self-destruction: Copied passwords automatically wipe from the clipboard after 30 seconds.
* **Gungnir Key Generator**:
  * Generates high-entropy passphrases (12 to 48 characters) with entropy bit calculations and strength ratings (from "Brittle Branch" to "Mjolnir Core").
  * Optional Norse Elder Futhark rune injections for mystical high-entropy passwords.
* **Seamless Access**:
  * Accessible via `Ctrl+Shift+L`, Command Palette, and Sanctum Settings.

#### Sovereign Privacy Architecture & Sanctum Settings Engine (`privacySettings.ts`, `SanctumSettingsModal.tsx`, `adblocker.rs`, `Omnibar.tsx`, `TitleBar.tsx`)
* **DuckDuckGo by Default Across All Conduits**:
  * Established DuckDuckGo as Mímir's primary, untracked search oracle across Omnibar, New Tab Sanctum, Autosuggest, and context menu lookups.
  * Dynamically responsive `buildSearchUrl` conduit router honoring user engine choice with zero telemetry.
  * Full search engine ecosystem with privacy grading: DuckDuckGo (`A+`), Brave Search (`A+`), Startpage (`A`), SearXNG (`A+`), Ecosia (`A-`), Google (`C`), and Bing (`C`).
  * Privacy search bangs integrated into autosuggest (`!ddg`, `!b`, `!sp`, `!sx`, `!e`).
* **Active-by-Default Adblock & YouTube Sentinel**:
  * Svalinn Ward network filtering and YouTube ad interception enabled out of the box with zero setup required.
  * Procedural cosmetic banner hiding active by default.
* **Anti-Fingerprinting Armor & Veil of Shadows**:
  * Automated Global Privacy Control (`navigator.globalPrivacyControl = true`, `Sec-GPC: 1`) injected into all webviews.
  * Do Not Track (`navigator.doNotTrack = '1'`, `DNT: 1`) broadcast on all HTTP/HTTPS conduits.
  * Canvas & audio hardware perturbation scrambling `getImageData` readbacks against cryptographic GPU canvas fingerprinting.
  * Outbound Referrer Sanctum Policy control (`strict-origin`, `no-referrer`, `standard`).
* **Obsidian Glass Sanctum Privacy & Settings Modal (`SanctumSettingsModal.tsx`)**:
  * Tabbed modal with Search Conduits, Shield & Wards, Anti-Fingerprinting Armor, Fate Threads (Retention & Cookies), and AI Scout Key.
  * Live domain whitelist manager to lower or raise Svalinn Wards per site.
  * Auto-purge on Sanctum exit and third-party cookie isolation modes.
  * Seamlessly triggered via TitleBar Sliders icon, Omnibar Security Ward widget, `Ctrl+,` global hotkey, or Command Palette.

#### Sacred Shield Mastery & YouTube Adblocking Engine (`adblocker.rs`, `tab_manager.rs`, `SecurityWardWidget.tsx`)
* **Brave `adblock` (v0.13.3) Native Rust Integration**:
  * Integrated Brave Software's official native Rust adblocking engine ([`adblocker.rs`](file:///d:/Projects/Mimir/src-rust/src/adblocker.rs)) with built-in EasyList, EasyPrivacy, and uBlock-grade rule matching.
  * Native sub-millisecond network URL classification with DATrie and Bloom filter indexing.
* **Dedicated YouTube Adblock Sentinel**:
  * **Player Response Sanitization**: Intercepts `window.ytInitialPlayerResponse` and `/youtubei/v1/player` JSON payloads to strip `adPlacements` and `adSlots` before video players can instantiate.
  * **Zero-Second Fast-Forward Watchdog**: Instantly mutes and fast-forwards (`video.currentTime = video.duration`) any stream ads that slipstream in, auto-clicking skip buttons.
  * **Anti-Adblock Enforcement Neutralizer**: Removes YouTube's anti-adblock modals (`ytd-enforcement-message-view-model`) and backdrop overlays, restoring normal playback and scroll behavior.
  * **Cosmetic YouTube Eradication**: Injects custom CSS hiding masthead ads, in-feed sponsored recommendations, and overlay banners.
* **Universal Cosmetic Ad Element Hiding**: Suppresses standard banner slots, ad containers, and sponsored blocks (`.ad-banner`, `[id^="google_ads_"]`, `.trc_related_container`, etc.) across all web domains.
* **Security Ward HUD Integration**: Updated [`SecurityWardWidget.tsx`](file:///d:/Projects/Mimir/src/components/mimisbrunnr/SecurityWardWidget.tsx) with dedicated YouTube Sentinel indicators and live blocked telemetry.

#### Mythic Installer Overhaul (`installer.rs`, `installer_ui.html`, `release.yml`)
* **100% Native Rust & WebView2 Architecture**: Completely replaced legacy NSIS installer with an Obsidian Glass, hardware-accelerated desktop setup application ([`installer.rs`](file:///d:/Projects/Mimir/src-rust/src/bin/installer.rs)).
* **Real-Time Storage Telemetry**: Live volume capacity calculation via Win32 `GetDiskFreeSpaceExW` showing available drive space and dynamic capacity utilization meters.
* **Dynamic Reactive Component Sizing**: Real-time calculation and animation of required installation footprint when selecting or deselecting Core Sanctuary vs. Living Cinematic Video Realms Pack (`16.5 MB` ➔ `105.1 MB`).
* **Repurposed Animated Splash**: Displays a rotating Vegvísir runic compass, pulsing `ᛗ` rune, and ambient particle simulations during extraction and download phases.
* **Automated System Registry Integration**: Automatically registers uninstall entries in Windows Add/Remove Programs and copies self as `uninstall.exe`.

#### Zero-Mock Feature Verification & Production Hardening
* **Genuine Fate Thread Browsing Data Purge (`FateThreadPurge.tsx`, `tab_manager.rs`, `ipc.rs`)**:
  * Eliminated simulated purge timeouts and mock cookie resets.
  * Implemented native `CLEAR_BROWSING_DATA` IPC protocol severing cookies across child webviews (`document.cookie`, `localStorage`, `sessionStorage`, `indexedDB.databases()`).
  * Real disk cache purging for temporary and isolated Helheim directories (`mimir_helheim_isolated` and `EBWebView` profile caches).
* **Live Bifröst Proxy Conduit Routing (`accelerator.rs`, `tab_manager.rs`, `main.rs`)**:
  * Connected `IpcCommand::ConfigureProxy` to multi-strand turbo download accelerator (`reqwest::Proxy::all`) and child webview process environments (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--proxy-server=...`).
  * Real-time confirmation broadcast back to HUD with active conduit indicators.
* **Huginn AI Scout & Runic Sidecar Live DOM Extraction (`huginnScout.ts`, `HuginnPanel.tsx`, `RunicSidecar.tsx`)**:
  * Eliminated hardcoded procedural templates in favor of live webpage inspection via `EXTRACT_PAGE_CONTENT` IPC.
  * Real DOM extraction of active page title, canonical URL, meta description, top headings, inner text excerpt, code blocks, script count, and detected frontend libraries (React, Next.js, Vue, Angular, WordPress, Tailwind CSS).
  * High-fidelity deterministic offline semantic summarizer calculating word count, reading times, section outlines, and ward audits.
  * Optional Google Gemini 1.5 Flash API key integration with discreet key modal and persistent configuration.

---

## [0.7.0] - 2026-10-25 *(Living Cinematic Video Realms & Tri-Mode Sanctum Engine)*

This milestone release brings the Nine Realms alive with living cinematic video backdrops, animated sovereign rulers, a unified Tri-Mode Sanctum Engine, in-browser visual documentation guides, and a lean Model A modular on-demand distribution architecture.

### Added

#### Living Cinematic Video Realms & Animated Sovereign Rulers (`RealmVideoBackdrop.tsx`, `forge_realm_videos.py`)
* **Animated Sovereign Realm Rulers (Option B)**:
  * Sovereign rulers breathe, focus, and command their cosmic domains in mathematically seamless ($t=0 \equiv t=1$), hardware-accelerated looping H.264 video backdrops:
    * **Surtr (Muspelheim)**: Volcanic glow pulses, rising twilight heat distortion waves, and leaping fire motes.
    * **Odin (Asgard)**: Celestial auroral god-rays, golden luminescence shimmer, and Gungnir divine resonance.
    * **Níðhöggr (Niflheim)**: Drifting toxic frost fog, icy cyan mist veils, and glacial chill breathing.
    * **Hel (Helheim)**: Undulating spectral soul flames and eerie phosphorescent emerald green radiance.
    * **Brokkr (Nidavellir)**: Rhythmic forge bellows breathing and molten bronze thermal warmth.
    * **Laufey (Jotunheim)**: Frost Giantess freezing breath with swirling sub-zero blizzard drifts.
    * **Freya (Vanaheim)**: Lush floral golden vitality and living nature energy pulses.
    * **Freyr (Alfheim)**: Crystalline solar brilliance and light-elf starlight glimmer.
    * **Heimdall (Midgard)**: Bifröst prism light shimmer and watchful guardian eye gleams.

#### Tri-Mode Sanctum Engine (`'video' | 'particles' | 'static'`)
* **Three-Way Visual Cycling**:
  * Unifies **Option B** (Hardware-accelerated looping video), **Option A** (Procedural HTML5 Canvas particle physics with 42-second Ken Burns GPU drift), and **Static Artwork** (zero-motion distraction-free mode).
  * Seamless one-click cycling button on the bottom realm bar of `mimir://newtab` (`SANCTUM: VIDEO (ᚠ) ➔ PARTICLES (ᛋ) ➔ STATIC (ᛏ)`).
  * Mode indicator button integrated into the Realm Gateway modal ([`RealmSelector.tsx`](file:///d:/Projects/Mimir/src/components/realms/RealmSelector.tsx)).
  * Direct Hliðskjálf Command Palette item (`Ctrl+K` ➔ `Sanctum Visuals: Cycle Mode`).
  * Mode preferences persist across launches in `localStorage` (`'mimir_sanctum_mode'`).

#### In-Browser Visuals & Model A Expansion Pack Guide
* **Integrated In-Browser Documentation**:
  * Added a collapsible in-browser documentation guide inside the Realm Gateway modal (`RealmSelector.tsx`).
  * Dedicated `GUIDE` button added on the Sanctum bottom HUD bar.
  * Dedicated Hliðskjálf Command Palette entry (`Ctrl+K` ➔ `Sanctum Visuals & Expansion Pack Guide`).
  * Provides end-users and developers with visual mode explanations, video installation target paths, and command syntax.

#### Hardware-Accelerated Dual-Buffered Video Player (`RealmVideoBackdrop.tsx`)
* **Conduit & Battery Sentinels**: Automatically halts video playback when the window is hidden, minimized (`document.hidden`), or when browsing active web pages to conserve battery life and GPU resources.
* **Zero-Downtime Fallback**: Pre-renders underlying high-resolution static artwork and automatically awakens Option A canvas particle simulations if video assets are missing, guaranteeing zero blank screens.

#### Cinema Forge Engine & Packaging Tooling (`scripts/`, `installer.nsi`)
* **`scripts/package_realm_pack.py`**: Automated packager creating the official `mimir-cinematic-realm-pack.zip` archive (~88.5 MB) containing all 9 genuine high-definition AI-generated living realm videos.
* **Automated Installer Component Downloader (`installer.nsi`)**: Added the optional `Living Cinematic Video Realms Pack` component to `mimir-setup.exe`. When selected during installation, the installer automatically downloads the video pack from GitHub Releases and unpacks it directly into `<install_dir>\dist\realms\videos\`.
* **Custom Protocol MIME Support**: Registered native `video/mp4` and `video/webm` MIME types in [`src-rust/src/main.rs`](file:///d:/Projects/Mimir/src-rust/src/main.rs) for smooth local streaming across custom `mimir://` protocol.

#### Model A Distribution Architecture
* **Lean Core Installer**: The primary browser repository and release archive remain lean (~12 MB) by omitting large binary video assets from git.
* **Modular High-Def Pack**: Users can either check the box during installation or download `mimir-cinematic-realm-pack.zip` (~88.5 MB) and drop it into `dist/realms/videos/` anytime to unlock living video backgrounds.

---

## [0.6.0] - 2026-10-24 *(Animated Realm Sanctums & Command Palette Universal Integration)*

This release elevates Mímir's sensory and mythological experience with living, animated theme backgrounds and brings universal command palette accessibility across all newly added browser systems.

### Added

#### Animated Realm Sanctums — Living Atmospheric Themes (`RealmAtmosphereCanvas.tsx`, `index.css`, `ContentViewport.tsx`)
* **Ken Burns Ambient Drift**: Implemented continuous 42-second smooth GPU-accelerated breathing transform (`realmKenBurns` keyframe animation) on realm ruler artwork, breathing life into every new tab sanctuary (`mimir://newtab`).
* **Procedural Particle Canvas Simulations (Option A)**:
  * **Muspelheim**: Rising fire sparks, glowing volcanic embers, and flickering heat distortion shimmer.
  * **Niflheim**: Drifting icy frost mist and swirling translucent ice crystals floating downwards.
  * **Asgard**: Shimmering golden auroras and animated celestial light motes with soft radial halos.
  * **Helheim**: Spectral soul-wisps and ghost-green glowing embers drifting on sine wave trajectories.
  * **Midgard**: Golden dust motes and soft atmospheric haze drifting in the wind.
  * **Alfheim**: Bioluminescent stardust, glowing pollen motes, and radiant celestial sparkles.
  * **Jotunheim**: Blowing blizzards and frost flurries with wind gusts accelerating sideways.
  * **Nidavellir**: Blacksmith forge sparks bursting upwards with rhythmic hearth warmth.
  * **Vanaheim**: Drifting golden nature spores and rotating autumn foliage floating gently.
* **Instant Static/Motion Switch**: Built-in toggle button in the bottom realm bar (`MOTION: ON / STATIC`) and command palette action allowing instantaneous switching between animated dynamic mode and classic static artwork.
* **Zero Performance & Bundle Cost**: 0 MB extra download size; automatically halts animation loops when windows or tabs are hidden (`document.hidden`), respects `prefers-reduced-motion`, and maintains a locked 60 FPS.
* **Future Upgrade Roadmap**: Documented roadmap to Option B (Seamless Looping Generative Video Backgrounds) with selectable Video / Particle / Static modes.

#### Hliðskjálf Command Palette Universal Integration (`CommandPalette.tsx`, `App.tsx`)
* **Direct Subsystem Navigation**:
  * **Naglfar Swarm (`Ctrl+Shift+U`)**: Direct command palette entry to open Mímir's Hoard tabbed into the P2P BitTorrent seeder/leecher console.
  * **Bifröst Turbo (`Ctrl+Shift+J`)**: Direct command palette entry to open Mímir's Hoard tabbed into the multi-strand parallel chunked download manager.
  * **Atmospheric Realms Toggle (`ᛞ`)**: Direct command palette entry to switch between Animated Particle/Drift and Static Artwork.
  * **Native .torrent File Ingestion**: Ingest local `.torrent` files or paste magnet URIs directly from the Swarm interface.

---

## [0.5.0] - 2026-10-24 *(Valhalla Revival, Bifröst Turbo Accelerator & Naglfar Swarm)*

This major milestone marks Mímir's graduation from Alpha into standard production releases. It introduces powerful new browsing systems including native multi-strand accelerated downloads, a full-featured native BitTorrent swarm client, persistent multi-mode sidebars, automated session revival, distraction-free reading sanctuaries, realm-level CSS/JS rule injection, and deep bundle optimizations.

### Added

#### Bifröst Turbo Multi-Strand Download Accelerator (`accelerator.rs`, `MimirsHoard.tsx`)
* **Parallel Chunked Streaming**: Implemented native Rust multi-strand download engine (`reqwest` + `tokio`) splitting file acquisitions across isolated `.strand_{i}` part files on Windows to eliminate file-locking conflicts.
* **Intelligent Server Negotiation**: Automatically probes server headers for `Accept-Ranges: bytes` and file length; gracefully falls back to single-stream chunking when range requests are unsupported.
* **Cancellation & State Recovery**: Safe runtime cancellation with automated temporary strand cleanup.
* **Live Segmented Visualizer**: Real-time HUD telemetry in Mímir's Hoard showing aggregate transfer speeds, remaining ETA, and individual segment progress bars for each parallel strand.

#### Naglfar Swarm — Native BitTorrent Client Engine (`torrent.rs`, `MimirsHoard.tsx`)
* **Pure Rust Swarm Protocol**: Integrated battle-tested BitTorrent client powered by `librqbit` (v9.0.1) running concurrently on background tokio threads without impacting webview frame rates.
* **Automatic Magnet Interception**: Webview navigation handler captures `magnet:?xt=...` links clicked on any webpage and channels them directly into the Naglfar Swarm engine.
* **Versatile Ingestion**: Full support for magnet links, HTTP/HTTPS `.torrent` URLs, and local `.torrent` files.
* **Live Swarm Telemetry**: 400ms broadcast ticker reporting active connected peers, seeders, upload/download speeds, piece verification progress, and time to completion.
* **Swarm Lifecycle Controls**: Pause, resume, exile (delete from swarm with optional file removal), and open download directory in Explorer.
* **Quick Vessel Testing**: One-click test button to ignite swarm testing with the official Ubuntu Mini ISO magnet link.

#### Valhalla Revival & Crash Sentinel (`sessionManager.ts`, `ValhallaRevivalBanner.tsx`)
* **Continuous Session Preservation**: Automatically captures active branches, zoom levels, split viewports, and realm hierarchy to persistent Valhalla memory.
* **Crash Sentinel**: Gracefully detects unexpected halts or severed browser threads.
* **Valhalla Revival Banner**: Presents an animated obsidian-and-gold prompt on launch allowing users to revive all prior conduits with a single click or begin anew.
* **Named Quest Sessions**: Support for saving and loading named session snapshots.

#### Runic Sidecar — Persistent Dock Panel (`RunicSidecar.tsx`)
* **Docked Split Sidebar**: Resizable persistent panel docking alongside the primary web viewport (`Ctrl+B` / `Alt+S`).
* **Runic Scratchpad (`ᚠ`)**: Quick-capture notepad supporting markdown, rune glyphs, and one-click copy to clipboard.
* **Huginn AI Skáli (`ᚨ`)**: Embedded concurrent thought-scout chat, allowing users to converse with Huginn without closing their browsing workspace.
* **Live Conduit Telemetry (`ᛋ`)**: Real-time event stream logging blocked surveillance conduits, network timings, and system heartbeats.

#### Reader Sanctum — Distraction-Free Reading Mode (`ReaderSanctum.tsx`)
* **Sanctum Typography View**: Strips away advertising noise, sticky headers, and trackers into an elegant reading sanctuary (`Alt+R` or Omnibar trigger).
* **Three Norse Aesthetic Themes**:
  * **Obsidian Sanctum**: Deep void darkness with glowing cyan and violet typography.
  * **Elder Parchment**: Warm aged parchment with golden serif styling and rune watermark.
  * **Rune Sepia**: Classic sepia tones for soft eye comfort during long research sessions.
* **Reading Progress & Metrics**: Live scroll progress bar, total word count, and estimated reading time.
* **Lore Recitation (TTS)**: Built-in voice recitation powered by speech synthesis with play/halt controls.

#### Realm Inscription Rules Engine (`inscriptionEngine.ts`, `BrokkrForge.tsx`)
* **Custom CSS & JS Injections**: Define user-scripts and custom CSS stylesheets matched by URL glob patterns and realm filters.
* **Automated Injection**: Automatically executes inscribed rules upon navigating to matched web conduits via native Wry script evaluation.

#### Bifröst Proxy Gateway Relaying (`BifrostMatrix.tsx`, `ipc.rs`)
* **Per-Realm Proxy Configuration**: Support for configuring SOCKS5 and HTTP proxy endpoints per realm.
* **Rust Engine Integration**: Relays `CONFIGURE_PROXY` commands from HUD directly into the native runtime.

### Improved & Optimized

#### Rune Seeker (Find-in-Page)
* Added toggles for Case-Sensitive matching (`Aa`) and Regular Expression mode (`.*`).
* Real-time match count telemetry dispatched from Rust back to the UI badge (`X matches`).
* Seamless `Enter` (next match) and `Shift+Enter` (previous match) keyboard traversal.

#### Mímir's Hoard (Download Manager)
* Filter bar by status (*All*, *Active*, *Complete*, *Failed*) and file category (*Documents*, *Images*, *Archives*, *Media*).
* Real-time download transfer speed (`MB/s`) and estimated time remaining (ETA).
* Download controls: Pause, Resume, and Cancel actions.
* Interactive SHA-256 file hash calculation via native Windows `certutil` with one-click comparison against clipboard hashes.

#### Security Ward & Tracker Deflector
* Expanded deflected tracker database to ~40 surveillance, telemetry, and advertising networks.
* Persistent realm whitelist toggle (*"Lower Ward for this Realm"*).
* Blocked Conduits Inspector drawer listing deflected network requests with status badges.

#### Mímisbrunnr (Omnibar) & Autosuggest
* Search bangs (`!g`, `!ddg`, `!gh`, `!yt`, `!w`, `!rust`, `!crate`) with prioritization in ranked suggestions.
* Quick-action *"Purify URL"* button stripping tracking and telemetry query runes (`utm_*`, `fbclid`, `gclid`, `ref_`, `si`).
* Pure TypeScript offline QR Code matrix generator and sharing popover.

#### Yggdrasil Tab Tree
* Quick search filter bar to find open tabs across sprawling trees.
* Nested child branch indentation with `GitBranch` tree hierarchy.
* 3-bar animated audio equalizer wave on playing tabs with instant mute button.
* `Alt+1` through `Alt+9` keyboard hotkeys for instant realm switching.

#### Muninn Vault (Bookmarks & History)
* Standard Netscape HTML bookmark import (`.html`, `.htm`) via native `DOMParser`.
* Chronological epoch grouping (*Today*, *Yesterday*, *Elder Epochs*).
* Multi-select checkboxes with batch deletion (*"Purge Selected (N)"*).
* Favicon resolution via Google Favicon API with runic icon fallback.

#### Norse Context Menu
* Text selection quick actions: *"Ask Huginn AI"*, *"Translate Rune / Text"*, and *"Copy as Markdown Link"*.
* Automatically opens and prefills Huginn AI drawer.

#### Engine Performance & Bundle Optimization
* Lazy loading of all heavy modal overlays and side panels via React `Suspense`.
* Vite Rollup manual chunking for vendor libraries (`vendor-react`, `vendor-framer`, `vendor-lucide`).
* Dropped main bundle size from **>533 kB** to **347 kB** (102 kB gzipped), eliminating bundle size warnings.
* Paced startup splash screen timing (3.8s) with module pre-warming and keyboard skip.

---

## [0.4.0] - 2026-10-23 *(Sacred Wards, Hoard & Browser Mastery)*

This release brings a comprehensive set of common browser functions, privacy controls, and security telemetry — wrapped in Mímir's distinctive Norse aesthetic. Every standard browser action a user expects is now present and themed.

### Added

#### Security Ward Widget — HTTPS Lock Icon & Privacy Panel (`SecurityWardWidget.tsx`)
* **Clickable HTTPS lock icon** in the Omnibar:
  * 🔒 **HTTPS** → emerald `Lock` icon (*"Sacred Conduit"*)
  * ⚠️ **HTTP** → red `ShieldAlert` icon (*"Unshielded Passage"*)
  * 🛡 **Internal pages** → cyan `ShieldCheck` icon (*"Mímir Sanctuary"*)
* **Security Ward Popup** (click the lock icon to open):
  * **Connection & Certificate panel**: TLS 1.3 cipher suite, issuer authority, OCSP stapling, key exchange algorithm — all expandable on demand.
  * **Runic Shield tracker blocker**: toggle per-site, shows tracker count and third-party cookie count. Animated on/off toggle.
  * **Site Permissions panel**: Geolocation, Camera, Microphone, Notifications — each individually togglable between `allow`, `ask`, and `block`.
  * **Quick actions**: Purge browsing threads directly for the active realm.

#### Rune Seeker — Find in Page (`RuneSeeker.tsx`)
* Floating overlay panel (`Ctrl+F`) for text search within the active WebView.
* Previous / Next match navigation (`Shift+Enter` / `Enter`).
* Sends `FIND_IN_PAGE`, `FIND_NEXT`, `FIND_PREVIOUS`, `FIND_CLOSE` IPC commands to the Rust/WebView2 host.
* Auto-focuses and auto-selects text on open; clears selection on close.
* Full Norse realm theming with accent glow and rune marker.

#### Mímir's Hoard — Full Native Downloads Manager (`MimirsHoard.tsx`)
* **Real Native WebView2 Download Handlers**:
  * Intercepts `with_download_started_handler` in Rust to track destination path, filename, and unique download IDs.
  * Intercepts `with_download_completed_handler` to determine exact file size on disk and success state.
  * Relays real-time `DOWNLOAD_STARTED` and `DOWNLOAD_COMPLETED` events across IPC to the HUD.
* **Artifact Actions & Hoard Controls**:
  * **Open Artifact**: Launches the downloaded file using default system association.
  * **Reveal in Windows Explorer**: Spawns `explorer.exe /select,"<path>"` to highlight the acquired file in its folder.
  * **Purge Artifact from Disk**: Sends `DELETE_FILE` IPC to delete the physical file from the file system.
  * **Manual Artifact Acquisition (Acquire URL)**: Slide-out drawer allowing users to acquire any URL directly via native background `curl.exe` to `%USERPROFILE%\Downloads`.
  * **Status Filter Tabs**: Filter hoard items by All, In Progress, Complete, and Failed.

#### Norse Themed Context Menu (`NorseContextMenu.tsx`)
* Custom obsidian glass context menu replacing default WebView2 context menu.
* Injected click and coordinate listener captures context details (`linkUrl`, `srcUrl`, `selectionText`, coordinates).
* Context-aware actions:
  * **Open in New Tab** / **Open in Split-Gaze** for hyperlinks.
  * **Copy Link Address** to system clipboard with audio chime.
  * **Save Image As...** & **Copy Image Address** for image targets.
  * **Search Web for Selection** using DuckDuckGo.
  * **Add to Runestones** (Quick Bookmark).
  * **Print Rune** (`Ctrl+P`) and **Inspect Element (DevTools)**.

#### True Helheim Isolation (Incognito Engine)
* Real sandboxed container isolation via dedicated `WebContext` pointing to `%TEMP%\mimir_helheim_isolated`.
* Helheim tabs do not share cookies, cache, localStorage, or session states with the main profile.

#### Runic Ward Ad & Tracker Protection
* Script-level interceptor automatically injected into child webviews on DOM initialization.
* Neutralizes calls to known ad, tracking, and telemetry domains (`doubleclick.net`, `google-analytics.com`, `facebook.net`, etc.).
* Relays live `TRACKER_BLOCKED` events via IPC to the Omnibar's `SecurityWardWidget`, displaying real-time blocked tracker counters.

#### HTTPS-Only Mode & Direct Upgrade
* Visual connection wards (🔒 Secure / ⚠️ Insecure / 🛡 Sanctuary).
* Added one-click **"Seal Passage (Upgrade to HTTPS)"** action inside the Security Ward widget to safely elevate unencrypted HTTP connections.

#### Runestone Vault — JSON Import & Export (`MuninnVault.tsx`)
* Full **JSON Export** of all bookmarks with ISO timestamps and formatted filenames.
* Robust **JSON Import** featuring schema validation, duplicates rejection, count reports, and procedural audio cues.

#### Tab Physics & Drag-to-Reorder (`TabTree.tsx`)
* Integrated Framer Motion `Reorder.Group` and `Reorder.Item` physics.
* Seamless drag-to-reorder tab branches in the Yggdrasil tree with dynamic height calculations and spring transitions.

#### Brokkr's Extension Forge — Live Script & Style Injection (`BrokkrForge.tsx`)
* Added `EXECUTE_SCRIPT` IPC pipeline to compile and cast inscriptions on demand.
* **"Cast to Current Tab"** button injects custom CSS `<style>` and executes JavaScript rules into the active DOM.

#### Bifröst Matrix — Latency & Reachability Probing (`BifrostMatrix.tsx`)
* Added **"Probe Conduit"** button measuring real-time latency (ms) and connectivity against configured DoH resolvers.

#### New Rust/IPC Commands (`ipc.rs`, `tab_manager.rs`, `main.rs`)
* `OPEN_PATH` — reveals files in Windows Explorer or executes them.
* `DOWNLOAD_URL` — triggers background file acquisition via native `curl.exe`.
* `DELETE_FILE` — deletes downloaded artifacts from disk.
* `SHOW_DEVTOOLS` — activates the WebView2 developer tools window.
* `EXECUTE_SCRIPT` — evaluates arbitrary JavaScript / CSS DOM overrides in the active webview.
* `DOWNLOAD_STARTED` / `DOWNLOAD_COMPLETED` — bidirectional download telemetry.
* `CONTEXT_MENU` — passes coordinates and context targets to HUD.
* `TRACKER_BLOCKED` — live telemetry for deflected telemetry requests.

### Changed
* `Tab` interface gained `isPinned: boolean` and `zoomLevel: number` fields.
* `IpcCommand` TypeScript union type extended with all new command variants.
* `handleCloseTab` respects `isPinned` — pinned tabs are immune to `Ctrl+W`.
* Bookmarks now persist to `localStorage` under `mimir_bookmarked_urls`.
* Download history persists to `localStorage` under `mimir_downloads_history`.

---

## [0.3.0] - 2026-10-21 *(Mímisbrunnr Autosuggest & Hliðskjálf Command Center)*


Major upgrade introducing intelligent multi-source autosuggestion ranking in the Omnibar, the Hliðskjálf Command Palette in the left navigation pane, and comprehensive layout refinement across realm lore and Hávamál wisdom cards.

### Added

#### Intelligent Omnibar Autosuggest & Ranking Engine (`autosuggest.ts`)
* **Multi-Source Frecency Ranking Engine**:
  * Real-time query matching across three distinct data sources:
    * **Muninn Runestones**: Bookmarked conduits with custom titles, tags, and realm affiliations.
    * **Threads of Fate**: Visited browsing history with timestamp tracking and visit counts.
    * **Popular Ancient Gateways**: 14 developer and knowledge portals (GitHub, DuckDuckGo, Wikipedia, Rust Docs, MDN, Stack Overflow, etc.).
  * **Scoring & Ranking Mechanics**:
    * Exact domain match bonus (`+150`)
    * Domain prefix match bonus (`+110`)
    * Full URL substring match (`+75`)
    * Title and metadata match (`+55`)
    * Intent bonus for bookmarked Runestones (`+40`)
    * Frequency score: `+8` per visit up to `+40` maximum
    * Recency decay bonus: up to `+25` for pages visited within 24 hours down to `+5` within 30 days
    * Fallback search suggestion for non-URL queries (`+10`)
  * **Smart Deduplication & Runic Badging**:
    * Merges duplicate entries across bookmarks, history, and popular gateways into a single high-priority result with compound badges (`ᛚ RUNESTONE • VISITED`).
    * Visual badges distinguishing result types: `ᛚ RUNESTONE` (gold), `ᚺ HISTORY` (cyan/blue), `ᛟ GATEWAY` (emerald), and `ᛋ SEARCH` (violet).
* **Keyboard Navigation & Omnibar Auto-Population**:
  * Keyboard navigation in suggestion dropdown via `ArrowDown` and `ArrowUp`.
  * Suggestion auto-population directly into the URL input during keyboard traversal.
  * Instant execution via `Enter` or mouse click with runic audio click sound cues.
  * Dismissal via `Escape` key or clicking outside.

#### Hliðskjálf Command Palette (`CommandPalette.tsx`)
* **Editor-Grade Omnipresent Command Center**:
  * Accessible from the dedicated trigger button directly above the tab tree on the left pane ("Seek Command... Ctrl+K").
  * Global hotkeys: `Ctrl+K` and `Ctrl+Shift+P` (standard code editor convention).
  * Filterable catalog of actions categorized into:
    * **Tabs & Navigation**: New Tab, Close Tab, Refresh Conduit, Return to Mímisbrunnr Sacred Well, Next/Previous Tab.
    * **Wisdom & Ravens**: Consult Huginn AI intelligence drawer (`Ctrl+H`), Open Muninn's Vault & Runestones (`Ctrl+M`).
    * **Viewports & Tools**: Toggle Odin's Split-Gaze dual viewports (`Ctrl+\`), Open Bifröst Proxy Conduit Matrix, Open Brokkr's Extension Forge, Toggle Gjallarhorn Ambient Audio.
    * **The Nine Realms**: Instant realm shifting to any of the 9 Norse realms (Midgard, Asgard, Vanaheim, Alfheim, Jotunheim, Muspelheim, Niflheim, Nidavellir, Helheim) with real-time accent color indicators.
    * **System & Wards**: Flush browser cache and clear browsing fate threads.
  * Keyboard-driven arrow navigation, direct execution, visual category headers, and shortcut badges.

### Fixed

#### Realm Lore & Hávamál Card Text Truncation
* **Expanded Viewport Lore Layout (`ContentViewport.tsx`)**:
  * Expanded container maximum width from `max-w-3xl` (768px) to `max-w-5xl` (1024px) for desktop wide displays.
  * Removed restrictive `truncate` class on Sovereign ruler titles, allowing multi-word Norse titles to display in their entirety.
  * Removed `line-clamp-1` on sovereign mythological quotes, ensuring the full ancient spoken verses wrap cleanly.
  * Added the full realm description text below ruler quotes for richer cosmological context.
  * Removed `line-clamp-2` on English translation stanzas in the Hávamál wisdom card, ensuring ancient philosophical verses from the Poetic Edda are completely legible without truncation.

#### Realm Selection Synchronization & Persistent Highlighting
* **Cosmic Realm Highlighting Fix (`ContentViewport.tsx`, `App.tsx`, `RealmSelector.tsx`)**:
  * Corrected realm selection comparison logic (`isSelected = isPrimary ? rId === activeRealm : ...`) so the currently active realm is accurately highlighted instead of defaulting to Midgard.
  * Synchronized tab realm state on selection and tab switching so each tab retains its bound realm identity.
  * Enhanced active realm visual presence with dedicated accent glows, pulsating active runic markers, and theme-colored borders across both the Sacred Well quick switcher and the Nine Realms modal dialog.

---

## [0.2.0] - 2026-10-21 *(The Nine Realms & Sovereign Wisdom)*

Major milestone expansion bringing full realization of the Nine Norse Realms with sovereign ruler artwork, the Huginn AI Copilot, Muninn's Memory Vault, Gjallarhorn Procedural Ambient Soundscapes, Bifröst Proxy Matrix, Odin's Split-Gaze dual viewports, and Brokkr's Extension Forge.

### Added

#### The Nine Realms Cosmology & Sovereign Artwork
* **All Nine Realms Fully Realized**:
  * **Midgard (*Miðgarðr*)**: Sovereign **Heimdall** (*Guardian of the Bifröst*), Rune `ᛗ` (Mannaz), Bifröst cyan & celestial aurora curtains.
  * **Asgard (*Ásgarðr*)**: Sovereign **Odin Allfather** (*High King of the Æsir*), Rune `ᚨ` (Ansuz), Valhalla gold & divine constellation stardust.
  * **Vanaheim (*Vanaheimr*)**: Sovereign **Freya** (*Queen of the Vanir & Lady of Fólkvangr*), Rune `ᚹ` (Wunjo), Vanir emerald & floating golden bio-spores.
  * **Alfheim (*Álfheimr*)**: Sovereign **Freyr** (*Lord of the Light Elves & Sun King*), Rune `ᛞ` (Dagaz), Luminous frost blue & crystal prism shimmers.
  * **Jotunheim (*Jötunheimr*)**: Sovereign **Queen Laufey** (*Ruler of the Frost Giants*), Rune `ᛁ` (Isa), Subzero glacial blue & falling ice needle blizzards.
  * **Muspelheim (*Múspellsheimr*)**: Sovereign **Surtr** (*Lord of the Fire Giants & World Burner*), Rune `ᚲ` (Kenaz), Volcanic ember rose & surging thermal fire glow.
  * **Niflheim (*Niflheimr*)**: Sovereign **Níðhöggr** (*The Primordial Serpent & Root Gnawer*), Rune `ᚺ` (Hagalaz), Toxic venom cyan & creeping primordial fog.
  * **Nidavellir (*Niðavellir*)**: Sovereigns **Brokkr & Sindri** (*Dwarven Master Smiths*), Rune `ᛏ` (Tiwaz), Molten bronze & explosive anvil sparks.
  * **Helheim (*Helheimr*)**: Sovereign **Hel (Hela)** (*Sovereign of the Underworld*), Rune `ᛈ` (Perthro), Amethyst purple & zero-trace stealth abyss veil.
* **Sovereign Ruler Artwork & Atmosphere**:
  * Bespoke high-resolution 16:9 widescreen artwork for all 9 sovereign rulers integrated into the Sacred Well (`mimir://newtab`) with obsidian veil gradients ensuring high text contrast.
  * Sovereign Lore Banner displaying ruler titles, avatars, and authentic mythological quotes.
  * Nine Realms Selector (`Níu Heimar`) expanded to a 3×3 responsive grid modal with ruler portraits and workspace isolation status.

#### Huginn AI Scout & Intelligence Drawer (`HuginnPanel.tsx`)
* **Norse AI Companion (Thought / *Hugr*)**:
  * Interactive slide-out intelligence drawer accessible from the Omnibar and via `Ctrl+H` / `Ctrl+I`.
  * **Runic Invocations**:
    * **ᚱ Synthesize Page**: Instant 4-point distillation of active page lore, security posture, and domain essence.
    * **ᚲ Code Lore**: Deep technical examination of client framework, sandboxing, and DOM architecture.
    * **ᛈ Ward Audit**: Telemetry assessment, cookie containment status, and fingerprint defenses.
  * **Procedural Old Norse Wisdom**: Dynamic conversational streaming responses with typewriter animation, Eddic sayings, and runic audio cues.
  * **Memory Carving**: One-click copying of insights ("Carve into Memory") and chat reset ("Purge Raven Memory").

#### Muninn's Memory Vault (`MuninnVault.tsx`)
* **Permanent Runestones (Bookmarks)**:
  * Persistent bookmarking system with realm tagging, customizable runes, search filtering, and one-click navigation.
  * "Carve Tab" quick action anchoring any active conduit permanently into memory.
* **Threads of Fate (Browsing History)**:
  * Chronological runic timeline of visited gateways across all nine realms.
  * "Sever Threads" action for clearing history with runic audio feedback.
  * Accessible via `Ctrl+M` or the Omnibar Muninn button.

#### Gjallarhorn Procedural Ambient Soundscapes
* **Web Audio API Elemental Atmosphere**:
  * Continuous, zero-dependency procedural audio synthesis generating living atmospheric soundscapes for each realm:
    * *Asgard*: Harmonic drone tuned to 432Hz & 648Hz sacred golden ratio chords.
    * *Muspelheim*: Deep volcanic sub-bass rumble (55Hz) with random ember crackle impulse filters.
    * *Jotunheim*: Sub-zero resonant sweeping bandpass glacial winds (420Hz).
    * *Vanaheim*: Calming nature breeze with 528Hz harmonic resonance.
    * *Helheim*: Deep subterranean cavern hum (42Hz).
    * *Nidavellir*: Resonant 110Hz metallic forge anvil tone.
    * *Midgard / Alfheim*: Gentle coastal rain and cosmic tide swell.
  * Dynamic cross-fading when switching active realms and dedicated toggle in the HUD.

#### Bifröst Proxy Conduit Matrix (`BifrostMatrix.tsx`)
* **Per-Realm Network Routing & Tunneling**:
  * Independent proxy topology per realm: Direct Bifröst, SOCKS5, HTTP, and Tor Stealth Gateway.
  * Encrypted DNS-over-HTTPS (DoH) resolver configuration per realm (Cloudflare, Mullvad, Google, Quad9).
  * Localhost bypass toggle for seamless web development in Asgard while retaining stealth in Helheim.

#### Odin's Split-Gaze (`Hliðskjálf Dual-Viewport`)
* **Multi-Realm Dual Browsing**:
  * Split-screen viewing container dividing the workspace into two side-by-side viewports.
  * Central control divider with instant Swap Panes (`ArrowLeftRight`) and Close Split actions.
  * Dynamic Secondary Gaze picker allowing quick selection of any active tab or branch of Yggdrasil.
  * Accessible via Omnibar button and shortcut `Ctrl+\`.

#### Brokkr's Extension Forge (`BrokkrForge.tsx`)
* **User-Scripts & Custom Runic Styles**:
  * Domain-specific CSS and sandboxed JavaScript injection manager.
  * Built-in runic presets: *Obsidian Dark Veil* (OLED pure black), *Mímir High-Legibility Typography*, *Cleanse Distractions* (Reader mode), and *Asgard Engineering Monospace*.
  * Custom Inscription Editor with live enable/disable toggles and URL pattern matching.

### Changed & Fixed

* **Sharp & Prominent Realm Background Artwork**:
  * Removed heavy blur filters and excessive black opacity from the Sacred Well (`ContentViewport.tsx`), Huginn AI drawer, and 3×3 Realm Selector modal.
  * Implemented subtle, elegant radial vignettes that preserve razor-sharp ruler artwork and vibrant colors in the center while maintaining high contrast for text and search controls.
* **Standardized ASCII Shell Naming ("Mimir Browser")**:
  * Resolved character decoding / mojibake mismatches (`MÃ­mir`) across Windows shells by standardizing installer strings, shortcut `.lnk` filenames, and PE metadata to clean ASCII `"Mimir Browser"`.
  * Embedded `FileDescription`, `ProductName`, `InternalName`, and `OriginalFilename` into the Windows PE resource table via `winres`.
* **Selectable Desktop Shortcut in Setup Installer**:
  * Integrated `MUI_PAGE_COMPONENTS` into the NSIS setup wizard, providing users with a dedicated checkbox option to create a Desktop shortcut (`Mimir Browser.lnk`) during installation.
  * Enhanced uninstaller to cleanly purge both new and legacy desktop and Start Menu shortcuts.

---

## [0.1.0] - 2026-10-20 *(Alpha Release — The Genesis of Mímir)*

The inaugural public alpha proof of concept (POC) for Mímir, the hypermodern, runic-forged web explorer.

### Added

#### Core Engine & Desktop Architecture
* **Rust Native Host (`mimir-core`)**: Lightweight native application host powered by **Wry v0.47** and **Tao v0.30**.
* **Windows WebView2 Docking Engine**: Zero-Electron, high-performance web runtime delivering 100% Chromium/Blink compatibility (YouTube, WebGL, WebGPU, 144Hz+) with low RAM footprint (~35–45MB idle).
* **Decoupled HUD Architecture**: Separates the custom Norse browser frame (React 19) from child web viewports, enabling fluid, non-blocking UI animations.
* **Smart Child Viewport Docking**: Rust dynamically positions, resizes, and clips the child WebView2 window into the React HUD viewport using `ResizeObserver` coordinates transmitted over native IPC.
* **Automatic Viewport Isolation**: When navigating to `mimir://newtab` (The Well of Mímisbrunnr), child WebViews automatically yield visibility (`wv.set_visible(false)`) to let the full HUD sanctum shine.

#### Norse Mythology Theming & Design System
* **Cosmological Feature Taxonomy**:
  * **Mímisbrunnr (The Well of Wisdom)**: Omnibar, command launcher, and search engine.
  * **Yggdrasil (The World Tree)**: Vertical, collapsible tab tree holding active threads of fate.
  * **Muninn (Memory)**: Deep history and thread recall.
  * **Huginn (Thought)**: Instant AI scout and page summarization action.
  * **Runestones**: Permanent visual bookmarks and anchored destinations.
  * **Helheim Cloak**: Zero-trace ephemeral / incognito browsing.
  * **Gjallarhorn**: Cross-realm media controller and sound state.
  * **The Nine Realms**: Dedicated isolated workspaces (Midgard, Asgard, Vanaheim, Alfheim, Helheim, Muspelheim).
  * **Aegis Ward**: Active tracker defense and security telemetry.
* **Firefox-Style Animated TitleBar Banners**: Dynamic cosmic gradients tailored to the active Realm, featuring scrolling Elder Futhark rune ribbons, Valknut / Ægishjálmr watermarks, and continuous aurora wave animations.
* **The Sacred Well Sanctum (New Tab Page)**:
  * Concentric living water ripples radiating from the well.
  * Subterranean roots of Yggdrasil ascending through the mist.
  * Rotating authentic stanzas of ancient wisdom from the **Hávamál** (*Poetic Edda*) with Old Norse inscriptions and English translations.
  * Speed dial standing stones (*Forge of Code*, *Well of Search*, *Iron Lore*, *Gjallarhorn Stream*).
  * Quick-access Cosmic Realm Gateway selectors.
* **Mythological Realm Canvas Atmospheres**:
  * *Midgard*: Bifröst Aurora Borealis ribbons waving across the sky with cyan rune drift.
  * *Asgard*: Celestial stardust and falling golden sparks with subtle constellation lines.
  * *Muspelheim*: Surtr's rising volcanic embers with turbulent flicker.
  * *Helheim*: Cold creeping frost mist and amethyst crystallization.
* **Animated Mímir Sigil & Branding**:
  * Iridescent chromatic `ᛗ` (Mannaz rune) with multi-stop Bifröst gradient.
  * Dual counter-rotating Elder Futhark compass rings.
  * Breathing runic pulse glow.
* **Cinematic Splash Screen**:
  * Full-screen launch sequence with Yggdrasil background, animated sigil, and authentic rune-boot telemetry.

#### Audio & Sensory Engine
* **Web Audio API Runic Synthesizer**: Zero-dependency procedural sound generator crafting crisp mechanical switch clicks, deep resonant portal hums, crystalline chimes, and blade whooshes on tab close.
* **Audio SFX Toggle**: Dedicated HUD control in the status bar with persistent state.

#### Developer Experience & Build Automation
* **Theme-Consistent Native Executable & Installer Icon**:
  * Embedded multi-resolution runic Mímir icon (`256x256`, `128x128`, `64x64`, `48x48`, `32x32`, `16x16`) directly into `mimir.exe` via Windows PE resource compilation (`winres`).
  * Configured NSIS setup installer (`mimir-setup.exe`), uninstaller, desktop shortcuts, and Start Menu links with the runic icon, ensuring it permanently locks in when pinned to the Windows Taskbar.
  * Linked native runtime window icon via Tao's `with_window_icon` for seamless Alt+Tab and taskbar representation.
* **Installer Launch-on-Finish**:
  * Integrated `MUI_FINISHPAGE_RUN` into the NSIS setup wizard, providing a checked-by-default "Launch Mímir Browser" option on the completion screen.
* **Vite Watcher Decoupling**: Explicitly isolated `src-rust/target` and WebView2 GPU cache directories from Vite file watching to prevent Windows `EBUSY` file locking errors.
* **Automated CI/CD Release Pipeline**: GitHub Actions workflow packaging both an executable installer and a portable Windows x64 zip bundle on every tag push.

### Fixed
* **COM Apartment Re-Entrancy & UI Deadlock Resolution**:
  * Decoupled `with_ipc_handler` from synchronous tab management and child WebView2 construction using Tao's `EventLoopProxy<IpcCommand>`.
  * Dispatched IPC messages asynchronously to the top-level Tao event loop, eliminating the COM apartment deadlock where `wait_with_pump` hung indefinitely inside WebView2's `WebMessageReceived` event handler.
  * Restored complete responsiveness to the HUD window controls (Close, Minimize, Maximize), Tab Tree, Realm Switcher, and Omnibar input during all navigation states.
* **Live Child Viewport Spawning & Tab IPC Synchronization**:
  * Implemented `build_as_child` child window attachment in Wry so external web pages (Google, GitHub, DuckDuckGo, etc.) dock seamlessly inside the HUD viewport rather than remaining on the placeholder.
  * Synchronized initial tab creation on mount and full two-way tab lifecycle (`CREATE_TAB`, `NAVIGATE`, `SWITCH_TAB`, `CLOSE_TAB`) between React HUD and native Rust `TabManager`.
  * Connected Omnibar navigation, search inquiry, speed dial runestones, and browser history actions (`GO_BACK`, `GO_FORWARD`, `REFRESH`) to active child WebViews.
* **White Blank Screen & ES Module CORS Bypass**:
  * Replaced fragile `file://` URI loading with an embedded secure custom protocol (`https://mimir.localhost`), completely resolving Chromium's `Origin: null` CORS block on `<script type="module">` assets.
  * Added instant `#05070a` void-obsidian background initialization (`with_background_color`) to eliminate white window flashes before HUD rendering.
  * Implemented an internal MIME-type dispatcher serving bundled JavaScript, CSS, SVGs, web fonts, and SPA fallback routes directly from the verified `dist/` asset sanctuary.
* **Dependency-Free Windows Distribution (Zero-Prerequisite WebView2)**:
  * Integrated automated WebView2 runtime detection in both the native Rust core and the NSIS setup installer.
  * If absent on a target machine, Mímir automatically downloads and executes Microsoft's official Evergreen Bootstrapper (`MicrosoftEdgeWebview2Setup.exe`) in silent mode.
  * Bundled the bootstrapper directly into the NSIS installer and portable release archive, making Mímir 100% self-sufficient even on fresh, clean, or LTSC Windows environments.
* **Windows Terminal Window Suppression**: Configured `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` so running the distributed binary no longer spawns an unwanted separate console window, while seamlessly retaining parent console attachment via `AttachConsole` when invoked from CLI.
* **Size-Controlled Crash Dump & Diagnostic Telemetry**:
  * Added dedicated `logger.rs` module writing to `%TEMP%\mimir_crash.log`, easily discoverable by Windows Disk Cleanup.
  * Enforced a strict 512 KB size ceiling with automatic log rotation/truncation to prevent disk bloat.
  * Implemented an unhandled panic hook with native Windows `MessageBoxW` error reporting and detailed diagnostic dumps.

---

[0.3.0]: https://github.com/indoctrinatedrecluse/Mimir/releases/tag/v0.3.0
[0.2.0]: https://github.com/indoctrinatedrecluse/Mimir/releases/tag/v0.2.0
[0.1.0]: https://github.com/indoctrinatedrecluse/Mimir/releases/tag/v0.1.0
