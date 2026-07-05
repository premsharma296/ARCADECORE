'use client'

import React, { useState, useEffect } from 'react'
import { Info, Volume2, VolumeX, Gift, CheckCircle, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import sound from '@/lib/sound'

interface RewardedAdProps {
  onRewardClaimed: () => void
  onClose: () => void
}

export default function RewardedAd({ onRewardClaimed, onClose }: RewardedAdProps) {
  const [loading, setLoading] = useState(true)
  const [secondsRemaining, setSecondsRemaining] = useState(10)
  const [muted, setMuted] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    // Simulate loading the ad video buffer
    const bufferTimer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(bufferTimer)
  }, [])

  useEffect(() => {
    if (loading || secondsRemaining <= 0) return

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1)
      sound.playTick()
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, secondsRemaining])

  const handleClaimReward = () => {
    setClaimed(true)
    sound.playWin()
    confetti({
      particleCount: 100,
      spread: 60,
      colors: ['#06b6d4', '#eab308']
    })
    
    setTimeout(() => {
      onRewardClaimed()
      onClose()
    }, 2000)
  }

  const progressPercent = ((10 - secondsRemaining) / 10) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dimmer */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Main Dialog container */}
      <div className="relative w-full max-w-lg aspect-video p-6 rounded-2xl glass border border-secondary/20 bg-[#09090e]/95 shadow-2xl z-50 overflow-hidden flex flex-col justify-between font-sans">
        
        {/* Ad Tag details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Info className="h-3.5 w-3.5" />
            <span>Rewarded Sponsor Ad</span>
          </div>

          <div className="text-xs font-bold text-secondary">
            {secondsRemaining > 0 ? (
              <span>Reward unlocked in {secondsRemaining}s</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to Claim!</span>
              </span>
            )}
          </div>
        </div>

        {/* Video Area content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-6 relative rounded-xl overflow-hidden bg-black/35 border border-border/20">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-secondary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Caching Ad video...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 max-w-xs p-4">
              <div className="h-12 w-12 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary animate-bounce">
                <Gift className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black font-display tracking-wider text-foreground">
                CYBER BOOTCAMP 2026
              </h3>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Become a senior stack engineer. Enroll now to get $500 early-bird scholarship discounts.
              </p>
            </div>
          )}
        </div>

        {/* Bottom controls & progress bar */}
        <div className="flex flex-col gap-4">
          {/* Progress bar line */}
          {!loading && (
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <button
              onClick={() => setMuted(!muted)}
              className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {secondsRemaining <= 0 ? (
              <button
                onClick={handleClaimReward}
                disabled={claimed}
                className="h-9 px-5 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform cursor-pointer animate-pulse"
              >
                <span>{claimed ? 'Claimed!' : 'Claim double coins'}</span>
                <Gift className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled
                className="h-9 px-5 rounded-xl bg-muted/80 text-muted-foreground/60 border border-border/40 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
              >
                Watch to Claim
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
