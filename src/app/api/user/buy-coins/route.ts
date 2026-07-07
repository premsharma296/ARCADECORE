import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { amount, coins } = body

    if (!amount || !coins) {
      return NextResponse.json({ error: 'Missing amount or coins value' }, { status: 400 })
    }

    const resolvedUserId = userId || 'guest-user'

    let tx
    try {
      // 1. Create transaction record in PostgreSQL database
      tx = await db.transaction.create({
        data: {
          userId: resolvedUserId,
          amount: parseFloat(amount),
          coins: parseInt(coins, 10),
          status: 'SUCCESS'
        }
      })

      // 2. Increment user balance
      try {
        await db.user.update({
          where: { id: resolvedUserId },
          data: { xp: { increment: coins } }
        })
      } catch {}
    } catch {}

    return NextResponse.json({ success: true, transaction: tx })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
