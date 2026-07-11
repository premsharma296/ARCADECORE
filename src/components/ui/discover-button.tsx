'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Shuffle, Play, Zap } from 'lucide-react'

interface Game {
  slug: string
  title: string
  thumbnailUrl?: string
  categories?: { name: string }[]
}

export default function DiscoverButton({ games }: { games: Game[] }) {
  const [current, setCurrent] = useState<Game | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const pickRandom = useCallback(() => {
    if (!games || games.length === 0) return
    setIsSpinning(true)
    setRevealed(false)

    // Cycle through a few games visually before settling
    let cycles = 0
    const maxCycles = 8
    const interval = setInterval(() => {
      const random = games[Math.floor(Math.random() * games.length)]
      setCurrent(random)
      cycles++
      if (cycles >= maxCycles) {
        clearInterval(interval)
        setIsSpinning(false)
        setRevealed(true)
      }
    }, 80)
  }, [games])

  useEffect(() => {
    if (games && games.length > 0) {
      setCurrent(games[Math.floor(Math.random() * games.length)])
    }
  }, [games])

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-border/30 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-2 z-10">
        <Zap className="h-4 w-4 text-primary animate-pulse" />
        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest">Feeling Lucky?</h3>
        <Zap className="h-4 w-4 text-primary animate-pulse" />
      </div>

      {/* Game Preview */}
      <div className={`relative w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${revealed ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/30'}`}>
        {current?.thumbnailUrl ? (
          <img
            src={current.thumbnailUrl}
            alt={current.title || ''}
            className={`w-full h-full object-cover transition-all duration-150 ${isSpinning ? 'blur-sm scale-110' : 'blur-0 scale-100'}`}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Shuffle className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isSpinning && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {current && !isSpinning && (
        <div className="text-center z-10">
          <p className="text-xs font-bold text-foreground truncate max-w-[180px]">{current.title}</p>
          {current.categories?.[0] && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{current.categories[0].name}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 z-10 w-full max-w-[200px]">
        <button
          onClick={pickRandom}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-all hover:scale-105 active:scale-95 border border-border/30"
        >
          <Shuffle className={`h-3.5 w-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
          Shuffle
        </button>
        {current && !isSpinning && (
          <Link
            href={`/games/${current.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Play!
          </Link>
        )}
      </div>
    </div>
  )
}
