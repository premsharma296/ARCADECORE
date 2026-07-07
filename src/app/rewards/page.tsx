'use client'

import React, { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/layout/app-shell'
import { Gift, Sparkles, HelpCircle, Trophy, Star } from 'lucide-react'
import confetti from 'canvas-confetti'
import sound from '@/lib/sound'

const SECTORS = [
  { label: '50 XP', color: '#ff0055', value: 50, type: 'xp' },
  { label: '2x Coins', color: '#00ffcc', value: 2, type: 'mult' },
  { label: '100 XP', color: '#ffcc00', value: 100, type: 'xp' },
  { label: 'Try Again', color: '#333344', value: 0, type: 'miss' },
  { label: '500 XP', color: '#ff00ff', value: 500, type: 'xp' },
  { label: 'Secret Box', color: '#0099ff', value: 1000, type: 'box' },
  { label: '250 XP', color: '#99ff00', value: 250, type: 'xp' },
  { label: 'Jackpot Badge', color: '#ff5500', value: 1, type: 'badge' },
]

export default function RewardsPage() {
  const [spinning, setSpinning] = useState(false)
  const [reward, setReward] = useState<any | null>(null)
  const [dailyClaimed, setDailyClaimed] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinAngleRef = useRef(0)

  // Start looping background music on user interaction
  useEffect(() => {
    const startMusic = () => {
      sound.playBackgroundMusic()
    }
    
    window.addEventListener('click', startMusic)
    window.addEventListener('keydown', startMusic)

    return () => {
      window.removeEventListener('click', startMusic)
      window.removeEventListener('keydown', startMusic)
      sound.stopBackgroundMusic()
    }
  }, [])

  // Draw the spin wheel procedurally on the Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 12
    const anglePerSector = (2 * Math.PI) / SECTORS.length

    const drawWheel = (rotationAngle: number) => {
      ctx.clearRect(0, 0, size, size)

      // Draw shadow border
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(217, 70, 239, 0.4)'

      SECTORS.forEach((sec, idx) => {
        const startAng = rotationAngle + idx * anglePerSector
        const endAng = startAng + anglePerSector

        // Sector arc path
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, startAng, endAng)
        ctx.closePath()

        ctx.fillStyle = sec.color
        ctx.fill()
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Text labels inside wheel
        ctx.save()
        ctx.translate(center, center)
        ctx.rotate(startAng + anglePerSector / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 11px Inter, sans-serif'
        ctx.fillText(sec.label, radius - 20, 4)
        ctx.restore()
      })

      // Draw Center core pin
      ctx.beginPath()
      ctx.arc(center, center, 20, 0, 2 * Math.PI)
      ctx.fillStyle = '#12121a'
      ctx.fill()
      ctx.strokeStyle = '#d946ef'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.closePath()

      // Center glowing inner circle
      ctx.beginPath()
      ctx.arc(center, center, 6, 0, 2 * Math.PI)
      ctx.fillStyle = '#06b6d4'
      ctx.fill()
      ctx.closePath()
    }

    drawWheel(spinAngleRef.current)

    // Save draw handler on window for animation loop binding
    ;(canvas as any).drawWheel = drawWheel
  }, [])

  const startSpin = () => {
    if (spinning || dailyClaimed) return
    setSpinning(true)
    setReward(null)
    sound.playClick()

    const canvas = canvasRef.current
    if (!canvas || !(canvas as any).drawWheel) return

    const duration = 4000 // Spin for 4 seconds
    const startTime = Date.now()
    
    // Choose random sector index
    const winningIndex = Math.floor(Math.random() * SECTORS.length)
    const anglePerSector = (2 * Math.PI) / SECTORS.length
    
    // Calculate final rotation target (reverse sector index to match top arrow pointer pointing at -90 degrees)
    // Pointer is at the top (1.5 * Math.PI).
    const targetAngle = 2 * Math.PI * 5 + (1.5 * Math.PI - winningIndex * anglePerSector - anglePerSector / 2)
    const startAngle = spinAngleRef.current

    let lastTickAngle = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (cubic decel)
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut(progress)
      
      spinAngleRef.current = currentAngle
      ;(canvas as any).drawWheel(currentAngle)

      // Play tick sound whenever a sector boundary crosses
      const currentSector = Math.floor((currentAngle % (2 * Math.PI)) / anglePerSector)
      if (currentSector !== lastTickAngle) {
        sound.playTick()
        lastTickAngle = currentSector
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setDailyClaimed(true)
        const won = SECTORS[winningIndex]
        setReward(won)

        // Award celebration confetti
        sound.playWin()
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        })

        // Log the reward claim persistently in database
        fetch('/api/user/claim-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardType: won.label, amount: won.value })
        }).catch(() => {})

        // Mock increment XP in local/backend storage telemetry
        if (won.type === 'xp') {
          fetch('/api/user/add-xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: won.value })
          }).catch(() => {})
        }
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 p-6 md:p-8 rounded-3xl glass border border-border/40 my-4 relative overflow-hidden">
        
        {/* Visual spinner wheel panel (Left) */}
        <div className="flex-1 flex flex-col items-center gap-6 relative">
          
          {/* Top Pointer indicator arrow */}
          <div className="absolute top-[8px] z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
          </div>

          <div className="relative rounded-full p-2 border-4 border-primary/20 bg-background/50 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="rounded-full bg-card"
            />
          </div>

          <button
            onClick={startSpin}
            disabled={spinning || dailyClaimed}
            className={`h-12 px-8 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg cursor-pointer ${
              dailyClaimed
                ? 'bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/40'
                : 'bg-primary text-white shadow-primary/25 border border-primary/25 hover:bg-primary/95 animate-pulse'
            }`}
          >
            {spinning ? 'Spinning Wheel...' : dailyClaimed ? 'Claimed Today' : 'Spin Wheel'}
          </button>
        </div>

        {/* Info panel (Right) */}
        <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3 justify-center md:justify-start">
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              Daily Rewards
            </h1>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Spin the Daily Wheel every 24 hours to win free account XP, coin multipliers, mystery boxes, or the legendary Jackpot profile badge!
          </p>

          {/* Reward Alert Box */}
          {reward && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center animate-bounce flex flex-col gap-1 items-center">
              <div className="flex items-center gap-1 text-accent font-bold">
                <Star className="h-4.5 w-4.5 fill-accent" />
                <span>CONGRATULATIONS!</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                You won: <span className="text-primary font-black uppercase text-base">{reward.label}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex flex-col gap-1">
              <span className="text-foreground">Sectors</span>
              <span>8 Rewards</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex flex-col gap-1">
              <span className="text-foreground">Reset Time</span>
              <span>Every Midnight</span>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
