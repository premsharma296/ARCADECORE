'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import GameCard from './game-card'
import { Loader2, Users, Clock, Flame, Sparkles } from 'lucide-react'

interface InfiniteScrollGridProps {
  initialGames: any[]
}

export default function InfiniteScrollGrid({ initialGames }: InfiniteScrollGridProps) {
  const [playerFilter, setPlayerFilter] = useState<'all' | '1player' | '2player' | 'online'>('all')
  const [durationFilter, setDurationFilter] = useState<'all' | 'quick' | 'standard' | 'long'>('all')
  
  const [displayedGames, setDisplayedGames] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  
  const BATCH_SIZE = 12

  // Get matching filtered games list
  const getFilteredGames = useCallback(() => {
    return initialGames.filter(game => {
      // 1. Player Count Filter
      const isMultiplayerCat = game.categories?.some((c: any) => c.slug === 'multiplayer') || false
      const hasLocalTwoPlayer = game.controls?.toLowerCase().includes('player 2') || game.controls?.toLowerCase().includes('p2') || game.slug === 'neon-showdown'
      
      if (playerFilter === '1player' && (isMultiplayerCat || hasLocalTwoPlayer)) return false
      if (playerFilter === '2player' && !hasLocalTwoPlayer) return false
      if (playerFilter === 'online' && !isMultiplayerCat) return false
      
      // 2. Play Duration Filter
      const categoriesSlugs = game.categories?.map((c: any) => c.slug) || []
      const isIdle = categoriesSlugs.includes('idle') || categoriesSlugs.includes('simulation') || game.slug.includes('clicker')
      const isRacerOrMulti = categoriesSlugs.includes('racing') || categoriesSlugs.includes('multiplayer')
      
      let duration: 'quick' | 'standard' | 'long' = 'standard'
      if (isIdle || game.slug.includes('flappy') || game.slug.includes('clicker')) {
        duration = 'quick'
      } else if (isRacerOrMulti) {
        duration = 'long'
      }
      
      if (durationFilter === 'quick' && duration !== 'quick') return false
      if (durationFilter === 'standard' && duration !== 'standard') return false
      if (durationFilter === 'long' && duration !== 'long') return false
      
      return true
    })
  }, [initialGames, playerFilter, durationFilter])

  // Reset display when filters change
  useEffect(() => {
    const filtered = getFilteredGames()
    setDisplayedGames(filtered.slice(0, BATCH_SIZE))
    setHasMore(filtered.length > BATCH_SIZE)
  }, [playerFilter, durationFilter, getFilteredGames])

  const loadMore = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const filtered = getFilteredGames()
      const currentLength = displayedGames.length
      const nextBatch = filtered.slice(currentLength, currentLength + BATCH_SIZE)
      
      setDisplayedGames((prev) => [...prev, ...nextBatch])
      setHasMore(currentLength + BATCH_SIZE < filtered.length)
      setLoading(false)
    }, 400)
  }, [displayedGames.length, getFilteredGames])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [displayedGames, hasMore, loading, loadMore])

  return (
    <div className="flex flex-col gap-6">
      
      {/* Filtering Control Bar */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-muted/10">
        
        {/* Row 1: Player filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 min-w-[100px]">
            <Users className="h-3.5 w-3.5" />
            <span>Players:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPlayerFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                playerFilter === 'all'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All Modes
            </button>
            <button
              onClick={() => setPlayerFilter('1player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                playerFilter === '1player'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              👤 Singleplayer
            </button>
            <button
              onClick={() => setPlayerFilter('2player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                playerFilter === '2player'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              👥 2 Player Local
            </button>
            <button
              onClick={() => setPlayerFilter('online')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                playerFilter === 'online'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              🌐 Online PvP
            </button>
          </div>
        </div>

        {/* Row 2: Duration filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-border/20 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 min-w-[100px]">
            <Clock className="h-3.5 w-3.5" />
            <span>Play Time:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setDurationFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                durationFilter === 'all'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Any Time
            </button>
            <button
              onClick={() => setDurationFilter('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                durationFilter === 'quick'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚡ Quick Fire (&lt;2 Min)
            </button>
            <button
              onClick={() => setDurationFilter('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                durationFilter === 'standard'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              ⏱️ Standard (2-10 Min)
            </button>
            <button
              onClick={() => setDurationFilter('long')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                durationFilter === 'long'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-background border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              🏆 Long Session (10+ Min)
            </button>
          </div>
        </div>

      </div>

      {/* Grid wrapper */}
      {displayedGames.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-border flex flex-col gap-2 items-center justify-center bg-muted/5">
          <span className="text-sm font-semibold text-muted-foreground">No matches found with this configuration.</span>
          <button 
            onClick={() => { setPlayerFilter('all'); setDurationFilter('all'); }}
            className="text-xs font-extrabold uppercase text-primary tracking-wider hover:underline mt-1"
          >
            Clear Active Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {displayedGames.map((game) => (
            <GameCard
              key={game.id || game.slug}
              id={game.id}
              title={game.title}
              slug={game.slug}
              thumbnailUrl={game.thumbnailUrl}
              rating={game.rating}
              playCount={game.playCount}
              isFeatured={game.isFeatured}
              isSponsored={game.isSponsored}
              categories={game.categories}
            />
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel element */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="w-full py-8 flex items-center justify-center"
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-sm glass px-4 py-2 rounded-full border border-primary/20 shadow-lg">
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>Buffering more games...</span>
          </div>
        </div>
      )}
    </div>
  )
}
