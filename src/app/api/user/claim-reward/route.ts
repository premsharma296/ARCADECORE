import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { rewardType, amount } = body

    if (!rewardType) {
      return NextResponse.json({ error: 'Missing reward type' }, { status: 400 })
    }

    const resolvedUserId = userId || 'guest-user'

    let log
    try {
      // 1. Log claim history
      log = await db.dailyRewardClaim.create({
        data: {
          userId: resolvedUserId,
          rewardType,
          amount: amount || 0
        }
      })

      // 2. If reward is coins, increment user coins balance in database
      if (rewardType.toLowerCase().includes('coins')) {
        const coinAmount = amount || 100
        try {
          await db.user.update({
            where: { id: resolvedUserId },
            data: { xp: { increment: coinAmount } } // use XP or add coins field if available, or just increment XP as rewards representation
          })
        } catch {}
      }
    } catch {}

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
