'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, ChevronLeft, ChevronRight, Eye, Star } from 'lucide-react'

interface CarouselGame {
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

export default function HeroCarousel({ games }: { games: CarouselGame[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Autoplay slides
  useEffect(() => {
    if (games.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % games.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [games])

  if (!games || games.length === 0) return null
  if (!mounted) {
    return <div className="relative w-full h-[360px] md:h-[420px] rounded-3xl bg-muted/40 animate-pulse border border-border/40" />
  }

  const activeGame = games[activeIndex]

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % games.length)
  }

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + games.length) % games.length)
  }

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-3xl overflow-hidden border border-border/40 group shadow-2xl">
      {/* Background Image slide */}
      <div className="absolute inset-0 bg-muted">
        <img
          src={activeGame.bannerUrl || activeGame.thumbnailUrl || ''}
          alt={activeGame.title}
          className="w-full h-full object-cover object-center transition-all duration-700 scale-102"
          suppressHydrationWarning
        />
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent hidden md:block" />
      </div>

      {/* Slide Navigation Buttons */}
      {games.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl glass border border-white/5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary/20 cursor-pointer z-20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl glass border border-white/5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary/20 cursor-pointer z-20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Content block overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col justify-end h-full z-10 select-none">
        <div className="max-w-2xl flex flex-col gap-4">
          
          {/* Tags / Badge row */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold bg-primary text-white uppercase tracking-widest rounded-lg shadow-md shadow-primary/20">
              Featured Game
            </span>
            {activeGame.categories.map((cat) => (
              <span
                key={cat.slug}
                className="px-2.5 py-1 text-[10px] font-bold bg-white/10 text-foreground uppercase tracking-wider rounded-lg backdrop-blur-md"
              >
                {cat.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-wide text-foreground leading-tight drop-shadow-lg">
            {activeGame.title}
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-muted-foreground line-clamp-2 leading-relaxed drop-shadow-md">
            {activeGame.description}
          </p>

          {/* Stats and play button row */}
          <div className="flex items-center gap-6 mt-2">
            {/* Play Button */}
            <Link href={`/games/${activeGame.slug}`}>
              <button className="h-12 px-6 rounded-xl bg-primary text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/95 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <Play className="h-4.5 w-4.5 fill-white" />
                <span>Play Now</span>
              </button>
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-1.5 text-sm font-bold text-accent">
              <Star className="h-4 w-4 fill-accent stroke-accent" />
              <span>{activeGame.rating.toFixed(1)}</span>
            </div>

            {/* Total play stats */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Eye className="h-4 w-4 text-secondary" />
              <span>{activeGame.playCount.toLocaleString()} plays</span>
            </div>
          </div>

        </div>
      </div>

      {/* Slide Indicators dot indicators */}
      {games.length > 1 && (
        <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
          {games.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
