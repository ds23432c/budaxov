'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; life: number; maxLife: number;
}

const COLORS = ['#FFD700', '#00C853', '#1E88E5', '#8E24AA', '#E53935', '#00BCD4'];

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.8 + 0.3),
        size: Math.random() * 3 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
        maxLife: Math.random() * 200 + 100,
      });
    };

    let frame = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (frame % 8 === 0 && particles.length < 60) spawnParticle();

      particles = particles.filter(p => p.life < p.maxLife);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.6;

        // Pixel particle (square)
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const s = Math.round(p.size);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      });
      ctx.globalAlpha = 1;
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" className="fixed inset-0 pointer-events-none z-0 opacity-30" />;
}
