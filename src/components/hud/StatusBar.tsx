import React, { useState } from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { RealmId } from '@/types';
import { REALMS } from '@/core/realms';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { NorseKnotworkRibbon } from '@/components/themes/NorsePatterns';
import { ShieldCheck, Radio, Activity, Volume2, VolumeX, Cpu } from 'lucide-react';

interface StatusBarProps {
  activeRealm: RealmId;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeRealm }) => {
  const [isAudioOn, setIsAudioOn] = useState(runicAudio.isEnabled());
  const [shieldCount] = useState(64);

  const currentRealm = REALMS[activeRealm];
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;

  const toggleSound = () => {
    const nextState = runicAudio.toggleAudio();
    setIsAudioOn(nextState);
  };

  return (
    <footer className="relative z-20 flex h-6 w-full select-none items-center justify-between border-t border-white/5 bg-[#05070d] px-3 text-[10px] text-slate-500">
      {/* Subtle knotwork top border */}
      <div className="absolute top-0 inset-x-0 h-[1px] opacity-20 pointer-events-none" style={{ color: theme.accentColor }}>
        <NorseKnotworkRibbon opacity={0.3} />
      </div>

      {/* Left Telemetry: Runic Ward & Shields */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <ShieldCheck className="h-3 w-3" />
          <span className="font-semibold text-slate-300">Aegis Ward:</span>
          <span className="font-mono text-emerald-400">{shieldCount} Banished</span>
        </div>

        <div className="h-2.5 w-[1px] bg-white/10" />

        <div className="flex items-center space-x-1.5">
          <Radio className="h-3 w-3 text-cyan-400" />
          <span className="font-medium text-slate-400">Gjallarhorn:</span>
          <span className="text-slate-400">Harmonized</span>
        </div>
      </div>

      {/* Right Telemetry: Bifröst, RAM, Audio Toggle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <Activity className="h-3 w-3" style={{ color: theme.accentColor }} />
          <span>Bifröst:</span>
          <span className="font-mono" style={{ color: theme.accentColor }}>
            14ms ({currentRealm.norseName})
          </span>
        </div>

        <div className="h-2.5 w-[1px] bg-white/10" />

        <div className="flex items-center space-x-1.5">
          <Cpu className="h-3 w-3 text-amber-400" />
          <span>Footprint:</span>
          <span className="font-mono text-amber-300/90">~38MB</span>
        </div>

        <div className="h-2.5 w-[1px] bg-white/10" />

        {/* Audio FX Toggle */}
        <button
          onClick={toggleSound}
          className={`flex items-center space-x-1 rounded px-1.5 py-0.5 transition-colors ${
            isAudioOn ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-slate-600 hover:text-slate-400'
          }`}
          title={isAudioOn ? 'Runic Audio SFX: Active' : 'Runic Audio SFX: Muted'}
        >
          {isAudioOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          <span className="font-mono uppercase">{isAudioOn ? 'SFX ON' : 'MUTED'}</span>
        </button>
      </div>
    </footer>
  );
};
