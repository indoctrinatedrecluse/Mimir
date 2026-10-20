import React, { useEffect, useRef } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
  rune?: string;
}

const RUNES = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛚ', 'ᛞ', 'ᛟ'];

interface RunicAtmosphereProps {
  activeRealm: RealmId;
}

export const RunicAtmosphere: React.FC<RunicAtmosphereProps> = ({ activeRealm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create subtle ambient floating particles
    const particles: Particle[] = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 1,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.35 + 0.05,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      rune: Math.random() > 0.5 ? RUNES[Math.floor(Math.random() * RUNES.length)] : undefined,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const currentTheme = themeRef.current;

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * 0.001 * p.pulseSpeed) * 0.004;

        // Wrap around
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        const currentOpacity = Math.max(0.04, Math.min(0.3, p.opacity));

        if (p.rune) {
          ctx.font = '13px "Segoe UI Historic", sans-serif';
          ctx.fillStyle = currentTheme.accentColor;
          ctx.globalAlpha = currentOpacity * 0.8;
          ctx.fillText(p.rune, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.accentColor;
          ctx.globalAlpha = currentOpacity;
          ctx.shadowBlur = 10;
          ctx.shadowColor = currentTheme.accentColor;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-40 transition-opacity duration-700"
    />
  );
};
