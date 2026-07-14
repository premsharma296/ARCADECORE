'use client'

import React, { useState, useEffect } from 'react'
import GameCard from './game-card'
import { Play, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useUser, SignInButton } from '@clerk/nextjs'

export default function ContinuePlayingGrid() {
  const { isSignedIn } = useUser()
  const [recentGames, setRecentGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadLocalRecent = () => {
    const list = localStorage.getItem('arcadecore_recent')
    if (list) {
      try {
        setRecentGames(JSON.parse(list).slice(0, 6))
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      setLoading(true)
      fetch('/api/user/progressed')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.games) && data.games.length > 0) {
            setRecentGames(data.games)
          } else {
            loadLocalRecent()
          }
        })
        .catch(() => loadLocalRecent())
        .finally(() => setLoading(false))
    } else {
      loadLocalRecent()
    }
  }, [isSignedIn])

  if (recentGames.length === 0) return null

  return (
    <section className="flex flex-col gap-4 animate-fade-in animate-duration-300">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Play className="h-4 w-4 fill-primary" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
            Continue Playing
          </h2>
        </div>
        
        {isSignedIn && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cloud Saved</span>
          </div>
        )}
      </div>

      {/* Guest Progress Warning Banner */}
      {!isSignedIn && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 backdrop-blur-md shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              <span className="font-extrabold uppercase mr-1.5">Guest Mode Active:</span>
              Your progress is saved locally. Create an account to sync scores, XP, and coins across devices!
            </p>
          </div>
          <SignInButton mode="modal">
            <button className="flex-shrink-0 h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-amber-500/20">
              Sync My Progress
            </button>
          </SignInButton>
        </div>
      )}

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

