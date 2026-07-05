import React from 'react'
import { notFound } from 'next/navigation'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import GamePlayer from '@/components/game/game-player'
import GameCard from '@/components/game/game-card'
import GameMetadataPanel from '@/components/game/game-metadata-panel'
import GameCommentsPanel from '@/components/game/game-comments-panel'
import { getFullMockCatalog } from '@/lib/fallback-data'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = params ? await params : { slug: '' }
  const catalog = getFullMockCatalog()
  const game = catalog.find((g) => g.slug === slug)
  
  if (!game) return { title: 'Game Not Found - ArcadeCore' }

  return {
    title: `${game.title} - Play Free Online on ArcadeCore`,
    description: game.description,
    openGraph: {
      title: `${game.title} - ArcadeCore`,
      description: game.description,
      images: [{ url: game.thumbnailUrl }]
    }
  }
}

async function getGameWithRelated(slug: string) {
  try {
    const game = await db.game.findUnique({
      where: { slug },
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
        developer: true
      }
    })

    if (!game) {
      throw new Error('Database game not found')
    }

    // Fetch related games from the same category
    const related = await db.game.findMany({
      where: {
        categories: { some: { id: { in: game.categories.map(c => c.id) } } },
        NOT: { id: game.id }
      },
      take: 6,
      include: {
        categories: { select: { name: true, slug: true } }
      }
    })

    return { game, related }
  } catch (error) {
    // Database check failed; utilize fallbacks
    const catalog = getFullMockCatalog()
    const game = catalog.find((g) => g.slug === slug)

    if (!game) return null

    const related = catalog
      .filter((g) => 
        g.slug !== slug && 
        g.categories.some(cat => game.categories.some(gameCat => gameCat.slug === cat.slug))
      )
      .slice(0, 6)

    return { game, related }
  }
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = params ? await params : { slug: '' }
  const data = await getGameWithRelated(slug)

  if (!data) {
    return notFound()
  }

  const { game, related } = data

  return (
    <AppShell>
      {/* Schema.org Game Rich Snippets for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": game.title,
            "description": game.description,
            "genre": game.categories?.[0]?.name || "Arcade",
            "playMode": "SinglePlayer",
            "applicationCategory": "Game",
            "operatingSystem": "Any",
            "author": {
              "@type": "Organization",
              "name": "ArcadeCore Studios"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": game.rating,
              "reviewCount": Math.floor(game.playCount * 0.005) + 3
            }
          })
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Player, Metadata, Comments (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Safe sandbox Iframe Player */}
          <GamePlayer
            iframeUrl={game.iframeUrl}
            title={game.title}
            slug={game.slug}
            thumbnailUrl={game.thumbnailUrl}
          />

          {/* Title, rating, descriptions, controls */}
          <GameMetadataPanel game={game} />

          {/* Social Reviews & Comments section */}
          <GameCommentsPanel gameId={game.id} />
        </div>

        {/* Right Column: Sidebar Related Games (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-lg font-bold font-display tracking-wider uppercase text-foreground">
              Related Games
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {related.map((relatedGame: any) => (
              <GameCard
                key={relatedGame.slug}
                id={relatedGame.id}
                title={relatedGame.title}
                slug={relatedGame.slug}
                thumbnailUrl={relatedGame.thumbnailUrl}
                rating={relatedGame.rating}
                playCount={relatedGame.playCount}
                isFeatured={relatedGame.isFeatured}
                isSponsored={relatedGame.isSponsored}
                categories={relatedGame.categories}
              />
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
