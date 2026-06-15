import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
}

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      particles.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const colors = [
      '#FFD700', // Gold
      '#FFDF00', // Bright Yellow
      '#1E3A8A', // Deep Blue
      '#3B82F6', // Lighter Blue
      '#10B981', // Emerald Green
      '#EF4444', // Red
      '#F472B6', // Pink
      '#FFFFFF', // White
    ];

    const createParticle = (x: number, y: number, isFirework: boolean = false): Particle => {
      const angle = isFirework ? Math.random() * Math.PI * 2 : Math.PI + (Math.random() - 0.5);
      const speed = isFirework ? Math.random() * 8 + 4 : Math.random() * 5 + 2;

      return {
        x,
        y,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        shape: ['circle', 'square', 'triangle', 'star'][Math.floor(Math.random() * 4)] as any,
      };
    };

    // Initial burst
    for (let i = 0; i < 150; i++) {
      particles.current.push(createParticle(canvas.width / 2, canvas.height + 20));
    }

    let fireworkTimer = 0;

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          x + r * Math.cos(((18 + i * 72) * Math.PI) / 180),
          y - r * Math.sin(((18 + i * 72) * Math.PI) / 180)
        );
        ctx.lineTo(
          x + (r / 2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
          y - (r / 2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
        );
      }
      ctx.closePath();
      ctx.fill();
    };

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Trigger standard fireworks occasionally
      fireworkTimer++;
      if (fireworkTimer % 45 === 0) {
        const fx = Math.random() * canvas.width;
        const fy = Math.random() * (canvas.height * 0.6);
        for (let i = 0; i < 35; i++) {
          particles.current.push(createParticle(fx, fy, true));
        }
      }

      // Continuous stream from bottom-left & bottom-right
      if (Math.random() < 0.3) {
        particles.current.push(createParticle(10, canvas.height - 10));
        particles.current.push(createParticle(canvas.width - 10, canvas.height - 10));
      }

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.12; // Gravity simulation
        p.speedX *= 0.98; // Air resistance
        p.rotation += p.rotationSpeed;

        if (p.speedY > 2) {
          p.opacity -= 0.01;
        }

        if (p.opacity <= 0 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, p.size);
        }

        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
