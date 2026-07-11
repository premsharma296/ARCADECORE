'use client'

import React from 'react'
import Link from 'next/link'
import { Play, Star, Eye, Flame, ShieldAlert, Sparkles, Users } from 'lucide-react'

interface GridGame {
  id: string
  title: string
  slug: string
  description: string
  bannerUrl: string | null
  thumbnailUrl?: string
  rating: number
  playCount: number
  categories: { name: string; slug: string }[]
}

export default function FeaturedGrid({ games }: { games: GridGame[] }) {
  if (!games || games.length === 0) return null

  // Ensure we have up to 5 games for our mosaic layout, fallback to duplicates if needed
  const items = [...games]
  while (items.length < 5) {
    items.push(items[0])
  }

  const formatPlays = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 select-none">
      
      {/* 1. Large Left Card (Bloxd.io style) */}
      <div className="md:col-span-4 h-[320px] md:h-[400px]">
        <Link
          href={`/games/${items[0].slug}`}
          className="group relative flex flex-col w-full h-full rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.01]"
        >
          <img
            src={items[0].bannerUrl || items[0].thumbnailUrl || ''}
            alt={items[0].title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-4 left-4 z-10">
            <span className="px-2.5 py-1 text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider rounded shadow-md border border-blue-500/20 flex items-center gap-0.5 animate-pulse">
              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              Top Updated
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2.5">
            <div className="flex gap-1.5">
              {items[0].categories.slice(0, 2).map(cat => (
                <span key={cat.slug} className="px-2 py-0.5 text-[9px] font-bold bg-white/10 text-white uppercase tracking-wider rounded backdrop-blur-md">
                  {cat.name}
                </span>
              ))}
            </div>
            <h3 className="text-xl font-black font-display text-white tracking-wide leading-tight group-hover:text-primary transition-colors">
              {items[0].title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {items[0].description}
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-white mt-1">
              <span className="flex items-center gap-1 text-accent">
                <Star className="h-3.5 w-3.5 fill-accent stroke-accent" />
                {items[0].rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-secondary" />
                {formatPlays(items[0].playCount)} plays
              </span>
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 scale-75 group-hover:scale-100 transition-transform">
              <Play className="h-6 w-6 fill-white pl-0.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Middle 2x2 Grid Column */}
      <div className="md:col-span-5 grid grid-cols-2 gap-4 h-[320px] md:h-[400px]">
        {[items[1], items[2], items[3], items[4]].map((game, idx) => (
          <Link
            key={`featured-mid-${game.slug}-${idx}`}
            href={`/games/${game.slug}`}
            className="group relative flex flex-col w-full h-full rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <img
              src={game.thumbnailUrl || game.bannerUrl || ''}
              alt={game.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            <div className="absolute top-3 left-3 z-10">
              {idx === 0 ? (
                <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-red-600 text-white uppercase tracking-wider rounded border border-red-500/20">
                  🔥 Hot
                </span>
              ) : idx === 1 ? (
                <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-purple-600 text-white uppercase tracking-wider rounded border border-purple-500/20">
                  Live
                </span>
              ) : null}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3.5 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {game.categories[0]?.name}
              </span>
              <h4 className="font-extrabold text-xs text-white truncate group-hover:text-primary transition-colors">
                {game.title}
              </h4>
              <div className="flex items-center gap-2.5 text-[9px] font-bold text-white/80">
                <span className="flex items-center gap-0.5 text-accent">
                  <Star className="h-3 w-3 fill-accent stroke-accent" />
                  {game.rating.toFixed(1)}
                </span>
                <span>{formatPlays(game.playCount)} plays</span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform">
                <Play className="h-4 w-4 fill-white pl-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 3. Large Right Card (EvoWars.io style) */}
      <div className="md:col-span-3 h-[320px] md:h-[400px]">
        <Link
          href={`/games/${items[2].slug}`}
          className="group relative flex flex-col w-full h-full rounded-2xl overflow-hidden border border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.01]"
        >
          <img
            src={items[2].bannerUrl || items[2].thumbnailUrl || ''}
            alt={items[2].title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-4 left-4 z-10 flex gap-1">
            <span className="px-2 py-0.5 text-[9px] font-extrabold bg-purple-600/90 text-white uppercase tracking-wider rounded shadow-md border border-purple-500/20 flex items-center gap-0.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Live Tournament
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              {items[2].categories[0]?.name}
            </span>
            <h3 className="text-base font-black font-display text-white tracking-wide truncate group-hover:text-primary transition-colors">
              {items[2].title}
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold text-white">
              <span className="flex items-center gap-1 text-accent">
                <Star className="h-3.5 w-3.5 fill-accent stroke-accent" />
                {items[2].rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">{formatPlays(items[2].playCount)} plays</span>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform">
              <Play className="h-5 w-5 fill-white pl-0.5" />
            </div>
          </div>
        </Link>
      </div>

    </div>
  )
}
