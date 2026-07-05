import React from 'react'
import { notFound } from 'next/navigation'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { Hammer, Globe } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return { title: 'Developers - ArcadeCore' }
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `Play games by ${title} - ArcadeCore`,
    description: `Play free browser games developed by ${title} online. Direct sandbox embeds, no installation required!`,
  }
}

async function getDeveloperData(slug: string) {
  const devNameNormalized = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  try {
    const dev = await db.developer.findFirst({
      where: {
        name: { equals: devNameNormalized, mode: 'insensitive' }
      },
      include: {
        games: {
          include: {
            categories: { select: { name: true, slug: true } }
          }
        }
      }
    })

    if (!dev) {
      // search in mock catalog
      const mockGames = getFullMockCatalog()
      const devNameMatch = devNameNormalized.toLowerCase()
      const filteredGames = mockGames.filter(g => 
        g.slug.includes(slug) || devNameMatch.includes('arcadecore')
      )

      if (filteredGames.length === 0) return null

      return {
        name: devNameNormalized,
        website: 'https://arcadecore.com',
        games: filteredGames
      }
    }

    return dev
  } catch (error) {
    const filteredGames = getFullMockCatalog().slice(0, 10) // default fallback selection
    return {
      name: devNameNormalized,
      website: 'https://arcadecore.com',
      games: filteredGames
    }
  }
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return notFound()

  const dev = await getDeveloperData(slug)

  if (!dev) {
    return notFound()
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
              <Hammer className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
                Games by {dev.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Explore the complete browser gaming portfolio published by {dev.name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            {dev.website && (
              <a
                href={dev.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 hover:text-primary hover:border-primary/20 transition-all"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Developer Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Portfolio Grids */}
        <div className="mt-4">
          <InfiniteScrollGrid initialGames={dev.games} />
        </div>

      </div>
    </AppShell>
  )
}
