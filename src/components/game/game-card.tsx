'use client'

import React from 'react'
import Link from 'next/link'
import { Play, Star, Eye } from 'lucide-react'

export interface GameCardProps {
  id: string
  title: string
  slug: string
  thumbnailUrl: string
  rating: number
  playCount: number
  isFeatured?: boolean
  isSponsored?: boolean
  categories?: { name: string; slug: string }[]
}

export default function GameCard({
  title,
  slug,
  thumbnailUrl,
  rating,
  playCount,
  isFeatured,
  isSponsored,
  categories,
}: GameCardProps) {
  // Format play count to human readable (e.g. 1.2M, 240K)
  const formatPlays = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  return (
    <Link
      href={`/games/${slug}`}
      className="group relative flex flex-col rounded-2xl bg-card border border-border/40 overflow-hidden shadow-md hover:shadow-primary/10 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:scale-[1.03]"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          suppressHydrationWarning
        />

        {/* Shadow overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity" />

        {/* Hover Action: Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-5 w-5 fill-white pl-0.5" />
          </div>
        </div>

        {/* Sponsored / Featured Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isSponsored && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-accent text-accent-foreground uppercase tracking-widest rounded-md shadow-md border border-accent/20">
              Sponsored
            </span>
          )}
          {isFeatured && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-primary text-white uppercase tracking-widest rounded-md shadow-md border border-primary/20">
              Featured
            </span>
          )}
        </div>

        {/* Category Badge overlay on bottom */}
        {categories && categories.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex gap-1">
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/60 text-foreground uppercase tracking-wider rounded backdrop-blur-sm border border-white/5">
              {categories[0].name}
            </span>
          </div>
        )}

        {/* Play count on bottom right */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 text-[10px] font-semibold bg-black/60 text-foreground px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5">
          <Eye className="h-3 w-3 text-secondary" />
          <span>{formatPlays(playCount)}</span>
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-col p-3.5 gap-1.5 flex-1 justify-between bg-card/45 backdrop-blur-sm">
        <h4 className="font-semibold text-sm tracking-wide text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </h4>

        {/* Rating and Details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-bold text-accent">
            <Star className="h-3.5 w-3.5 fill-accent stroke-accent" />
            <span>{rating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground/60">
            ArcadeCore Devs
          </span>
        </div>
      </div>
    </Link>
  )
}
