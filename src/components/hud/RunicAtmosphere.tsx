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
  hueOffset?: number;
}

const RUNES = ['ᛗ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛚ', 'ᛞ', 'ᛟ'];

interface RunicAtmosphereProps {
  activeRealm: RealmId;
}

export const RunicAtmosphere: React.FC<RunicAtmosphereProps> = ({ activeRealm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = REALM_THEMES[activeRealm] || REALM_THEMES.midgard;
  const themeRef = useRef(theme);
  const realmRef = useRef(activeRealm);

  useEffect(() => {
    themeRef.current = theme;
    realmRef.current = activeRealm;
  }, [theme, activeRealm]);

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

    // Initialize 40 particles
    const particles: Particle[] = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 1,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.05,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      rune: Math.random() > 0.45 ? RUNES[Math.floor(Math.random() * RUNES.length)] : undefined,
      hueOffset: Math.random() * 30 - 15,
    }));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.015;

      const currentTheme = themeRef.current;
      const currentRealm = realmRef.current;

      // 1. Draw Mythological Realm Waves (Bifröst Aurora / Golden Haze / Volcanic Glow)
      if (currentRealm === 'midgard' || currentRealm === 'alfheim') {
        // Bifröst Aurora Borealis wave curtains
        ctx.save();
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 80 + i * 40);
          for (let x = 0; x <= width; x += 30) {
            const waveY =
              80 +
              i * 40 +
              Math.sin(x * 0.003 + time + i * 1.5) * 35 +
              Math.cos(x * 0.006 - time * 0.8) * 20;
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(width, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();

          const auroraGrad = ctx.createLinearGradient(0, 0, width, 180);
          if (i === 0) {
            auroraGrad.addColorStop(0, 'rgba(0, 245, 255, 0.05)');
            auroraGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.07)');
            auroraGrad.addColorStop(1, 'rgba(0, 245, 255, 0.02)');
          } else {
            auroraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.03)');
            auroraGrad.addColorStop(0.5, 'rgba(0, 245, 255, 0.06)');
            auroraGrad.addColorStop(1, 'rgba(251, 191, 36, 0.03)');
          }
          ctx.fillStyle = auroraGrad;
          ctx.fill();
        }
        ctx.restore();
      } else if (currentRealm === 'muspelheim') {
        // Volcanic fire glow rising from bottom
        ctx.save();
        const fireGrad = ctx.createLinearGradient(0, height, 0, height - 200);
        fireGrad.addColorStop(0, 'rgba(251, 113, 133, 0.09)');
        fireGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.04)');
        fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fireGrad;
        ctx.fillRect(0, height - 200, width, 200);
        ctx.restore();
      }

      // 2. Draw Realm Particles (Embers for Muspelheim, Stardust for Asgard, Frost for Helheim)
      particles.forEach((p, idx) => {
        // Realm-specific motion adjustments
        if (currentRealm === 'muspelheim') {
          // Accelerating upward embers with turbulent horizontal flicker
          p.y -= Math.random() * 0.8 + 0.3;
          p.x += Math.sin(time * 3 + idx) * 0.5;
        } else if (currentRealm === 'asgard') {
          // Gentle floating celestial stardust
          p.y += p.speedY * 0.7;
          p.x += p.speedX * 0.7;
        } else {
          // Standard runic drift
          p.y += p.speedY;
          p.x += p.speedX;
        }

        p.opacity += Math.sin(time * 2 + p.pulseSpeed * 100) * 0.003;

        // Boundary Wrap
        if (p.y < -25) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.y > height + 25) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        const currentOpacity = Math.max(0.04, Math.min(0.4, p.opacity));

        if (p.rune) {
          ctx.font = '13px "Segoe UI Historic", sans-serif';
          ctx.fillStyle = currentTheme.accentColor;
          ctx.globalAlpha = currentOpacity * 0.85;
          ctx.fillText(p.rune, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.accentColor;
          ctx.globalAlpha = currentOpacity;
          ctx.shadowBlur = currentRealm === 'asgard' || currentRealm === 'midgard' ? 12 : 6;
          ctx.shadowColor = currentTheme.accentColor;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw faint constellation lines between close particles in Asgard (Divine sky)
        if (currentRealm === 'asgard' && idx < 20) {
          const nextP = particles[(idx + 1) % particles.length];
          const dist = Math.hypot(p.x - nextP.x, p.y - nextP.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(nextP.x, nextP.y);
            ctx.strokeStyle = currentTheme.accentColor;
            ctx.globalAlpha = (1 - dist / 110) * 0.12;
            ctx.stroke();
          }
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
      className="pointer-events-none fixed inset-0 z-0 opacity-45 transition-opacity duration-700"
    />
  );
};
