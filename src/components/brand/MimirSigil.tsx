import React from 'react';

interface MimirSigilProps {
  size?: number;
  animated?: boolean;
  showRings?: boolean;
  className?: string;
  glowColor?: string;
}

export const MimirSigil: React.FC<MimirSigilProps> = ({
  size = 64,
  animated = true,
  showRings = true,
  className = '',
  glowColor = 'rgba(0, 245, 255, 0.6)',
}) => {
  const outerRunes = "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛋ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ";

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Rotating Stave Dial */}
      {showRings && (
        <svg
          className={`absolute inset-0 w-full h-full pointer-events-none opacity-40 ${
            animated ? 'animate-spin-slow' : ''
          }`}
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Outer Dashed Compass Ring */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="url(#bifrostRingGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Cardinal runic notch marks */}
          <line x1="50" y1="2" x2="50" y2="8" stroke="#00f5ff" strokeWidth="1.5" />
          <line x1="50" y1="92" x2="50" y2="98" stroke="#a855f7" strokeWidth="1.5" />
          <line x1="2" y1="50" x2="8" y2="50" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="92" y1="50" x2="98" y2="50" stroke="#10b981" strokeWidth="1.5" />

          {/* 45-degree angle tick marks */}
          <line x1="16" y1="16" x2="20" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="84" y1="16" x2="80" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="16" y1="84" x2="20" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="84" y1="84" x2="80" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
        </svg>
      )}

      {/* Inner Counter-Rotating Dial */}
      {showRings && (
        <svg
          className={`absolute inset-0 w-full h-full pointer-events-none opacity-30 ${
            animated ? 'animate-spin-reverse' : ''
          }`}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="url(#bifrostInnerGrad)"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          {/* 8-point subtle constellation dots */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <circle
              key={deg}
              cx={50 + 38 * Math.cos((deg * Math.PI) / 180)}
              cy={50 + 38 * Math.sin((deg * Math.PI) / 180)}
              r="1.2"
              fill="#00f5ff"
            />
          ))}
        </svg>
      )}

      {/* Core Glowing Sigil (Mannaz / Mímir 'ᛗ' with Bifröst Chromatic Gradient) */}
      <div
        className={`relative flex items-center justify-center ${
          animated ? 'animate-runic-breathe' : ''
        }`}
        style={{
          width: size * 0.72,
          height: size * 0.72,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich multi-stop Bifröst chromatic gradient */}
            <linearGradient id="bifrostMimirGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />     {/* Bifröst Cyan */}
              <stop offset="35%" stopColor="#818cf8" />    {/* Mystic Indigo */}
              <stop offset="70%" stopColor="#c084fc" />    {/* Helheim Purple */}
              <stop offset="100%" stopColor="#fbbf24" />   {/* Valhalla Gold */}
            </linearGradient>

            <linearGradient id="bifrostRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="bifrostInnerGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#00f5ff" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="mimirGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Chiseled Hexagonal Medallion */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="#090e18"
            fillOpacity="0.85"
            stroke="url(#bifrostMimirGrad)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* The Runic 'ᛗ' (Mannaz) Glyph - Geometric & Chiseled */}
          <g filter="url(#mimirGlow)" stroke="url(#bifrostMimirGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            {/* Left vertical staff */}
            <line x1="28" y1="22" x2="28" y2="78" />
            {/* Right vertical staff */}
            <line x1="72" y1="22" x2="72" y2="78" />
            {/* Diagonal cross from tops to midpoints and bottoms */}
            <polyline points="28,22 72,50 28,78" strokeWidth="4.5" strokeOpacity="0.75" />
            <polyline points="72,22 28,50 72,78" strokeWidth="4.5" strokeOpacity="0.75" />
            {/* High-visibility primary cross */}
            <line x1="28" y1="22" x2="72" y2="60" strokeWidth="5.5" />
            <line x1="72" y1="22" x2="28" y2="60" strokeWidth="5.5" />
          </g>

          {/* Central Eye of Wisdom Core Dot */}
          <circle cx="50" cy="41" r="3.5" fill="#00f5ff" />
          <circle cx="50" cy="41" r="1.5" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
};
