import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

// GET User Profile (XP, Coins, unlocked borders, equipped border)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        coins: 100,
        xp: 0,
        unlockedBorders: 'none',
        equippedBorder: 'none'
      })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      // Auto-create a synced user if database tables are ready but sync failed previously
      return NextResponse.json({
        coins: 100,
        xp: 0,
        unlockedBorders: 'none',
        equippedBorder: 'none'
      })
    }

    return NextResponse.json({
      coins: user.coins,
      xp: user.xp,
      unlockedBorders: user.unlockedBorders,
      equippedBorder: user.equippedBorder
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST User Actions (Equip Border or Purchase Border)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, borderId, cost } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter (equip or buy)' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User profile not found in database' }, { status: 404 })
    }

    if (action === 'equip') {
      if (!borderId) {
        return NextResponse.json({ error: 'Missing borderId parameter' }, { status: 400 })
      }

      // Verify the user actually owns this border
      const unlockedList = user.unlockedBorders.split(',')
      if (borderId !== 'none' && !unlockedList.includes(borderId)) {
        return NextResponse.json({ error: 'You do not own this cosmetic border' }, { status: 403 })
      }

      const updated = await db.user.update({
        where: { id: userId },
        data: { equippedBorder: borderId }
      })

      return NextResponse.json({
        success: true,
        equippedBorder: updated.equippedBorder
      })
    }

    if (action === 'buy') {
      if (!borderId) {
        return NextResponse.json({ error: 'Missing borderId parameter' }, { status: 400 })
      }

      // Server-side border pricing registry to prevent client-side cost spoofing
      const BORDER_PRICES: { [key: string]: number } = {
        'cyber-green': 250,
        'outrun-pink': 500,
        'gold-crown': 1000,
        'rainbow-shift': 2000
      }

      const trueCost = BORDER_PRICES[borderId]
      if (trueCost === undefined) {
        return NextResponse.json({ error: 'Invalid border cosmetic ID' }, { status: 400 })
      }

      // Check if user already owns it
      const unlockedList = user.unlockedBorders.split(',')
      if (unlockedList.includes(borderId)) {
        return NextResponse.json({ error: 'You already own this cosmetic border' }, { status: 400 })
      }

      // Check if user has sufficient coins
      if (user.coins < trueCost) {
        return NextResponse.json({ error: 'Insufficient coins balance' }, { status: 400 })
      }

      const newUnlocked = [...unlockedList, borderId].join(',')

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: trueCost },
          unlockedBorders: newUnlocked
        }
      })

      return NextResponse.json({
        success: true,
        coins: updated.coins,
        unlockedBorders: updated.unlockedBorders
      })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('User action transaction failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
