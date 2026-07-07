import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 })
    }

    // Lazy instantiate Stripe inside handler to prevent Next.js build-time constructor crashes
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // 1. Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment has not been completed' }, { status: 400 })
    }

    // Verify user ID in metadata matches current user
    if (session.metadata?.userId !== userId) {
      return NextResponse.json({ error: 'User session mismatch' }, { status: 403 })
    }

    const coinsToCredit = parseInt(session.metadata?.coins || '0', 10)
    const priceAmount = parseFloat(session.metadata?.price || '0')

    // 2. Check if this checkout session has already been processed (deduplication)
    try {
      const existingTx = await db.transaction.findUnique({
        where: { id: sessionId }
      })

      if (existingTx) {
        const user = await db.user.findUnique({
          where: { id: userId }
        })
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          coins: user?.xp || 0
        })
      }
    } catch {}

    // 3. Create a transaction row and increment user coins balance persistently
    let updatedXp = 0
    try {
      await db.transaction.create({
        data: {
          id: sessionId, // Use Stripe session ID as transaction ID to guarantee deduplication
          userId,
          amount: priceAmount,
          coins: coinsToCredit,
          status: 'SUCCESS'
        }
      })

      const user = await db.user.update({
        where: { id: userId },
        data: {
          xp: { increment: coinsToCredit }
        }
      })
      updatedXp = user.xp
    } catch (e: any) {
      console.error('Database write failed during Stripe checkout verification:', e)
      return NextResponse.json({ error: 'Failed to write transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coins: updatedXp
    })
  } catch (error: any) {
    console.error('Stripe verification failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
