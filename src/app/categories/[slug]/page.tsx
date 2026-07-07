import React from 'react'
import { notFound } from 'next/navigation'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import InfiniteScrollGrid from '@/components/game/infinite-scroll-grid'
import { getFullMockCatalog } from '@/lib/fallback-data'
import { iconMap } from '@/components/layout/sidebar'
import { Gamepad2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return { title: 'Games - ArcadeCore' }

  try {
    const cat = await db.category.findUnique({
      where: { slug }
    })
    if (cat) {
      return {
        title: `${cat.name} Games - Play Online on ArcadeCore`,
        description: `Play the best free online ${cat.name} games on ArcadeCore. No downloads or installations required!`,
      }
    }
  } catch {}

  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${title} Games - Play Online on ArcadeCore`,
    description: `Play the best free online ${title} games on ArcadeCore. No downloads or installations required!`,
  }
}

async function getCategoryData(slug: string) {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        games: {
          include: {
            categories: { select: { name: true, slug: true } }
          }
        }
      }
    })

    if (!category) {
      // check if category exists in mock data
      const mockGames = getFullMockCatalog().filter((g) =>
        g.categories.some((c) => c.slug === slug)
      )
      if (mockGames.length === 0) return null
      
      return {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        icon: 'Gamepad2',
        games: mockGames
      }
    }

    return category
  } catch (error) {
    // Database query failed, utilize mock filtering
    const mockGames = getFullMockCatalog().filter((g) =>
      g.categories.some((c) => c.slug === slug)
    )
    if (mockGames.length === 0) return null

    return {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      icon: 'Gamepad2',
      games: mockGames
    }
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params
  if (!slug) return notFound()

  const category = await getCategoryData(slug)

  if (!category) {
    return notFound()
  }

  // Resolve Category icon dynamically
  const CategoryIcon = (iconMap[category.icon] || Gamepad2) as React.ComponentType<any>

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <CategoryIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              {category.name} Games
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Play the best free online {category.name.toLowerCase()} arcade games with friends.
            </p>
          </div>
        </div>

        {/* Dynamic Games Grid */}
        <div className="mt-4">
          <InfiniteScrollGrid initialGames={category.games} />
        </div>

      </div>
    </AppShell>
  )
}
