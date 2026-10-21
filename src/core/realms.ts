import { Realm, RealmId } from '@/types';

export const REALMS: Record<RealmId, Realm> = {
  midgard: {
    id: 'midgard',
    name: 'Midgard',
    norseName: 'Miðgarðr',
    rune: 'ᛗ',
    ruler: 'Heimdall',
    rulerTitle: 'Guardian of the Bifröst',
    description: 'The Mortal Sphere — Everyday Navigation, Public Web & Bifröst Gateway',
    accentColor: '#00f5ff', // Bifröst Cyan
    bgUrl: '/realms/midgard.jpg',
    quote: 'He hears the grass grow in the ground and wool upon the sheep.',
  },
  asgard: {
    id: 'asgard',
    name: 'Asgard',
    norseName: 'Ásgarðr',
    rune: 'ᚨ',
    ruler: 'Odin',
    rulerTitle: 'Allfather & Sovereign of the Æsir',
    description: 'The Golden Citadel — Deep Engineering, Research, Documentation & Code',
    accentColor: '#fbbf24', // Valhalla Gold
    bgUrl: '/realms/asgard.jpg',
    quote: 'Gaze upon the nine worlds from Hliðskjálf; eternal wisdom demands its sacrifice.',
  },
  vanaheim: {
    id: 'vanaheim',
    name: 'Vanaheim',
    norseName: 'Vanaheimr',
    rune: 'ᚹ',
    ruler: 'Freya',
    rulerTitle: 'Queen of the Vanir & Lady of Fólkvangr',
    description: 'The Verdant Realm — Media, Streaming, High-Fidelity Audio & Nature',
    accentColor: '#10b981', // Vanir Emerald
    bgUrl: '/realms/vanaheim.jpg',
    quote: 'The wild magic of the Vanir breathes golden warmth into song and vision.',
  },
  alfheim: {
    id: 'alfheim',
    name: 'Alfheim',
    norseName: 'Álfheimr',
    rune: 'ᛞ',
    ruler: 'Freyr',
    rulerTitle: 'Lord of the Light Elves & Sun King',
    description: 'The Luminous Sanctuary — Typography, Design, Minimalist Reading & Art',
    accentColor: '#38bdf8', // Luminous Frost Blue
    bgUrl: '/realms/alfheim.jpg',
    quote: 'Clear crystal light banishes every shadow and sharpens the intellect.',
  },
  jotunheim: {
    id: 'jotunheim',
    name: 'Jotunheim',
    norseName: 'Jötunheimr',
    rune: 'ᛁ',
    ruler: 'Laufey',
    rulerTitle: 'Queen of the Frost Giants',
    description: 'The Glacial Peaks — Cold Storage, Archives, Data Heavyweight & Caches',
    accentColor: '#93c5fd', // Glacial Frost Ice
    bgUrl: '/realms/jotunheim.jpg',
    quote: 'Ancient glaciers endure unbroken long after empires crumble into snow.',
  },
  muspelheim: {
    id: 'muspelheim',
    name: 'Muspelheim',
    norseName: 'Múspellsheimr',
    rune: 'ᚲ',
    ruler: 'Surtr',
    rulerTitle: 'Lord of the Fire Giants & World Burner',
    description: 'The Primordial Fire Forge — High-Performance Cloud Gaming & 3D WebGL',
    accentColor: '#f43f5e', // Primordial Ember
    bgUrl: '/realms/muspelheim.jpg',
    quote: 'His flaming sword blazes brighter than the noon sun across the cosmos.',
  },
  niflheim: {
    id: 'niflheim',
    name: 'Niflheim',
    norseName: 'Niflheimr',
    rune: 'ᚺ',
    ruler: 'Níðhöggr',
    rulerTitle: 'The Root Gnawer & Primordial Serpent',
    description: 'The Realm of Mists — Deep Network Analysis, DevTools, Threat Probing & Proxies',
    accentColor: '#67e8f9', // Toxic Venom Mist
    bgUrl: '/realms/niflheim.jpg',
    quote: 'Beneath the sacred roots of Yggdrasil, the ancient dragon watches through the fog.',
  },
  nidavellir: {
    id: 'nidavellir',
    name: 'Nidavellir',
    norseName: 'Niðavellir',
    rune: 'ᛏ',
    ruler: 'Brokkr & Sindri',
    rulerTitle: 'Master Smiths of Mjölnir & Draupnir',
    description: 'The Underground Forges — Extensions, Custom Scripts, WebAssembly & Compilers',
    accentColor: '#f97316', // Molten Bronze Anvil
    bgUrl: '/realms/nidavellir.jpg',
    quote: 'Strike the anvil while the furnace roars; relics of legendary power take form.',
  },
  helheim: {
    id: 'helheim',
    name: 'Helheim',
    norseName: 'Helheimr',
    rune: 'ᛈ',
    ruler: 'Hel',
    rulerTitle: 'Sovereign of the Underworld',
    description: 'The Shadow Realm — Zero-Trace Incognito, Ephemeral Identity & Ghost Shield',
    accentColor: '#c084fc', // Spectral Amethyst
    bgUrl: '/realms/helheim.jpg',
    quote: 'No footprint lingers in the hall of mist; all traces perish at the iron gates.',
  },
};

