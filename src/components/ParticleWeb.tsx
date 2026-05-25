// components/ParticleWeb.tsx
'use client';
import { useEffect, useRef } from 'react';

export default function ParticleWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas;
    const ctx = c.getContext('2d')!;
    let animId = 0;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: Particle[] = [];
    let Wcss = 0, Hcss = 0, dpr = 1;
    let MAX_DIST = 120;

    function setupCanvas() {
      const rect = c.getBoundingClientRect();
      Wcss = Math.max(1, rect.width);
      Hcss = Math.max(1, rect.height);
      const isMobile = Wcss < 640;
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Lower DPR on mobile for performance
      dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1) : Math.min(window.devicePixelRatio || 1, 2);
      c.style.width = `${Wcss}px`;
      c.style.height = `${Hcss}px`;
      c.width = Math.round(Wcss * dpr);
      c.height = Math.round(Hcss * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // If user prefers reduced motion, set very low particle count
      if (prefersReduced) {
        MAX_DIST = Math.max(40, Math.min(Wcss, Hcss) * 0.12);
      }
    }

    function initParticles() {
      const isMobile = Wcss < 640;
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // density per css pixel^2, lower on mobile
      const density = isMobile ? 0.000045 : 0.00008; // tuned for balanced density across sizes
      const targetN = Math.round(Math.max(12, Math.min(160, Wcss * Hcss * density)));
      MAX_DIST = isMobile ? Math.max(50, Math.min(Wcss, Hcss) * 0.12) : Math.max(70, Math.min(Wcss, Hcss) * 0.18);
      // if user prefers reduced motion, keep very small, static set
      const finalN = prefersReduced ? Math.min(20, targetN) : targetN;
      const speedMul = isMobile ? 0.35 : 0.6;
      particles = Array.from({ length: finalN }, () => ({
        x: Math.random() * Wcss,
        y: Math.random() * Hcss,
        vx: (Math.random() - 0.5) * speedMul,
        vy: (Math.random() - 0.5) * speedMul,
        r: Math.random() * 2 + 1.4,
      }));
    }

    let frame = 0;
    function draw() {
      frame += 1;
      const isMobile = Wcss < 640;
      // throttle frames on mobile for performance
      if (isMobile && frame % 2 === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, Wcss, Hcss);

      // move
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = Wcss + 10;
        if (p.x > Wcss + 10) p.x = -10;
        if (p.y < -10) p.y = Hcss + 10;
        if (p.y > Hcss + 10) p.y = -10;
      });

      // connections
      const N = particles.length;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.45;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(232,96,28,${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // particles
      particles.forEach(p => {
        // halo (soft, low-opacity orange)
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.8, p.r + 1.2), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232,96,28,0.12)';
        ctx.fill();
        // core (smaller, solid orange)
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, p.r * 0.75), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232,96,28,1)';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    function start() {
      setupCanvas();
      initParticles();
      draw();
    }

    start();
    const handleResize = () => { cancelAnimationFrame(animId); start(); };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
