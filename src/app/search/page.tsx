import React from 'react'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { Search } from 'lucide-react'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return {
    title: `Search results for "${q || ''}" - ArcadeCore`,
    description: `Browse instant browser search matches for ${q || ''} on ArcadeCore.`,
  }
}

async function searchGames(query: string) {
  if (!query.trim()) return []

  try {
    const games = await db.game.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        categories: { select: { name: true, slug: true } }
      }
    })

    return games
  } catch (error) {
    // Database failed, filter fallback data
    const catalog = getFullMockCatalog()
    const cleanQuery = query.toLowerCase()
    
    return catalog.filter((g) => 
      g.title.toLowerCase().includes(cleanQuery) || 
      g.description.toLowerCase().includes(cleanQuery) ||
      g.categories.some(c => c.name.toLowerCase().includes(cleanQuery))
    )
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q || ''
  const games = await searchGames(query)

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full">
        
        {/* Search header status */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-wider uppercase text-foreground">
              Search Results
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {games.length} matching games for &ldquo;<span className="text-primary font-semibold">{query}</span>&rdquo;
            </p>
          </div>
        </div>

        {/* Results grid container */}
        <div className="mt-2">
          {games.length > 0 ? (
            <InfiniteScrollGrid initialGames={games} />
          ) : (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-muted/20 flex flex-col gap-2 items-center justify-center">
              <p className="text-sm font-bold text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your spelling or searching for broader keywords.</p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
