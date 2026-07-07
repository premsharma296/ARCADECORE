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

    // Server-side validation list of sector rewards to prevent client spoofing
    const VALID_SECTORS = [
      { label: '50 XP', value: 50, type: 'xp' },
      { label: '2x Coins', value: 150, type: 'coins' },
      { label: '100 XP', value: 100, type: 'xp' },
      { label: 'Try Again', value: 0, type: 'miss' },
      { label: '500 XP', value: 500, type: 'xp' },
      { label: 'Secret Box', value: 400, type: 'coins' },
      { label: '250 XP', value: 250, type: 'xp' },
      { label: 'Jackpot Badge', value: 0, type: 'badge' },
    ]

    const matchedSector = VALID_SECTORS.find(s => s.label === rewardType)
    if (!matchedSector) {
      return NextResponse.json({ error: 'Invalid reward sector requested' }, { status: 400 })
    }

    const secureAmount = matchedSector.value
    const secureType = matchedSector.type

    // 2. Log claim history
    const log = await db.dailyRewardClaim.create({
      data: {
        userId,
        rewardType,
        amount: secureAmount
      }
    })

    // 3. Update user balances (XP or Coins)
    let updatedUser = null
    if (secureType === 'xp') {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { xp: { increment: secureAmount } }
      })
    } else if (secureType === 'coins') {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { coins: { increment: secureAmount } }
      })
    } else {
      // Award base 50 XP for miss / badge
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
