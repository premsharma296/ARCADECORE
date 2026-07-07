import React from 'react'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import HeroCarousel from '@/components/game/hero-carousel'
import GameCard from '@/components/game/game-card'
import ContinuePlayingGrid from '@/components/game/continue-playing-grid'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import LiveSidebar from '@/components/realtime/live-sidebar'
import SpikeSnakeSpotlight from '@/components/game/spike-snake-spotlight'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { Flame, Star, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'ArcadeCore - Play Free Online HTML5 Browser Games',
  description: 'Play 100+ free online HTML5 browser games on ArcadeCore. Experience action, racing, and puzzle games instantly. Spin daily rewards and compete on global leaderboards!',
}

export const revalidate = 60 // Cache home page for 1 minute

async function getGamesData() {
  try {
    const games = await db.game.findMany({
      include: {
        categories: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } }
      },
      orderBy: { playCount: 'desc' }
    })

    if (games.length === 0) {
      throw new Error('Database is empty, fallback to seed arrays')
    }

    return games
  } catch (error) {
    console.log('Database query failed or is empty; utilizing fallback catalog data.')
    return getFullMockCatalog()
  }
}

export default async function Home() {
  const games = await getGamesData()

  // Sift categories/featured items
  const featuredGames = games.filter((g) => g.isFeatured).slice(0, 5)
  const trendingGames = games.slice(0, 4) // Adjust count for 2x2 card sizes in dual-col
  const recommendedGames = games.filter((g) => g.rating >= 4.6).slice(0, 4)

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* Main Content (Left: 9 columns) */}
        <div className="lg:col-span-9 flex flex-col gap-10">

          {/* 🐍 SPIKE SNAKE — Premium Featured Spotlight */}
          <section aria-label="Featured: Spike Snake">
            <SpikeSnakeSpotlight />
          </section>
          
          {/* 1. Hero Showcase Carousel */}
          <section aria-label="Featured Games">
            <HeroCarousel games={featuredGames} />
          </section>

          {/* Continue/Recently Played Slider */}
          <ContinuePlayingGrid />

          {/* 2. Trending Grid */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Flame className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
                Trending Games
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {trendingGames.map((game) => (
                <GameCard
                  key={`trending-${game.slug}`}
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
          </section>

          {/* 3. Recommended Panel */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Star className="h-5 w-5 text-accent fill-accent" />
              <h2 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
                Recommended For You
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {recommendedGames.map((game) => (
                <GameCard
                  key={`recommended-${game.slug}`}
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
          </section>

          {/* 4. Complete Games List (Infinite Scroll) */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="h-5 w-5 text-secondary animate-bounce" />
              <h2 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
                All Arcade Games
              </h2>
            </div>
            <InfiniteScrollGrid initialGames={games} />
          </section>
        </div>

        {/* Real-time Side Control Tickers Panel (Right: 3 columns) */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-3">
              🔴 Live Activities
            </h3>
            <LiveSidebar />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
