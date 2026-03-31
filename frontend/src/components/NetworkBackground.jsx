import React, { useEffect, useRef } from 'react';

export default function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Neural Mesh Particle Configuration
    const particles = [];
    const layers = [
      { count: 180, speed: 0.018, opacity: 0.05, size: 0.6, color: '#FFFFFF' }, // Far Stars
      { count: 220, speed: 0.05,  opacity: 0.09, size: 1.1, color: '#3B82F6', isNetwork: true }, // Network Hubs
      { count: 40,  speed: 0.08,  opacity: 0.12, size: 1.4, color: '#8B5CF6' }  // Near Dust
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * layer.speed,
          vy: (Math.random() - 0.5) * layer.speed,
          radius: Math.random() * layer.size + 0.3,
          baseOpacity: Math.random() * layer.opacity,
          isNetwork: layer.isNetwork || false,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.01,
          driftX: (Math.random() - 0.5) * 0.012,
          driftY: (Math.random() - 0.5) * 0.012,
        });
      }
    });

    const networkNodes = particles.filter(p => p.isNetwork);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Neural Connection Mesh
      ctx.lineWidth = 0.4;
      for (let i = 0; i < networkNodes.length; i++) {
        for (let j = i + 1; j < networkNodes.length; j++) {
          const p1 = networkNodes[i];
          const p2 = networkNodes[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 140;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const opacity = Math.pow(1 - dist / maxDist, 1.8) * 0.035;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(100, 160, 255, ${opacity})`;
            ctx.stroke();
          }
        }
      }

      // Pulsing Nodes & Stars
      particles.forEach(p => {
        p.x += p.vx + p.driftX;
        p.y += p.vy + p.driftY;

        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        let currentOpacity = p.baseOpacity;
        let currentRadius = p.radius;

        if (p.isNetwork) {
          p.pulsePhase += p.pulseSpeed;
          const pulse = (Math.sin(p.pulsePhase) + 1) / 2;
          currentOpacity = p.baseOpacity + pulse * 0.15;
          currentRadius = p.radius + pulse * 0.35;

          // Hub Glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 3);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${currentOpacity * 0.08})`);
          gradient.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.isNetwork
          ? `rgba(100, 160, 255, ${currentOpacity})`
          : `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 
        Nebula image is set on <body> via index.css (background-attachment: fixed)
        This component handles all the overlay layers on top of it.
      */}

      {/* 1. Dark overlay (0.70 opacity) — primary readability layer, lets nebula show through */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.70)' }} />

      {/* 2. Radial vignette — darkens edges, focuses center on globe */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5, 15, 40, 0.0) 0%, rgba(0, 0, 0, 0.55) 60%, rgba(0, 0, 0, 0.88) 100%)',
        }}
      />

      {/* 3. Subtle center blue bloom — syncs with globe aura */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 46%, rgba(20, 70, 180, 0.07) 0%, transparent 55%)',
        }}
      />

      {/* 4. Neural Mesh Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full relative z-10" style={{ opacity: 0.55 }} />
    </div>
  );
}
