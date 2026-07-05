'use client'

import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, Info, ExternalLink } from 'lucide-react'

interface InterstitialAdProps {
  onComplete: () => void
}

export default function InterstitialAd({ onComplete }: InterstitialAdProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(5)
  const [canSkip, setCanSkip] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [sponsor, setSponsor] = useState({
    title: 'NordVPN',
    cta: 'Secure your internet with 63% off NordVPN. Stay anonymous while gaming.',
    logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=100&auto=format&fit=crop',
    bgUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop',
    link: 'https://google.com'
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('arcadecore_monetization_settings')
      if (saved) {
        const config = JSON.parse(saved)
        setSecondsRemaining(Number(config.adCountdownSeconds ?? 5))
        setSponsor({
          title: config.sponsorTitle || 'NordVPN',
          cta: config.sponsorCta || 'Secure your internet with 63% off NordVPN. Stay anonymous while gaming.',
          logoUrl: config.sponsorLogo || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=100&auto=format&fit=crop',
          bgUrl: config.sponsorBg || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop',
          link: config.sponsorLink || 'https://google.com'
        })
      }
    } catch (e) {
      console.warn('Failed to load monetization configuration from storage:', e)
    }
  }, [])

  useEffect(() => {
    if (secondsRemaining > 0) {
      const timer = setTimeout(() => {
        setSecondsRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanSkip(true)
    }
  }, [secondsRemaining])

  const handleSkip = () => {
    if (canSkip) {
      onComplete()
    }
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#09090e] flex flex-col justify-between p-6 select-none font-sans">
      
      {/* Top Banner: Ad Metadata & Skip Button */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/60 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Advertisement by Sponsor</span>
        </div>

        {/* Skip button / Timer */}
        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className={`h-10 px-6 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center gap-2 border transition-all cursor-pointer ${
            canSkip
              ? 'bg-primary text-white border-primary/20 hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-[1.02]'
              : 'bg-muted/80 text-muted-foreground/60 border-border/40 cursor-not-allowed'
          }`}
        >
          {canSkip ? (
            <span>Skip Ad</span>
          ) : (
            <span>Ad will close in {secondsRemaining}s</span>
          )}
        </button>
      </div>

      {/* Middle Banner: Interactive Ad Graphic Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-6 rounded-2xl overflow-hidden border border-border/20 group">
        <img
          src={sponsor.bgUrl}
          alt={sponsor.title}
          className="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090e] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md text-center px-4 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-black border border-white/10 overflow-hidden p-1 shadow-2xl">
            <img src={sponsor.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h3 className="text-xl font-black font-display tracking-wider text-foreground">
            {sponsor.title}
          </h3>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">
            {sponsor.cta}
          </p>
          <a
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 h-10 px-5 rounded-lg bg-secondary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-secondary/95 transition-all shadow-md shadow-secondary/20"
          >
            <span>Learn More</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Bottom Control panel bar */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4 z-10">
        <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
          ArcadeCore Ads Manager
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

    </div>
  )
}
