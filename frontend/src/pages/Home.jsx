import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Laptop, Network, Brain, ArrowRight } from 'lucide-react';
import ComputeVisualization from '../components/ComputeVisualization';

/* ─── Utility – fade-in wrapper triggered by scroll ─── */
function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating particles canvas ─── */
function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.opacity})`;
        ctx.fill();
      });

      // Draw faint connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─── "How It Works" step icon wrapper ─── */
function StepCard({ icon: Icon, title, description, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.2, ease: 'easeOut' }}
      className="how-step-card"
    >
      <div className="how-step-number">{String(index + 1).padStart(2, '0')}</div>
      <div className="how-step-icon-wrap">
        <Icon className="w-7 h-7 text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-white mt-5 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms for hero section
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  /* ── Dot animation state for Section 2 → 3 ── */
  const networkRef = useRef(null);
  const networkInView = useInView(networkRef, { once: true, margin: '-100px' });
  const [showLines, setShowLines] = useState(false);

  const solutionRef = useRef(null);
  const solutionInView = useInView(solutionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (solutionInView) {
      const t = setTimeout(() => setShowLines(true), 400);
      return () => clearTimeout(t);
    }
  }, [solutionInView]);

  return (
    <div className="home-page">
      <FloatingParticles />

      {/* ════════════════ SECTION 1 — HERO ════════════════ */}
      <section ref={heroRef} className="home-section hero-section">
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hero-title"
          >
            NebulaAI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hero-subtitle"
          >
            Autonomous Student AI Supercomputer
          </motion.p>
        </motion.div>

        {/* Globe */}
        <motion.div
          style={{ scale: heroScale }}
          className="hero-globe-wrap"
        >
          <div className="hero-globe-glow" />
          <ComputeVisualization isTraining={false} />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="scroll-indicator"
        >
          <div className="scroll-line" />
          <span className="scroll-text">Scroll to explore</span>
        </motion.div>
      </section>

      {/* ════════════════ SECTION 2 — THE PROBLEM ════════════════ */}
      <section className="home-section problem-section">
        <ScrollReveal className="section-text-wrap">
          <p className="section-label">The Problem</p>
          <h2 className="section-heading">
            Idle compute power is <span className="text-gradient-blue">wasted</span> across thousands of student laptops
          </h2>
        </ScrollReveal>

        {/* Dots representing idle laptops */}
        <div ref={networkRef} className="dots-canvas">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="idle-dot"
              initial={{ opacity: 0, scale: 0 }}
              animate={networkInView ? { opacity: 0.6, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.03 }}
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      </section>

      {/* ════════════════ SECTION 3 — THE SOLUTION ════════════════ */}
      <section ref={solutionRef} className="home-section solution-section">
        <ScrollReveal className="section-text-wrap">
          <p className="section-label">The Solution</p>
          <h2 className="section-heading">
            NebulaAI transforms them into a{' '}
            <span className="text-gradient-purple">distributed AI supercomputer</span>
          </h2>
        </ScrollReveal>

        {/* Connected network visualization */}
        <div className="network-vis">
          <svg viewBox="0 0 600 300" className="network-svg">
            {/* Nodes */}
            {[
              [80, 60], [200, 40], [340, 70], [480, 50], [550, 120],
              [60, 150], [180, 180], [300, 150], [420, 170], [540, 200],
              [100, 250], [250, 260], [400, 240], [520, 270],
            ].map(([cx, cy], i) => (
              <React.Fragment key={i}>
                <motion.circle
                  cx={cx} cy={cy} r="4"
                  fill="#3B82F6"
                  initial={{ opacity: 0, r: 0 }}
                  animate={solutionInView ? { opacity: 0.9, r: 4 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                />
                <motion.circle
                  cx={cx} cy={cy} r="10"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="0.5"
                  initial={{ opacity: 0 }}
                  animate={solutionInView ? { opacity: 0.2 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.05 + 0.3 }}
                />
              </React.Fragment>
            ))}
            {/* Lines connecting nodes */}
            {showLines && [
              [80, 60, 200, 40], [200, 40, 340, 70], [340, 70, 480, 50],
              [480, 50, 550, 120], [60, 150, 180, 180], [180, 180, 300, 150],
              [300, 150, 420, 170], [420, 170, 540, 200], [100, 250, 250, 260],
              [250, 260, 400, 240], [400, 240, 520, 270],
              [80, 60, 60, 150], [200, 40, 180, 180], [340, 70, 300, 150],
              [480, 50, 420, 170], [550, 120, 540, 200],
              [60, 150, 100, 250], [300, 150, 250, 260], [420, 170, 400, 240],
            ].map(([x1, y1, x2, y2], i) => (
              <motion.line
                key={`l-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="url(#lineGrad)"
                strokeWidth="0.8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 0.8, delay: i * 0.06 }}
              />
            ))}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* ════════════════ SECTION 4 — HOW IT WORKS ════════════════ */}
      <section className="home-section how-section">
        <ScrollReveal className="section-text-wrap">
          <p className="section-label">How It Works</p>
          <h2 className="section-heading">Three simple steps</h2>
        </ScrollReveal>

        <div className="how-steps-grid">
          <StepCard
            icon={Laptop}
            title="Join Network"
            description="A single click connects you to the distributed mesh."
            index={0}
          />
          <StepCard
            icon={Network}
            title="Share Compute"
            description="Your idle CPU and GPU cycles are securely pooled with thousands of other students."
            index={1}
          />
          <StepCard
            icon={Brain}
            title="Train Models"
            description="Launch distributed AI training jobs. Your models train across the entire network."
            index={2}
          />
        </div>
      </section>

      {/* ════════════════ SECTION 5 — LIVE SYSTEM ════════════════ */}
      <section className="home-section live-section">
        <ScrollReveal className="section-text-wrap">
          <p className="section-label">Live Network</p>
          <h2 className="section-heading">
            Real-time distributed intelligence{' '}
            <span className="text-gradient-blue">across the globe</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="live-globe-wrap">
          <ComputeVisualization isTraining={true} />
        </ScrollReveal>
      </section>

      {/* ════════════════ SECTION 6 — CTA ════════════════ */}
      <section className="home-section cta-section">
        <ScrollReveal className="cta-content">
          <h2 className="cta-heading">Ready to join the network?</h2>
          <p className="cta-subtext">
            Start contributing your idle compute power today.
          </p>
          <div className="cta-buttons">
            <Link to="/dashboard" className="cta-btn-primary">
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/nodes" className="cta-btn-secondary">
              Join Network
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
