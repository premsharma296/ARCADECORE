import React from 'react'
import { notFound } from 'next/navigation'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { Tag } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return { title: 'Tags - ArcadeCore' }
  const title = slug.charAt(0).toUpperCase() + slug.slice(1)
  return {
    title: `Best ${title} Games - Play Free Online on ArcadeCore`,
    description: `Play top rated ${title.toLowerCase()} browser games instantly on ArcadeCore. No downloads required, full mobile support!`,
  }
}

async function getTagData(slug: string) {
  try {
    const tag = await db.tag.findUnique({
      where: { slug },
      include: {
        games: {
          include: {
            categories: { select: { name: true, slug: true } }
          }
        }
      }
    })

    if (!tag) {
      // Fallback search in static catalog
      const mockGames = getFullMockCatalog().filter((g) =>
        g.tags.some((t) => t.slug === slug)
      )
      if (mockGames.length === 0) return null

      return {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        games: mockGames
      }
    }

    return tag
  } catch (error) {
    const mockGames = getFullMockCatalog().filter((g) =>
      g.tags.some((t) => t.slug === slug)
    )
    if (mockGames.length === 0) return null

    return {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      games: mockGames
    }
  }
}

export default async function TagPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return notFound()

  const tag = await getTagData(slug)

  if (!tag) {
    return notFound()
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              {tag.name} Games
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Explore our curated selection of free online {tag.name.toLowerCase()} tags and arcade classics.
            </p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="mt-4">
          <InfiniteScrollGrid initialGames={tag.games} />
        </div>

      </div>
    </AppShell>
  )
}
