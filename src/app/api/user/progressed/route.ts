import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ games: [] })
    }

    // Get the latest plays for the logged-in user
    const plays = await db.gamePlay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Get a decent size list to filter duplicates
      select: {
        gameId: true,
        createdAt: true,
      }
    })

    // Filter duplicates in JavaScript while preserving latest order
    const seenIds = new Set<string>()
    const gameIds: string[] = []
    for (const play of plays) {
      if (!seenIds.has(play.gameId)) {
        seenIds.add(play.gameId)
        gameIds.push(play.gameId)
      }
      if (gameIds.length >= 6) break // Return top 6 games
    }

    if (gameIds.length === 0) {
      return NextResponse.json({ games: [] })
    }

    // Fetch game details for those unique IDs
    const games = await db.game.findMany({
      where: {
        id: { in: gameIds }
      },
      include: {
        categories: { select: { name: true, slug: true } }
      }
    })

    // Sort games in the order of latest played
    const orderedGames = gameIds
      .map(id => games.find(g => g.id === id))
      .filter(Boolean)

    return NextResponse.json({ games: orderedGames })
  } catch (error: any) {
    console.error('Failed to fetch progressed games:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
