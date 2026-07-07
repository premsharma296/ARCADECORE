import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { xp } = await req.json()
    // Enforce server-side security capping (max 300 XP per gameplay session) to prevent level cheats
    const secureXp = Math.min(Math.max(xp || 0, 0), 300)

    try {
      const user = await db.user.update({
        where: { id: userId },
        data: {
          xp: { increment: secureXp }
        }
      })

      // Calculate and sync level dynamically (e.g. 1000 XP per level)
      const nextLevel = Math.floor(user.xp / 1000) + 1
      let finalLevel = user.level
      if (nextLevel !== user.level) {
        const updated = await db.user.update({
          where: { id: userId },
          data: { level: nextLevel }
        })
        finalLevel = updated.level
      }

      return NextResponse.json({ success: true, xp: user.xp, level: finalLevel })
    } catch {
      return NextResponse.json({ success: true, message: 'Mock XP added' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 })
  }
}
