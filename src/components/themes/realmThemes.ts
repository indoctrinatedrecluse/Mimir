import { RealmId } from '@/types';

export interface RealmThemeStyle {
  id: RealmId;
  title: string;
  norseTitle: string;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  knotworkColor: string;
  titlebarBg: string;
  portalBg: string;
  waterRipples: string;
  primaryRune: string;
  stave: 'aegishjalmr' | 'valknut' | 'roots';
}

export const REALM_THEMES: Record<RealmId, RealmThemeStyle> = {
  midgard: {
    id: 'midgard',
    title: 'Midgard',
    norseTitle: 'Miðgarðr',
    subtitle: 'The Twilight Bifröst Conduit (Heimdall)',
    accentColor: '#00f5ff',
    glowColor: 'rgba(0, 245, 255, 0.4)',
    knotworkColor: '#00f5ff',
    titlebarBg: 'linear-gradient(90deg, #070d18 0%, #0d1e30 40%, #091728 70%, #050a12 100%)',
    portalBg: 'radial-gradient(ellipse at top, #0c2136 0%, #07101c 50%, #04070c 100%)',
    waterRipples: 'rgba(0, 245, 255, 0.25)',
    primaryRune: 'ᛗ',
    stave: 'roots',
  },
  asgard: {
    id: 'asgard',
    title: 'Asgard',
    norseTitle: 'Ásgarðr',
    subtitle: 'Golden Citadel of the Gods (Odin)',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    knotworkColor: '#f59e0b',
    titlebarBg: 'linear-gradient(90deg, #181206 0%, #291e0a 40%, #1e1508 70%, #0c0803 100%)',
    portalBg: 'radial-gradient(ellipse at top, #2e2008 0%, #171004 50%, #0a0602 100%)',
    waterRipples: 'rgba(251, 191, 36, 0.25)',
    primaryRune: 'ᚨ',
    stave: 'valknut',
  },
  vanaheim: {
    id: 'vanaheim',
    title: 'Vanaheim',
    norseTitle: 'Vanaheimr',
    subtitle: 'Sacred Grove of the Vanir (Freya)',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    knotworkColor: '#059669',
    titlebarBg: 'linear-gradient(90deg, #061610 0%, #0d281e 40%, #091c15 70%, #040d0a 100%)',
    portalBg: 'radial-gradient(ellipse at top, #0f3024 0%, #071711 50%, #030a07 100%)',
    waterRipples: 'rgba(16, 185, 129, 0.25)',
    primaryRune: 'ᚹ',
    stave: 'roots',
  },
  alfheim: {
    id: 'alfheim',
    title: 'Alfheim',
    norseTitle: 'Álfheimr',
    subtitle: 'Luminous Sanctuary of Light (Freyr)',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    knotworkColor: '#0284c7',
    titlebarBg: 'linear-gradient(90deg, #071420 0%, #0e2740 40%, #091929 70%, #050b12 100%)',
    portalBg: 'radial-gradient(ellipse at top, #112d4a 0%, #081726 50%, #030910 100%)',
    waterRipples: 'rgba(56, 189, 248, 0.25)',
    primaryRune: 'ᛞ',
    stave: 'aegishjalmr',
  },
  jotunheim: {
    id: 'jotunheim',
    title: 'Jotunheim',
    norseTitle: 'Jötunheimr',
    subtitle: 'Glacial Peaks of the Frost Giants (Laufey)',
    accentColor: '#93c5fd',
    glowColor: 'rgba(147, 197, 253, 0.4)',
    knotworkColor: '#60a5fa',
    titlebarBg: 'linear-gradient(90deg, #07111e 0%, #0d2238 40%, #0a1b2d 70%, #040a12 100%)',
    portalBg: 'radial-gradient(ellipse at top, #112b45 0%, #081624 50%, #03080e 100%)',
    waterRipples: 'rgba(147, 197, 253, 0.25)',
    primaryRune: 'ᛁ',
    stave: 'aegishjalmr',
  },
  muspelheim: {
    id: 'muspelheim',
    title: 'Muspelheim',
    norseTitle: 'Múspellsheimr',
    subtitle: 'Primordial Fire Forge (Surtr)',
    accentColor: '#fb7185',
    glowColor: 'rgba(251, 113, 133, 0.45)',
    knotworkColor: '#e11d48',
    titlebarBg: 'linear-gradient(90deg, #1e090e 0%, #351019 40%, #240b11 70%, #0f0306 100%)',
    portalBg: 'radial-gradient(ellipse at top, #3d101a 0%, #1d070b 50%, #0b0204 100%)',
    waterRipples: 'rgba(251, 113, 133, 0.25)',
    primaryRune: 'ᚲ',
    stave: 'valknut',
  },
  niflheim: {
    id: 'niflheim',
    title: 'Niflheim',
    norseTitle: 'Niflheimr',
    subtitle: 'Realm of Mist & Primordial Serpents (Níðhöggr)',
    accentColor: '#67e8f9',
    glowColor: 'rgba(103, 232, 249, 0.4)',
    knotworkColor: '#06b6d4',
    titlebarBg: 'linear-gradient(90deg, #051417 0%, #0a262c 40%, #071c20 70%, #030a0c 100%)',
    portalBg: 'radial-gradient(ellipse at top, #0f343b 0%, #06191c 50%, #02090b 100%)',
    waterRipples: 'rgba(103, 232, 249, 0.25)',
    primaryRune: 'ᚺ',
    stave: 'roots',
  },
  nidavellir: {
    id: 'nidavellir',
    title: 'Nidavellir',
    norseTitle: 'Niðavellir',
    subtitle: 'Subterranean Forges of the Dwarves (Brokkr & Sindri)',
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.45)',
    knotworkColor: '#ea580c',
    titlebarBg: 'linear-gradient(90deg, #1b0e06 0%, #31190a 40%, #221208 70%, #0d0603 100%)',
    portalBg: 'radial-gradient(ellipse at top, #381b0a 0%, #1c0d04 50%, #0a0502 100%)',
    waterRipples: 'rgba(251, 146, 60, 0.25)',
    primaryRune: 'ᛏ',
    stave: 'valknut',
  },
  helheim: {
    id: 'helheim',
    title: 'Helheim',
    norseTitle: 'Helheimr',
    subtitle: 'Shadows of the Underworld & Stealth Ward (Hel)',
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    knotworkColor: '#9333ea',
    titlebarBg: 'linear-gradient(90deg, #130920 0%, #23113b 40%, #170b28 70%, #0a0412 100%)',
    portalBg: 'radial-gradient(ellipse at top, #2b1348 0%, #140924 50%, #08030e 100%)',
    waterRipples: 'rgba(192, 132, 252, 0.25)',
    primaryRune: 'ᛈ',
    stave: 'aegishjalmr',
  },
};

