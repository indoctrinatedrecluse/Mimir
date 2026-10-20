import React, { useState } from 'react';
import { runicAudio } from '@/core/audio/runicAudio';
import { ShieldCheck, Radio, Activity, Volume2, VolumeX, Cpu } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [isAudioOn, setIsAudioOn] = useState(runicAudio.isEnabled());
  const [shieldCount] = useState(48);

  const toggleSound = () => {
    const nextState = runicAudio.toggleAudio();
    setIsAudioOn(nextState);
  };

  return (
    <footer className="relative z-20 flex h-6 w-full select-none items-center justify-between border-t border-white/5 bg-[#06090f] px-3 text-[10px] text-slate-500">
      {/* Left Telemetry: Runic Ward & Shields */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <ShieldCheck className="h-3 w-3" />
          <span className="font-semibold text-slate-300">Runic Ward:</span>
          <span className="font-mono text-emerald-400">{shieldCount} Deflected</span>
        </div>

        <div className="h-2.5 w-[1px] bg-white/10" />

        <div className="flex items-center space-x-1.5">
          <Radio className="h-3 w-3 text-cyan-400" />
          <span className="font-medium text-slate-400">Gjallarhorn:</span>
          <span className="text-slate-500">Standby</span>
        </div>
      </div>

      {/* Right Telemetry: Bifröst, RAM, Audio Toggle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span>Bifröst:</span>
          <span className="font-mono text-cyan-300">16ms</span>
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
