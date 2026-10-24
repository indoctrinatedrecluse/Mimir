import React, { useEffect, useState } from 'react';
import { MimirSigil } from '@/components/brand/MimirSigil';
import { YggdrasilRootsSvg, ValknutSvg, ElderFutharkBanner } from '@/components/themes/NorsePatterns';
import { runicAudio } from '@/core/audio/runicAudio';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { rune: 'ᚱ', text: 'Communing with the subterranean roots of Yggdrasil...' },
  { rune: 'ᚨ', text: 'Awakening Huginn & Muninn (Thought & Memory)...' },
  { rune: 'ᛏ', text: 'Attuning the Bifröst crystal conduit & Nine Realms...' },
  { rune: 'ᚦ', text: 'Inscribing Runic Wards & Pre-warming Sanctum...' },
  { rune: 'ᛗ', text: 'Drinking from Mímisbrunnr... Sanctum Ready.' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    runicAudio.playRunicHum();

    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgress(35);
    }, 750);

    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgress(60);
    }, 1500);

    const t3 = setTimeout(() => {
      setStepIndex(3);
      setProgress(85);
    }, 2300);

    const t4 = setTimeout(() => {
      setStepIndex(4);
      setProgress(100);
      runicAudio.playChime();
    }, 3100);

    const t5 = setTimeout(() => {
      onComplete();
    }, 3800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between select-none overflow-hidden bg-[#04060a]"
      onClick={onComplete}
    >
      {/* Background Animated Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Aurora Borealis Light Wave */}
        <div className="absolute -top-32 inset-x-0 h-96 bg-gradient-to-r from-cyan-500/20 via-purple-600/25 to-amber-500/15 blur-3xl animate-aurora" />

        {/* Faint Stave in Background */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 text-cyan-400 scale-150 pointer-events-none">
          <ValknutSvg size={500} />
        </div>

        {/* Yggdrasil Subterranean Roots */}
        <div className="absolute bottom-0 inset-x-0 h-72 opacity-25 text-cyan-400">
          <YggdrasilRootsSvg className="w-full h-full object-cover" />
        </div>

        {/* Top & Bottom Futhark Engravings */}
        <div className="absolute top-3 inset-x-0 opacity-20">
          <ElderFutharkBanner />
        </div>
        <div className="absolute bottom-3 inset-x-0 opacity-20">
          <ElderFutharkBanner />
        </div>
      </div>

      {/* Top Sigil Watermark */}
      <div className="relative z-10 pt-10 text-center">
        <span className="text-[10px] font-mono tracking-[0.35em] text-slate-500 uppercase">
          ᚱ ÁSGARÐR • MIÐGARÐR • HELHEIMR ᚱ
        </span>
      </div>

      {/* Centerpiece: Animated Mímir Sigil & Identity */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        {/* Animated Sigil with Rotating Dials */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <MimirSigil size={130} animated={true} showRings={true} />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ letterSpacing: '0.6em', opacity: 0 }}
          animate={{ letterSpacing: '0.35em', opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300 uppercase tracking-[0.35em]"
        >
          M Í M I R
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-xs font-mono tracking-widest text-slate-400"
        >
          KEEPER OF THE SACRED WELL • RUNIC BROWSER
        </motion.p>

        {/* Boot Telemetry Indicator */}
        <div className="mt-8 flex flex-col items-center w-80">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2 text-[11px] font-mono text-cyan-400/90"
            >
              <span className="text-sm font-bold text-amber-400">
                {BOOT_STEPS[stepIndex].rune}
              </span>
              <span>{BOOT_STEPS[stepIndex].text}</span>
            </motion.div>
          </AnimatePresence>

          {/* Progress Conduit Bar */}
          <div className="mt-3 h-1 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 shadow-[0_0_10px_rgba(0,245,255,0.7)]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 pb-8 text-center">
        <span className="text-[9px] font-mono tracking-wider text-slate-500 hover:text-slate-400 cursor-pointer">
          [PRESS ESC OR CLICK TO ENTER]
        </span>
      </div>
    </motion.div>
  );
};
