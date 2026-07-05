import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) {
      return NextResponse.json([])
    }

    const games = await db.game.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { categories: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { tags: { some: { name: { contains: q, mode: 'insensitive' } } } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
      },
      take: 8
    })

    return NextResponse.json(games)
  } catch (error: any) {
    console.warn('Search database query failed, searching fallback catalog:', error.message)
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    const { getFullMockCatalog } = require('@/lib/fallback-data')
    const catalog = getFullMockCatalog()
    const filtered = catalog.filter((game: any) => 
      game.title.toLowerCase().includes(q) || 
      game.description.toLowerCase().includes(q) || 
      game.categories.some((c: any) => c.name.toLowerCase().includes(q))
    ).slice(0, 8).map((game: any) => ({
      id: game.id,
      title: game.title,
      slug: game.slug,
      thumbnailUrl: game.thumbnailUrl
    }))
    return NextResponse.json(filtered)
  }
}
