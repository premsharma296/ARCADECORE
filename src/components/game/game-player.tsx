'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, Play, Volume2, VolumeX, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'
import InterstitialAd from '@/components/monetization/interstitial-ad'

interface GamePlayerProps {
  iframeUrl: string
  title: string
  slug: string
  thumbnailUrl: string
}

export default function GamePlayer({ iframeUrl, title, slug, thumbnailUrl }: GamePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAd, setShowAd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const handleStartPlay = () => {
    try {
      const saved = localStorage.getItem('arcadecore_monetization_settings')
      if (saved) {
        const config = JSON.parse(saved)
        if (config.globalAdsEnabled === false) {
          setIsPlaying(true)
          return
        }
      }
    } catch (e) {}

    // Show interstitial monetization ad gate before starting game
    setShowAd(true)
  }

  const handleAdComplete = () => {
    setShowAd(false)
    setIsPlaying(true)
    
    // Play laser starting chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch (e) {
      console.warn('Audio Context failed to start')
    }

    // Register a play view telemetry count
    fetch(`/api/games/${slug}/play`, { method: 'POST' }).catch(() => {})

    // Save to local storage for "Continue Playing" history
    try {
      const recent = localStorage.getItem('arcadecore_recent')
      let list = recent ? JSON.parse(recent) : []
      list = list.filter((g: any) => g.slug !== slug)
      list.unshift({ title, slug, thumbnailUrl })
      localStorage.setItem('arcadecore_recent', JSON.stringify(list.slice(0, 10)))
    } catch (e) {
      console.warn('Storage save failed:', e)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Fullscreen request failed:', err)
      })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle ESC or native fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {/* Game Iframe Container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-video rounded-2xl overflow-hidden border border-border/60 bg-black shadow-2xl ${
          isFullscreen ? 'w-screen h-screen rounded-none border-0' : ''
        }`}
      >
        {/* Ad Gate Screen */}
        {showAd && (
          <InterstitialAd onComplete={handleAdComplete} />
        )}

        {/* Start Game Splash overlay */}
        {!isPlaying && !showAd && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center select-none">
            {/* Blurry background thumbnail */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-105 pointer-events-none"
              suppressHydrationWarning
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            <div className="relative z-20 flex flex-col items-center gap-6 max-w-sm">
              <h2 className="text-2xl font-black font-display tracking-wider text-foreground">
                READY TO PLAY?
              </h2>
              
              <button
                onClick={handleStartPlay}
                className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 hover:bg-primary/95 transition-all cursor-pointer animate-bounce"
                aria-label="Play game"
              >
                <Play className="h-6 w-6 fill-white pl-1" />
              </button>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                <span>Runs securely in HTML5 sandbox</span>
              </div>
            </div>
          </div>
        )}

        {/* Real Sandbox Game Iframe */}
        {isPlaying && !showAd && (
          <iframe
            src={iframeUrl}
            title={title}
            allow="autoplay; gamepad; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="w-full h-full border-0"
          />
        )}
      </div>

      {/* Embedded Controls Action Bar */}
      <div className="flex items-center justify-between glass px-4 py-2.5 rounded-xl border border-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(false)
              setShowAd(false)
            }}
            disabled={!isPlaying}
            className="p-2 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all cursor-pointer"
            title="Reload Game"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-1.5 rounded-lg border border-border/40 font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>Sandbox Mode</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
