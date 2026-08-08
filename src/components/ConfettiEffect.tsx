import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
  shape: 'circle' | 'rect' | 'triangle' | 'star';
  width: number;
  height: number;
}

const COLORS = [
  '#FF0000', '#FF7300', '#FFFB00', '#48FF00', 
  '#00FFD5', '#002BFF', '#7A00FF', '#FF00C8',
  '#FCD34D', '#34D399', '#60A5FA', '#F472B6'
];

interface ConfettiEffectProps {
  active: boolean;
}

export default function ConfettiEffect({ active }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Resize canvas safely
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helper to generate a single particle
    const createParticle = (x: number, y: number, angle: number, speed: number): Particle => {
      const radius = Math.random() * 4 + 4;
      const radians = (angle * Math.PI) / 180;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      const shapes: Array<'circle' | 'rect' | 'triangle' | 'star'> = ['circle', 'rect', 'triangle', 'star'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      return {
        x,
        y,
        vx: Math.cos(radians) * speed + (Math.random() - 0.5) * 3,
        vy: Math.sin(radians) * speed + (Math.random() - 0.5) * 3,
        radius,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: Math.random() * 0.005 + 0.004,
        shape,
        width: Math.random() * 6 + 6,
        height: Math.random() * 12 + 8,
      };
    };

    // Shoot initial burst from corners (Bottom Left and Bottom Right)
    const triggerCannons = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Left Cannon: angle -45 to -75 (shooting up-right)
      for (let i = 0; i < 120; i++) {
        const speed = Math.random() * 16 + 12;
        const angle = -45 - Math.random() * 30; // -45 to -75 degrees
        particles.push(createParticle(0, h, angle, speed));
      }

      // Right Cannon: angle -135 to -105 (shooting up-left)
      for (let i = 0; i < 120; i++) {
        const speed = Math.random() * 16 + 12;
        const angle = -135 + Math.random() * 30; // -135 to -105 degrees
        particles.push(createParticle(w, h, angle, speed));
      }
    };

    triggerCannons();

    // Trigger sub-bursts periodically to keep celebration alive for a few seconds
    const interval = setInterval(() => {
      const w = canvas.width;
      const h = canvas.height;
      // Soft center bursts
      for (let i = 0; i < 30; i++) {
        const angle = -90 + (Math.random() - 0.5) * 45;
        const speed = Math.random() * 10 + 8;
        particles.push(createParticle(w * 0.2 + Math.random() * (w * 0.6), h, angle, speed));
      }
    }, 1200);

    // Sound alert wrapper for a premium stadium effect
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Cannon Boom sound
      const boom = () => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      };
      
      // Fanfare Whistle sound
      const fanfare = () => {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
          gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.12);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.12 + 0.25);
          osc.start(audioCtx.currentTime + idx * 0.12);
          osc.stop(audioCtx.currentTime + idx * 0.12 + 0.3);
        });
      };

      boom();
      setTimeout(fanfare, 300);
    } catch (e) {
      // Audio context error or browser autoplay block
    }

    // Animation Loop
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Physic constants
      const gravity = 0.45;
      const wind = 0.05;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply forces
        p.vy += gravity;
        // Float wind drift
        p.vx += (Math.sin(p.y / 30) * wind) + (Math.random() - 0.5) * 0.1;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;

        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.radius);
          ctx.lineTo(p.radius, p.radius);
          ctx.lineTo(-p.radius, p.radius);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.radius, Math.sin(((18 + s * 72) * Math.PI) / 180) * p.radius);
            ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.radius / 2), Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.radius / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Recycle or delete dead particles
        if (p.opacity <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
      id="champion-celebration-confetti-canvas"
    />
  );
}
