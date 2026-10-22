# ᛗ MÍMIR
### *The Hypermodern, Runic-Forged Web Explorer*

[![Release](https://img.shields.io/badge/Release-v0.3.0%20(Alpha)-10b981?style=for-the-badge&logo=github)](https://github.com/indoctrinatedrecluse/Mimir/releases/tag/v0.3.0)
[![Platform](https://img.shields.io/badge/Platform-Windows%20(WebView2)-00f5ff?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/indoctrinatedrecluse/Mimir)
[![Core Engine](https://img.shields.io/badge/Core-Rust%20%2B%20Wry-f97316?style=for-the-badge&logo=rust&logoColor=white)](https://github.com/tauri-apps/wry)
[![UI HUD](https://img.shields.io/badge/HUD-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev/)
[![Styling & FX](https://img.shields.io/badge/Aesthetic-Tailwind%20%2B%20Framer%20Motion-a855f7?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> *"He who drinks from Mímisbrunnr gains wisdom beyond mortal reckoning."*  
> Mímir is a next-generation desktop browser crafted for gamers, power users, and mythology enthusiasts. It strips away sterile corporate browser design in favor of a responsive, obsidian-glass, gamer-grade HUD deeply rooted in Norse cosmology.

---

## ⚡ Download Mímir (v0.3.0 Alpha)

Ready-to-use releases for 64-bit Windows are packaged and distributed with zero manual prerequisites:

| Package | Format | Description |
| :--- | :--- | :--- |
| [**Windows Setup Installer**](https://github.com/indoctrinatedrecluse/Mimir/releases/download/v0.3.0/mimir-v0.3.0-windows-x64-setup.exe) | `.exe` (~10 MB) | Full setup wizard with Desktop and Start Menu shortcuts, auto-launch option, and bundled Microsoft WebView2 Evergreen Bootstrapper for fresh or LTSC Windows systems. |
| [**Portable Archive**](https://github.com/indoctrinatedrecluse/Mimir/releases/download/v0.3.0/mimir-v0.3.0-windows-x64-portable.zip) | `.zip` (~8 MB) | Standalone portable bundle. Extract and launch `mimir.exe` directly without installation. |

---

## 🧭 Purpose & Vision

Modern browsers have devolved into monotonous gray rectangles that treat the internet as a corporate spreadsheet. **Mímir** explores what happens when a browser is designed with:
1. **Sensory & Visual Tactility**: Deep obsidian textures, neon runic accents, spring physics, and subtle mechanical audio feedback for every click, tab shift, and command execution (reminiscent of high-end game launchers and cybernetic HUDs).
2. **Deep Mythological Lore**: Every feature is named and conceptualized around Norse cosmology. The browser is not just an application—it is your conduit across the digital Nine Realms.
3. **High Performance & Low Footprint**: By utilizing a native **Rust core (`wry`)** on top of Windows' **Evergreen WebView2 (Chromium Blink)**, Mímir delivers 100% web compatibility with minimal RAM overhead compared to traditional Electron wrappers.

---

## ⚡ Tech Stack Decision & Rationale

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MÍMIR ARCHITECTURE DUALITY                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ 🛡️ BACKEND / ENGINE LAYER          │ ᚱ FRONTEND / HUD LAYER             │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Rust (Cargo)                    │ • React 19 (TypeScript)            │
│ • Wry + Tao Window Manager        │ • Vite (Instant HMR)               │
│ • Microsoft Edge WebView2 (Blink) │ • Tailwind CSS v4 (Custom Tokens)  │
│ • Native IPC & Process Isolation  │ • Framer Motion (Spring Physics)   │
│ • Windows Subsystem Targeting     │ • Web Audio API (Runic Cues)       │
└───────────────────────────────────┴────────────────────────────────────┘
```

* **Why Wry on WebView2?**  
  Windows WebView2 provides full Chromium/Blink rendering fidelity (YouTube, WebGL, WebGPU, DRM, 144Hz+ displays) without bundling a 150MB+ Chromium binary or running heavy Node.js background services.
* **Why React 19 + Framer Motion?**  
  Delivers unparalleled animation fluidity (`layoutId` shared-element transitions, spring physics on tab snapping) and access to the world's richest component ecosystem.
* **Why Tailwind v4 + OKLCH?**  
  Prevents neon glow clipping in dark mode; enables glowing runic glassmorphism with high rendering performance.

---

## ᚱ Thematic Taxonomy (Norse Feature Glossary)

Every standard browser function is rechristened into ancient Norse cosmology:

| Traditional Element | Mímir Norse Codename | Lore & Purpose |
| :--- | :--- | :--- |
| **Omnibar / Search** | **Mímisbrunnr** | *The Well of Wisdom.* The central command bar, search engine, and runic launcher. |
| **Autosuggest** | **Mímisbrunnr Whispers** | Real-time frecency ranking delivering bookmarked Runestones, history threads, and portals as you type. |
| **Command Palette** | **Hliðskjálf** | *The High Seat of Odin.* Editor-grade omnipresent command center (`Ctrl+K` / `Ctrl+Shift+P`) overlooking all browser operations. |
| **Tabs & Tab Trees** | **Yggdrasil Branches** | The great World Tree holding your active web threads, collapsible into glowing runes. |
| **History & Cache** | **Muninn** | *Memory.* Raven that recalls every realm and journey traversed (`Ctrl+M`). |
| **Quick AI Scout** | **Huginn** | *Thought.* Raven that scours pages for summaries, architecture, and security audits (`Ctrl+H`). |
| **Bookmarks** | **Runestones** | Sacred marks carved into the browser to anchor important destinations. |
| **Dual Viewports** | **Odin's Split-Gaze** | Side-by-side split-screen browsing container with instant pane swapping (`Ctrl+\`). |
| **Incognito Mode** | **Helheim Cloak** | Zero-trace icy cloaking. Leaves no footstep across memory or disk. |
| **Ambient Audio** | **Gjallarhorn Soundscape** | Procedural Web Audio synthesizer generating unique living soundscapes for each realm. |
| **Workspaces & Themes** | **The Nine Realms** | Dedicated realm spaces with sovereign ruler artwork, lore, and independent network routing. |
| **Proxy & DoH Routing** | **Bifröst Conduit Matrix** | Per-realm proxy routing (Direct, SOCKS5, HTTP, Tor) and encrypted DNS-over-HTTPS resolvers. |
| **Extension Engine** | **Brokkr's Forge** | User-scripts and custom runic CSS/JS style injection engine for power customization. |
| **Adblock & Shields** | **Runic Ward** | Defensive runic barrier deflecting trackers, banners, and malicious script intrusion. |

---

## 🏛️ System Architecture

Mímir operates using a **Decoupled HUD Architecture**:

```mermaid
graph TD
    subgraph Host["Rust Engine Host (Wry & Tao)"]
        A[Native Windows Application Process]
        B[IPC Dispatcher & State Store]
        C[WebView2 Tab Controller]
    end

    subgraph Chrome["HUD Presentation Layer (React 19)"]
        D[Custom Window Titlebar & Window Controls]
        E[Mímisbrunnr Omnibar & Autosuggest Dropdown]
        F[Hliðskjálf Command Palette Modal]
        G[Yggdrasil Vertical Tab Tree]
        H[Huginn & Muninn Side Drawers]
        I[Gamer Audio & Particle Shaders Engine]
    end

    subgraph Viewports["Child Content Viewports (Blink / WebView2)"]
        J[Active Tab 1: Web Content]
        K[Background Tab 2: Standby]
        L[Secondary Split-Gaze Viewport]
    end

    A -->|Hosts| Chrome
    Chrome <==>|Fast IPC Commands / Events| B
    B -->|Dynamically Resizes & Clips| C
    C -->|Docks into Workspace Area| Viewports
```

---

## 🎯 Feature Evolution & Roadmap

### Phase 0: Scaffolding & Foundation *(Completed in v0.1.0)*
- [x] Project architecture blueprint & technical specification.
- [x] Modular workspace setup (Rust backend + React 19 Vite frontend).
- [x] Establish typed IPC contract between Rust and React.
- [x] Initialize Obsidian Glass design tokens and typography.

### Phase 1: The Runic Frame (UI-First Prototype) *(Completed in v0.1.0)*
- [x] Custom borderless window frame with integrated titlebar and window controls.
- [x] **Mímisbrunnr (Omnibar)** with runic glow focus, keyboard hotkeys, and suggestions HUD.
- [x] **Yggdrasil Tab Bar** (vertical & collapsible) with spring-physics tab switching.
- [x] Tactile sound engine (subtle mechanical clicks, low-frequency hums on realm switches).
- [x] Ambient canvas rune particles / ember effects.

### Phase 2: Live Content Docking (Wry Integration) *(Completed in v0.1.0)*
- [x] Rust process spawning child WebView2 viewports inside the React frame workspace.
- [x] Dynamic bounds synchronization (resizing HUD cleanly adjusts the webview).
- [x] URL navigation, Back / Forward / Refresh controls bound to Mímisbrunnr.
- [x] Multi-tab lifecycle: Tab creation, switching, closing, and memory hibernation.
- [x] COM apartment re-entrancy fix decoupling IPC handlers from synchronous child creation.
- [x] Embedded `https://mimir.localhost` custom protocol eliminating CORS blocks on ES modules.

### Phase 3: The Nine Realms & Sovereign Wisdom *(Completed in v0.2.0)*
- [x] **The Nine Realms Cosmology**: Full realization of all 9 Norse realms (Midgard, Asgard, Vanaheim, Alfheim, Jotunheim, Muspelheim, Niflheim, Nidavellir, Helheim) with sovereign ruler artwork and palettes.
- [x] **Muninn's Memory Vault**: Persistent Runestones bookmarks and Threads of Fate history tree (`Ctrl+M`).
- [x] **Gjallarhorn Procedural Ambient Soundscapes**: Continuous Web Audio procedural drone synthesizer for all 9 realms.
- [x] **Bifröst Proxy Conduit Matrix**: Per-realm proxy and encrypted DoH resolver routing.
- [x] **Odin's Split-Gaze**: *Hliðskjálf* dual-viewport split-screen browsing (`Ctrl+\`).
- [x] **Brokkr's Extension Forge**: Custom CSS/JS user-script injection engine.
- [x] **Huginn AI Scout**: Floating Norse AI companion drawer (`Ctrl+H` / `Ctrl+I`).
- [x] **Helheim Mode**: Zero-trace private browsing sessions.

### Phase 4: Autosuggest & Command Center *(Completed in v0.3.0)*
- [x] **Intelligent Omnibar Autosuggest**:
  - Multi-source frecency ranking engine evaluating Runestone bookmarks, visited history, and developer portals.
  - Scoring factors: exact domain match (+150), prefix match (+110), full URL substring (+75), title match (+55), bookmark intent (+40), visit frequency (+8 per visit up to +40), and recency decay.
  - Keyboard navigation (`ArrowDown`/`ArrowUp`) with live URL bar auto-population and runic badges (`ᛚ RUNESTONE`, `ᚺ HISTORY`, `ᛟ GATEWAY`, `ᛋ SEARCH`).
- [x] **Hliðskjálf Command Palette**:
  - Editor-grade modal command center accessible via dedicated trigger on the left pane (above tabs) and via `Ctrl+K` / `Ctrl+Shift+P`.
  - Categorized actions: Tabs & Navigation, Wisdom & Ravens, Viewports & Tools, The Nine Realms, and System & Wards.
- [x] **Cosmic Realm Highlighting & Lore Refinement**:
  - Synchronized active realm state with bound tab workspaces.
  - Active realm indicators with distinct accent glows, borders, and pulsing runic status dots.
  - Expanded lore layout removing truncation on ruler titles, quotes, and Hávamál verses.

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Ctrl + Shift + P` | Open **Hliðskjálf Command Palette** |
| `Ctrl + T` | Open New Tab (Branch of Yggdrasil) |
| `Ctrl + W` | Sever Active Tab Thread |
| `Ctrl + L` | Focus **Mímisbrunnr (Omnibar)** |
| `Ctrl + H` / `Ctrl + I` | Summon **Huginn AI Scout** |
| `Ctrl + M` | Open **Muninn's Memory Vault** |
| `Ctrl + \` / `Ctrl + U` | Toggle **Odin's Split-Gaze** (Dual Viewports) |
| `Escape` | Dismiss Active Modal, Command Palette, or AI Drawer |

---

## 🛠️ Development Setup (Windows)

### Prerequisites
* **Node.js**: `v20+` (Recommended `v22+`)
* **Rust**: `1.80+` with the `x86_64-pc-windows-msvc` target
* **Build Tools**: Visual Studio C++ Build Tools (with Windows 10/11 SDK)
* **WebView2**: Standard on modern Windows 10/11 systems

### Quick Start
```bash
# 1. Install frontend dependencies
npm install

# 2. Compile UI bundle
npm run build:ui

# 3. Launch full native browser application (Rust + Wry + React)
cargo run --manifest-path src-rust/Cargo.toml
```

### Building for Release
```bash
# Build production UI bundle
npm run build:ui

# Compile optimized native Windows binary
cargo build --release --manifest-path src-rust/Cargo.toml
```

---

<div align="center">
  <sub>Forged in the roots of Yggdrasil. Protected by the wisdom of Mímir.</sub>
</div>
