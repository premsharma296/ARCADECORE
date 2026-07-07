import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ claimed: false, coins: 100, xp: 0, timeRemaining: 0 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0) // resets at midnight UTC

    const claim = await db.dailyRewardClaim.findFirst({
      where: {
        userId,
        createdAt: { gte: startOfToday }
      },
      orderBy: { createdAt: 'desc' }
    })

    const nextMidnight = new Date(startOfToday)
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1)
    const timeRemaining = nextMidnight.getTime() - now.getTime()

    return NextResponse.json({
      claimed: !!claim,
      lastClaimedAt: claim?.createdAt || null,
      timeRemaining,
      coins: user?.coins ?? 100,
      xp: user?.xp ?? 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rewardType, amount } = body

    if (!rewardType) {
      return NextResponse.json({ error: 'Missing reward type' }, { status: 400 })
    }

    // 1. Verify user hasn't already claimed today (prevent double spinning)
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)

    const existingClaim = await db.dailyRewardClaim.findFirst({
      where: {
        userId,
        createdAt: { gte: startOfToday }
      }
    })

    if (existingClaim) {
      return NextResponse.json({ error: 'You have already claimed your daily reward!' }, { status: 400 })
    }

    // 2. Log claim history
    const log = await db.dailyRewardClaim.create({
      data: {
        userId,
        rewardType,
        amount: amount || 0
      }
    })

    // 3. Update user balances (XP or Coins)
    const isXp = rewardType.toLowerCase().includes('xp')
    const isCoins = rewardType.toLowerCase().includes('coins') || rewardType.toLowerCase().includes('secret box')

    let updatedUser = null
    if (isXp) {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { xp: { increment: amount || 50 } }
      })
    } else if (isCoins) {
      let awardCoins = amount || 100
      if (rewardType === '2x Coins') awardCoins = 150
      if (rewardType === 'Secret Box') awardCoins = 400

      updatedUser = await db.user.update({
        where: { id: userId },
        data: { coins: { increment: awardCoins } }
      })
    } else {
      // Catch-all: award a base 50 XP if it's Try Again or Jackpot Badge
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { xp: { increment: 50 } }
      })
    }

    return NextResponse.json({
      success: true,
      log,
      coins: updatedUser?.coins ?? 100,
      xp: updatedUser?.xp ?? 0
    })
  } catch (error: any) {
    console.error('Daily reward claim failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
