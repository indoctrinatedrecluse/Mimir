import React from 'react';

/**
 * Continuous interlocking Norse knotwork ribbon for borders and titlebars
 */
export const NorseKnotworkRibbon: React.FC<{ className?: string; opacity?: number }> = ({
  className = '',
  opacity = 0.35,
}) => {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      width="100%"
      height="12"
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <pattern id="norseKnotPattern" width="40" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M0 6 C5 1, 15 1, 20 6 C25 11, 35 11, 40 6 M0 6 C5 11, 15 11, 20 6 C25 1, 35 1, 40 6 M10 1 L30 11 M10 11 L30 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="6" r="1.5" fill="currentColor" />
      </pattern>
      <rect width="100%" height="12" fill="url(#norseKnotPattern)" />
    </svg>
  );
};

/**
 * Full Elder Futhark runic sequence ribbon
 */
export const ElderFutharkBanner: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = 'currentColor',
}) => {
  const futhark = "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛋ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ";
  return (
    <div
      className={`pointer-events-none select-none flex overflow-hidden whitespace-nowrap font-mono text-[11px] tracking-[0.35em] ${className}`}
      style={{ color }}
    >
      <span className="opacity-40">{futhark}</span>
      <span className="opacity-40 ml-8">{futhark}</span>
      <span className="opacity-40 ml-8">{futhark}</span>
    </div>
  );
};

/**
 * The Helm of Awe (Ægishjálmr) - Ancient Icelandic/Norse stave of invincible protection
 */
export const AegishjalmrSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 8-spoke central cross */}
      <line x1="50" y1="8" x2="50" y2="92" />
      <line x1="8" y1="50" x2="92" y2="50" />
      <line x1="20" y1="20" x2="80" y2="80" />
      <line x1="80" y1="20" x2="20" y2="80" />

      {/* Trident prongs on spokes */}
      {/* North */}
      <path d="M42 22 L50 14 L58 22 M44 28 L50 22 L56 28 M46 34 L50 30 L54 34" />
      {/* South */}
      <path d="M42 78 L50 86 L58 78 M44 72 L50 78 L56 72 M46 66 L50 70 L54 66" />
      {/* East */}
      <path d="M78 42 L86 50 L78 58 M72 44 L78 50 L72 56 M66 46 L70 50 L66 54" />
      {/* West */}
      <path d="M22 42 L14 50 L22 58 M28 44 L22 50 L28 56 M34 46 L30 50 L34 54" />

      {/* Diagonal prongs */}
      <path d="M25 35 L20 20 L35 25 M75 35 L80 20 L65 25 M25 65 L20 80 L35 75 M75 65 L80 80 L65 75" />

      {/* Central ring */}
      <circle cx="50" cy="50" r="5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
};

/**
 * The Valknut - Knot of the Slain / Triple interlocking triangles
 */
export const ValknutSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="50,15 82,72 18,72" strokeOpacity="0.85" />
      <polygon points="36,36 84,36 60,84" strokeOpacity="0.85" />
      <polygon points="64,36 16,36 40,84" strokeOpacity="0.85" />
    </svg>
  );
};

/**
 * Yggdrasil - The World Tree Silhouette with cosmic canopy and deep roots
 */
export const YggdrasilRootsSvg: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rootGrad" x1="300" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Deep Entangled Roots of Yggdrasil descending into Mímisbrunnr */}
      <g stroke="url(#rootGrad)" strokeWidth="2.5" strokeLinecap="round">
        {/* Main trunk base */}
        <path d="M290 0 C285 60 260 110 210 160 C170 200 110 240 40 280" />
        <path d="M310 0 C315 60 340 110 390 160 C430 200 490 240 560 280" />
        <path d="M300 0 C300 80 295 140 280 200 C270 240 240 270 200 300" />
        <path d="M300 0 C300 80 305 140 320 200 C330 240 360 270 400 300" />

        {/* Tributary Root Tendrils */}
        <path d="M250 120 C220 150 170 170 120 180 C80 190 30 200 0 205" strokeWidth="1.8" />
        <path d="M350 120 C380 150 430 170 480 180 C520 190 570 200 600 205" strokeWidth="1.8" />
        <path d="M270 170 C240 200 210 230 160 260" strokeWidth="1.5" />
        <path d="M330 170 C360 200 390 230 440 260" strokeWidth="1.5" />
        <path d="M290 220 C270 250 250 275 220 300" strokeWidth="1.2" />
        <path d="M310 220 C330 250 350 275 380 300" strokeWidth="1.2" />
      </g>
    </svg>
  );
};
