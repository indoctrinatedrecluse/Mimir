/**
 * Runic Audio Synthesizer
 * Uses the Web Audio API to synthesize crisp, low-latency gamer audio cues
 * without relying on external media files.
 */
class RunicAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const saved = localStorage.getItem('mimir_sfx_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25; // Gentle ambient volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('mimir_sfx_enabled', String(val));
  }

  public toggleAudio(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playChime();
    }
    return this.enabled;
  }

  /**
   * Crisp, tactile mechanical switch click (for buttons & tabs)
   */
  public playClick(freq = 800) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /**
   * Low runic hum / portal pulse (for realm transitions and Omnibar focus)
   */
  public playRunicHum() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Crystal shimmer chime (for Mímisbrunnr wisdom / search action)
   */
  public playChime() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 triad chord
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.03);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22 + idx * 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + idx * 0.03);
      osc.stop(this.ctx.currentTime + 0.25 + idx * 0.03);
    });
  }

  /**
   * Quick whoosh / close sound (for tab closing)
   */
  public playTabClose() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  // ==========================================
  // GJALLARHORN PROCEDURAL AMBIENT SOUNDSCAPES
  // ==========================================
  private ambientGain: GainNode | null = null;
  private ambientSources: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private ambientEnabled: boolean = false;
  private ambientVolume: number = 0.18;
  private currentAmbientRealm: string | null = null;

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
    }
  }

  public toggleAmbient(realm: string): boolean {
    if (this.ambientEnabled) {
      this.stopAmbient();
    } else {
      this.startAmbient(realm);
    }
    return this.ambientEnabled;
  }

  public updateAmbientRealm(realm: string) {
    if (this.ambientEnabled && this.currentAmbientRealm !== realm) {
      this.startAmbient(realm);
    }
  }

  public stopAmbient() {
    this.ambientEnabled = false;
    this.currentAmbientRealm = null;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    }
    setTimeout(() => {
      this.ambientSources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      });
      this.ambientSources = [];
    }, 450);
  }

  public startAmbient(realm: string) {
    this.initContext();
    if (!this.ctx) return;

    // Clean previous ambient sources
    this.ambientSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    this.ambientSources = [];

    this.ambientEnabled = true;
    this.currentAmbientRealm = realm;

    if (!this.ambientGain) {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.connect(this.ctx.destination);
    }

    this.ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(this.ambientVolume, this.ctx.currentTime + 0.8);

    const now = this.ctx.currentTime;

    // Generate White Noise Buffer for atmospheric winds / fire / water
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();

    // Realm-specific elemental tuning
    if (realm === 'asgard') {
      // Golden Harmonic Drone (432Hz & 648Hz sacred fifth)
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(450, now);
      noiseGain.gain.setValueAtTime(0.02, now);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(216, now); // Low A
      osc2.frequency.setValueAtTime(324, now); // Pure 5th E

      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.04, now);

      osc1.connect(toneGain);
      osc2.connect(toneGain);
      toneGain.connect(this.ambientGain);

      osc1.start();
      osc2.start();
      this.ambientSources.push(osc1, osc2);
    } else if (realm === 'muspelheim') {
      // Volcanic rumble & fire crackle
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(180, now);
      noiseFilter.Q.setValueAtTime(2.0, now);
      noiseGain.gain.setValueAtTime(0.08, now);

      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(55, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.04, now);

      subOsc.connect(subGain);
      subGain.connect(this.ambientGain);
      subOsc.start();
      this.ambientSources.push(subOsc);
    } else if (realm === 'jotunheim') {
      // Sub-zero whistling glacial winds
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(420, now);
      noiseFilter.Q.setValueAtTime(3.5, now);
      noiseGain.gain.setValueAtTime(0.07, now);
    } else if (realm === 'vanaheim') {
      // Gentle nature breeze & high chime drone (528Hz Love/Nature frequency)
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(350, now);
      noiseGain.gain.setValueAtTime(0.04, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now);
      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.015, now);

      osc.connect(toneGain);
      toneGain.connect(this.ambientGain);
      osc.start();
      this.ambientSources.push(osc);
    } else if (realm === 'helheim') {
      // Subterranean underworld cavern hum
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(90, now);
      noiseGain.gain.setValueAtTime(0.09, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(42, now);
      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.05, now);

      osc.connect(toneGain);
      toneGain.connect(this.ambientGain);
      osc.start();
      this.ambientSources.push(osc);
    } else if (realm === 'nidavellir') {
      // Dwarven forge anvil drone (110Hz + warm lowpass noise)
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(240, now);
      noiseFilter.Q.setValueAtTime(1.5, now);
      noiseGain.gain.setValueAtTime(0.06, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.03, now);

      osc.connect(toneGain);
      toneGain.connect(this.ambientGain);
      osc.start();
      this.ambientSources.push(osc);
    } else {
      // Midgard, Alfheim, Niflheim: Soothing rain & gentle cosmic tide
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(260, now);
      noiseGain.gain.setValueAtTime(0.05, now);
    }

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);

    whiteNoise.start();
    this.ambientSources.push(whiteNoise);
  }
}

export const runicAudio = new RunicAudioEngine();

