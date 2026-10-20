# Changelog

All notable changes to the **Mímir Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
* **Vite Watcher Decoupling**: Explicitly isolated `src-rust/target` and WebView2 GPU cache directories from Vite file watching to prevent Windows `EBUSY` file locking errors.
* **Automated CI/CD Release Pipeline**: GitHub Actions workflow packaging both an executable installer and a portable Windows x64 zip bundle on every tag push.

### Fixed
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

[0.1.0]: https://github.com/indoctrinatedrecluse/Mimir/releases/tag/v0.1.0
