import { RealmId } from '@/types';

export interface BifrostPortal {
  id: string;
  title: string;
  norseTitle: string;
  url: string;
  rune: string;
  icon: string;
  category?: string;
  pinned?: boolean;
}

export interface NorseTimeState {
  timeString: string;
  hourRune: string;
  secondsRune: string;
  hour: number;
  minute: number;
  second: number;
}

export interface NorseDateState {
  dayName: string;
  dayNorse: string;
  dayMeaning: string;
  monthNorse: string;
  seasonNorse: string;
  gregorianFormatted: string;
  moonPhaseRune: string;
  moonPhaseName: string;
}

export interface RealmAtmosphereTelemetry {
  condition: string;
  fluxLabel: string;
  fluxValue: string;
  etherResonance: string;
  weatherQuote: string;
  runicHarmonic: string;
}

const STORAGE_KEY = 'mimir_bifrost_speed_dials';

// 24 Elder Futhark runes mapped to 0..23 hours
export const HOUR_RUNES = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ',
  'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ',
  'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ',
];

export const NORSE_DAYS = [
  { name: 'Sunday', norse: 'Sunnudagr', meaning: 'Day of Sunna (Sun Goddess)' },
  { name: 'Monday', norse: 'Mánadagr', meaning: 'Day of Máni (Moon God)' },
  { name: 'Tuesday', norse: 'Týsdagr', meaning: 'Day of Týr (Valor & Victory)' },
  { name: 'Wednesday', norse: 'Óðinsdagr', meaning: 'Day of Odin (The All-Father)' },
  { name: 'Thursday', norse: 'Þórsdagr', meaning: 'Day of Thor (Lord of Thunder)' },
  { name: 'Friday', norse: 'Frjádagr', meaning: 'Day of Frigg (Queen of Sanctum)' },
  { name: 'Saturday', norse: 'Laugardagr', meaning: 'Day of Cleansing Waters' },
];

export const DEFAULT_PORTALS: BifrostPortal[] = [
  {
    id: 'portal-gh',
    title: 'GitHub',
    norseTitle: 'Forge of Code',
    url: 'https://github.com',
    rune: 'ᚲ',
    icon: 'Terminal',
    category: 'Development',
    pinned: true,
  },
  {
    id: 'portal-ddg',
    title: 'DuckDuckGo',
    norseTitle: 'Well of Search',
    url: 'https://duckduckgo.com',
    rune: 'ᛗ',
    icon: 'Compass',
    category: 'Knowledge',
    pinned: true,
  },
  {
    id: 'portal-rust',
    title: 'Rust Docs',
    norseTitle: 'Iron Lore',
    url: 'https://doc.rust-lang.org',
    rune: 'ᚱ',
    icon: 'BookOpen',
    category: 'Development',
    pinned: true,
  },
  {
    id: 'portal-yt',
    title: 'YouTube',
    norseTitle: 'Gjallarhorn Stream',
    url: 'https://youtube.com',
    rune: 'ᚹ',
    icon: 'Flame',
    category: 'Media',
    pinned: true,
  },
  {
    id: 'portal-crates',
    title: 'Crates.io',
    norseTitle: 'Runic Artifacts',
    url: 'https://crates.io',
    rune: 'ᚦ',
    icon: 'Code',
    category: 'Development',
  },
  {
    id: 'portal-wiki',
    title: 'Wikipedia',
    norseTitle: "All-Father's Lore",
    url: 'https://wikipedia.org',
    rune: 'ᚨ',
    icon: 'Globe',
    category: 'Knowledge',
  },
  {
    id: 'portal-hn',
    title: 'Hacker News',
    norseTitle: 'Mead Hall Inquiries',
    url: 'https://news.ycombinator.com',
    rune: 'ᚺ',
    icon: 'Sparkles',
    category: 'News',
  },
  {
    id: 'portal-arch',
    title: 'Arch Wiki',
    norseTitle: 'Sacred Codex',
    url: 'https://wiki.archlinux.org',
    rune: 'ᛚ',
    icon: 'Shield',
    category: 'Knowledge',
  },
];

type PortalListener = (portals: BifrostPortal[]) => void;

class BifrostManager {
  private portals: BifrostPortal[];
  private listeners: Set<PortalListener> = new Set();

  constructor() {
    this.portals = this.loadPortals();
  }

