'use client'

import React, { useState, useEffect } from 'react'
import GameCard from './game-card'
import { Play } from 'lucide-react'

export default function ContinuePlayingGrid() {
  const [recentGames, setRecentGames] = useState<any[]>([])

  useEffect(() => {
    const list = localStorage.getItem('arcadecore_recent')
    if (list) {
      try {
        setRecentGames(JSON.parse(list).slice(0, 6))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  if (recentGames.length === 0) return null

  return (
    <section className="flex flex-col gap-4 animate-fade-in animate-duration-300">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Play className="h-4 w-4 fill-primary" />
        </div>
        <h2 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
          Continue Playing
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {recentGames.map((game) => (
          <GameCard
            key={`recent-${game.slug}`}
            id={game.id || game.slug}
            title={game.title}
            slug={game.slug}
            thumbnailUrl={game.thumbnailUrl}
            rating={game.rating || 4.5}
            playCount={game.playCount || 1000}
            categories={game.categories}
          />
        ))}
      </div>
    </section>
  )
}
