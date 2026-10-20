import { Realm, RealmId } from '@/types';

export const REALMS: Record<RealmId, Realm> = {
  midgard: {
    id: 'midgard',
    name: 'Midgard',
    norseName: 'Miðgarðr',
    rune: 'ᛗ',
    description: 'The Mortal Sphere — Everyday Navigation & General Web',
    accentColor: '#00f5ff', // Bifröst Cyan
  },
  asgard: {
    id: 'asgard',
    name: 'Asgard',
    norseName: 'Ásgarðr',
    rune: 'ᚨ',
    description: 'The Golden Realm — Development, Research & High Engineering',
    accentColor: '#fbbf24', // Valhalla Gold
  },
  vanaheim: {
    id: 'vanaheim',
    name: 'Vanaheim',
    norseName: 'Vanaheimr',
    rune: 'ᚹ',
    description: 'The Verdant Realm — Media, Streaming & High-Fidelity Audio',
    accentColor: '#10b981', // Asgard Emerald
  },
  alfheim: {
    id: 'alfheim',
    name: 'Alfheim',
    norseName: 'Álfheimr',
    rune: 'ᛞ',
    description: 'The Luminous Realm — Typography, Reading & Minimalist Focus',
    accentColor: '#38bdf8', // Frost Blue
  },
  helheim: {
    id: 'helheim',
    name: 'Helheim',
    norseName: 'Helheimr',
    rune: 'ᚺ',
    description: 'The Frozen Abyss — Zero-Trace Incognito & Ephemeral Browsing',
    accentColor: '#a855f7', // Helheim Amethyst
  },
  muspelheim: {
    id: 'muspelheim',
    name: 'Muspelheim',
    norseName: 'Múspellsheimr',
    rune: 'ᚲ',
    description: 'The Forge of Fire — High-Performance Cloud Gaming & 3D Web',
    accentColor: '#f43f5e', // Muspelheim Ember
  },
};
