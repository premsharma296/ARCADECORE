import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    let plays: any[] = []
    try {
      // Fetch latest actual game plays from database
      const dbPlays = await db.gamePlay.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      // Fetch game and user maps to attach titles and usernames
      if (dbPlays.length > 0) {
        const gameIds = Array.from(new Set(dbPlays.map(p => p.gameId)))
        const userIds = Array.from(new Set(dbPlays.map(p => p.userId)))

        const games = await db.game.findMany({
          where: { id: { in: gameIds } }
        })
        const users = await db.user.findMany({
          where: { id: { in: userIds } }
        })

        plays = dbPlays.map(p => {
          const game = games.find(g => g.id === p.gameId)
          const user = users.find(u => u.id === p.userId)
          return {
            id: p.id,
            username: user?.username || 'PlayerXYZ',
            gameName: game?.title || 'Neo Arcade',
            score: `${p.score} pts`,
            coins: Math.floor(p.score / 100) + 10,
            time: 'Just now'
          }
        })
      }
    } catch {
      // Fallback if postgres is initializing
    }

    // Default seed plays if database logs are empty
    if (plays.length === 0) {
      plays = [
        {
          id: 'seed-play-1',
          username: 'NeonDiver',
          gameName: 'Neon Velocity',
          score: '1,890 pts',
          coins: 35,
          time: '2s ago'
        },
        {
          id: 'seed-play-2',
          username: 'TetrisQueen',
          gameName: 'Cosmic Tetris',
          score: '3,200 pts',
          coins: 50,
          time: '8s ago'
        }
      ]
    }

    return NextResponse.json(plays)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
