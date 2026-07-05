import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    try {
      // Try to increment database playCount count
      const game = await db.game.update({
        where: { slug },
        data: {
          playCount: { increment: 1 }
        }
      })
      return NextResponse.json({ success: true, playCount: game.playCount })
    } catch {
      // Mock Success Response if database is offline or not configured
      return NextResponse.json({ success: true, message: 'Mock count registered' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 })
  }
}
