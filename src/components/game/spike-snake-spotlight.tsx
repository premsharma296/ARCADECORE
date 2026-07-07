'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Play, Users, Zap, Swords, Trophy, Crown, Gamepad2, Shield, Sparkles, Star, ChevronRight, ArrowRight } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Spike Snake – Premium Spotlight Hero Component                     */
/* ------------------------------------------------------------------ */

export default function SpikeSnakeSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particlePositions, setParticlePositions] = useState<{x: number; y: number; delay: number; size: number; color: string}[]>([])

  // Generate particle positions only on mount (client-side)
  useEffect(() => {
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
      size: Math.random() * 3 + 1.5,
      color: ['#00ff87', '#ff00d4', '#00d4ff', '#ffd700', '#ff6b35', '#a855f7'][Math.floor(Math.random() * 6)]
    }))
    setParticlePositions(particles)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const features = [
    { icon: Swords, label: 'Battle Royale', desc: 'Shrinking arena deathmatch', color: '#ff00d4' },
    { icon: Users, label: 'Multiplayer', desc: 'Real-time WebRTC P2P battles', color: '#00d4ff' },
    { icon: Zap, label: 'Speed Boost', desc: 'Risky turbo acceleration', color: '#ffd700' },
    { icon: Shield, label: 'AI Bots', desc: 'Cunning neural opponents', color: '#00ff87' },
  ]

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="spike-snake-spotlight"
      aria-label="Featured Game: Spike Snake"
    >
      {/* Animated Background Layer */}
      <div className="sss-bg">
        {/* Main banner image */}
        <img
          src="/game-files/snake-game/banner.jpg"
          alt="Spike Snake Arena"
          className="sss-bg-img"
        />
        
        {/* Gradient overlays */}
        <div className="sss-overlay sss-overlay-bottom" />
        <div className="sss-overlay sss-overlay-left" />
        <div className="sss-overlay sss-overlay-vignette" />
        
        {/* Animated glow that follows mouse */}
        <div 
          className="sss-mouse-glow"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            opacity: isHovered ? 0.35 : 0,
          }}
        />

        {/* Floating particles */}
        <div className="sss-particles">
          {particlePositions.map((p, i) => (
            <div
              key={i}
              className="sss-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              }}
            />
          ))}
        </div>

        {/* Animated grid lines */}
        <div className="sss-grid-lines" />
      </div>

      {/* Content */}
      <div className="sss-content">
        {/* Left: Info Block */}
        <div className="sss-info">
          {/* Top badge row */}
          <div className="sss-badges">
            <span className="sss-badge sss-badge-new">
              <Sparkles className="sss-badge-icon" />
              NEW GAME
            </span>
            <span className="sss-badge sss-badge-featured">
              <Crown className="sss-badge-icon" />
              FEATURED
            </span>
            <span className="sss-badge sss-badge-multiplayer">
              <Gamepad2 className="sss-badge-icon" />
              MULTIPLAYER
            </span>
          </div>

          {/* Game Title with neon glow */}
          <div className="sss-title-block">
            <h2 className="sss-title">
              <span className="sss-title-spike">SPIKE</span>
              <span className="sss-title-snake">SNAKE</span>
            </h2>
            <p className="sss-subtitle">Multiplayer Arena Battle</p>
          </div>

          {/* Description */}
          <p className="sss-description">
            Enter the neon arena and battle against players worldwide! Grow your spiked serpent, 
            outmaneuver opponents, and dominate the shrinking Battle Royale zone. 
            WebRTC-powered real-time multiplayer with AI bots and epic power-ups.
          </p>

          {/* Feature chips row */}
          <div className="sss-features">
            {features.map((f, i) => (
              <div key={i} className="sss-feature-chip" style={{ '--chip-color': f.color } as React.CSSProperties}>
                <f.icon className="sss-feature-icon" style={{ color: f.color }} />
                <div className="sss-feature-text">
                  <span className="sss-feature-label">{f.label}</span>
                  <span className="sss-feature-desc">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Row */}
          <div className="sss-cta-row">
            <Link href="/games/snake-game" className="sss-play-btn">
              <div className="sss-play-btn-glow" />
              <Play className="sss-play-icon" />
              <span>PLAY NOW</span>
              <ArrowRight className="sss-play-arrow" />
            </Link>

            <div className="sss-stats">
              <div className="sss-stat">
                <Star className="sss-stat-icon" style={{ color: '#ffd700', fill: '#ffd700' }} />
                <span className="sss-stat-value">4.8</span>
              </div>
              <div className="sss-stat-divider" />
              <div className="sss-stat">
                <Trophy className="sss-stat-icon" style={{ color: '#00ff87' }} />
                <span className="sss-stat-value">Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Floating screenshot preview */}
        <div className="sss-preview">
          <div className="sss-preview-frame">
            <div className="sss-preview-glow" />
            <img
              src="/game-files/snake-game/banner.jpg"
              alt="Spike Snake Gameplay"
              className="sss-preview-img"
            />
            <div className="sss-preview-overlay">
              <div className="sss-preview-play-circle">
                <Play className="sss-preview-play-icon" />
              </div>
            </div>
            {/* Animated scanning line */}
            <div className="sss-scan-line" />
          </div>

          {/* Floating mini-stats cards */}
          <div className="sss-float-card sss-float-card-1">
            <Users style={{ width: '14px', height: '14px', color: '#00d4ff' }} />
            <span>Online P2P</span>
          </div>
          <div className="sss-float-card sss-float-card-2">
            <Swords style={{ width: '14px', height: '14px', color: '#ff00d4' }} />
            <span>Battle Royale</span>
          </div>
          <div className="sss-float-card sss-float-card-3">
            <Zap style={{ width: '14px', height: '14px', color: '#ffd700' }} />
            <span>6 Modes</span>
          </div>
        </div>
      </div>

      {/* CSS-in-JS Styles */}
      <style jsx>{`
        .spike-snake-spotlight {
          position: relative;
          width: 100%;
          min-height: 480px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(0, 255, 135, 0.15);
          cursor: default;
          container-type: inline-size;
        }

        /* ----- Background ----- */
        .sss-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .sss-bg-img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center;
          transform: scale(1.05);
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .spike-snake-spotlight:hover .sss-bg-img {
          transform: scale(1.1);
        }

        .sss-overlay {
          position: absolute; inset: 0; pointer-events: none;
        }
        .sss-overlay-bottom {
          background: linear-gradient(0deg, rgba(10,10,18,0.98) 0%, rgba(10,10,18,0.7) 40%, transparent 75%);
        }
        .sss-overlay-left {
          background: linear-gradient(90deg, rgba(10,10,18,0.95) 0%, rgba(10,10,18,0.5) 45%, transparent 70%);
        }
        .sss-overlay-vignette {
          background: radial-gradient(ellipse at center, transparent 40%, rgba(10,10,18,0.6) 100%);
        }

        .sss-mouse-glow {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,135,0.2) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: opacity 0.5s ease;
          mix-blend-mode: screen;
        }

        /* Particles */
        .sss-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .sss-particle {
          position: absolute;
          border-radius: 50%;
          animation: sssFloat 6s ease-in-out infinite;
        }
        @keyframes sssFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translateY(-40px) scale(1.5); opacity: 0.8; }
          80% { opacity: 0.3; }
        }

        /* Grid lines overlay */
        .sss-grid-lines {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: sssGridShift 20s linear infinite;
          pointer-events: none;
        }
        @keyframes sssGridShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* ----- Content Layout ----- */
        .sss-content {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 40px;
          padding: 48px;
          min-height: 480px;
        }

        .sss-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Badges */
        .sss-badges { display: flex; flex-wrap: wrap; gap: 8px; }
        .sss-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 8px;
          backdrop-filter: blur(8px);
          animation: sssBadgePulse 3s ease-in-out infinite;
        }
        .sss-badge-icon { width: 12px; height: 12px; }
        .sss-badge-new {
          background: linear-gradient(135deg, rgba(0,255,135,0.2), rgba(0,212,255,0.2));
          color: #00ff87;
          border: 1px solid rgba(0,255,135,0.3);
          box-shadow: 0 0 12px rgba(0,255,135,0.15);
        }
        .sss-badge-featured {
          background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2));
          color: #ffd700;
          border: 1px solid rgba(255,215,0,0.3);
          box-shadow: 0 0 12px rgba(255,215,0,0.15);
          animation-delay: 1s;
        }
        .sss-badge-multiplayer {
          background: linear-gradient(135deg, rgba(255,0,212,0.2), rgba(168,85,247,0.2));
          color: #ff00d4;
          border: 1px solid rgba(255,0,212,0.3);
          box-shadow: 0 0 12px rgba(255,0,212,0.15);
          animation-delay: 2s;
        }
        @keyframes sssBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Title */
        .sss-title-block { display: flex; flex-direction: column; gap: 2px; }
        .sss-title {
          font-family: var(--font-display, 'Orbitron', sans-serif);
          font-size: 52px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0.05em;
          display: flex;
          gap: 14px;
          align-items: baseline;
        }
        .sss-title-spike {
          color: #00ff87;
          text-shadow: 0 0 20px rgba(0,255,135,0.5), 0 0 60px rgba(0,255,135,0.2);
          animation: sssGlow 3s ease-in-out infinite alternate;
        }
        .sss-title-snake {
          color: #ff00d4;
          text-shadow: 0 0 20px rgba(255,0,212,0.5), 0 0 60px rgba(255,0,212,0.2);
          animation: sssGlow 3s ease-in-out infinite alternate;
          animation-delay: 1.5s;
        }
        @keyframes sssGlow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.3); }
        }
        .sss-subtitle {
          font-family: var(--font-display, 'Orbitron', sans-serif);
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        /* Description */
        .sss-description {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.6);
          max-width: 520px;
        }

        /* Feature Chips */
        .sss-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .sss-feature-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          backdrop-filter: blur(4px);
          transition: all 0.3s ease;
        }
        .sss-feature-chip:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--chip-color, rgba(255,255,255,0.15));
          box-shadow: 0 0 20px color-mix(in srgb, var(--chip-color) 20%, transparent);
          transform: translateY(-2px);
        }
        .sss-feature-icon { width: 20px; height: 20px; flex-shrink: 0; }
        .sss-feature-text { display: flex; flex-direction: column; gap: 1px; }
        .sss-feature-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); }
        .sss-feature-desc { font-size: 10px; color: rgba(255,255,255,0.4); }

        /* CTA */
        .sss-cta-row { display: flex; align-items: center; gap: 24px; margin-top: 6px; }
        .sss-play-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #00ff87, #00c966);
          color: #0a0a12;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.1em;
          border-radius: 16px;
          text-decoration: none;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 8px 32px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .sss-play-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 48px rgba(0,255,135,0.45), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .sss-play-btn:active { transform: translateY(0) scale(0.98); }
        .sss-play-btn-glow {
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          background: linear-gradient(135deg, #00ff87, #00d4ff, #ff00d4, #00ff87);
          background-size: 300% 300%;
          animation: sssGlowRotate 4s linear infinite;
          z-index: -1;
          filter: blur(8px);
          opacity: 0.5;
        }
        @keyframes sssGlowRotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .sss-play-icon { width: 18px; height: 18px; fill: #0a0a12; }
        .sss-play-arrow {
          width: 16px; height: 16px;
          transition: transform 0.3s ease;
        }
        .sss-play-btn:hover .sss-play-arrow { transform: translateX(4px); }

        .sss-stats { display: flex; align-items: center; gap: 12px; }
        .sss-stat { display: flex; align-items: center; gap: 5px; }
        .sss-stat-icon { width: 16px; height: 16px; }
        .sss-stat-value { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); }
        .sss-stat-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.15); }

        /* ----- Preview ----- */
        .sss-preview {
          position: relative;
          width: 380px;
          flex-shrink: 0;
        }
        .sss-preview-frame {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(0,255,135,0.2);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,135,0.1);
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          animation: sssPreviewFloat 6s ease-in-out infinite;
        }
        .spike-snake-spotlight:hover .sss-preview-frame {
          border-color: rgba(0,255,135,0.4);
          box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,135,0.2);
        }
        @keyframes sssPreviewFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .sss-preview-glow {
          position: absolute;
          inset: -4px;
          border-radius: 22px;
          background: conic-gradient(from 0deg, #00ff87, #00d4ff, #ff00d4, #ffd700, #00ff87);
          animation: sssFrameRotate 6s linear infinite;
          opacity: 0.3;
          filter: blur(10px);
          z-index: -1;
        }
        @keyframes sssFrameRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sss-preview-img {
          width: 100%;
          aspect-ratio: 16 / 10;
          object-fit: cover;
          display: block;
        }

        .sss-preview-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(10,10,18,0.3);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .sss-preview-frame:hover .sss-preview-overlay { opacity: 1; }
        .sss-preview-play-circle {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(0,255,135,0.9);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 30px rgba(0,255,135,0.5);
          transition: transform 0.3s ease;
        }
        .sss-preview-frame:hover .sss-preview-play-circle { transform: scale(1.1); }
        .sss-preview-play-icon { width: 28px; height: 28px; fill: #0a0a12; color: #0a0a12; margin-left: 3px; }

        /* Scan line effect */
        .sss-scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,135,0.4), transparent);
          animation: sssScan 4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes sssScan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* Floating mini cards */
        .sss-float-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(10,10,18,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          white-space: nowrap;
        }
        .sss-float-card-1 {
          top: -10px; right: -20px;
          animation: sssCardFloat1 5s ease-in-out infinite;
        }
        .sss-float-card-2 {
          bottom: 30px; left: -30px;
          animation: sssCardFloat2 6s ease-in-out infinite;
        }
        .sss-float-card-3 {
          bottom: -10px; right: 20px;
          animation: sssCardFloat3 5.5s ease-in-out infinite;
        }
        @keyframes sssCardFloat1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes sssCardFloat2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes sssCardFloat3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }

        /* ----- Responsive ----- */
        @container (max-width: 800px) {
          .sss-content { flex-direction: column; padding: 32px 24px; }
          .sss-preview { width: 100%; max-width: 360px; }
          .sss-title { font-size: 36px; }
          .sss-features { grid-template-columns: 1fr 1fr; }
          .sss-float-card-1 { right: 0; }
          .sss-float-card-2 { left: 0; }
        }
        @container (max-width: 500px) {
          .sss-title { font-size: 28px; flex-direction: column; gap: 4px; }
          .sss-features { grid-template-columns: 1fr; }
          .sss-cta-row { flex-direction: column; align-items: flex-start; }
          .sss-preview { display: none; }
        }
      `}</style>
    </section>
  )
}
