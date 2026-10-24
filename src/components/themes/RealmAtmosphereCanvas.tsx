import React, { useEffect, useRef } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';

interface RealmAtmosphereCanvasProps {
  realmId: RealmId;
  enabled?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  alpha: number;
  maxAlpha: number;
  fadeSpeed: number;
  fadingIn: boolean;
  color: string;
  wobble: number;
  wobbleSpeed: number;
  rotation?: number;
  vRot?: number;
}

export const RealmAtmosphereCanvas: React.FC<RealmAtmosphereCanvasProps> = ({
  realmId,
  enabled = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const theme = REALM_THEMES[realmId] || REALM_THEMES.midgard;

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Realm-tailored particle configuration
    const getParticleConfig = (r: RealmId) => {
      switch (r) {
        case 'muspelheim':
          return {
            count: 55,
            colors: ['#ff4d00', '#ff8000', '#ffcc00', '#ff2200'],
            baseVy: -1.2,
            baseVx: 0.2,
            sizeRange: [1.5, 3.8],
            wobble: 0.08,
            mode: 'ember',
          };
        case 'niflheim':
          return {
            count: 45,
            colors: ['#a5f3fc', '#cffafe', '#e0f2fe', '#38bdf8'],
            baseVy: 0.45,
            baseVx: -0.3,
            sizeRange: [1.2, 3.0],
            wobble: 0.03,
            mode: 'frost',
          };
        case 'asgard':
          return {
            count: 40,
            colors: ['#fde047', '#fef08a', '#67e8f9', '#ffffff'],
            baseVy: -0.4,
            baseVx: 0.05,
            sizeRange: [2.0, 4.5],
            wobble: 0.02,
            mode: 'aurora',
          };
        case 'helheim':
          return {
            count: 35,
            colors: ['#4ade80', '#22c55e', '#a855f7', '#6ee7b7'],
            baseVy: -0.35,
            baseVx: 0.1,
            sizeRange: [2.5, 5.0],
            wobble: 0.05,
            mode: 'wisp',
          };
        case 'jotunheim':
          return {
            count: 50,
            colors: ['#93c5fd', '#bfdbfe', '#ffffff', '#60a5fa'],
            baseVy: 0.9,
            baseVx: -1.4,
            sizeRange: [1.0, 2.8],
            wobble: 0.04,
            mode: 'blizzard',
          };
        case 'nidavellir':
          return {
            count: 45,
            colors: ['#fb923c', '#fdba74', '#f59e0b', '#f97316'],
            baseVy: -1.5,
            baseVx: 0.4,
            sizeRange: [1.2, 3.2],
            wobble: 0.06,
            mode: 'spark',
          };
        case 'alfheim':
          return {
            count: 40,
            colors: ['#fef08a', '#facc15', '#a7f3d0', '#f472b6'],
            baseVy: -0.3,
            baseVx: 0.15,
            sizeRange: [2.0, 4.2],
            wobble: 0.03,
            mode: 'pollen',
          };
        case 'vanaheim':
          return {
            count: 35,
            colors: ['#86efac', '#4ade80', '#fbbf24', '#a3e635'],
            baseVy: 0.35,
            baseVx: 0.6,
            sizeRange: [2.2, 4.0],
            wobble: 0.04,
            mode: 'flora',
          };
        case 'midgard':
        default:
          return {
            count: 35,
            colors: ['#38bdf8', '#7dd3fc', '#fcd34d', '#e0f2fe'],
            baseVy: -0.25,
            baseVx: 0.1,
            sizeRange: [1.5, 3.5],
            wobble: 0.02,
            mode: 'mote',
          };
      }
    };

    const cfg = getParticleConfig(realmId);

    const createParticle = (spawnAnywhere = true): Particle => {
      const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      const baseSize = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);
      const maxAlpha = 0.25 + Math.random() * 0.55;

      return {
        x: Math.random() * width,
        y: spawnAnywhere ? Math.random() * height : cfg.baseVy < 0 ? height + 10 : -10,
        vx: cfg.baseVx + (Math.random() - 0.5) * 0.4,
        vy: cfg.baseVy + (Math.random() - 0.5) * 0.3,
        size: baseSize,
        baseSize,
        alpha: spawnAnywhere ? Math.random() * maxAlpha : 0,
        maxAlpha,
        fadeSpeed: 0.003 + Math.random() * 0.008,
        fadingIn: true,
        color,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: cfg.wobble * (0.8 + Math.random() * 0.4),
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
      };
    };

    const particles: Particle[] = Array.from({ length: cfg.count }, () => createParticle(true));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate alpha pulse
        if (p.fadingIn) {
          p.alpha += p.fadeSpeed;
          if (p.alpha >= p.maxAlpha) {
            p.fadingIn = false;
          }
        } else {
          p.alpha -= p.fadeSpeed;
          if (p.alpha <= 0.02) {
            // Respawn particle
            particles[i] = createParticle(false);
            continue;
          }
        }

        p.wobble += p.wobbleSpeed;
        const currentVx = p.vx + Math.sin(p.wobble) * 0.35;
        p.x += currentVx;
        p.y += p.vy;

        if (p.vRot !== undefined && p.rotation !== undefined) {
          p.rotation += p.vRot;
        }

        // Screen boundary wrap
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (cfg.baseVy < 0 && p.y < -20) {
          particles[i] = createParticle(false);
          continue;
        } else if (cfg.baseVy > 0 && p.y > height + 20) {
          particles[i] = createParticle(false);
          continue;
        }

        // Draw particle based on mode
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

        if (cfg.mode === 'ember' || cfg.mode === 'spark') {
          // Fiery glowing ember with soft halo
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cfg.mode === 'aurora' || cfg.mode === 'wisp') {
          // Ethereal glowing orb
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          grad.addColorStop(0, p.color);
          grad.addColorStop(0.5, p.color + '66');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic atmospheric mote or crystal
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [realmId, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-[1] h-full w-full ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
