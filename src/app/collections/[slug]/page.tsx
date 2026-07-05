import React from 'react'
import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { Layers, Sparkles } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return { title: 'Collections - ArcadeCore' }
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${title} - Curated Arcade Games on ArcadeCore`,
    description: `Browse our hand-picked curated catalog of ${title.toLowerCase()} browser games. Play instantly with no installs!`,
  }
}

// Simulated static lists of dynamic themed collections
const CURATED_COLLECTIONS: { [key: string]: { name: string; desc: string; filter: (g: any) => boolean } } = {
  'best-retro-games': {
    name: 'Best Retro Games of 2026',
    desc: 'Take a trip down memory lane with these pixel art, retro chiptune, and grid-perspective browser arcade hits.',
    filter: (g) => g.tags.some((t: any) => t.slug === 'retro')
  },
  'cyber-neon-classics': {
    name: 'Cyber Neon Classics',
    desc: 'Glowing colors, electric cyan grids, and fast-paced arcade velocity. Play our top visual synthwave games.',
    filter: (g) => g.tags.some((t: any) => t.slug === 'neon')
  },
  'casual-time-killers': {
    name: 'Casual Time Killers',
    desc: 'Easy to pick up, impossible to put down. Enjoy these relaxed clicking, stacking, and physics-controlled micro-puzzles.',
    filter: (g) => g.tags.some((t: any) => t.slug === 'casual')
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return notFound()

  const collection = CURATED_COLLECTIONS[slug]

  if (!collection) {
    // If not matching default categories, fallback search filter matching name queries
    const mockGames = getFullMockCatalog().slice(0, 12)
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
                {slug.replace(/-/g, ' ')} Collection
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Hand-picked list of top-ranked games selected by the ArcadeCore editors.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <InfiniteScrollGrid initialGames={mockGames} />
          </div>
        </div>
      </AppShell>
    )
  }

  const games = getFullMockCatalog().filter(collection.filter)

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              {collection.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              {collection.desc}
            </p>
          </div>
        </div>

        {/* Curator Grid */}
        <div className="mt-4">
          <InfiniteScrollGrid initialGames={games} />
        </div>

      </div>
    </AppShell>
  )
}
