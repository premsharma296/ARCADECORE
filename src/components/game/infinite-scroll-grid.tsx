'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import GameCard from './game-card'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollGridProps {
  initialGames: any[]
}

export default function InfiniteScrollGrid({ initialGames }: InfiniteScrollGridProps) {
  const [displayedGames, setDisplayedGames] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  
  const BATCH_SIZE = 12

  useEffect(() => {
    // Initialize first batch
    setDisplayedGames(initialGames.slice(0, BATCH_SIZE))
    setHasMore(initialGames.length > BATCH_SIZE)
  }, [initialGames])

  const loadMore = useCallback(() => {
    setLoading(true)
    // Simulate minor network delay for premium visual feedback
    setTimeout(() => {
      const currentLength = displayedGames.length
      const nextBatch = initialGames.slice(currentLength, currentLength + BATCH_SIZE)
      
      setDisplayedGames((prev) => [...prev, ...nextBatch])
      setHasMore(currentLength + BATCH_SIZE < initialGames.length)
      setLoading(false)
    }, 600)
  }, [displayedGames.length, initialGames])

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
    <div className="flex flex-col gap-8">
      {/* Grid wrapper */}
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
