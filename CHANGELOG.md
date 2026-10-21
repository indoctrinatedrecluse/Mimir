# Changelog

All notable changes to the **Mímir Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