  private loadPortals(): BifrostPortal[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load Bifröst speed dials:', e);
    }
    return DEFAULT_PORTALS;
  }

  private savePortals() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.portals));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save Bifröst speed dials:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.portals]));
  }

  public getPortals(): BifrostPortal[] {
    return [...this.portals];
  }

  public addPortal(portalData: Omit<BifrostPortal, 'id'>): BifrostPortal {
    const newPortal: BifrostPortal = {
      ...portalData,
      id: `portal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.portals.push(newPortal);
    this.savePortals();
    return newPortal;
  }

  public updatePortal(updated: BifrostPortal): void {
    const idx = this.portals.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      this.portals[idx] = updated;
      this.savePortals();
    }
  }

  public removePortal(id: string): void {
    this.portals = this.portals.filter((p) => p.id !== id);
    this.savePortals();
  }

  public resetToDefaults(): BifrostPortal[] {
    this.portals = [...DEFAULT_PORTALS];
    this.savePortals();
    return this.portals;
  }

  public subscribe(listener: PortalListener): () => void {
    this.listeners.add(listener);
    listener([...this.portals]);
    return () => this.listeners.delete(listener);
  }

  // --- Runic Celestial Time & Calendar Engine ---

  public getNorseTime(date: Date = new Date()): NorseTimeState {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    const ss = String(second).padStart(2, '0');

    const hourRune = HOUR_RUNES[hour] || 'ᚠ';
    // Modulo 24 for seconds rune pulse
    const secondsRune = HOUR_RUNES[second % 24] || 'ᛋ';

    return {
      timeString: `${hh}:${mm}:${ss}`,
      hourRune,
      secondsRune,
      hour,
      minute,
      second,
    };
  }

  public getNorseDate(date: Date = new Date()): NorseDateState {
    const dayOfWeek = date.getDay(); // 0 is Sunday
    const dayInfo = NORSE_DAYS[dayOfWeek] || NORSE_DAYS[0];

    // Ancient Norse Month calculation (Approximate to classical Icelandic calendar)
    const month = date.getMonth(); // 0-11
    const dayOfMonth = date.getDate();

    let monthNorse = 'Gormánuður';
    let seasonNorse = 'Vetur (Winter)';

    // Calculation by month boundaries
    if ((month === 3 && dayOfMonth >= 14) || (month === 4 && dayOfMonth < 14)) {
      monthNorse = 'Harpa';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 4 && dayOfMonth >= 14) || (month === 5 && dayOfMonth < 13)) {
      monthNorse = 'Skerpla';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 5 && dayOfMonth >= 13) || (month === 6 && dayOfMonth < 13)) {
      monthNorse = 'Sólmánuður';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 6 && dayOfMonth >= 13) || (month === 7 && dayOfMonth < 15)) {
      monthNorse = 'Heyannir';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 7 && dayOfMonth >= 15) || (month === 8 && dayOfMonth < 14)) {
      monthNorse = 'Tvímánuður';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 8 && dayOfMonth >= 14) || (month === 9 && dayOfMonth < 14)) {
      monthNorse = 'Haustmánuður';
      seasonNorse = 'Sumar (Summer)';
    } else if ((month === 9 && dayOfMonth >= 14) || (month === 10 && dayOfMonth < 14)) {
      monthNorse = 'Gormánuður';
      seasonNorse = 'Vetur (Winter)';
    } else if ((month === 10 && dayOfMonth >= 14) || (month === 11 && dayOfMonth < 14)) {
      monthNorse = 'Ýlir';
      seasonNorse = 'Vetur (Winter)';
    } else if ((month === 11 && dayOfMonth >= 14) || (month === 0 && dayOfMonth < 13)) {
      monthNorse = 'Mörsugur';
      seasonNorse = 'Vetur (Winter)';
    } else if ((month === 0 && dayOfMonth >= 13) || (month === 1 && dayOfMonth < 12)) {
      monthNorse = 'Þorri';
      seasonNorse = 'Vetur (Winter)';
    } else if ((month === 1 && dayOfMonth >= 12) || (month === 2 && dayOfMonth < 14)) {
      monthNorse = 'Góa';
      seasonNorse = 'Vetur (Winter)';
    } else {
      monthNorse = 'Einmánuður';
      seasonNorse = 'Vetur (Winter)';
    }

    // Moon Phase (approximate cycle of 29.53 days)
    const baseDate = new Date(2000, 0, 6); // Known New Moon
    const diffDays = (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    const cycle = (diffDays % 29.53058867) / 29.53058867;

    let moonPhaseRune = 'ᛗ';
    let moonPhaseName = 'Full Máni';

    if (cycle < 0.125 || cycle >= 0.875) {
      moonPhaseRune = 'ᚾ';
      moonPhaseName = 'Ný Máni (New Moon)';
    } else if (cycle >= 0.125 && cycle < 0.375) {
      moonPhaseRune = 'ᚦ';
      moonPhaseName = 'Vaxandi Máni (Waxing)';
    } else if (cycle >= 0.375 && cycle < 0.625) {
      moonPhaseRune = 'ᛗ';
      moonPhaseName = 'Fullr Máni (Full Moon)';
    } else {
      moonPhaseRune = 'ᛋ';
      moonPhaseName = 'Þverrandi Máni (Waning)';
    }

    const gregorianFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      dayName: dayInfo.name,
      dayNorse: dayInfo.norse,
      dayMeaning: dayInfo.meaning,
      monthNorse,
      seasonNorse,
      gregorianFormatted,
      moonPhaseRune,
      moonPhaseName,
    };
  }

  // --- Dynamic Realm Atmospheric & Cosmic Telemetry ---

  public getRealmAtmosphere(realmId: RealmId): RealmAtmosphereTelemetry {
    switch (realmId) {
      case 'asgard':
        return {
          condition: 'Prismatic Bifröst Radiance',
          fluxLabel: 'Golden Solar Wind',
          fluxValue: '99.8 nT',
          etherResonance: '99.9%',
          weatherQuote: 'Heimdall’s clarion vigilance echoes over the gilded spires of Valhalla.',
          runicHarmonic: 'ᚨ • ASGARD_HEAVEN_ETHER',
        };
      case 'muspelheim':
        return {
          condition: 'Surtr Thermal Flare Wave',
          fluxLabel: 'Ember Core Temp',
          fluxValue: '1,840 K',
          etherResonance: '92.4%',
          weatherQuote: 'Primordial ember tempests swirl above the roaring rivers of liquid fire.',
          runicHarmonic: 'ᚲ • PYRO_PRIME_VOLATILITY',
        };
      case 'niflheim':
        return {
          condition: 'Glacial Élivágar Blizzard',
          fluxLabel: 'Cryo-Thermal Dip',
          fluxValue: '-184 °C',
          etherResonance: '96.2%',
          weatherQuote: 'Venomous mists freeze instantaneously in the fathomless primordial gloom.',
          runicHarmonic: 'ᚺ • CRYO_COSMIC_VOID',
        };
      case 'helheim':
        return {
          condition: 'Silent Fog of Gjöll',
          fluxLabel: 'Spectral Density',
          fluxValue: '0.04 nT',
          etherResonance: '99.1%',
          weatherQuote: 'The pale gates of Hela stand motionless beneath eternal cold starlight.',
          runicHarmonic: 'ᛖ • HELA_QUIETUDE_PLANE',
        };
      case 'jotunheim':
        return {
          condition: 'Rime Frost Tempest',
          fluxLabel: 'Ironwood Gale',
          fluxValue: '86 km/h',
          etherResonance: '91.8%',
          weatherQuote: 'Mountain titans dream beneath crushing glaciers carving black obsidian valleys.',
          runicHarmonic: 'ᚦ • JOTUN_COLOSSAL_DRIFT',
        };
      case 'alfheim':
        return {
          condition: 'Ljósálfar Starlight Harmonic',
          fluxLabel: 'Aetheric Frequency',
          fluxValue: '432 Hz',
          etherResonance: '99.7%',
          weatherQuote: 'Luminous light-elves weave threads of starlight through iridescent silver boughs.',
          runicHarmonic: 'ᛃ • ALFHEIM_LUMEN_HARMONY',
        };
      case 'nidavellir':
        return {
          condition: 'Subterranean Forge Surge',
          fluxLabel: 'Anvil Hydraulic Load',
          fluxValue: '14.2 MPa',
          etherResonance: '97.6%',
          weatherQuote: 'The hammers of Brokkr strike true against the singing meteoric iron.',
          runicHarmonic: 'ᚱ • DWARVEN_BASALT_PULSE',
        };
      case 'vanaheim':
        return {
          condition: 'Vanir Seed-Life Resonance',
          fluxLabel: 'Vital Leyline Flux',
          fluxValue: '528 Hz',
          etherResonance: '99.4%',
          weatherQuote: 'Fragrant emerald blossoms release spores of renewal over the sacred groves.',
          runicHarmonic: 'ᚹ • FREYA_VERDANT_BLOOM',
        };
      case 'midgard':
      default:
        return {
          condition: 'Aurora Borealis Equilibrium',
          fluxLabel: 'Ionospheric Flux',
          fluxValue: '412 nT',
          etherResonance: '98.5%',
          weatherQuote: 'Bifröst ribbons shimmer silently across the vast nocturnal skies of humankind.',
          runicHarmonic: 'ᛗ • MIDGARD_EARTH_ANCHOR',
        };
    }
  }
}

export const bifrostManager = new BifrostManager();
